"""
Post-processing module for MONAI SegResNet output tensors.
Handles sigmoid activation, sub-region binary mask thresholding,
visual PNG overlay rendering, physical volumetric measurements, and region metadata export.
"""
import os
import torch
import numpy as np
from PIL import Image
from app.storage.file_storage import file_storage
from app.utils.logging import logger


# Verified BraTS sub-region label definitions
SUB_REGION_LABELS = {
    0: {"code": "WT", "name": "Whole Tumor", "color_rgb": (255, 68, 68)},       # Red
    1: {"code": "TC", "name": "Tumor Core", "color_rgb": (255, 170, 0)},       # Orange
    2: {"code": "ET", "name": "Enhancing Tumor", "color_rgb": (51, 204, 51)}    # Green
}


class PostProcessor:
    """Post-processor for SegResNet multi-label 3D logits/probabilities."""

    def process_logits(self, logits: torch.Tensor, threshold: float = 0.5) -> torch.Tensor:
        """
        Applies Sigmoid activation to raw model output logits and thresholding to produce binary masks.
        Input shape: (1, 3, H, W, D) or (3, H, W, D)
        Returns binary tensor of shape (3, H, W, D) containing 0 or 1 per channel.
        """
        probs = torch.sigmoid(logits)
        if probs.ndim == 5:
            probs = probs.squeeze(0)  # (3, H, W, D)

        binary_masks = (probs > threshold).to(torch.uint8)
        return binary_masks

    def compute_volume_cm3(self, binary_mask_channel: torch.Tensor, voxel_spacing: tuple[float, float, float] = (1.0, 1.0, 1.0)) -> float:
        """
        Computes physical volume in cm³ from voxel count and voxel spacing (mm).
        Formula: Volume (cm³) = (Voxel Count * vx * vy * vz) / 1000.0
        """
        voxel_count = int(torch.sum(binary_mask_channel).item())
        voxel_vol_mm3 = voxel_spacing[0] * voxel_spacing[1] * voxel_spacing[2]
        total_vol_mm3 = voxel_count * voxel_vol_mm3
        volume_cm3 = total_vol_mm3 / 1000.0
        return round(volume_cm3, 3)

    def generate_outputs(
        self,
        binary_masks: torch.Tensor,
        job_id: str,
        voxel_spacing: tuple[float, float, float] = (1.0, 1.0, 1.0)
    ) -> dict:
        """
        Generates segmentation mask files, overlay preview PNG, region metadata, and volumetric measurements.
        Input binary_masks: (3, H, W, D) tensor.
        """
        num_channels, H, W, D = binary_masks.shape
        regions = []
        total_volume_cm3 = 0.0

        # Select middle slice along axial dimension (D // 2) for 2D overlay preview
        mid_slice_idx = D // 2

        # Create RGBA overlay array for middle slice (H, W, 4)
        overlay_rgba = np.zeros((H, W, 4), dtype=np.uint8)

        for ch in range(min(num_channels, 3)):
            channel_mask = binary_masks[ch]  # (H, W, D)
            vol_cm3 = self.compute_volume_cm3(channel_mask, voxel_spacing)
            voxel_count = int(torch.sum(channel_mask).item())

            label_info = SUB_REGION_LABELS.get(ch, {"code": f"REGION_{ch}", "name": f"Region {ch}", "color_rgb": (255, 0, 0)})

            regions.append({
                "channelIndex": ch,
                "labelCode": label_info["code"],
                "regionName": label_info["name"],
                "voxelCount": voxel_count,
                "volumeCm3": vol_cm3,
                "colorRgb": list(label_info["color_rgb"])
            })

            if label_info["code"] == "WT":
                total_volume_cm3 = vol_cm3

            # Render slice overlay for channel
            slice_mask = channel_mask[:, :, mid_slice_idx].cpu().numpy()
            r, g, b = label_info["color_rgb"]
            active_pixels = slice_mask > 0

            # Composite into RGBA overlay with 40% opacity (alpha=102)
            overlay_rgba[active_pixels, 0] = r
            overlay_rgba[active_pixels, 1] = g
            overlay_rgba[active_pixels, 2] = b
            overlay_rgba[active_pixels, 3] = 102

        # Save mask as 3D NumPy array file (.npy) or slice PNG
        mask_filename = f"mask_{job_id}.npy"
        mask_path = file_storage.save_mask_npy(binary_masks.cpu().numpy(), mask_filename)

        # Save middle slice overlay preview PNG
        overlay_img = Image.fromarray(overlay_rgba)
        overlay_filename = f"overlay_{job_id}.png"

        overlay_path = file_storage.save_overlay_png(overlay_img, overlay_filename)

        logger.info(f"[Job #{job_id}] Post-processing complete. Overlay generated: '{overlay_path}', total WT volume: {total_volume_cm3} cm³")

        return {
            "maskPath": mask_path,
            "overlayPath": overlay_path,
            "regions": regions,
            "totalVolumeCm3": total_volume_cm3
        }


post_processor = PostProcessor()
