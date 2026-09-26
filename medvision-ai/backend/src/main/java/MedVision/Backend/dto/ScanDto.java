package MedVision.Backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ScanDto {
    private Long id;
    private Long patientId;
    private String originalFileName;
    private String fileType;
    private String modality;
    private String status;
    private LocalDateTime uploadedAt;
}
