import os
import pytest
import numpy as np
import nibabel as nib
from app.inference.model import MonaiInferenceModel
from app.schemas.analysis import InferenceResult


@pytest.fixture
def real_checkpoint_path():
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "monai_brats_segresnet.pt")
    assert os.path.exists(path)
    return path


@pytest.fixture
def synthetic_nifti_file(tmp_path):
    """Creates a 4-channel synthetic NIfTI MRI volume file (32x32x32)."""
    data = np.random.randn(32, 32, 32, 4).astype(np.float32)
    affine = np.eye(4)
    img = nib.Nifti1Image(data, affine)
    nii_path = str(tmp_path / "brain_mri_test.nii.gz")
    nib.save(img, nii_path)
    return nii_path


def test_real_monai_inference_on_3d_nifti(real_checkpoint_path, synthetic_nifti_file):
    """Tests end-to-end MONAI SegResNet inference on synthetic 3D NIfTI input."""
    model = MonaiInferenceModel(model_path=real_checkpoint_path)
    result = model.predict(synthetic_nifti_file, "job_test_3d_real")

    assert isinstance(result, InferenceResult)
    assert result.jobId == "job_test_3d_real"
    assert result.status == "COMPLETED"
    assert result.mode == "PRODUCTION"
    assert result.modelName == "MONAI SegResNet (BraTS 3D)"
    assert result.prediction.label == "MONAI_SEGRESNET_BRATS"
    assert result.prediction.confidence is None
    
    # Verify sub-region layers
    assert len(result.segmentation.regions) == 3
    codes = [r.labelCode for r in result.segmentation.regions]
    assert "WT" in codes
    assert "TC" in codes
    assert "ET" in codes

    # Verify generated mask & overlay paths
    assert result.segmentation.maskPath is not None
    assert result.segmentation.overlayPath is not None
    assert os.path.exists(result.segmentation.maskPath)
    assert os.path.exists(result.segmentation.overlayPath)

    # Verify volumetric measurements
    assert result.measurements.affectedVolumeCm3 is not None
    assert isinstance(result.measurements.affectedVolumeCm3, float)

    # Verify timing telemetry
    assert result.processing.device in ["CPU", "CUDA"]
    assert result.processing.preprocessingTimeMs > 0
    assert result.processing.inferenceTimeMs > 0
    assert result.processing.postprocessingTimeMs > 0
    assert result.processing.totalTimeMs > 0


def test_production_mode_2d_image_rejection(real_checkpoint_path, tmp_path, sample_jpeg_bytes):
    """Verifies that 2D image uploads in PRODUCTION mode return 2D_MODEL_NOT_CONFIGURED status."""
    img_file = tmp_path / "test_2d.jpg"
    img_file.write_bytes(sample_jpeg_bytes)

    model = MonaiInferenceModel(model_path=real_checkpoint_path)
    result = model.predict(str(img_file), "job_test_2d_rejection")

    assert result.status == "2D_MODEL_NOT_CONFIGURED"
    assert result.mode == "PRODUCTION"
    assert "compatible volumetric MRI input" in result.message
    assert result.segmentation.maskPath is None
    assert result.segmentation.overlayPath is None
