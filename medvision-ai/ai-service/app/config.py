import os
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SERVICE_NAME: str = "medvision-ai"
    VERSION: str = "2.4.0"
    
    # AI Configuration
    AI_MODE: Literal["demo", "production"] = "demo"
    MODEL_PATH: str | None = None
    DEVICE: str = "auto"  # auto, cpu, cuda
    
    # Upload limits
    MAX_UPLOAD_SIZE_MB: int = 500
    ALLOWED_MIME_TYPES: list[str] = ["image/jpeg", "image/png", "application/dicom", "application/octet-stream"]
    ALLOWED_EXTENSIONS: list[str] = [".jpg", ".jpeg", ".png", ".dcm", ".nii", ".nii.gz"]
    
    # Storage
    STORAGE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage_data")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def resolve_device(self) -> str:
        """
        Determines execution device (CPU or CUDA) safely.
        Raises ValueError if explicit CUDA is requested but CUDA is unavailable.
        """
        dev = self.DEVICE.lower()
        if dev == "cuda":
            try:
                import torch
                if not torch.cuda.is_available():
                    raise ValueError("Configuration Error: DEVICE=cuda explicitly requested, but CUDA is not available in current environment.")
                return "CUDA"
            except ImportError:
                raise ValueError("Configuration Error: DEVICE=cuda explicitly requested, but PyTorch is not installed.")

        if dev == "cpu":
            return "CPU"
        
        # Auto detect via torch if available
        try:
            import torch
            return "CUDA" if torch.cuda.is_available() else "CPU"
        except ImportError:
            return "CPU"



settings = Settings()
