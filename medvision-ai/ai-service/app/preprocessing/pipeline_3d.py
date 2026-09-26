"""
3D MRI Preprocessing Pipeline using MONAI Transforms.
Supports NIfTI (.nii, .nii.gz) and 3D multi-sequence volumetric MRI data.
"""
import os
import torch
import numpy as np
from monai.transforms import (
    Compose,
    LoadImaged,
    EnsureChannelFirstd,
    Orientationd,
    Spacingd,
    NormalizeIntensityd,
    CropForegroundd,
    CastToTyped,
    ToTensord
)
from app.utils.logging import logger


class PreprocessingPipeline3D:
    """
    MONAI-based 3D volumetric preprocessing pipeline for BraTS SegResNet.
    Preprocesses 4-channel 3D MRI data (T1, T1ce, T2, FLAIR) to standard RAS 1mm³ isotropic format.
    """

    def __init__(self):
        self._transforms = Compose([
            LoadImaged(keys=["image"]),
            EnsureChannelFirstd(keys=["image"]),
            Orientationd(keys=["image"], axcodes="RAS"),
            Spacingd(keys=["image"], pixdim=(1.0, 1.0, 1.0), mode="bilinear"),
            NormalizeIntensityd(keys=["image"], nonzero=True, channel_wise=True),
            CropForegroundd(keys=["image"], source_key="image"),
            CastToTyped(keys=["image"], dtype=torch.float32),
            ToTensord(keys=["image"])
        ])

    def is_nifti_file(self, file_path: str) -> bool:
        """Determines if a file is a NIfTI volume (.nii or .nii.gz)."""
        lower = file_path.lower()
        return lower.endswith(".nii") or lower.endswith(".nii.gz")

    def process(self, file_path: str) -> dict:
        """
        Executes MONAI 3D preprocessing pipeline on input NIfTI file path.
        Returns dictionary containing preprocessed 3D tensor and metadata.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"3D image file not found: {file_path}")

        logger.info(f"Executing 3D MONAI preprocessing on '{file_path}'")
        data_dict = {"image": file_path}
        processed = self._transforms(data_dict)
        
        tensor = processed["image"]
        # Expected tensor shape: (C, H, W, D) where C=4 for BraTS modalities
        logger.info(f"3D preprocessing completed. Result tensor shape: {list(tensor.shape)}")

        return {
            "tensor": tensor,
            "shape": list(tensor.shape),
            "affine": processed["image"].meta.get("affine", None) if hasattr(processed["image"], "meta") else None,
            "spatial_shape": list(tensor.shape[1:]) if tensor.ndim == 4 else list(tensor.shape)
        }


preprocessing_pipeline_3d = PreprocessingPipeline3D()
