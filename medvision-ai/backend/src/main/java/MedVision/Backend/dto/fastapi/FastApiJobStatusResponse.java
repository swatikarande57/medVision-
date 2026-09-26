package MedVision.Backend.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Maps the FastAPI GET /api/ai/jobs/{job_id} → JobStatusResponse.
 *
 * FastAPI schema:
 * {
 *   "jobId": "job_abc123",
 *   "status": "COMPLETED",
 *   "progress": 100,
 *   "stage": "Processing complete",
 *   "error": null,
 *   "result": { ...InferenceResult... }
 * }
 *
 * FastAPI statuses: QUEUED | VALIDATING | PREPROCESSING | INFERENCE
 *                   | SEGMENTATION | POST_PROCESSING | COMPLETED | FAILED
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FastApiJobStatusResponse {
    private String jobId;
    private String status;
    private Integer progress;
    private String stage;
    private String error;
    private FastApiInferenceResult result;
}
