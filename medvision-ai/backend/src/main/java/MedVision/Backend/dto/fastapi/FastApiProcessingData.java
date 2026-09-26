package MedVision.Backend.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Maps the nested InferenceResult.processing metrics from FastAPI.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FastApiProcessingData {
    private String device;
    private Double preprocessingTimeMs;
    private Double inferenceTimeMs;
    private Double postprocessingTimeMs;
    private Double totalTimeMs;
}
