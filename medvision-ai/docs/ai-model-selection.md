# Brain MRI AI Model Selection & Evaluation

This document presents the research, candidate evaluation, input compatibility analysis, and model selection for the **MedVision AI** Brain MRI AI-assisted tumor segmentation engine.

---

## 1. Target AI Problem Definition

- **Use Case**: Brain MRI AI-assisted lesion and tumor region segmentation.
- **Clinical Terminology Guard**: Output is designated as **"AI-assisted segmentation"** or **"possible abnormal region"** to clearly demarcate decision-support telemetry from definitive medical diagnosis.
- **Required Telemetry**:
  - AI-assisted segmentation mask (binary & sub-region multilabel)
  - Visual overlay representation
  - Quantitative measurement (2D pixel area $\text{mm}^2$ / 3D volume $\text{cm}^3$)
  - Model confidence metrics
  - Preprocessing, inference, and postprocessing latency metrics
  - Execution device (`CPU` or `CUDA`)

---

## 2. Model Candidates Evaluation Matrix

We evaluated 4 prominent architectures suited for Brain MRI segmentation:

| Criterion | Candidate 1: MONAI SegResNet (BraTS 2021) | Candidate 2: Swin UNETR (BraTS 3D) | Candidate 3: 3D UNETR | Candidate 4: 2D U-Net (ResNet Backbone) |
|---|---|---|---|---|
| **1. Dataset Modality** | Brain MRI (BraTS 2021) | Brain MRI (BraTS 2021) | Brain MRI (BraTS 2021) | Brain MRI 2D Slices (Kaggle) |
| **2. Input Format** | NIfTI (`.nii.gz`) / DICOM | NIfTI (`.nii.gz`) | NIfTI (`.nii.gz`) | JPG / PNG / DICOM Slice |
| **3. Dimensions** | 3D Volume / 2D Slice Crop | 3D Volume | 3D Volume | 2D Single Slice |
| **4. Channels** | 4 (T1, T1ce, T2, FLAIR) | 4 (T1, T1ce, T2, FLAIR) | 4 (T1, T1ce, T2, FLAIR) | 1 to 3 (Grayscale/RGB) |
| **5. Labels** | 3 (WT, TC, ET) | 3 (WT, TC, ET) | 3 (WT, TC, ET) | 1 (Abnormal Region) |
| **6. Architecture** | SegResNet (Encoder-Decoder + Residual) | Swin Transformer + UNet | ViT + 3D UNet | 2D U-Net + ResNet34 |
| **7. Preprocessing** | RAS, Spacing (1mm³), Z-Score | RAS, Spacing (1mm³), Z-Score | RAS, Spacing (1mm³), Z-Score | Resize 256x256, MinMax |
| **8. Checkpoint Availability** | Public (MONAI Model Zoo / Bundle) | Public (MONAI Model Zoo) | Public (MONAI Model Zoo) | Torchvision / GitHub |
| **9. Expected Output** | Multilabel 3D/2D Mask | Multilabel 3D Mask | Multilabel 3D Mask | Binary 2D Mask |
| **10. License** | Apache 2.0 (Open Research) | Apache 2.0 | Apache 2.0 | MIT / Public Domain |
| **11. GPU VRAM** | ~4 GB VRAM | ~8-12 GB VRAM | ~12 GB VRAM | ~2 GB VRAM |
| **12. CPU Inference** | Feasible (~1.5s/slice crop) | Slow on CPU (~15s) | Slow on CPU (~20s) | Fast on CPU (~0.2s) |
| **13. Feasibility** | High (MONAI Native) | Moderate | Moderate | High |
| **14. JPG Input** | Via Dual-Input Adapter | Requires 4 NIfTI files | Requires 4 NIfTI files | Native |
| **15. Real DICOM/NIfTI** | Supported | Required | Required | Optional |

---

## 3. Critical Input Compatibility Analysis

### The Doctor Upload Reality
In clinical web application contexts, medical staff frequently upload single-slice 2D formats (**JPG**, **JPEG**, **PNG**) via web browsers alongside standard **DICOM** (`.dcm`) and **NIfTI** (`.nii.gz`) files.

> [!CAUTION]
> **Medical Imaging Constraint**: A JPG or PNG file uploaded by a doctor is an 8-bit lossy 2D projection of a single slice. It does **NOT** contain 3D volumetric depth, 12/16-bit dynamic range, or multi-sequence MRI channels (T1w, T1gd, T2w, FLAIR). Converting a JPG file to DICOM via `pydicom` creates a **Secondary Capture DICOM** object, but does NOT magically create authentic 3D MRI physics metadata.

### Architectural Recommendation: Dual-Input Pipeline (Option D)

To balance technical correctness, UI flexibility, and project feasibility, MedVision AI adopts a **Dual-Input Hybrid Pipeline**:

```text
Doctor Upload (Browser)
   ├── Case A: 2D Image (JPG/PNG/Secondary Capture DICOM)
   │     └── Single-Slice Preprocessing -> 2D Segmentation & Pixel-Area Telemetry (mm²)
   │
   └── Case B: 3D Volumetric Study (Multi-sequence DICOM / NIfTI)
         └── MONAI SegResNet Pipeline -> 3D Sub-region Segmentation (WT/TC/ET) & Volume (cm³)
```

---

## 4. Recommended Primary Model

We select **MONAI SegResNet (BraTS 2021 Brain Tumor Segmentation)** as the primary production model.

### Selection Rationale
1. **Gold Standard Benchmark**: Trained on the official BraTS (Brain Tumor Segmentation) benchmark.
2. **MONAI Native Ecosystem**: Standardized PyTorch/MONAI model architecture with built-in preprocessing and postprocessing transforms.
3. **Optimized Resource Footprint**: Encoder-decoder architecture with residual connections allows fast CPU inference (~1.5s) while utilizing full CUDA acceleration when available (~0.15s).
4. **Sub-region Precision**: Distinguishes **Whole Tumor (WT)**, **Tumor Core (TC)**, and **Enhancing Tumor (ET)**.
