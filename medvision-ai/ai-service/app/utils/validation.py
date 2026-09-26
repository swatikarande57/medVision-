import os
from io import BytesIO
from PIL import Image, UnidentifiedImageError
from fastapi import HTTPException, status
from app.config import settings
from app.utils.logging import logger


class ImageValidationError(Exception):
    """Custom exception for image validation errors."""
    pass


def validate_image_file(content: bytes, filename: str) -> dict:
    """
    Validates uploaded image bytes for existence, size, extension, MIME, and corruption.
    Returns metadata dict (width, height, format, mode, file_size).
    Raises ImageValidationError if invalid.
    """
    if not content or len(content) == 0:
        raise ImageValidationError("Uploaded file is empty.")

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise ImageValidationError(
            f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    lower_filename = filename.lower()
    if lower_filename.endswith(".nii.gz"):
        ext = ".nii.gz"
    else:
        _, ext = os.path.splitext(lower_filename)

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise ImageValidationError(
            f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # For standard image files (JPG, PNG) verify with Pillow
    if ext in [".jpg", ".jpeg", ".png"]:
        try:
            image = Image.open(BytesIO(content))
            image.verify()  # Verify file integrity
            
            # Re-open after verify() as verify() closes the file pointer
            image = Image.open(BytesIO(content))
            
            if image.width < 10 or image.height < 10:
                raise ImageValidationError(
                    f"Image dimensions ({image.width}x{image.height}) are too small for medical processing."
                )

            return {
                "width": image.width,
                "height": image.height,
                "format": image.format,
                "mode": image.mode,
                "file_size": len(content)
            }
        except UnidentifiedImageError:
            raise ImageValidationError("Corrupted image or unrecognized image format.")
        except Exception as e:
            if isinstance(e, ImageValidationError):
                raise e
            raise ImageValidationError(f"Image validation failed: {str(e)}")

    # For NIfTI files (.nii, .nii.gz)
    if ext in [".nii", ".nii.gz"]:
        return {
            "width": 0,
            "height": 0,
            "format": "NIFTI",
            "mode": "3D_VOLUMETRIC",
            "file_size": len(content)
        }

    # For DICOM files (.dcm)
    return {
        "width": 0,
        "height": 0,
        "format": "DICOM",
        "mode": "RAW",
        "file_size": len(content)
    }

