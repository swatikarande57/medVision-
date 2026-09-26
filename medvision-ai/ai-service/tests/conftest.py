from io import BytesIO
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_jpeg_bytes():
    """Generates valid 100x100 JPEG image bytes."""
    img = Image.new("RGB", (100, 100), color=(100, 150, 200))
    buf = BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def sample_png_bytes():
    """Generates valid 128x128 PNG image bytes."""
    img = Image.new("RGB", (128, 128), color=(50, 200, 100))
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def corrupted_image_bytes():
    """Generates corrupted image bytes."""
    return b"NOT_AN_IMAGE_THIS_IS_CORRUPTED_DATA_HEADER_12345"
