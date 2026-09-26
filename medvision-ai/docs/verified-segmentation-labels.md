# Verified Segmentation Labels — MONAI SegResNet (BraTS)

> **Model:** MONAI SegResNet (BraTS Brain Tumor Segmentation)  
> **Output Channels:** 3  
> **Activation & Threshold:** Sigmoid activation followed by 0.5 probability thresholding

---

## 1. Sub-Region Channel Definitions

The model outputs 3 overlapping binary segmentation channels corresponding to standard Brain Tumor Segmentation (BraTS) sub-regions:

| Channel Index | Label Code | Region Name | Anatomical Sub-Region Composition | Color Mapping (RGB) | Color Preview |
|---|---|---|---|---|---|
| **0** | **WT** | Whole Tumor | Whole tumor volume (Edema + Non-enhancing core + Enhancing tumor) | `(255, 68, 68)` | 🔴 Red |
| **1** | **TC** | Tumor Core | Necrotic and non-enhancing tumor core + Enhancing tumor | `(255, 170, 0)` | 🟠 Orange |
| **2** | **ET** | Enhancing Tumor | Active contrast-enhancing tumor tissue | `(51, 204, 51)` | 🟢 Green |

---

## 2. Measurement Definitions

- **Voxel Volume:** $1.0\text{ mm} \times 1.0\text{ mm} \times 1.0\text{ mm} = 1.0\text{ mm}^3 = 0.001\text{ cm}^3$
- **Volumetric Calculation:**
  $$\text{Volume (cm}^3) = \frac{\text{Voxel Count} \times v_x \times v_y \times v_z}{1000.0}$$
- **Primary Volumetric Output:** `affectedVolumeCm3` corresponds to Channel 0 (Whole Tumor volume in cm³).

---

## 3. Visual Preview Overlay Generation

- **Preview Slice:** Middle axial slice ($D / 2$)
- **Blending:** 40% alpha opacity (`alpha = 102 / 255`) composite over background MRI
- **Output Format:** PNG 32-bit RGBA image stored in `storage_data/overlays/`
- **Mask Array Output:** 3D NumPy binary tensor `.npy` stored in `storage_data/masks/`
