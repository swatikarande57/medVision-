package MedVision.Backend.service;

import MedVision.Backend.config.AiServiceProperties;
import MedVision.Backend.dto.fastapi.FastApiJobStatusResponse;
import MedVision.Backend.dto.fastapi.FastApiJobSubmissionResponse;
import MedVision.Backend.exception.FastApiUnavailableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.PathResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.SocketTimeoutException;
import java.nio.file.Path;

/**
 * HTTP client service for communicating with the Python FastAPI AI service.
 *
 * Actual FastAPI Endpoints (verified from source):
 *   POST /api/ai/jobs                - Submit multipart file → returns jobId + QUEUED status
 *   GET  /api/ai/jobs/{job_id}       - Poll job status → returns full JobStatusResponse
 *
 * Uses Spring 6.1 RestClient (synchronous, no WebFlux dependency required).
 */
@Slf4j
@Service
public class FastApiClientService {

    private final AiServiceProperties props;
    private final RestClient restClient;

    public FastApiClientService(RestClient.Builder restClientBuilder, AiServiceProperties props) {
        this.props = props;

        // Apply configured timeouts to the HTTP client factory
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(props.getConnectTimeoutMs());
        factory.setReadTimeout(props.getReadTimeoutMs());

        this.restClient = restClientBuilder
                .requestFactory(factory)
                .baseUrl(props.getBaseUrl())
                .build();
    }

    /**
     * Submits a scan file to FastAPI for AI analysis.
     *
     * Sends multipart/form-data to POST /api/ai/jobs.
     * FastAPI validates the file, creates an in-memory job, and returns immediately with QUEUED status.
     *
     * @param filePath        Absolute path to the stored scan file on disk.
     * @param originalFileName Original filename for MIME detection.
     * @return FastApiJobSubmissionResponse containing the external jobId and initial status.
     * @throws FastApiUnavailableException on network, timeout, or HTTP errors.
     */
    public FastApiJobSubmissionResponse submitJob(Path filePath, String originalFileName) {
        log.info("[FastApiClient] Submitting scan file '{}' to POST {}/api/ai/jobs",
                originalFileName, props.getBaseUrl());

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new PathResource(filePath));

        try {
            FastApiJobSubmissionResponse response = restClient
                    .post()
                    .uri("/api/ai/jobs")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(), (req, res) -> {
                        throw new FastApiUnavailableException(
                                "FastAPI rejected job submission with HTTP " + res.getStatusCode()
                                + ". Check the uploaded file format and size.");
                    })
                    .onStatus(status -> status.is5xxServerError(), (req, res) -> {
                        throw new FastApiUnavailableException(
                                "FastAPI internal error on job submission: HTTP " + res.getStatusCode());
                    })
                    .body(FastApiJobSubmissionResponse.class);

            if (response == null || response.getJobId() == null || response.getJobId().isBlank()) {
                throw new FastApiUnavailableException(
                        "FastAPI returned a job submission response missing the jobId field.");
            }

            log.info("[FastApiClient] FastAPI accepted job. External jobId={}", response.getJobId());
            return response;

        } catch (ResourceAccessException ex) {
            String msg = buildConnectionErrorMessage(ex);
            log.error("[FastApiClient] Connection failure submitting job: {}", msg);
            throw new FastApiUnavailableException(msg, ex);
        } catch (RestClientResponseException ex) {
            String msg = "FastAPI returned HTTP " + ex.getStatusCode() + " during job submission: " + ex.getMessage();
            log.error("[FastApiClient] {}", msg);
            throw new FastApiUnavailableException(msg, ex);
        }
    }

    /**
     * Polls the status of a previously submitted FastAPI job.
     *
     * Calls GET /api/ai/jobs/{job_id}.
     * Returns null when a 404 is received (job not found) so callers can handle gracefully.
     *
     * @param externalJobId The FastAPI-assigned job ID (e.g., "job_abc123").
     * @return FastApiJobStatusResponse or null if the job is not found.
     * @throws FastApiUnavailableException on network, timeout, or 5xx errors.
     */
    public FastApiJobStatusResponse getJobStatus(String externalJobId) {
        log.debug("[FastApiClient] Polling status for externalJobId={}", externalJobId);

        try {
            return restClient
                    .get()
                    .uri("/api/ai/jobs/{job_id}", externalJobId)
                    .retrieve()
                    .onStatus(status -> status == HttpStatus.NOT_FOUND, (req, res) -> {
                        log.warn("[FastApiClient] Job {} not found in FastAPI (404).", externalJobId);
                        // Return null via custom exception boundary — handled in caller
                    })
                    .onStatus(status -> status.is5xxServerError(), (req, res) -> {
                        throw new FastApiUnavailableException(
                                "FastAPI returned HTTP " + res.getStatusCode()
                                + " polling job " + externalJobId);
                    })
                    .body(FastApiJobStatusResponse.class);

        } catch (ResourceAccessException ex) {
            String msg = buildConnectionErrorMessage(ex);
            log.error("[FastApiClient] Connection failure polling job {}: {}", externalJobId, msg);
            throw new FastApiUnavailableException(msg, ex);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                return null;
            }
            String msg = "FastAPI returned HTTP " + ex.getStatusCode()
                    + " polling job " + externalJobId + ": " + ex.getMessage();
            log.error("[FastApiClient] {}", msg);
            throw new FastApiUnavailableException(msg, ex);
        }
    }

    /**
     * Builds a human-readable error message from a ResourceAccessException,
     * distinguishing timeouts from connection-refused errors.
     */
    private String buildConnectionErrorMessage(ResourceAccessException ex) {
        Throwable cause = ex.getCause();
        if (cause instanceof SocketTimeoutException) {
            return "FastAPI AI service timed out after " + props.getReadTimeoutMs() + "ms. "
                    + "Ensure the service is running at: " + props.getBaseUrl();
        }
        return "FastAPI AI service is unreachable at " + props.getBaseUrl()
                + ". Ensure the service is running. Cause: " + ex.getMessage();
    }
}
