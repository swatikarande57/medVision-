package MedVision.Backend.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AnalysisResponse {
    private Long id;
    private Long scanId;
    private Boolean tumorDetected;
    private Double confidence;
    private Double affectedAreaPercentage;
    private Double estimatedArea;
    private String resultSummary;
    private String maskPath;
    private String overlayPath;
    private String modelName;
    private String mode;
    private String device;
    private Double inferenceTimeMs;
    private Double affectedVolumeCm3;
    private String regionsJson;
    private LocalDateTime createdAt;
}
