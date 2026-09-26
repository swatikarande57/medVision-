import os
import pytest
import torch
from app.inference.model import MonaiInferenceModel
from app.config import settings


def test_monai_model_loading_with_real_checkpoint():
    """Verifies that MonaiInferenceModel successfully loads the real SegResNet checkpoint."""
    model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "monai_brats_segresnet.pt")
    assert os.path.exists(model_path), f"Checkpoint file missing at {model_path}"

    inference_model = MonaiInferenceModel(model_path=model_path)
    model = inference_model.load_model()

    assert model is not None
    assert isinstance(model, torch.nn.Module)
    assert inference_model.validate_model() is True


def test_monai_model_forward_pass_synthetic_tensor():
    """Verifies SegResNet forward pass with 4-channel 3D synthetic tensor."""
    model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "monai_brats_segresnet.pt")
    inference_model = MonaiInferenceModel(model_path=model_path)
    model = inference_model.load_model()

    model.eval()
    with torch.inference_mode():
        # Batch=1, Channels=4 (T1, T1ce, T2, FLAIR), Spatial 64x64x64
        synthetic_input = torch.randn(1, 4, 64, 64, 64)
        output = model(synthetic_input)

    # Output shape must be (1, 3, 64, 64, 64) for WT, TC, ET sub-regions
    assert output.shape == (1, 3, 64, 64, 64)
    assert output.ndim == 5


def test_monai_model_missing_checkpoint():
    """Verifies error handling when model checkpoint file is missing."""
    MonaiInferenceModel._instance_model = None
    inference_model = MonaiInferenceModel(model_path="./models/non_existent_model_123.pt")
    with pytest.raises(RuntimeError) as exc_info:
        inference_model.load_model()
    assert "missing or unconfigured" in str(exc_info.value)
    MonaiInferenceModel._instance_model = None

