package MedVision.Backend.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class JobResponse {
    private Long jobId;
    private Long scanId;
    private String status;
    private Double progress;
    private String stage;
    private String externalJobId;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String errorMessage;
}
