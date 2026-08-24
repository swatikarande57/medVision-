# MedVision AI — Technical Design Document

> **Project:** Final-Year Full-Stack AI Medical Image Analysis Platform  
> **Version:** 1.0  
> **Status:** Architecture approved for implementation — **no application code in this phase**  
> **Existing asset:** `MedVision-Backend/` (Spring Boot 4.1.1, Java 21, verified build)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Primary User Flow](#3-primary-user-flow)
4. [Module Breakdown](#4-module-breakdown)
5. [Database ER Design](#5-database-er-design)
6. [REST API Contract](#6-rest-api-contract)
7. [WebSocket Contract](#7-websocket-contract)
8. [Frontend Route Map](#8-frontend-route-map)
9. [AI Service Contract](#9-ai-service-contract)
10. [Medical Imaging Rules](#10-medical-imaging-rules)
11. [UI / UX Design System](#11-ui--ux-design-system)
12. [Security Architecture](#12-security-architecture)
13. [Deployment Topology](#13-deployment-topology)
14. [Implementation Phases](#14-implementation-phases)
15. [Risks & Dependencies](#15-risks--dependencies)

---

## 1. Executive Summary

MedVision AI is a doctor-facing web platform for uploading brain MRI images (JPG/PNG), running AI-assisted prediction and segmentation, viewing results in an interactive medical viewer, tracking analysis history, comparing scans over time, and generating structured reports.

The system is intentionally split into three deployable services:

| Layer | Stack | Responsibility |
|-------|-------|----------------|
| Frontend | React + Vite + TypeScript + Tailwind | UX, viewer, real-time job progress |
| Backend | Spring Boot + JWT + JPA + WebSocket | Auth, business logic, orchestration, persistence |
| AI Service | FastAPI + MONAI + PyTorch | Preprocessing, inference, segmentation, derived DICOM |

**Academic demo goal:** End-to-end working demo with professional UI, real AI pipeline, honest medical disclaimers, and no fake buttons.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         React SPA (Vite + TypeScript)                        │
│  Landing · Auth · Dashboard · Patients · Upload · Viewer · Reports         │
│  Cornerstone3D viewer · Recharts · R3F hero · Framer Motion · Axios         │
└───────────────────────────────┬────────────────────────────────────────────┘
                                │
                    REST (JSON) │  WebSocket (STOMP/SockJS)
                    Bearer JWT  │  /ws/analysis/{jobId}
                                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Spring Boot Backend (port 8080)                           │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ JWT Auth │ │ Patients  │ │ Scan Upload│ │ AI Jobs    │ │ WebSocket   │ │
│  │ BCrypt   │ │ CRUD      │ │ Storage    │ │ Orchestrator│ │ Broadcaster │ │
│  └──────────┘ └───────────┘ └────────────┘ └──────┬─────┘ └─────────────┘ │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐         │                        │
│  │ Results  │ │ Compare   │ │ Reports    │         │ RestClient + API Key │
│  └──────────┘ └───────────┘ └────────────┘         ▼                        │
└───────────────────────────────┬────────────────────────────────────────────┘
                                │ JDBC (HikariCP, @Transactional)
                                ▼
                    ┌───────────────────────┐
                    │      MySQL 8.x        │
                    │  medvision schema     │
                    └───────────────────────┘

                                Spring Boot ──HTTP multipart──►
┌──────────────────────────────────────────────────────────────────────────────┐
│                   Python FastAPI AI Service (port 8000)                      │
│  Job queue · Preprocess · Validate JPG/PNG · MONAI inference · Segment      │
│  Optional: derived DICOM Secondary Capture (pydicom, clearly labelled)       │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  MONAI + PyTorch      │
                    │  CPU or NVIDIA CUDA   │
                    └───────────────────────┘

File storage (local dev / MinIO prod):
  /uploads/scans/{scanId}/original.{jpg|png}
  /uploads/results/{resultId}/overlay.png
  /uploads/results/{resultId}/mask.png
  /uploads/results/{resultId}/derived.dcm   (optional, labelled derived)
  /uploads/reports/{reportId}/report.pdf
```

### 2.1 Async Analysis Job Flow

```
Doctor uploads scan
       │
       ▼
Spring Boot saves scan + creates ai_job (status=PENDING)
       │
       ▼
Spring Boot POST /api/v1/jobs → FastAPI (multipart image)
       │
       ▼
FastAPI returns external job_id, status=QUEUED
       │
       ├──► Spring Boot updates ai_job, broadcasts WS: QUEUED
       │
       ▼
FastAPI worker: PREPROCESSING → INFERENCE → SEGMENTATION → COMPLETED
       │              (progress % pushed via callback or polled)
       │
       ├──► Spring Boot polls GET /jobs/{id} OR receives webhook
       ├──► On COMPLETED: fetch result, persist analysis_result
       └──► WebSocket push: COMPLETED + result summary to subscribed clients
       │
       ▼
Doctor views prediction + overlay in Cornerstone3D viewer
```

### 2.2 Communication Matrix

| From | To | Protocol | Auth |
|------|-----|----------|------|
| Browser | Spring Boot | HTTPS REST | JWT Bearer |
| Browser | Spring Boot | WSS STOMP | JWT (handshake) |
| Spring Boot | MySQL | JDBC | env vars |
| Spring Boot | FastAPI | HTTP REST | `X-API-Key` (server-only) |
| FastAPI | Spring Boot | HTTP callback (optional) | `X-API-Key` |
| FastAPI | Local/GPU | In-process | N/A |

### 2.3 Repository Layout (target monorepo)

```
medVision/
├── docs/
│   ├── TECHNICAL_DESIGN.md          ← this document
│   └── ARCHITECTURE.md              ← backend baseline (legacy)
├── MedVision-Backend/               ← existing Spring Boot project
├── medvision-frontend/              ← React + Vite (to create)
├── medvision-ai-service/            ← FastAPI (to create)
├── docker-compose.yml               ← MySQL + services (Phase 1)
└── .env.example                     ← credentials template (no secrets)
```

---

## 3. Primary User Flow

**Actor:** Doctor (role: `RADIOLOGIST` or `CLINICIAN`)

```
1.  Visit landing page → Login
2.  Dashboard shows recent patients, pending analyses, quick stats
3.  Create patient (MRN, name, DOB, gender) OR select existing
4.  Upload brain MRI (JPG/PNG, max 50 MB)
5.  Confirm scan metadata (modality=MR, body part=BRAIN, scan date)
6.  Click "Analyze" → AI job created
7.  UI shows AI processing animation + live progress via WebSocket
8.  On completion:
      - Prediction label + confidence score
      - Segmentation overlay on original image
      - Region measurements (area, bounding box)
9.  View in interactive viewer (window/level, zoom, pan, overlay toggle)
10. Analysis stored in patient history
11. Later: upload follow-up scan → Compare with baseline
12. Generate PDF report (findings, images, disclaimer)
```

**Disclaimer (shown on upload + report):**  
*"MedVision AI provides decision support only. Results are not a clinical diagnosis. Derived DICOM files are secondary captures, not original scanner acquisitions."*

---

## 4. Module Breakdown

| # | Module | Frontend | Backend | AI Service | DB Tables |
|---|--------|----------|---------|------------|-----------|
| 1 | Landing page | `/` marketing | — | — | — |
| 2 | Doctor login/signup | `/login`, `/register` | Auth API | — | `users` |
| 3 | Dashboard | `/dashboard` | Stats API | — | aggregates |
| 4 | Patient management | `/patients/*` | Patient CRUD | — | `patients` |
| 5 | Scan upload | `/patients/:id/upload` | Multipart upload | — | `scans` |
| 6 | AI analysis | `/scans/:id/analyze` | Job orchestration | Inference | `ai_jobs` |
| 7 | Medical image viewer | `/scans/:id/viewer` | File serve | — | `scans`, `analysis_results` |
| 8 | Segmentation result | `/results/:id` | Result API | mask/overlay | `analysis_results`, `segmentation_layers` |
| 9 | Analysis history | `/patients/:id/history` | List results | — | `analysis_results` |
| 10 | Scan comparison | `/patients/:id/compare` | Compare API | optional diff | `scan_comparisons` |
| 11 | Reports | `/reports/*` | Report gen | — | `reports` |
| 12 | Settings | `/settings` | Profile API | — | `users` |
| 13 | Admin | `/admin/*` | User mgmt | model config | `users`, `audit_logs` |

**Signup policy:** Open registration creates `CLINICIAN` role; `ADMIN` promotes users. Registration can be disabled via env flag for demo deployments.

---

## 5. Database ER Design

**Engine:** MySQL 8.x · **Charset:** `utf8mb4` · **Collation:** `utf8mb4_unicode_ci`  
**Migrations:** Flyway (versioned SQL in `MedVision-Backend/src/main/resources/db/migration/`)

### 5.1 Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ PK id           │
│    email (UQ)   │
│    password_hash│
│    full_name    │
│    role         │── ENUM: ADMIN, RADIOLOGIST, CLINICIAN
│    specialty    │
│    enabled      │
│    created_at   │
│    updated_at   │
└────────┬────────┘
         │ 1
         │ creates
         ▼ *
┌─────────────────┐         ┌─────────────────┐
│    patients     │         │   audit_logs    │
├─────────────────┤         ├─────────────────┤
│ PK id           │         │ PK id           │
│    mrn (UQ)     │         │ FK user_id      │
│    first_name   │         │    action       │
│    last_name    │         │    entity_type  │
│    date_of_birth│         │    entity_id    │
│    gender       │         │    ip_address   │
│ FK created_by   │         │    created_at   │
│    notes        │         └─────────────────┘
│    deleted_at   │◄── soft delete
│    created_at   │
│    updated_at   │
└────────┬────────┘
         │ 1
         ▼ *
┌─────────────────────────────────────────────────────────┐
│                        scans                            │
├─────────────────────────────────────────────────────────┤
│ PK id                                                   │
│ FK patient_id          → patients(id) ON DELETE RESTRICT│
│ FK uploaded_by         → users(id)                      │
│    scan_type           ENUM: BRAIN_MRI, OTHER           │
│    modality            VARCHAR(16)  default 'MR'        │
│    body_part           VARCHAR(32)  default 'BRAIN'    │
│    original_filename                                    │
│    storage_path        NOT NULL                         │
│    mime_type           ENUM: image/jpeg, image/png      │
│    file_size_bytes                                      │
│    width, height                                        │
│    captured_at         DATE                             │
│    status              ENUM (see below)                 │
│    created_at, updated_at                               │
└────────────┬────────────────────────────────────────────┘
             │ 1
             ▼ *
┌─────────────────────────────────────────────────────────┐
│                       ai_jobs                           │
├─────────────────────────────────────────────────────────┤
│ PK id                                                   │
│ FK scan_id             → scans(id) ON DELETE CASCADE      │
│    external_job_id     VARCHAR(64) UQ  (FastAPI UUID)  │
│    model_name          VARCHAR(64)                      │
│    status              ENUM (see below)                 │
│    progress_pct        TINYINT 0-100                    │
│    error_code          VARCHAR(64) NULL                   │
│    error_message       TEXT NULL                        │
│    queued_at, started_at, completed_at                  │
│    created_at                                           │
└────────────┬────────────────────────────────────────────┘
             │ 1
             ▼ 0..1
┌─────────────────────────────────────────────────────────┐
│                   analysis_results                      │
├─────────────────────────────────────────────────────────┤
│ PK id                                                   │
│ FK ai_job_id           → ai_jobs(id) UQ                 │
│ FK scan_id             → scans(id)                      │
│    prediction_label    VARCHAR(128)                     │
│    confidence_score    DECIMAL(5,4)  CHECK 0-1          │
│    findings_json       JSON                             │
│    overlay_path        VARCHAR(512)                     │
│    mask_path           VARCHAR(512)                     │
│    derived_dicom_path  VARCHAR(512) NULL                │
│    inference_device    VARCHAR(32)                      │
│    preprocessing_ms, inference_ms                       │
│    created_at                                           │
└────────────┬────────────────────────────────────────────┘
             │ 1
             ▼ *
┌─────────────────────────────────────────────────────────┐
│                 segmentation_layers                     │
├─────────────────────────────────────────────────────────┤
│ PK id                                                   │
│ FK result_id           → analysis_results(id) CASCADE   │
│    label               VARCHAR(64)                      │
│    color_hex           CHAR(7)                          │
│    area_pixels         INT                              │
│    bbox_json           JSON  [x,y,w,h]                  │
│    mask_path           VARCHAR(512) NULL                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  scan_comparisons                       │
├─────────────────────────────────────────────────────────┤
│ PK id                                                   │
│ FK patient_id          → patients(id)                   │
│ FK baseline_scan_id    → scans(id)                      │
│ FK followup_scan_id    → scans(id)                      │
│ FK baseline_result_id  → analysis_results(id) NULL      │
│ FK followup_result_id  → analysis_results(id) NULL      │
│ FK created_by          → users(id)                      │
│    delta_summary       TEXT                             │
│    comparison_json     JSON                             │
│    created_at                                           │
│ CHECK baseline_scan_id != followup_scan_id              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                       reports                           │
├─────────────────────────────────────────────────────────┤
│ PK id                                                   │
│ FK scan_id             → scans(id)                      │
│ FK result_id           → analysis_results(id) NULL      │
│ FK generated_by        → users(id)                      │
│    title               VARCHAR(256)                     │
│    format              ENUM: PDF, HTML                  │
│    status              ENUM: DRAFT, FINAL, ARCHIVED   │
│    storage_path        VARCHAR(512)                     │
│    created_at, finalized_at                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  refresh_tokens                         │
├─────────────────────────────────────────────────────────┤
│ PK id                                                   │
│ FK user_id             → users(id) ON DELETE CASCADE    │
│    token_hash          VARCHAR(256) UQ                  │
│    expires_at          DATETIME                         │
│    revoked             BOOLEAN DEFAULT FALSE            │
│    created_at                                           │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Enumerations

| Table | Column | Values |
|-------|--------|--------|
| `users.role` | | `ADMIN`, `RADIOLOGIST`, `CLINICIAN` |
| `scans.status` | | `UPLOADED`, `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`, `ARCHIVED` |
| `ai_jobs.status` | | `PENDING`, `QUEUED`, `PREPROCESSING`, `INFERENCE`, `POSTPROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED` |
| `reports.status` | | `DRAFT`, `FINAL`, `ARCHIVED` |

### 5.3 Indexes

```sql
CREATE INDEX idx_patients_mrn ON patients(mrn);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_scans_patient_created ON scans(patient_id, created_at DESC);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_ai_jobs_scan ON ai_jobs(scan_id);
CREATE INDEX idx_ai_jobs_status_created ON ai_jobs(status, created_at);
CREATE INDEX idx_ai_jobs_external ON ai_jobs(external_job_id);
CREATE INDEX idx_results_scan ON analysis_results(scan_id);
CREATE INDEX idx_comparisons_patient ON scan_comparisons(patient_id);
CREATE INDEX idx_reports_scan ON reports(scan_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
```

### 5.4 Transaction Boundaries

| Operation | Transaction scope |
|-----------|-------------------|
| Upload scan | Save scan metadata + write file; rollback DB if file write fails |
| Submit AI job | Create `ai_job`, call FastAPI; on FastAPI failure mark `FAILED` |
| Persist result | Update job + insert result + layers in single `@Transactional` |
| Generate report | Insert report record + write PDF atomically |
| Soft delete patient | Set `deleted_at`; scans remain for audit |

### 5.5 Environment Variables (no hardcoded credentials)

```env
# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medvision
DB_USERNAME=medvision_app
DB_PASSWORD=<from-secret>

# JWT
JWT_SECRET=<256-bit-minimum-secret>
JWT_ACCESS_EXPIRY_MINUTES=30
JWT_REFRESH_EXPIRY_DAYS=7

# AI Service
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_API_KEY=<shared-secret>

# Storage
UPLOAD_DIR=./uploads

# Frontend CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Registration
ALLOW_PUBLIC_REGISTRATION=true
```

---

## 6. REST API Contract

**Base URL:** `https://api.medvision.local/api/v1` (dev: `http://localhost:8080/api/v1`)  
**Auth header:** `Authorization: Bearer <access_token>`  
**Content-Type:** `application/json` unless multipart  
**Errors:** RFC 7807 Problem Details

### 6.1 Standard Envelope

```json
{
  "success": true,
  "data": { },
  "meta": { "page": 0, "size": 20, "totalElements": 42, "totalPages": 3 },
  "timestamp": "2026-08-23T15:00:00Z"
}
```

### 6.2 Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public* | Register doctor account |
| POST | `/auth/login` | Public | Returns access + refresh tokens |
| POST | `/auth/refresh` | Public | Rotate access token |
| POST | `/auth/logout` | JWT | Revoke refresh token |
| GET | `/auth/me` | JWT | Current user profile |
| PATCH | `/auth/me` | JWT | Update profile / password |

*Disabled when `ALLOW_PUBLIC_REGISTRATION=false`

**POST `/auth/login` response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 1800,
    "user": {
      "id": 1,
      "email": "dr.smith@hospital.com",
      "fullName": "Dr. Jane Smith",
      "role": "RADIOLOGIST"
    }
  }
}
```

### 6.3 Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/summary` | Counts: patients, scans today, pending jobs, completed analyses |

```json
{
  "data": {
    "totalPatients": 48,
    "scansThisWeek": 12,
    "pendingAnalyses": 2,
    "completedAnalyses": 156,
    "recentActivity": [ ]
  }
}
```

### 6.4 Patients

| Method | Path | Description |
|--------|------|-------------|
| GET | `/patients?search=&page=0&size=20` | Search/list |
| POST | `/patients` | Create |
| GET | `/patients/{id}` | Detail |
| PUT | `/patients/{id}` | Update |
| DELETE | `/patients/{id}` | Soft delete |
| GET | `/patients/{id}/scans` | Scan history |
| GET | `/patients/{id}/history` | All analysis results |

**POST `/patients` body:**
```json
{
  "mrn": "MRN-2026-0042",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1985-03-15",
  "gender": "MALE",
  "notes": "Follow-up for glioma monitoring"
}
```

### 6.5 Scans

| Method | Path | Description |
|--------|------|-------------|
| POST | `/patients/{patientId}/scans` | Multipart upload |
| GET | `/scans/{id}` | Metadata |
| GET | `/scans/{id}/image` | Stream original image |
| DELETE | `/scans/{id}` | Archive |
| POST | `/scans/{id}/analyze` | Submit AI job |
| GET | `/scans/{id}/jobs` | Job history |

**Multipart fields:** `file` (required), `capturedAt` (optional), `notes` (optional)

**Validation rules:**
- MIME: `image/jpeg`, `image/png` only
- Max size: 50 MB
- Min dimensions: 64×64 px
- Magic-byte verification server-side

### 6.6 AI Jobs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/ai-jobs/{id}` | Status + progress |
| POST | `/ai-jobs/{id}/cancel` | Cancel if not completed |
| GET | `/ai-jobs/{id}/events` | Poll fallback (SSE optional) |

**GET `/ai-jobs/{id}` response:**
```json
{
  "data": {
    "id": 42,
    "scanId": 17,
    "status": "INFERENCE",
    "progressPct": 65,
    "modelName": "brain_mri_segmentation_v1",
    "queuedAt": "2026-08-23T14:30:00Z",
    "startedAt": "2026-08-23T14:30:05Z",
    "completedAt": null,
    "errorMessage": null
  }
}
```

### 6.7 Analysis Results

| Method | Path | Description |
|--------|------|-------------|
| GET | `/results/{id}` | Full result detail |
| GET | `/scans/{scanId}/results/latest` | Latest result for scan |
| GET | `/results/{id}/overlay` | PNG overlay image |
| GET | `/results/{id}/mask` | Segmentation mask PNG |
| GET | `/results/{id}/derived-dicom` | Derived SC DICOM (if generated) |

**GET `/results/{id}` response:**
```json
{
  "data": {
    "id": 31,
    "scanId": 17,
    "predictionLabel": "suspicious_lesion",
    "confidenceScore": 0.8734,
    "findings": [
      { "label": "hyperintense_region", "confidence": 0.91, "bbox": [120, 80, 45, 45] }
    ],
    "segmentationLayers": [
      { "label": "tumor_core", "colorHex": "#FF4444", "areaPixels": 4821 }
    ],
    "measurements": {
      "lesionAreaMm2": 124.5,
      "lesionDiameterMm": 12.6
    },
    "overlayUrl": "/api/v1/results/31/overlay",
    "disclaimer": "AI-assisted analysis only. Not a clinical diagnosis."
  }
}
```

### 6.8 Scan Comparison

| Method | Path | Description |
|--------|------|-------------|
| POST | `/comparisons` | Create comparison |
| GET | `/comparisons/{id}` | Detail with delta |
| GET | `/patients/{patientId}/comparisons` | List |

**POST `/comparisons` body:**
```json
{
  "patientId": 5,
  "baselineScanId": 17,
  "followupScanId": 24
}
```

### 6.9 Reports

| Method | Path | Description |
|--------|------|-------------|
| POST | `/scans/{scanId}/reports` | Generate report |
| GET | `/reports/{id}` | Metadata |
| GET | `/reports/{id}/download` | PDF stream |
| GET | `/patients/{patientId}/reports` | List |

### 6.10 Admin

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/admin/users` | ADMIN | List users |
| PATCH | `/admin/users/{id}/role` | ADMIN | Change role |
| PATCH | `/admin/users/{id}/enabled` | ADMIN | Enable/disable |
| GET | `/admin/audit-logs` | ADMIN | Audit trail |

### 6.11 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 202 | AI job accepted |
| 400 | Validation error |
| 401 | Missing/invalid JWT |
| 403 | Insufficient role |
| 404 | Not found |
| 409 | Duplicate MRN / job conflict |
| 413 | File too large |
| 422 | Invalid image |
| 503 | AI service unavailable |

---

## 7. WebSocket Contract

**Endpoint:** `ws://localhost:8080/ws` (prod: `wss://...`)  
**Protocol:** STOMP over SockJS (Spring WebSocket + STOMP)  
**Auth:** JWT passed in STOMP connect headers: `Authorization: Bearer <token>`

### 7.1 Subscribe

Client subscribes to job-specific topic after submitting analysis:

```
SUBSCRIBE /topic/analysis/{jobId}
```

Dashboard may subscribe to user-wide channel:

```
SUBSCRIBE /user/queue/analysis-updates
```

### 7.2 Server Push Messages

**Progress update:**
```json
{
  "type": "PROGRESS",
  "jobId": 42,
  "scanId": 17,
  "status": "INFERENCE",
  "progressPct": 65,
  "message": "Running MONAI segmentation model...",
  "timestamp": "2026-08-23T14:30:18Z"
}
```

**Completion:**
```json
{
  "type": "COMPLETED",
  "jobId": 42,
  "scanId": 17,
  "resultId": 31,
  "predictionLabel": "suspicious_lesion",
  "confidenceScore": 0.8734,
  "timestamp": "2026-08-23T14:30:28Z"
}
```

**Failure:**
```json
{
  "type": "FAILED",
  "jobId": 42,
  "scanId": 17,
  "errorCode": "INFERENCE_ERROR",
  "errorMessage": "Model inference failed on GPU; retried on CPU.",
  "timestamp": "2026-08-23T14:30:28Z"
}
```

### 7.3 Backend Implementation Notes

- `AnalysisJobPoller` polls FastAPI every 2s for active jobs (fallback if webhook fails)
- `AnalysisWebSocketBroadcaster` pushes on status change
- Frontend reconnects with exponential backoff; falls back to REST polling `/ai-jobs/{id}`

---

## 8. Frontend Route Map

**Router:** React Router v7 · **Base:** Vite dev server `http://localhost:5173`

### 8.1 Public Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `LandingPage` | Hero (R3F brain), features, CTA, disclaimer |
| `/login` | `LoginPage` | Doctor login form |
| `/register` | `RegisterPage` | Signup (if enabled) |
| `/about` | `AboutPage` | Project info for viva/demo |

### 8.2 Protected Routes (require JWT)

| Path | Component | Layout | Description |
|------|-----------|--------|-------------|
| `/dashboard` | `DashboardPage` | `AppShell` | Stats, charts, recent activity |
| `/patients` | `PatientListPage` | `AppShell` | Searchable patient table |
| `/patients/new` | `PatientFormPage` | `AppShell` | Create patient |
| `/patients/:id` | `PatientDetailPage` | `AppShell` | Profile + scan list |
| `/patients/:id/edit` | `PatientFormPage` | `AppShell` | Edit patient |
| `/patients/:id/upload` | `ScanUploadPage` | `AppShell` | Drag-drop JPG/PNG upload |
| `/patients/:id/history` | `AnalysisHistoryPage` | `AppShell` | Timeline of results |
| `/patients/:id/compare` | `ComparisonPage` | `AppShell` | Side-by-side scan compare |
| `/scans/:id` | `ScanDetailPage` | `AppShell` | Scan metadata + actions |
| `/scans/:id/analyze` | `AnalysisProgressPage` | `AppShell` | AI animation + WS progress |
| `/scans/:id/viewer` | `MedicalViewerPage` | `ViewerLayout` | Cornerstone3D viewer |
| `/results/:id` | `ResultDetailPage` | `AppShell` | Prediction + segmentation |
| `/reports` | `ReportListPage` | `AppShell` | All reports |
| `/reports/:id` | `ReportDetailPage` | `AppShell` | Preview + download |
| `/settings` | `SettingsPage` | `AppShell` | Profile, password, theme |
| `/admin` | `AdminDashboardPage` | `AppShell` | Admin only |
| `/admin/users` | `AdminUsersPage` | `AppShell` | User management |

### 8.3 Route Guards

```typescript
// Pseudo-structure
<Route element={<PublicLayout />}>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
</Route>

<Route element={<ProtectedRoute roles={['CLINICIAN','RADIOLOGIST','ADMIN']} />}>
  <Route element={<AppShell />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    {/* ... */}
  </Route>
</Route>

<Route element={<ProtectedRoute roles={['ADMIN']} />}>
  <Route path="/admin/*" element={<AdminRoutes />} />
</Route>
```

### 8.4 Frontend Folder Structure

```
medvision-frontend/src/
├── app/                    # Router, providers
├── api/                    # Axios clients (auth, patients, scans, jobs)
├── auth/                   # Token storage, refresh interceptor, guards
├── components/
│   ├── ui/                 # Button, Card, Input, Skeleton, Badge
│   ├── layout/             # AppShell, Navbar, Sidebar
│   ├── charts/             # Recharts wrappers
│   └── viewer/             # Cornerstone3D wrapper
├── features/
│   ├── landing/
│   ├── dashboard/
│   ├── patients/
│   ├── scans/
│   ├── analysis/
│   ├── viewer/
│   ├── comparison/
│   ├── reports/
│   ├── settings/
│   └── admin/
├── hooks/                  # useAnalysisProgress (WebSocket)
├── stores/                 # Zustand: auth, theme
├── styles/                 # Tailwind config, globals
└── utils/
```

### 8.5 Key Frontend Dependencies

| Package | Purpose |
|---------|---------|
| `@cornerstonejs/core`, `@cornerstonejs/tools` | Medical image viewing |
| `@react-three/fiber`, `@react-three/drei` | Landing page 3D brain hero |
| `framer-motion` | Page transitions, micro-interactions |
| `recharts` | Dashboard analytics |
| `@stomp/stompjs`, `sockjs-client` | WebSocket |
| `axios` | REST |
| `react-hook-form`, `zod` | Form validation |
| `lucide-react` | Icons |

---

## 9. AI Service Contract

**Base URL:** `http://localhost:8000`  
**Auth:** `X-API-Key: <AI_SERVICE_API_KEY>` (backend only — never exposed to browser)  
**Framework:** FastAPI · **Python:** 3.11+

### 9.1 Endpoints

#### GET `/health`
```json
{
  "status": "ok",
  "gpu_available": true,
  "device": "cuda:0",
  "models_loaded": ["brain_mri_segmentation_v1"],
  "version": "1.0.0"
}
```

#### POST `/api/v1/jobs`
**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | yes | JPG/PNG image |
| `scan_id` | string | yes | Backend correlation ID |
| `job_id` | string | yes | Backend ai_job ID |
| `model` | string | no | Default: `brain_mri_segmentation_v1` |
| `options` | JSON string | no | See below |

**options schema:**
```json
{
  "generate_derived_dicom": false,
  "segmentation": true,
  "confidence_threshold": 0.5,
  "target_size": [256, 256]
}
```

**Response `202`:**
```json
{
  "external_job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "QUEUED",
  "scan_id": "17",
  "estimated_seconds": 30
}
```

#### GET `/api/v1/jobs/{external_job_id}`
```json
{
  "external_job_id": "550e8400-e29b-41d4-a716-446655440000",
  "scan_id": "17",
  "status": "INFERENCE",
  "progress": 65,
  "stage": "Running UNet segmentation",
  "started_at": "2026-08-23T14:30:05Z",
  "completed_at": null,
  "error": null
}
```

#### GET `/api/v1/jobs/{external_job_id}/result`
```json
{
  "external_job_id": "550e8400-e29b-41d4-a716-446655440000",
  "scan_id": "17",
  "model": "brain_mri_segmentation_v1",
  "inference_device": "cuda:0",
  "prediction": {
    "label": "suspicious_lesion",
    "confidence": 0.8734
  },
  "findings": [
    { "label": "hyperintense_region", "confidence": 0.91, "bbox": [120, 80, 45, 45] }
  ],
  "segmentation": {
    "layers": [
      {
        "label": "tumor_core",
        "color_hex": "#FF4444",
        "area_pixels": 4821,
        "mask_file": "tumor_core.png"
      }
    ],
    "overlay_file": "overlay.png"
  },
  "derived_dicom": {
    "generated": false,
    "path": null,
    "sop_class": null,
    "note": "Not generated for this job"
  },
  "metadata": {
    "input_width": 512,
    "input_height": 512,
    "preprocessing_ms": 45,
    "inference_ms": 820,
    "input_format": "image/png"
  }
}
```

#### POST `/api/v1/jobs/{external_job_id}/cancel`
```json
{ "external_job_id": "...", "status": "CANCELLED" }
```

#### POST `/api/v1/internal/callback` (FastAPI → Spring Boot)
Spring Boot exposes this; FastAPI calls on completion:

```
POST /api/v1/internal/ai-callback
X-API-Key: <shared-secret>

{
  "external_job_id": "...",
  "job_id": 42,
  "status": "COMPLETED"
}
```

### 9.2 AI Pipeline Stages

```
1. VALIDATE     — magic bytes, dimensions, file size
2. PREPROCESS   — PIL/OpenCV: RGB→grayscale/RGB as model expects, resize, normalize
3. INFERENCE    — MONAI/PyTorch forward pass on tensor shape [1,C,H,W]
4. SEGMENT      — threshold mask, connected components, bbox extraction
5. POSTPROCESS  — generate overlay PNG, optional derived DICOM SC
6. PACKAGE      — write artifacts to job output dir, return JSON
```

**Critical rule:** Inference uses the **preprocessed tensor representation** defined by the trained model (e.g., single-channel normalized float32 256×256). DICOM export is a **separate optional output**, not the inference input, unless the model was trained on DICOM-derived tensors.

### 9.3 FastAPI Project Structure

```
medvision-ai-service/
├── app/
│   ├── main.py
│   ├── config.py              # env-based settings
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py
│   │   │   └── jobs.py
│   │   └── deps.py            # API key validation
│   ├── core/
│   │   ├── job_manager.py     # async queue (asyncio + worker)
│   │   └── storage.py
│   ├── models/
│   │   └── schemas.py         # Pydantic v2
│   ├── services/
│   │   ├── validation.py
│   │   ├── preprocessing.py
│   │   ├── inference.py       # MONAI model load + predict
│   │   ├── segmentation.py
│   │   └── dicom_export.py    # derived SC only
│   └── ml/
│       ├── model_registry.py
│       └── weights/
│           └── brain_mri_segmentation_v1.pth
├── requirements.txt
├── Dockerfile
└── .env.example
```

### 9.4 AI Error Codes

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | `INVALID_IMAGE` | Not JPG/PNG or corrupt |
| 400 | `INVALID_DIMENSIONS` | Below minimum size |
| 413 | `FILE_TOO_LARGE` | Exceeds limit |
| 422 | `VALIDATION_ERROR` | Schema error |
| 503 | `GPU_UNAVAILABLE` | GPU required but absent (falls back to CPU if configured) |
| 500 | `INFERENCE_ERROR` | Model/runtime failure |
| 500 | `DICOM_EXPORT_ERROR` | Derived DICOM write failed (non-fatal to inference) |

---

## 10. Medical Imaging Rules

### 10.1 JPG/PNG Upload (Primary Input)

- Accepted formats: JPEG, PNG only
- These are **secondary raster images**, not DICOM MR acquisitions
- UI must label: *"Upload exported/saved MRI image (JPG/PNG)"*

### 10.2 Derived DICOM (Optional Export)

When `generate_derived_dicom=true`:

```python
# pydicom Secondary Capture — NOT pretending to be original MR
dataset.SOPClassUID = SecondaryCaptureImageStorage
dataset.Modality = "OT"  # Other
dataset.ImageType = ["DERIVED", "SECONDARY"]
dataset.SeriesDescription = "MedVision AI Derived Secondary Capture"
dataset.ConversionType = "WSD"  # Workspace document
# NO fake ScannerManufacturer, MagneticFieldStrength, etc.
dataset.Manufacturer = "MedVision AI Platform"
dataset.ManufacturerModelName = "Derived SC Generator v1"
dataset.DerivationDescription = (
    "Derived from uploaded raster image via MedVision AI. "
    "NOT an original MRI acquisition."
)
```

### 10.3 Viewer Behaviour

- **Cornerstone3D** loads JPG/PNG via backend image endpoint for primary viewing
- If derived DICOM exists, viewer shows badge: *"Derived SC — not original acquisition"*
- Window/level presets tuned for brain MRI appearance
- Overlay opacity slider for segmentation mask

### 10.4 Measurements Disclaimer

Pixel-to-mm conversion requires known pixel spacing. For JPG/PNG without DICOM spacing:

- Store measurements in **pixels** always
- Show mm estimates only if user provides pixel spacing in upload metadata (optional field)
- Label mm values as *"estimated"* in UI and reports

---

## 11. UI / UX Design System

### 11.1 Visual Direction

**Theme:** Premium healthcare SaaS — trustworthy, calm, modern  
**Modes:** Light (default for clinical) + Dark (optional toggle)  
**Palette (Light):**

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#0EA5E9` | Actions, links (sky-500) |
| `--primary-dark` | `#0284C7` | Hover |
| `--accent` | `#14B8A6` | Success, AI highlights (teal-500) |
| `--surface` | `#F8FAFC` | Page background |
| `--card` | `#FFFFFF` | Cards with subtle shadow |
| `--text` | `#0F172A` | Primary text |
| `--muted` | `#64748B` | Secondary text |
| `--danger` | `#EF4444` | Errors, critical findings |
| `--warning` | `#F59E0B` | Pending states |

**Glassmorphism:** Use sparingly on landing hero nav and dashboard stat cards (`backdrop-blur-md bg-white/70`).

### 11.2 Component Patterns

| Pattern | Implementation |
|---------|----------------|
| Page transitions | Framer Motion `AnimatePresence` + fade/slide |
| Skeleton loading | Tailwind animate-pulse placeholders |
| AI processing | Animated scan line + pulsing ring + stage text from WS |
| Charts | Recharts: analyses/week, confidence distribution |
| 3D hero | R3F rotating brain mesh on landing (decorative, not clinical data) |
| Toast notifications | Success/error on upload, analysis complete |
| Empty states | Illustration + CTA when no patients/scans |

### 11.3 Accessibility

- WCAG AA contrast minimum 4.5:1 for body text
- Focus rings on all interactive elements
- `aria-live="polite"` on analysis progress region
- Keyboard navigation for viewer tools
- Reduced motion: respect `prefers-reduced-motion`

### 11.4 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| `< 768px` | Collapsed sidebar, stacked viewer controls |
| `768–1024px` | Tablet: 2-column dashboard |
| `> 1024px` | Full sidebar + multi-panel viewer |

### 11.5 No Fake Features Policy

| Element | Behaviour |
|---------|-----------|
| "Analyze" button | Disabled until valid image uploaded; then triggers real job |
| "Export DICOM" | Only visible after analysis with `derived_dicom` available |
| "Compare scans" | Disabled if < 2 scans exist for patient |
| Admin panel | Hidden unless role=ADMIN |
| GPU badge | Shows real status from `/health` via backend proxy |

---

## 12. Security Architecture

```
Browser ──JWT(access)──► Spring Boot
         ──JWT(refresh)──► /auth/refresh only

Spring Boot ──BCrypt──► password_hash in MySQL
            ──API Key──► FastAPI (server-side only)

Secrets: all via environment variables / .env (gitignored)
```

| Control | Implementation |
|---------|----------------|
| Password hashing | BCrypt strength 12 |
| JWT access | HS256 or RS256, 30 min expiry |
| JWT refresh | HttpOnly cookie or secure storage, rotation on use |
| CORS | Whitelist frontend origin only |
| File upload | MIME sniff + extension check + size limit |
| SQL injection | JPA parameterized queries |
| XSS | React escaping + CSP headers |
| CSRF | Disabled for stateless JWT API |
| Rate limiting | Login: 5 attempts/min/IP (Bucket4j, Phase 4) |
| Audit | Admin actions logged to `audit_logs` |

---

## 13. Deployment Topology

### 13.1 Local Development

```yaml
# docker-compose.yml (planned)
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: medvision
      MYSQL_USER: medvision_app
      MYSQL_PASSWORD: ${DB_PASSWORD}
  backend:
    build: ./MedVision-Backend
    ports: ["8080:8080"]
    depends_on: [mysql]
  ai-service:
    build: ./medvision-ai-service
    ports: ["8000:8000"]
  frontend:
    build: ./medvision-frontend
    ports: ["5173:5173"]
```

### 13.2 Demo / Viva Deployment

- Single VM or laptop: all services local
- Pre-seeded demo doctor account + sample patient
- Sample brain MRI images bundled in `/samples`
- GPU optional; CPU fallback pre-tested

---

## 14. Implementation Phases

| Phase | Scope | Deliverable |
|-------|-------|-------------|
| **0** ✓ | Backend scaffold, architecture docs | Verified Spring Boot build |
| **1** | Auth (JWT+BCrypt), Flyway schema, patient CRUD | Login works, DB migrated |
| **2** | Scan upload, file storage, AI job submission | Upload + job created |
| **3** | FastAPI service, MONAI inference, result persistence | End-to-end analysis |
| **4** | WebSocket progress, React frontend core | Doctor can analyze from UI |
| **5** | Cornerstone3D viewer, segmentation overlay | Interactive result viewing |
| **6** | Comparison, reports (PDF), dashboard charts | Full demo flow |
| **7** | Admin, polish, dark mode, 3D hero, testing | Viva-ready |

---

## 15. Risks & Dependencies

### 15.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| MONAI/PyTorch CUDA setup on Windows | High | Document CPU fallback; test in Docker/Linux VM |
| Cornerstone3D + Vite bundling complexity | Medium | Use official Vite config; lazy-load viewer route |
| Large MRI JPG files (slow upload) | Medium | Client-side compression preview; 50 MB limit |
| Spring Boot 4 modular test deps | Low | Already identified; use `webmvc-test`, `security-test` |
| WebSocket through proxies | Medium | SockJS fallback; REST polling backup |
| No pixel spacing in JPG | Medium | Pixel-based measurements; optional manual spacing |
| Model accuracy for viva questions | High | Use pre-trained weights; document dataset source; show confidence scores honestly |

### 15.2 External Dependencies

| Dependency | Version | Notes |
|------------|---------|-------|
| Java | 21 | Project pom target |
| Spring Boot | 4.1.x | Existing project |
| MySQL | 8.0+ | Docker or local install |
| Python | 3.11+ | AI service |
| PyTorch | 2.x | Match MONAI compatibility matrix |
| MONAI | 1.3+ | Brain segmentation model |
| Node.js | 20 LTS | Frontend build |
| NVIDIA Driver + CUDA | Optional | For GPU inference demo |

### 15.3 Academic / Compliance Notes

- Position as **decision support tool**, not diagnostic device
- Include disclaimer on every analysis and report
- Do not claim FDA/regulatory approval
- Document model limitations in README and viva slides
- Synthetic/demo images acceptable if real patient data unavailable

### 15.4 Prerequisites Before Phase 1 Implementation

- [ ] Confirm MySQL 8.x installed or Docker available
- [ ] Confirm Python 3.11+ and pip/venv
- [ ] Obtain or train brain MRI segmentation model weights
- [ ] Prepare 3–5 sample brain MRI JPG/PNG images for demo
- [ ] Create `.env` from `.env.example` (no secrets in git)
- [ ] Node.js 20 LTS for frontend scaffolding

---

## Appendix A — Alignment with Existing Backend

The existing `MedVision-Backend/` project provides:

- Spring Boot 4.1.1, Java 21, Maven
- Starters: Web, JPA, Security, Validation, Actuator
- MySQL + H2 (dev/test) configuration
- Minimal `SecurityConfig` (actuator public, dev H2 console)
- 6 passing tests

**Phase 1 first actions (when approved):**

1. Rename package `MedVision.Backend` → `com.medvision.backend`
2. Add Flyway + initial migration from Section 5
3. Implement JWT auth module
4. Scaffold `medvision-frontend` and `medvision-ai-service`

---

*Document prepared for MedVision AI final-year project. Awaiting implementation instruction.*
