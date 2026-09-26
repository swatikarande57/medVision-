package MedVision.Backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReportRequest {
    @NotNull(message = "patientId is required")
    private Long patientId;

    @NotNull(message = "scanId is required")
    private Long scanId;

    private Long analysisId;
}
