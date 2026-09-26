package MedVision.Backend.service;

import MedVision.Backend.dto.fastapi.FastApiInferenceResult;
import MedVision.Backend.dto.fastapi.FastApiJobStatusResponse;
import MedVision.Backend.entity.AIAnalysis;
import MedVision.Backend.entity.AnalysisJob;
import MedVision.Backend.exception.FastApiUnavailableException;
import MedVision.Backend.repository.AIAnalysisRepository;
import MedVision.Backend.repository.AnalysisJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Scheduled poller that queries FastAPI for in-flight analysis jobs.
 *
 * - Runs every ${ai-service.polling-interval-ms} milliseconds (default: 3000ms).
 * - Queries AnalysisJobRepository for all QUEUED or PROCESSING jobs that have an externalJobId.
 * - Calls FastApiClientService to get current status.
 * - Maps FastAPI statuses → Spring statuses:
 *     QUEUED                            → QUEUED
 *     VALIDATING / PREPROCESSING /
 *       INFERENCE / SEGMENTATION /
 *       POST_PROCESSING                 → PROCESSING
 *     COMPLETED                         → COMPLETED  (persists AIAnalysis)
 *     FAILED                            → FAILED
 * - On FastAPI unavailability: increments retry counter.
 *   When retryCount exceeds maxRetries → marks job as FAILED.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisJobPoller {

    private static final Set<String> IN_FLIGHT_STATUSES = Set.of("QUEUED", "PROCESSING");

    private static final Set<String> FASTAPI_PROCESSING_STAGES = Set.of(
            "VALIDATING", "PREPROCESSING", "INFERENCE", "SEGMENTATION", "POST_PROCESSING"
    );

    private final AnalysisJobRepository analysisJobRepository;
    private final AIAnalysisRepository aiAnalysisRepository;
    private final FastApiClientService fastApiClientService;
    private final MedVision.Backend.config.AiServiceProperties aiServiceProperties;

    @Scheduled(fixedDelayString = "${ai-service.polling-interval-ms:3000}")
    @Transactional
    public void pollInFlightJobs() {
        List<AnalysisJob> inFlightJobs = analysisJobRepository
                .findByStatusInAndExternalJobIdIsNotNull(IN_FLIGHT_STATUSES);

        if (inFlightJobs.isEmpty()) {
            return;
        }

        log.debug("[Poller] Checking {} in-flight analysis job(s).", inFlightJobs.size());

        for (AnalysisJob job : inFlightJobs) {
            pollSingleJob(job);
        }
    }

    private void pollSingleJob(AnalysisJob job) {
        String externalJobId = job.getExternalJobId();
        Long localJobId = job.getId();

        try {
            FastApiJobStatusResponse response = fastApiClientService.getJobStatus(externalJobId);

            if (response == null) {
                // 404 — job not found in FastAPI; treat as failure
                log.warn("[Poller] Job localId={} externalId={} not found in FastAPI (404). Marking as FAILED.",
                        localJobId, externalJobId);
                markFailed(job, "FastAPI reported job not found (404): " + externalJobId);
                return;
            }

            String fastApiStatus = response.getStatus();
            log.info("[Poller] Job localId={} externalId={} FastAPI status={} progress={}%",
                    localJobId, externalJobId, fastApiStatus, response.getProgress());

            if ("COMPLETED".equalsIgnoreCase(fastApiStatus)) {
                handleCompleted(job, response);
            } else if ("FAILED".equalsIgnoreCase(fastApiStatus)) {
                handleFailed(job, response);
            } else if (FASTAPI_PROCESSING_STAGES.contains(fastApiStatus.toUpperCase())) {
                // Map intermediate FastAPI stages → single PROCESSING status
                job.setStatus("PROCESSING");
                job.setProgress(response.getProgress() != null ? response.getProgress().doubleValue() : job.getProgress());
                analysisJobRepository.save(job);
            }
            // QUEUED in FastAPI → keep as QUEUED in Spring, no action needed

        } catch (FastApiUnavailableException ex) {
            // FastAPI unreachable: increment retry counter
            int newRetryCount = job.getRetryCount() + 1;
            job.setRetryCount(newRetryCount);
            log.warn("[Poller] Job localId={} FastAPI unreachable (retry {}/{}): {}",
                    localJobId, newRetryCount, aiServiceProperties.getMaxRetries(), ex.getMessage());

            if (newRetryCount > aiServiceProperties.getMaxRetries()) {
                markFailed(job, "FastAPI unreachable after " + newRetryCount + " retries: " + ex.getMessage());
            } else {
                analysisJobRepository.save(job);
            }
        } catch (Exception ex) {
            log.error("[Poller] Unexpected error polling job localId={} externalId={}: {}",
                    localJobId, externalJobId, ex.getMessage(), ex);
            markFailed(job, "Unexpected polling error: " + ex.getMessage());
        }
    }

    private void handleCompleted(AnalysisJob job, FastApiJobStatusResponse response) {
        log.info("[Poller] Job localId={} externalId={} COMPLETED. Persisting AIAnalysis.",
                job.getId(), job.getExternalJobId());

        FastApiInferenceResult inferenceResult = response.getResult();
        if (inferenceResult == null) {
            log.warn("[Poller] Job localId={} COMPLETED but InferenceResult is null. Marking as FAILED.",
                    job.getId());
            markFailed(job, "FastAPI reported COMPLETED but returned no InferenceResult payload.");
            return;
        }

        // Persist AIAnalysis — only fields that actually exist in the result
        AIAnalysis analysis = aiAnalysisRepository.findByScanId(job.getScan().getId())
                .orElse(new AIAnalysis());

        analysis.setScan(job.getScan());

        // Model metadata
        analysis.setModelName(inferenceResult.getModelName());
        String mode = inferenceResult.getMode() != null ? inferenceResult.getMode() : "UNKNOWN";
        analysis.setMode(mode);

        // Processing metrics
        if (inferenceResult.getProcessing() != null) {
            analysis.setDevice(inferenceResult.getProcessing().getDevice());
            analysis.setInferenceTimeMs(inferenceResult.getProcessing().getInferenceTimeMs());
        }

        // Prediction fields
        if (inferenceResult.getPrediction() != null) {
            analysis.setConfidence(inferenceResult.getPrediction().getConfidence());
        }

        // Measurement fields
        if (inferenceResult.getMeasurements() != null) {
            analysis.setAffectedAreaPercentage(inferenceResult.getMeasurements().getAffectedAreaPercentage());
            analysis.setEstimatedArea(inferenceResult.getMeasurements().getEstimatedArea());
            analysis.setAffectedVolumeCm3(inferenceResult.getMeasurements().getAffectedVolumeCm3());
        }

        // Segmentation paths and regions
        boolean hasRegionsWithVoxels = false;
        if (inferenceResult.getSegmentation() != null) {
            analysis.setMaskPath(inferenceResult.getSegmentation().getMaskPath());
            analysis.setOverlayPath(inferenceResult.getSegmentation().getOverlayPath());

            // Serialize regions to JSON
            if (inferenceResult.getSegmentation().getRegions() != null
                    && !inferenceResult.getSegmentation().getRegions().isEmpty()) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    analysis.setRegionsJson(mapper.writeValueAsString(inferenceResult.getSegmentation().getRegions()));

                    // Check if any region (specifically WT) has voxels > 0
                    for (var region : inferenceResult.getSegmentation().getRegions()) {
                        if (region.getVoxelCount() != null && region.getVoxelCount() > 0) {
                            hasRegionsWithVoxels = true;
                            break;
                        }
                    }
                } catch (Exception e) {
                    log.warn("[Poller] Failed to serialize regions JSON for localJobId={}: {}", job.getId(), e.getMessage());
                }
            }
        }

        // TumorDetected: based on actual region voxel data, not confidence score
        // For PRODUCTION mode with SegResNet, detected = any region has voxels > 0
        // For DEMO mode, confidence-based detection (backward compatible)
        if ("PRODUCTION".equalsIgnoreCase(mode)) {
            analysis.setTumorDetected(hasRegionsWithVoxels);
        } else {
            analysis.setTumorDetected(
                    inferenceResult.getPrediction() != null
                            && inferenceResult.getPrediction().getConfidence() != null
                            && inferenceResult.getPrediction().getConfidence() > 50.0
            );
        }

        // Store mode and message in resultSummary
        String message = inferenceResult.getMessage() != null ? inferenceResult.getMessage() : "Analysis completed";
        analysis.setResultSummary("[" + mode + "] " + message
                + " (externalJobId=" + job.getExternalJobId() + ")");

        aiAnalysisRepository.save(analysis);

        // Update job
        job.setStatus("COMPLETED");
        job.setProgress(100.0);
        job.setCompletedAt(LocalDateTime.now());
        analysisJobRepository.save(job);

        log.info("[Poller] AIAnalysis persisted for scanId={}. Mode={}. LocalJobId={}.",
                job.getScan().getId(), mode, job.getId());
    }

    private void handleFailed(AnalysisJob job, FastApiJobStatusResponse response) {
        String errorMsg = response.getError() != null
                ? response.getError()
                : "FastAPI pipeline execution failed with no error message.";
        log.warn("[Poller] Job localId={} externalId={} FAILED. Error: {}",
                job.getId(), job.getExternalJobId(), errorMsg);
        markFailed(job, errorMsg);
    }

    private void markFailed(AnalysisJob job, String errorMessage) {
        job.setStatus("FAILED");
        job.setProgress(0.0);
        job.setCompletedAt(LocalDateTime.now());
        job.setErrorMessage(errorMessage);
        analysisJobRepository.save(job);
    }
}
