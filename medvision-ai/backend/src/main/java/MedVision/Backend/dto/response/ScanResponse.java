package MedVision.Backend.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ScanResponse {
    private Long id;
    private Long patientId;
    private String originalFileName;
    private String fileType;
    private String modality;
    private String status;
    private LocalDateTime uploadedAt;
}
