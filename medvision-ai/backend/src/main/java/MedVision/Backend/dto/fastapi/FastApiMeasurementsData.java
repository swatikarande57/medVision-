package MedVision.Backend.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Maps the nested InferenceResult.measurements object from FastAPI.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FastApiMeasurementsData {
    private Double affectedAreaPercentage;
    private Double estimatedArea;
    private Double affectedVolumeCm3;
}
