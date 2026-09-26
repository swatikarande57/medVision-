# MONAI Brain MRI Model Technical Specification

This document details the exact preprocessing transforms, segmentation sub-region channels, measurement telemetry rules, and application lifecycle design for **MONAI SegResNet**.

---

## 1. Preprocessing Pipeline Specification

To reproduce model performance without introducing arbitrary preprocessing artifacts, input images pass through the MONAI transform chain:

```python
from monai.transforms import (
    Compose,
    LoadImaged,
    EnsureChannelFirstd,
    Orientationd,
    Spacingd,
    NormalizeIntensityd,
    CropForegroundd,
    CastToTyped,
    ToTensord
)

preprocessing_transforms = Compose([
    LoadImaged(keys=["image"]),
    EnsureChannelFirstd(keys=["image"]),
    Orientationd(keys=["image"], axcodes="RAS"),
    Spacingd(keys=["image"], pixdim=(1.0, 1.0, 1.0), mode="bilinear"),
    NormalizeIntensityd(keys=["image"], nonzero=True, channel_wise=True),
    CropForegroundd(keys=["image"], source_key="image"),
    CastToTyped(keys=["image"], dtype=torch.float32),
    ToTensord(keys=["image"])
])
```

### Preprocessing Parameters
- **Orientation**: Standardized to `RAS` (Right-Anterior-Superior) anatomical coordinates.
- **Voxel Spacing**: Resampled to isotropic $1.0\text{mm} \times 1.0\text{mm} \times 1.0\text{mm}$.
- **Intensity Normalization**: Z-score normalization $z = \frac{x - \mu}{\sigma}$ calculated over non-zero brain tissue voxels.
- **Cropping**: Foreground bounding box crop to exclude empty background space.

---

## 2. Output & Segmentation Sub-region Channels

The output tensor shape is `(3, H, W, D)` for 3D volumes or `(3, H, W)` for 2D slices.

| Channel Index | Label Code | Sub-Region Name | Anatomical Components |
|---|---|---|---|
| **Channel 0** | **WT** | Whole Tumor | Peritumoral Edema + Non-enhancing Core + Enhancing Tumor |
| **Channel 1** | **TC** | Tumor Core | Non-enhancing Core + Enhancing Tumor |
| **Channel 2** | **ET** | Enhancing Tumor | Contrast-Enhancing Active Tumor Tissue |

---

## 3. Measurement Telemetry Calculation Rules

> [!IMPORTANT]
> **Strict Measurement Rule**: Physical volume ($\text{cm}^3$) is calculated **ONLY** when isotropic 3D voxel spacing ($v_x, v_y, v_z$) is present in NIfTI/DICOM headers. For 2D JPG uploads, pixel-area ($\text{mm}^2$) is calculated based on slice calibration; if uncalibrated, area is reported as percentage of slice foreground to prevent fake volume claims.

### 2D Single Slice Measurement Formula
$$\text{Area (mm}^2\text{)} = \text{Pixel Count} \times \text{Spacing}_x \times \text{Spacing}_y$$

### 3D Volumetric Measurement Formula
$$\text{Volume (cm}^3\text{)} = \frac{\sum \text{Voxels}_{\text{label}} \times v_x \times v_y \times v_z}{1000}$$

---

## 4. `MonaiInferenceModel` Architecture & Lifecycle Design

### Lifecycle Management (Singleton App Load)
To avoid loading multi-megabyte model weights on every HTTP request, `MonaiInferenceModel` uses a singleton lifecycle initialized during FastAPI application startup (`@app.on_event("startup")`):

```python
class MonaiInferenceModel(InferenceModel):
    def __init__(self, model_path: str | None = None):
        self.model_path = model_path or settings.MODEL_PATH
        self.device = settings.resolve_device()
        self.model = None

    def load_model(self):
        """Loads weights once during application startup."""
        if not self.model_path or not os.path.exists(self.model_path):
            raise RuntimeError("Production model is not configured.")
        
        # Initialize SegResNet structure and load state dict
        self.model = SegResNet(
            spatial_dims=3,
            in_channels=4,
            out_channels=3,
            init_filters=16,
            blocks_down=[1, 2, 2, 4],
            blocks_up=[1, 1, 1]
        ).to(self.device)
        
        self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
        self.model.eval()

    def predict(self, file_path: str, job_id: str) -> InferenceResult:
        if self.model is None:
            raise RuntimeError("Production model is not configured.")
        # Execute preprocessing -> forward pass -> postprocessing
```
