package MedVision.Backend.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Maps the FastAPI POST /api/ai/jobs → JobSubmissionResponse.
 * { "jobId": "job_abc123", "status": "QUEUED" }
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FastApiJobSubmissionResponse {
    private String jobId;
    private String status;
}
