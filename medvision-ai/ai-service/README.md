# MedVision AI — Python FastAPI Service

Standalone Python service for image validation, derived DICOM creation (`pydicom`), configurable preprocessing, asynchronous job processing, and PyTorch / MONAI model inference abstraction.

## Features

- **Health Monitoring**: `GET /api/ai/health` with CPU/CUDA device detection.
- **Asynchronous Jobs**: `POST /api/ai/jobs` non-blocking job submission returning immediate `jobId` and updates status (`QUEUED` → `VALIDATING` → `PREPROCESSING` → `INFERENCE` → `SEGMENTATION` → `COMPLETED`).
- **DICOM Generation**: `POST /api/ai/dicom/convert` derives Secondary Capture DICOM objects with authentic UIDs using `pydicom` without fabricating acquisition parameters.
- **Inference Abstraction**: Supports `DEMO` mode (explicitly tagged with `DEMO_MODE`) and `PRODUCTION` mode (MONAI + PyTorch integration layer).

## Running Locally

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start FastAPI application
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 3. Run automated tests
pytest
```
