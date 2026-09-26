import pytest
from app.utils.validation import validate_image_file, ImageValidationError


def test_validate_valid_jpeg(sample_jpeg_bytes):
    meta = validate_image_file(sample_jpeg_bytes, "test.jpg")
    assert meta["width"] == 100
    assert meta["height"] == 100
    assert meta["format"] == "JPEG"


def test_validate_valid_png(sample_png_bytes):
    meta = validate_image_file(sample_png_bytes, "scan.png")
    assert meta["width"] == 128
    assert meta["height"] == 128
    assert meta["format"] == "PNG"


def test_validate_corrupted_image(corrupted_image_bytes):
    with pytest.raises(ImageValidationError) as exc_info:
        validate_image_file(corrupted_image_bytes, "broken.jpg")
    assert "Corrupted image" in str(exc_info.value) or "validation failed" in str(exc_info.value)


def test_validate_unsupported_extension(sample_jpeg_bytes):
    with pytest.raises(ImageValidationError) as exc_info:
        validate_image_file(sample_jpeg_bytes, "file.exe")
    assert "Unsupported file extension" in str(exc_info.value)


def test_validate_empty_file():
    with pytest.raises(ImageValidationError) as exc_info:
        validate_image_file(b"", "empty.png")
    assert "empty" in str(exc_info.value)
