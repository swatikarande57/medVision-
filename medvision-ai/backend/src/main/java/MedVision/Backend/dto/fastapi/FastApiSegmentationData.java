package MedVision.Backend.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

/**
 * Maps the nested InferenceResult.segmentation object from FastAPI.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FastApiSegmentationData {
    private String maskPath;
    private String overlayPath;
    private List<FastApiRegionData> regions;
}
