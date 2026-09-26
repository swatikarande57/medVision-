# MedVision AI Runtime Environment Specification

This document records the verified Python library versions and hardware runtime capabilities for the MedVision AI Service (`ai-service/`).

---

## 1. Verified Software Environment

- **Python**: `3.13.7`
- **PyTorch**: `2.14.0+cpu`
- **MONAI**: `1.6.0`
- **nibabel**: `5.4.2`
- **NumPy**: `2.5.2`
- **pydicom**: `3.0.2`
- **Pillow**: `11.3.0`
- **FastAPI**: `0.141.1`
- **Uvicorn**: `0.35.0`
- **scipy**: `1.18.1`
- **httpx**: `0.28.1`
- **pytest**: `9.1.1`

---

## 2. Compute Acceleration & Device Resolution

- **CUDA Runtime**: Not active in current environment (CPU execution fallback verified).
- **Execution Device**: `CPU`
- **Device Resolution Logic**: `settings.resolve_device()` dynamically evaluates `torch.cuda.is_available()` on application startup. If CUDA-capable hardware and PyTorch CUDA binaries are detected, execution automatically switches to `CUDA`.
- **Model Checkpoint**: MONAI SegResNet (BraTS 2021) `monai_brats_segresnet.pt` (17.97 MB, `init_filters=16`, 4ch in, 3ch out)
