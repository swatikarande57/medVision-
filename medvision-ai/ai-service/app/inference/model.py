import os
import time
import torch
from monai.networks.nets import SegResNet
from app.config import settings
from app.inference.base import InferenceModel
from app.preprocessing.pipeline import preprocessing_pipeline
from app.preprocessing.pipeline_3d import preprocessing_pipeline_3d
from app.postprocessing.postprocessing import post_processor
from app.schemas.analysis import (
    InferenceResult,
    PredictionData,
    SegmentationData,
    MeasurementsData,
    ProcessingMetrics,
    RegionData
)
from app.utils.logging import logger


class DemoInferenceModel(InferenceModel):
    """
    Demo inference model used exclusively for technical integration testing.
    Explicitly tags outputs with DEMO_MODE without pretending to provide medical predictions.
    """

    def predict(self, file_path: str, job_id: str) -> InferenceResult:
        start_time = time.time()
        
        # Run preprocessing pipeline for timing telemetry
        prep_start = time.time()
        prep_output = preprocessing_pipeline.process(file_path)
        prep_time_ms = (time.time() - prep_start) * 1000.0

        inf_start = time.time()
        # Simulated inference computation time
        time.sleep(0.05)
        inf_time_ms = (time.time() - inf_start) * 1000.0

        post_start = time.time()
        post_time_ms = (time.time() - post_start) * 1000.0

        device = settings.resolve_device()
        total_time_ms = (time.time() - start_time) * 1000.0

        logger.info(f"[Job #{job_id}] DemoInferenceModel executed in {total_time_ms:.1f}ms on {device}")

        return InferenceResult(
            jobId=job_id,
            status="COMPLETED",
            mode="DEMO",
            modelName="DemoInferenceModel",
            modelVersion="1.0.0",
            prediction=PredictionData(
                label="DEMO_MODE",
                confidence=None  # Explicitly null to prevent fake medical claims
            ),
            segmentation=SegmentationData(
                maskPath=None,
                overlayPath=None,
                regions=[]
            ),
            measurements=MeasurementsData(
                affectedAreaPercentage=None,
                estimatedArea=None
            ),
            processing=ProcessingMetrics(
                device=device,
                preprocessingTimeMs=round(prep_time_ms, 2),
                inferenceTimeMs=round(inf_time_ms, 2),
                postprocessingTimeMs=round(post_time_ms, 2),
                totalTimeMs=round(total_time_ms, 2)
            )
        )


