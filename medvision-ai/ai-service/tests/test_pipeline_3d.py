import os
import pytest
import numpy as np
import nibabel as nib
from app.preprocessing.pipeline_3d import preprocessing_pipeline_3d


@pytest.fixture
def synthetic_nifti_file(tmp_path):
    """Creates a valid 4-channel synthetic NIfTI MRI volume file."""
    # 4 channels, spatial dimensions 32x32x32
    data = np.random.randn(32, 32, 32, 4).astype(np.float32)
    affine = np.eye(4)
    img = nib.Nifti1Image(data, affine)
    nii_path = str(tmp_path / "brain_mri_sample.nii.gz")
    nib.save(img, nii_path)
    return nii_path


def test_is_nifti_file():
    assert preprocessing_pipeline_3d.is_nifti_file("scan.nii") is True
    assert preprocessing_pipeline_3d.is_nifti_file("brain.nii.gz") is True
    assert preprocessing_pipeline_3d.is_nifti_file("image.jpg") is False
    assert preprocessing_pipeline_3d.is_nifti_file("dicom.dcm") is False


def test_3d_preprocessing_pipeline(synthetic_nifti_file):
    """Tests 3D MONAI preprocessing transform execution on synthetic NIfTI file."""
    result = preprocessing_pipeline_3d.process(synthetic_nifti_file)
    
    assert "tensor" in result
    tensor = result["tensor"]
    
    # Tensor must be channel-first (4, H, W, D)
    assert tensor.ndim == 4
    assert tensor.shape[0] == 4  # 4 modalities (T1, T1ce, T2, FLAIR)
    assert result["spatial_shape"] == list(tensor.shape[1:])
