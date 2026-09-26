package MedVision.Backend.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReportResponse {
    private Long id;
    private Long patientId;
    private Long scanId;
    private Long analysisId;
    private String reportPath;
    private LocalDateTime createdAt;
}
