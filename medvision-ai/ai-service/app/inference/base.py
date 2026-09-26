from abc import ABC, abstractmethod
from app.schemas.analysis import InferenceResult


class InferenceModel(ABC):
    """Abstract base class for AI inference models."""

    @abstractmethod
    def predict(self, file_path: str, job_id: str) -> InferenceResult:
        """Executes model inference on input image file path."""
        pass
