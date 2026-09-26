import pytest
from app.inference.model import DemoInferenceModel, MonaiInferenceModel


def test_demo_inference_model(tmp_path, sample_jpeg_bytes):
    img_file = tmp_path / "test.jpg"
    img_file.write_bytes(sample_jpeg_bytes)

    model = DemoInferenceModel()
    result = model.predict(str(img_file), "job_test_123")

    assert result.jobId == "job_test_123"
    assert result.status == "COMPLETED"
    assert result.mode == "DEMO"
    assert result.prediction.label == "DEMO_MODE"
    assert result.prediction.confidence is None
    assert result.processing.device in ["CPU", "CUDA"]


def test_monai_inference_model_unconfigured(tmp_path, sample_jpeg_bytes):
    img_file = tmp_path / "test.jpg"
    img_file.write_bytes(sample_jpeg_bytes)

    model = MonaiInferenceModel(model_path=None)
    with pytest.raises(RuntimeError) as exc_info:
        model.predict(str(img_file), "job_test_456")
    assert "Production model is not configured" in str(exc_info.value)
