# MedVision AI Service API Contract

This document outlines the REST API contract between the Spring Boot Backend and the Python AI Processing Service (`ai-service/`).

---

## 1. Health Endpoint

### `GET /api/ai/health`
Verifies process status and available compute device without loading the heavy neural model.

#### Response `200 OK`
```json
{
  "status": "UP",
  "service": "medvision-ai",
  "version": "2.4.0",
  "modelMode": "DEMO",
  "device": "CPU"
}
```

---

## 2. Asynchronous Analysis Job API

### `POST /api/ai/jobs`
Submits a medical image for non-blocking asynchronous analysis.

- **Content-Type**: `multipart/form-data`
- **Body**: `file` (Binary image file: JPG, JPEG, PNG, or DCM)

#### Response `202 Accepted`
```json
{
  "jobId": "job_a1b2c3d4e5f6",
  "status": "QUEUED"
}
```

---

### `GET /api/ai/jobs/{jobId}`
Polls status and telemetry for an active or completed job.

#### Response `200 OK` (Processing)
```json
{
  "jobId": "job_a1b2c3d4e5f6",
  "status": "PREPROCESSING",
  "progress": 35,
  "stage": "Running image normalization and tensor conversion",
  "error": null,
  "result": null
}
```

#### Response `200 OK` (Completed)
```json
{
  "jobId": "job_a1b2c3d4e5f6",
  "status": "COMPLETED",
  "progress": 100,
  "stage": "Processing complete",
  "error": null,
  "result": {
    "jobId": "job_a1b2c3d4e5f6",
    "status": "COMPLETED",
    "mode": "DEMO",
    "prediction": {
      "label": "DEMO_MODE",
      "confidence": null
    },
    "segmentation": {
      "maskPath": null,
      "overlayPath": null
    },
    "measurements": {
      "affectedAreaPercentage": null,
      "estimatedArea": null
    },
    "processing": {
      "device": "CPU",
      "preprocessingTimeMs": 12.4,
      "inferenceTimeMs": 50.1,
      "postprocessingTimeMs": 1.2
    }
  }
}
```

---

## 3. Secondary Capture DICOM Conversion API

### `POST /api/ai/dicom/convert`
Converts uploaded JPG or PNG into a derived Secondary Capture DICOM dataset (`1.2.840.10008.5.1.4.1.1.7`) with generated UIDs.

- **Content-Type**: `multipart/form-data`
- **Body**: `file` (JPG/PNG file)

#### Response `200 OK`
```json
{
  "success": true,
  "dicomPath": "/app/storage_data/dicom/DERIVED_1.2.840.10008.5.1.4.1.1.7...dcm",
  "originalFileName": "scan_brain.png",
  "sopInstanceUid": "1.2.826.0.1.3680043...",
  "modality": "SC",
  "message": "Successfully converted image to derived Secondary Capture DICOM format."
}
```
