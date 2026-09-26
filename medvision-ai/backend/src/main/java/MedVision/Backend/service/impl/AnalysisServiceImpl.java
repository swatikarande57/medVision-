package MedVision.Backend.service.impl;

import MedVision.Backend.dto.response.AnalysisResponse;
import MedVision.Backend.dto.response.JobResponse;
import MedVision.Backend.dto.fastapi.FastApiJobSubmissionResponse;
import MedVision.Backend.entity.AIAnalysis;
import MedVision.Backend.entity.AnalysisJob;
import MedVision.Backend.entity.Scan;
import MedVision.Backend.exception.FastApiUnavailableException;
import MedVision.Backend.exception.ResourceNotFoundException;
import MedVision.Backend.repository.AIAnalysisRepository;
import MedVision.Backend.repository.AnalysisJobRepository;
import MedVision.Backend.repository.ScanRepository;
import MedVision.Backend.service.AnalysisService;
import MedVision.Backend.service.FastApiClientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisServiceImpl implements AnalysisService {

    private final AIAnalysisRepository aiAnalysisRepository;
    private final AnalysisJobRepository analysisJobRepository;
    private final ScanRepository scanRepository;
    private final FastApiClientService fastApiClientService;

    @Override
    public AnalysisResponse getAnalysisById(Long id) {
        AIAnalysis analysis = aiAnalysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AI Analysis not found with id: " + id));
        return mapToAnalysisResponse(analysis);
    }

    @Override
    public AnalysisResponse getAnalysisByScanId(Long scanId) {
        AIAnalysis analysis = aiAnalysisRepository.findByScanId(scanId)
                .orElseThrow(() -> new ResourceNotFoundException("AI Analysis not found for scanId: " + scanId));
        return mapToAnalysisResponse(analysis);
    }

    @Override
    public List<AnalysisResponse> getAnalysesByPatientId(Long patientId) {
        return aiAnalysisRepository.findByScanPatientId(patientId).stream()
                .map(this::mapToAnalysisResponse)
                .collect(Collectors.toList());
    }

    /**
     * Creates an AnalysisJob and asynchronously triggers the FastAPI AI pipeline.
     *
     * Flow:
     *   1. Validate scan exists in DB.
     *   2. Verify the physical scan file exists on disk.
     *   3. Create AnalysisJob with status=QUEUED, save to DB.
     *   4. Submit the actual scan file to FastAPI POST /api/ai/jobs.
     *   5. Save the returned externalJobId.
     *   6. Return immediately (FastAPI processes async; poller will update status later).
     *
     * Failure handling:
     *   If FastAPI is unavailable or returns an error, the job is immediately marked FAILED
     *   so the frontend sees a clear error state rather than forever-QUEUED.
     */
    @Override
    @Transactional
    public JobResponse createAnalysisJob(Long scanId) {
        // 1. Validate scan
        Scan scan = scanRepository.findById(scanId)
                .orElseThrow(() -> new ResourceNotFoundException("Scan not found with id: " + scanId));

        // 2. Verify scan file exists on disk
        Path scanFilePath = Paths.get(scan.getFilePath()).toAbsolutePath().normalize();
        if (!Files.exists(scanFilePath)) {
            throw new ResourceNotFoundException(
                    "Scan file not found on disk for scan id: " + scanId
                    + ". Expected path: " + scanFilePath);
        }

        // 3. Create AnalysisJob in QUEUED state
        AnalysisJob job = new AnalysisJob();
        job.setScan(scan);
        job.setStatus("QUEUED");
        job.setProgress(0.0);
        job.setStartedAt(LocalDateTime.now());
        AnalysisJob savedJob = analysisJobRepository.save(job);

        log.info("[AnalysisService] Created AnalysisJob localId={} for scanId={}", savedJob.getId(), scanId);

        // 4. Forward scan file to FastAPI (non-blocking submission; FastAPI returns immediately with jobId)
        try {
            log.info("[AnalysisService] Submitting scan file '{}' to FastAPI for localJobId={}",
                    scan.getOriginalFileName(), savedJob.getId());

            FastApiJobSubmissionResponse fastApiResponse =
                    fastApiClientService.submitJob(scanFilePath, scan.getOriginalFileName());

            // 5. Persist externalJobId returned by FastAPI
            savedJob.setExternalJobId(fastApiResponse.getJobId());
            analysisJobRepository.save(savedJob);

            log.info("[AnalysisService] FastAPI accepted job. localJobId={} externalJobId={}",
                    savedJob.getId(), fastApiResponse.getJobId());

        } catch (FastApiUnavailableException ex) {
            // FastAPI is down — mark job as FAILED immediately so frontend knows
            log.error("[AnalysisService] FastAPI unavailable for localJobId={}: {}",
                    savedJob.getId(), ex.getMessage());
            savedJob.setStatus("FAILED");
            savedJob.setCompletedAt(LocalDateTime.now());
            savedJob.setErrorMessage("FastAPI AI service unavailable: " + ex.getMessage());
            analysisJobRepository.save(savedJob);
        } catch (Exception ex) {
            log.error("[AnalysisService] Unexpected error submitting to FastAPI for localJobId={}: {}",
                    savedJob.getId(), ex.getMessage(), ex);
            savedJob.setStatus("FAILED");
            savedJob.setCompletedAt(LocalDateTime.now());
            savedJob.setErrorMessage("Unexpected error during AI job submission: " + ex.getMessage());
            analysisJobRepository.save(savedJob);
        }

        // 6. Return response with current job state (QUEUED or FAILED)
        return mapToJobResponse(savedJob);
    }

    @Override
    public JobResponse getJobById(Long jobId) {
        AnalysisJob job = analysisJobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis Job not found with id: " + jobId));
        return mapToJobResponse(job);
    }

    private AnalysisResponse mapToAnalysisResponse(AIAnalysis analysis) {
        AnalysisResponse response = new AnalysisResponse();
        response.setId(analysis.getId());
        response.setScanId(analysis.getScan().getId());
        response.setTumorDetected(analysis.getTumorDetected());
        response.setConfidence(analysis.getConfidence());
        response.setAffectedAreaPercentage(analysis.getAffectedAreaPercentage());
        response.setEstimatedArea(analysis.getEstimatedArea());
        response.setResultSummary(analysis.getResultSummary());
        response.setMaskPath(analysis.getMaskPath());
        response.setOverlayPath(analysis.getOverlayPath());
        response.setModelName(analysis.getModelName());
        response.setMode(analysis.getMode());
        response.setDevice(analysis.getDevice());
        response.setInferenceTimeMs(analysis.getInferenceTimeMs());
        response.setAffectedVolumeCm3(analysis.getAffectedVolumeCm3());
        response.setRegionsJson(analysis.getRegionsJson());
        response.setCreatedAt(analysis.getCreatedAt());
        return response;
    }

    private JobResponse mapToJobResponse(AnalysisJob job) {
        JobResponse response = new JobResponse();
        response.setJobId(job.getId());
        response.setScanId(job.getScan().getId());
        response.setStatus(job.getStatus());
        response.setProgress(job.getProgress());
        response.setStage(job.getStatus()); // Stage reflects status during basic tracking
        response.setExternalJobId(job.getExternalJobId());
        response.setStartedAt(job.getStartedAt());
        response.setCompletedAt(job.getCompletedAt());
        response.setErrorMessage(job.getErrorMessage());
        return response;
    }
}