class MonaiInferenceModel(InferenceModel):
    """
    Production MONAI SegResNet inference model implementation.
    Loads pre-trained BraTS SegResNet weights, executes PyTorch forward pass,
    and returns real segmentation sub-region layers and volumetric measurements.
    """

    _instance_model = None
    _instance_device = None

    def __init__(self, model_path: str | None = None):
        self.model_path = model_path or settings.MODEL_PATH
        if not self.model_path or not os.path.exists(self.model_path):
            logger.warning(f"Production MONAI model path is not configured or file does not exist: '{self.model_path}'")

    def load_model(self) -> SegResNet:
        """
        Loads pre-trained MONAI SegResNet model weights into memory once (Singleton).
        Sets evaluation mode (.eval()) and configures hardware device.
        """
        if MonaiInferenceModel._instance_model is not None:
            return MonaiInferenceModel._instance_model

        if not self.model_path or not os.path.exists(self.model_path):
            raise RuntimeError(f"Production model checkpoint file is missing or unconfigured: '{self.model_path}'")

        device_str = settings.resolve_device()
        device = torch.device("cuda" if device_str == "CUDA" else "cpu")

        logger.info(f"Loading MONAI SegResNet model weights from '{self.model_path}' onto device {device_str}...")
        
        # Instantiate verified SegResNet architecture (init_filters=16, 4 input channels, 3 output channels)
        model = SegResNet(
            spatial_dims=3,
            in_channels=4,
            out_channels=3,
            init_filters=16,
            blocks_down=[1, 2, 2, 4],
            blocks_up=[1, 1, 1]
        )

        try:
            state_dict = torch.load(self.model_path, map_location=device, weights_only=True)
            if isinstance(state_dict, dict) and "state_dict" in state_dict:
                state_dict = state_dict["state_dict"]
            model.load_state_dict(state_dict, strict=True)
        except Exception as e:
            raise RuntimeError(f"Failed to load checkpoint into SegResNet model: {str(e)}")

        model.to(device)
        model.eval()

        MonaiInferenceModel._instance_model = model
        MonaiInferenceModel._instance_device = device
        logger.info("Successfully loaded and verified MONAI SegResNet model weights.")
        return model

    def validate_model(self) -> bool:
        """Verifies that model is loaded and ready for inference."""
        model = self.load_model()
        return model is not None


    def predict(self, file_path: str, job_id: str) -> InferenceResult:
        start_time = time.time()
        device_str = settings.resolve_device()

        if not self.model_path or not os.path.exists(self.model_path):
            raise RuntimeError("Production model is not configured.")

        if not file_path or not os.path.exists(file_path):
            raise FileNotFoundError(f"Input scan file does not exist: '{file_path}'")

        # Handle 2D images (JPG, PNG) in PRODUCTION mode
        lower_path = file_path.lower()
        if lower_path.endswith((".jpg", ".jpeg", ".png")):
            logger.info(f"[Job #{job_id}] 2D image format uploaded in PRODUCTION mode. Returning 2D_MODEL_NOT_CONFIGURED.")

            total_time_ms = (time.time() - start_time) * 1000.0
            return InferenceResult(
                jobId=job_id,
                status="2D_MODEL_NOT_CONFIGURED",
                mode="PRODUCTION",
                modelName="MONAI SegResNet (BraTS 3D)",
                modelVersion="1.0.0",
                message="Current production segmentation model requires compatible volumetric MRI input (NIfTI / 3D DICOM).",
                prediction=PredictionData(
                    label="2D_MODEL_NOT_CONFIGURED",
                    confidence=None
                ),
                segmentation=SegmentationData(
                    maskPath=None,
                    overlayPath=None,
                    regions=[]
                ),
                measurements=MeasurementsData(
                    affectedAreaPercentage=None,
                    estimatedArea=None,
                    affectedVolumeCm3=None
                ),
                processing=ProcessingMetrics(
                    device=device_str,
                    preprocessingTimeMs=0.0,
                    inferenceTimeMs=0.0,
                    postprocessingTimeMs=0.0,
                    totalTimeMs=round(total_time_ms, 2)
                )
            )

        # 1. Load & validate model
        model = self.load_model()
        device = MonaiInferenceModel._instance_device

        # 2. Preprocessing
        prep_start = time.time()
        prep_output = preprocessing_pipeline_3d.process(file_path)
        input_tensor = prep_output["tensor"]  # Shape: (4, H, W, D)
        prep_time_ms = (time.time() - prep_start) * 1000.0

        # Add batch dimension: (1, 4, H, W, D)
        if input_tensor.ndim == 4:
            input_tensor = input_tensor.unsqueeze(0)

        input_tensor = input_tensor.to(device)

        # 3. Model Forward Pass
        inf_start = time.time()
        logger.info(f"[Job #{job_id}] Running SegResNet inference pass on tensor shape {list(input_tensor.shape)}...")
        
        with torch.inference_mode():
            logits = model(input_tensor)
            
        inf_time_ms = (time.time() - inf_start) * 1000.0
        logger.info(f"[Job #{job_id}] Forward pass completed in {inf_time_ms:.1f}ms. Output logits shape: {list(logits.shape)}")

        # 4. Post-processing
        post_start = time.time()
        binary_masks = post_processor.process_logits(logits, threshold=0.5)
        
        outputs = post_processor.generate_outputs(
            binary_masks=binary_masks,
            job_id=job_id,
            voxel_spacing=(1.0, 1.0, 1.0)
        )
        post_time_ms = (time.time() - post_start) * 1000.0

        total_time_ms = (time.time() - start_time) * 1000.0

        region_objs = [
            RegionData(
                channelIndex=r["channelIndex"],
                labelCode=r["labelCode"],
                regionName=r["regionName"],
                voxelCount=r["voxelCount"],
                volumeCm3=r["volumeCm3"],
                colorRgb=r["colorRgb"]
            )
            for r in outputs["regions"]
        ]

        logger.info(f"[Job #{job_id}] Real MONAI inference finished successfully in {total_time_ms:.1f}ms on {device_str}")

        return InferenceResult(
            jobId=job_id,
            status="COMPLETED",
            mode="PRODUCTION",
            modelName="MONAI SegResNet (BraTS 3D)",
            modelVersion="1.0.0",
            message="3D Volumetric Brain MRI AI segmentation complete.",
            prediction=PredictionData(
                label="MONAI_SEGRESNET_BRATS",
                confidence=None  # Explicitly null as SegResNet produces region masks, not scalar classification
            ),
            segmentation=SegmentationData(
                maskPath=outputs["maskPath"],
                overlayPath=outputs["overlayPath"],
                regions=region_objs
            ),
            measurements=MeasurementsData(
                affectedAreaPercentage=None,
                estimatedArea=outputs["totalVolumeCm3"],
                affectedVolumeCm3=outputs["totalVolumeCm3"]
            ),
            processing=ProcessingMetrics(
                device=device_str,
                preprocessingTimeMs=round(prep_time_ms, 2),
                inferenceTimeMs=round(inf_time_ms, 2),
                postprocessingTimeMs=round(post_time_ms, 2),
                totalTimeMs=round(total_time_ms, 2)
            )
        )


def get_inference_model() -> InferenceModel:
    """Factory returning appropriate InferenceModel instance based on AI_MODE setting."""
    if settings.AI_MODE.lower() == "production":
        return MonaiInferenceModel()
    return DemoInferenceModel()
