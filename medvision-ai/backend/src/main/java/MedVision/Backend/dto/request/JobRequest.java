package MedVision.Backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class JobRequest {
    @NotNull(message = "scanId is required")
    private Long scanId;
}
