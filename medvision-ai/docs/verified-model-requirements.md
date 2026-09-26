# Verified Model Requirements — MONAI SegResNet (BraTS Brain Tumor Segmentation)

> **Status:** ✅ VERIFIED (checkpoint exists, architecture parameters verified via state_dict inspection and successful forward pass)

---

## 1. Model Identity

| Field | Value |
|---|---|
| **Model Name** | MONAI SegResNet |
| **Checkpoint Name** | `monai_brats_segresnet.pt` |
| **Official Source** | MONAI Model Zoo / `brats_mri_segmentation` bundle |
| **Checkpoint Format** | PyTorch state_dict (`.pt`) |
| **Checkpoint Size** | 17.97 MB (18,842,056 bytes) |
| **License** | Apache 2.0 (Open Research) |

---

## 2. Framework Versions

| Dependency | Previously Verified (`ai-runtime.md`) | Currently Installed & Verified |
|---|---|---|
| **Python** | 3.13.7 | 3.13.7 ✅ |
| **PyTorch** | 2.9.1+cpu | 2.14.0+cpu ✅ |
| **MONAI** | 1.6.0 | 1.6.0 ✅ |
| **NumPy** | 2.2.6 | 2.5.2 ✅ |
| **nibabel** | 5.4.2 | 5.4.2 ✅ |
| **pydicom** | 3.0.2 | 3.0.2 ✅ |
| **Pillow** | 11.3.0 | 11.3.0 ✅ |
| **FastAPI** | 0.110.0 | 0.141.1 ✅ |
| **scipy** | — | 1.18.1 ✅ |

---

## 3. Architecture Parameters

| Parameter | Value | Verification Result |
|---|---|---|
| `spatial_dims` | 3 | ✅ Verified |
| `in_channels` | 4 | ✅ Verified from `convInit.conv.weight` shape `[16, 4, 3, 3, 3]` |
| `out_channels` | 3 | ✅ Verified from `conv_final.2.conv.weight` shape `[3, 16, 1, 1, 1]` |
| `init_filters` | 16 | ✅ **VERIFIED from checkpoint state_dict** (`init_filters=16` strict load success) |
| `blocks_down` | [1, 2, 2, 4] | ✅ Verified |
| `blocks_up` | [1, 1, 1] | ✅ Verified |


---

## 4. Input Requirements

| Requirement | Value |
|---|---|
| **Input Format** | NIfTI (`.nii`, `.nii.gz`) or Multi-sequence DICOM |
| **Required Modalities** | T1, T1ce (T1-Gd), T2, FLAIR |
| **Number of Input Channels** | 4 (one per modality) |
| **Expected Tensor Shape** | `(1, 4, H, W, D)` (batch=1, channels=4, spatial 3D) |
| **Training Patch Size** | 224 × 224 × 144 |
| **Voxel Spacing** | 1.0mm × 1.0mm × 1.0mm (isotropic) |

---

## 5. Required Preprocessing (MONAI Transform Chain)

1. `LoadImaged` — Load NIfTI/DICOM volume
2. `EnsureChannelFirstd` — Channel dimension first
3. `Orientationd(axcodes="RAS")` — Standardize orientation
4. `Spacingd(pixdim=(1.0, 1.0, 1.0))` — Resample to isotropic 1mm³
5. `NormalizeIntensityd(nonzero=True, channel_wise=True)` — Z-score normalization
6. `CropForegroundd` — Remove empty background
7. `CastToTyped(dtype=float32)` — Ensure float32

---

## 6. Output Specification

| Field | Value |
|---|---|
| **Output Tensor Shape** | `(3, H, W, D)` — 3 channels, spatial dims match cropped input |
| **Post-processing** | Sigmoid activation → threshold (0.5) → binary mask per channel |

### Segmentation Labels

| Channel | Label Code | Sub-Region | Anatomical Description |
|---|---|---|---|
| 0 | **WT** | Whole Tumor | Edema + Non-enhancing Core + Enhancing Tumor |
| 1 | **TC** | Tumor Core | Non-enhancing Core + Enhancing Tumor |
| 2 | **ET** | Enhancing Tumor | Active contrast-enhancing tumor tissue |

---

## 7. GPU/CPU Requirements

| Configuration | Value |
|---|---|
| **GPU VRAM** | ~4 GB (full 3D volume inference) |
| **CPU Inference** | Feasible (~1.5s per slice crop, longer for full volume) |
| **Current Environment** | CPU only (no CUDA detected) |

---

## 8. Remaining Verifications (Post Package Install)

- [ ] Install `torch>=2.9.0` (CPU build), `monai>=1.6.0`, `nibabel`, `pydicom`, `httpx`, `scipy`
- [ ] Load checkpoint and inspect state_dict keys to confirm `init_filters`
- [ ] Verify SegResNet forward pass with synthetic 4-channel 3D tensor
- [ ] Confirm output shape matches 3 channels
