package MedVision.Backend.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ComparisonResponse {
    private Long id;
    private Long patientId;
    private Long previousScanId;
    private Long currentScanId;
    private Double previousAffectedArea;
    private Double currentAffectedArea;
    private Double absoluteChange;
    private Double percentageChange;
    private String timeDifference;
    private String interpretation;
    private LocalDateTime createdAt;
}
