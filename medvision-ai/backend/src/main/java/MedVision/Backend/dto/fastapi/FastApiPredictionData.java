package MedVision.Backend.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Maps the nested InferenceResult.prediction object from FastAPI.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FastApiPredictionData {
    private String label;
    private Double confidence;
}
