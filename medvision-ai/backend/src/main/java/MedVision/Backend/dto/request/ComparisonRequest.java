package MedVision.Backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ComparisonRequest {
    @NotNull(message = "previousScanId is required")
    private Long previousScanId;

    @NotNull(message = "currentScanId is required")
    private Long currentScanId;
}
