# Real MONAI SegResNet AI Model Integration — Technical Summary

This document records the architecture, verified requirements, preprocessing transform chain, and test verification results for the production **MONAI SegResNet** brain tumor segmentation model integration into the MedVision AI platform.

---

## 1. System Architecture & Model Pipeline

```
  [ NIfTI 3D MRI Volume (.nii / .nii.gz) ]
                    │
                    ▼
     ┌─────────────────────────────┐
     │   PreprocessingPipeline3D   │
     │  LoadImaged -> Orientation   │
     │  -> Spacing (1mm³) -> Norm  │
     └──────────────┬──────────────┘
                    │  Tensor: (1, 4, H, W, D)
                    ▼
     ┌─────────────────────────────┐
     │    MonaiInferenceModel      │
     │   MONAI SegResNet (16 init) │
     │  torch.inference_mode()     │
     └──────────────┬──────────────┘
                    │  Logits: (1, 3, H, W, D)
                    ▼
     ┌─────────────────────────────┐
     │        PostProcessor        │
     │  Sigmoid -> 0.5 Threshold   │
     │  -> WT / TC / ET Layers     │
     │  -> 3D Volume (cm³) Calc    │
     └──────────────┬──────────────┘
                    │
                    ▼
  [ JSON InferenceResult + PNG Overlay + .npy Mask ]
```

---

## 2. Model Parameters & Verified Specifications

- **Architecture:** MONAI SegResNet (`spatial_dims=3`)
- **Checkpoint File:** `ai-service/models/monai_brats_segresnet.pt` (17.97 MB)
- **Verified Init Filters:** `init_filters=16` (strict load verified against state_dict with 83 parameters)
- **Input Channels:** 4 (T1, T1ce, T2, FLAIR)
- **Output Channels:** 3 (WT: Whole Tumor, TC: Tumor Core, ET: Enhancing Tumor)
- **Execution Device:** CPU (CUDA auto-detected if GPU hardware available)
- **Warm Start Loading:** Pre-loaded into memory during FastAPI startup via lifespan context manager

---

## 3. Test Coverage Summary

- **Total Test Cases:** 19
- **Pass Rate:** 100% (19/19 passed)
- **Test Categories:**
  1. `test_model_loading.py`: Real checkpoint load, state_dict strict verification, forward pass, error handling
  2. `test_pipeline_3d.py`: 3D NIfTI format detection, MONAI transform chain execution
  3. `test_real_inference.py`: End-to-end NIfTI inference, 3D sub-regions, overlay rendering, volume measurement, 2D rejection in production mode
  4. `test_dicom.py`: DICOM conversion and tag verification
  5. `test_jobs.py`: Asynchronous job creation, background status transitions, status polling
  6. `test_validation.py`: Image validation, mime types, file extension validation
  7. `test_health.py`: System health check

---

## 4. 2D Image Upload Policy in Production Mode

In `PRODUCTION` mode (`AI_MODE=production`), standard 2D image uploads (`.jpg`, `.jpeg`, `.png`) return `status: "2D_MODEL_NOT_CONFIGURED"` with an explicit diagnostic message explaining that the 3D BraTS SegResNet model requires compatible 3D volumetric MRI inputs. In `DEMO` mode (`AI_MODE=demo`), 2D images continue to process via `DemoInferenceModel`.
