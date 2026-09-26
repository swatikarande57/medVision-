from pydantic import BaseModel, Field
from typing import Literal


JobStage = Literal[
    "QUEUED",
    "VALIDATING",
    "PREPROCESSING",
    "INFERENCE",
    "SEGMENTATION",
    "POST_PROCESSING",
    "COMPLETED",
    "FAILED"
]


class PredictionData(BaseModel):
    label: str
    confidence: float | None = None


class RegionData(BaseModel):
    channelIndex: int
    labelCode: str
    regionName: str
    voxelCount: int
    volumeCm3: float
    colorRgb: list[int]


class SegmentationData(BaseModel):
    maskPath: str | None = None
    overlayPath: str | None = None
    regions: list[RegionData] = []


class MeasurementsData(BaseModel):
    affectedAreaPercentage: float | None = None
    estimatedArea: float | None = None
    affectedAreaPixels: int | None = None
    affectedAreaMm2: float | None = None
    affectedVolumeCm3: float | None = None


class ProcessingMetrics(BaseModel):
    device: str
    preprocessingTimeMs: float = 0.0
    inferenceTimeMs: float = 0.0
    postprocessingTimeMs: float = 0.0
    totalTimeMs: float = 0.0


class InferenceResult(BaseModel):
    jobId: str
    status: str = "COMPLETED"
    mode: Literal["DEMO", "PRODUCTION"]
    modelName: str = "MONAI SegResNet"
    modelVersion: str = "1.0.0"
    message: str | None = None
    prediction: PredictionData
    segmentation: SegmentationData
    measurements: MeasurementsData
    processing: ProcessingMetrics



class JobSubmissionResponse(BaseModel):
    jobId: str
    status: JobStage = "QUEUED"


class JobStatusResponse(BaseModel):
    jobId: str
    status: JobStage
    progress: int = Field(ge=0, le=100)
    stage: str
    error: str | None = None
    result: InferenceResult | None = None


class DicomConversionResponse(BaseModel):
    success: bool
    dicomPath: str
    originalFileName: str
    sopInstanceUid: str
    modality: str = "OT"
    message: str
