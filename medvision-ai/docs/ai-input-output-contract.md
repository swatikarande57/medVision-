# MedVision AI Input-Output API Contract & Migration Plan

This document details the API field compatibility between Python FastAPI, Spring Boot, and the React DICOM Viewer, alongside the step-by-step migration roadmap for integrating production MONAI inference.

---

## 1. Spring Boot & Python AI API Field Contract

The Python AI service response schema is engineered to map directly into the Spring Boot backend (`AIAnalysis` JPA Entity & `AnalysisJob` status poller) without requiring database breaking changes:

| Python FastAPI `InferenceResult` Field | Spring Boot `AIAnalysis` Field | React Frontend DTO Property | Type | Description |
|---|---|---|---|---|
| `jobId` | `jobId` | `jobId` | `String` | Unique analysis job identifier |
| `status` | `status` | `status` | `String` | Job status (`COMPLETED` / `FAILED`) |
| `mode` | `mode` | `mode` | `String` | Execution mode (`DEMO` / `PRODUCTION`) |
| `prediction.label` | `findings` / `resultLabel` | `findings` | `String` | AI-assisted region label |
| `prediction.confidence` | `confidence` | `confidence` | `Float \| null` | Model prediction confidence (null in demo) |
| `segmentation.maskPath` | `maskPath` | `maskUrl` | `String` | Binary / multilabel mask file location |
| `segmentation.overlayPath` | `overlayPath` | `overlayUrl` | `String` | PNG transparency visual overlay |
| `measurements.affectedAreaPercentage` | `affectedAreaPercentage` | `affectedAreaPercentage` | `Float` | Lesion area percentage of slice foreground |
| `measurements.estimatedArea` | `affectedArea` / `affectedVolume` | `affectedArea` | `Float` | Pixel area ($\text{mm}^2$) / Volume ($\text{cm}^3$) |
| `processing.device` | `processingDevice` | `processingDevice` | `String` | Execution compute hardware (`CPU` / `CUDA`) |
| `processing.inferenceTimeMs` | `executionTimeMs` | `executionTimeMs` | `Float` | Forward pass latency in milliseconds |

---

## 2. React Viewer Visual Data Requirements

To display real AI model outputs in the React `MedicalViewerPage` and `AIAnalysisPage`:

```typescript
export interface AIAnalysisOutput {
  jobId: string;
  status: 'COMPLETED' | 'FAILED';
  mode: 'DEMO' | 'PRODUCTION';
  findings: string;
  confidence: number | null;
  maskUrl: string | null;
  overlayUrl: string | null;
  affectedAreaPercentage: number | null;
  affectedArea: number | null; // mm² (2D) or cm³ (3D)
  processingDevice: 'CPU' | 'CUDA';
  executionTimeMs: number;
  analysisTimestamp: string;
}
```

---

## 3. End-to-End Migration Plan

```text
CURRENT VERIFIED FOUNDATION
FastAPI AI Service + Async JobManager + pydicom Derived DICOM + DemoInferenceModel
    │
    ▼
STEP 1: Model Checkpoint Selection & Download
Place MONAI SegResNet pre-trained weights file (`monai_brats_segresnet.pt`) into `ai-service/models/`.
Set `AI_MODE=production` and `MODEL_PATH=./models/monai_brats_segresnet.pt`.
    │
    ▼
STEP 2: Implement MonaiInferenceModel & Preprocessing Pipelines
Wire `MONAI.transforms` preprocessing pipeline into `MonaiInferenceModel.load_model()` and `predict()`.
    │
    ▼
STEP 3: Real Segmentation Mask & Overlay Export Generation
Save binary/multilabel segmentation mask arrays to `ai-service/storage_data/masks/` and export PNG overlays to `ai-service/storage_data/overlays/`.
    │
    ▼
STEP 4: Quantitative 2D Area & 3D Volumetric Calculations
Apply physical voxel spacing formulas to compute valid $\text{mm}^2$ area (2D) and $\text{cm}^3$ volume (3D).
    │
    ▼
STEP 5: Spring Boot Job Poller & Database Mapping Verification
Verify Spring Boot `AnalysisService` correctly fetches Python FastAPI `/api/ai/jobs/{id}` completed results and persists to MySQL `ai_analyses` table.
    │
    ▼
STEP 6: React DICOM Viewer Visualization
Render the generated PNG/NIfTI overlay on top of the original scan canvas in `MedicalViewerPage.tsx`.
```
