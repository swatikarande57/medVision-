package MedVision.Backend.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

/**
 * Maps individual segmentation region data from FastAPI.
 * Each region represents a BraTS sub-region (WT, TC, or ET).
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FastApiRegionData {
    private Integer channelIndex;
    private String labelCode;
    private String regionName;
    private Integer voxelCount;
    private Double volumeCm3;
    private List<Integer> colorRgb;
}
