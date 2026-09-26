import os
import numpy as np
from PIL import Image
from app.utils.logging import logger


class PreprocessingPipeline:
    """Configurable medical image preprocessing pipeline."""

    def __init__(self, target_size: tuple[int, int] = (256, 256), color_mode: str = "RGB"):
        self.target_size = target_size
        self.color_mode = color_mode

    def validate(self, file_path: str) -> bool:
        """Verifies that the target file exists and is accessible."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Image path does not exist: {file_path}")
        if os.path.getsize(file_path) == 0:
            raise ValueError(f"Image file is empty: {file_path}")
        return True

    def load(self, file_path: str) -> Image.Image:
        """Loads image file using Pillow and converts to target color mode."""
        self.validate(file_path)
        img = Image.open(file_path)
        return img.convert(self.color_mode)

    def resize(self, image: Image.Image) -> Image.Image:
        """Resizes Pillow image to target dimensions."""
        if image.size == self.target_size:
            return image
        return image.resize(self.target_size, Image.Resampling.BILINEAR)

    def normalize(self, image_array: np.ndarray) -> np.ndarray:
        """Normalizes NumPy pixel array to [0.0, 1.0] range."""
        arr = image_array.astype(np.float32)
        min_val, max_val = arr.min(), arr.max()
        if max_val - min_val > 0:
            return (arr - min_val) / (max_val - min_val)
        return arr

    def to_tensor(self, image_array: np.ndarray):
        """Converts (H, W, C) NumPy array to (C, H, W) tensor representation."""
        if image_array.ndim == 2:
            # Grayscale (H, W) -> (1, H, W)
            tensor_np = np.expand_dims(image_array, axis=0)
        elif image_array.ndim == 3:
            # Color (H, W, C) -> (C, H, W)
            tensor_np = np.transpose(image_array, (2, 0, 1))
        else:
            tensor_np = image_array

        try:
            import torch
            return torch.from_numpy(tensor_np)
        except ImportError:
            return tensor_np

    def process(self, file_path: str) -> dict:
        """Executes full preprocessing pipeline on input image path."""
        img = self.load(file_path)
        resized_img = self.resize(img)
        img_np = np.array(resized_img)
        normalized_np = self.normalize(img_np)
        tensor = self.to_tensor(normalized_np)

        return {
            "original_size": img.size,
            "processed_size": resized_img.size,
            "tensor_shape": list(tensor.shape),
            "tensor": tensor
        }


preprocessing_pipeline = PreprocessingPipeline()
