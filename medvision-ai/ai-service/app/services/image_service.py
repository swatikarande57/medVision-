from app.utils.validation import validate_image_file, ImageValidationError
from app.storage.file_storage import file_storage
from app.utils.logging import logger


class ImageService:
    """Service handling file upload validation and disk storage."""

    def process_and_save_upload(self, content: bytes, original_filename: str) -> dict:
        """
        Validates uploaded image bytes and saves to file storage if valid.
        Returns metadata dict containing file_path, width, height, format, mode, and size.
        Raises ImageValidationError if invalid.
        """
        # 1. Validate image bytes
        metadata = validate_image_file(content, original_filename)

        # 2. Save upload safely
        saved_path = file_storage.save_upload(content, original_filename)
        metadata["file_path"] = saved_path
        metadata["original_filename"] = original_filename

        return metadata


image_service = ImageService()
