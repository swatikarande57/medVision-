package MedVision.Backend.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Maps the InferenceResult object nested in FastAPI JobStatusResponse.result.
 *
 * FastAPI InferenceResult schema (verified from app/schemas/analysis.py):
 * {
 *   "jobId": "job_abc123",
 *   "status": "COMPLETED",
 *   "mode": "PRODUCTION",
 *   "modelName": "MONAI SegResNet (BraTS 3D)",
 *   "modelVersion": "1.0.0",
 *   "message": "3D Volumetric Brain MRI AI segmentation complete.",
 *   "prediction": { "label": "MONAI_SEGRESNET_BRATS", "confidence": null },
 *   "segmentation": { "maskPath": "...", "overlayPath": "...", "regions": [...] },
 *   "measurements": { "affectedAreaPercentage": null, "estimatedArea": null, "affectedVolumeCm3": 12.5 },
 *   "processing": { "device": "CPU", "preprocessingTimeMs": 500.0,
 *                   "inferenceTimeMs": 120000.0, "postprocessingTimeMs": 200.0, "totalTimeMs": 121000.0 }
 * }
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FastApiInferenceResult {
    private String jobId;
    private String status;
    private String mode;            // "DEMO" or "PRODUCTION"
    private String modelName;       // "MONAI SegResNet (BraTS 3D)"
    private String modelVersion;    // "1.0.0"
    private String message;         // Human-readable status message
    private FastApiPredictionData prediction;
    private FastApiSegmentationData segmentation;
    private FastApiMeasurementsData measurements;
    private FastApiProcessingData processing;
}
