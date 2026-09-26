import os
import uuid
from app.config import settings
from app.utils.logging import logger


class FileStorage:
    def __init__(self, base_dir: str = settings.STORAGE_DIR):
        self.base_dir = os.path.abspath(base_dir)
        self.uploads_dir = os.path.join(self.base_dir, "uploads")
        self.dicom_dir = os.path.join(self.base_dir, "dicom")
        self.masks_dir = os.path.join(self.base_dir, "masks")
        self.overlays_dir = os.path.join(self.base_dir, "overlays")

        self._init_dirs()

    def _init_dirs(self):
        """Creates storage directories if they do not exist."""
        for d in [self.uploads_dir, self.dicom_dir, self.masks_dir, self.overlays_dir]:
            os.makedirs(d, exist_ok=True)

    def _sanitize_path(self, file_path: str) -> str:
        """Guards against path traversal by ensuring path stays inside storage base directory."""
        abs_path = os.path.abspath(file_path)
        if not abs_path.startswith(self.base_dir):
            raise ValueError("Path traversal attempt detected.")
        return abs_path

    def save_upload(self, content: bytes, original_filename: str) -> str:
        """Saves uploaded bytes under a unique UUID filename in uploads_dir."""
        _, ext = os.path.splitext(original_filename)
        safe_ext = ext.lower() if ext else ".bin"
        unique_name = f"{uuid.uuid4().hex}{safe_ext}"
        target_path = os.path.join(self.uploads_dir, unique_name)
        
        target_path = self._sanitize_path(target_path)

        with open(target_path, "wb") as f:
            f.write(content)

        logger.info(f"Saved uploaded file '{original_filename}' -> '{target_path}' ({len(content)} bytes)")
        return target_path

    def get_dicom_path(self, filename: str) -> str:
        """Generates a safe path for output DICOM file."""
        safe_name = os.path.basename(filename)
        return self._sanitize_path(os.path.join(self.dicom_dir, safe_name))

    def save_mask_npy(self, mask_array: object, filename: str) -> str:
        """Saves segmentation mask array to masks_dir."""
        import numpy as np
        safe_name = os.path.basename(filename)
        target_path = self._sanitize_path(os.path.join(self.masks_dir, safe_name))
        np.save(target_path, mask_array)
        logger.info(f"Saved segmentation mask array -> '{target_path}'")
        return target_path

    def save_overlay_png(self, pillow_image: object, filename: str) -> str:
        """Saves overlay PNG preview image to overlays_dir."""
        safe_name = os.path.basename(filename)
        target_path = self._sanitize_path(os.path.join(self.overlays_dir, safe_name))
        pillow_image.save(target_path, format="PNG")
        logger.info(f"Saved segmentation overlay preview PNG -> '{target_path}'")
        return target_path



file_storage = FileStorage()
