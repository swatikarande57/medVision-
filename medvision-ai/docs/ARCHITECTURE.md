# MedVision AI — Technical Architecture

> **Status:** Phase 0 — design baseline (no business logic implemented yet)

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Client Layer (Browser)                            │
│  React SPA · TypeScript · React Router · TanStack Query · Medical viewers   │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ HTTPS / REST / JWT
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Spring Boot Backend (MedVision-Backend)                  │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────────────────┐  │
│  │ Auth (JWT)  │ │ Patient Mgmt │ │ Scan Mgmt   │ │ AI Job Orchestration │  │
│  └─────────────┘ └──────────────┘ └─────────────┘ └──────────────────────┘  │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────────────────┐  │
│  │ File Upload │ │ Reports      │ │ Comparison  │ │ Actuator / Monitoring│  │
│  └─────────────┘ └──────────────┘ └─────────────┘ └──────────────────────┘  │
└───────────────┬───────────────────────────────┬─────────────────────────────┘
                │ JDBC (HikariCP)               │ HTTP (RestClient / WebClient)
                ▼                               ▼
┌───────────────────────────┐   ┌─────────────────────────────────────────────┐
│         MySQL 8.x         │   │     Python FastAPI AI Service (port 8000)   │
│  patients · scans · jobs  │   │  preprocess · validate · infer · segment   │
│  results · reports · users  │   └──────────────────────┬──────────────────────┘
└───────────────────────────┘                          │
                                                       ▼
                              ┌─────────────────────────────────────────────┐
                              │        MONAI + PyTorch inference stack      │
                              │   CPU fallback · NVIDIA GPU when available  │
                              └─────────────────────────────────────────────┘
```

### Communication patterns

| Flow | Protocol | Notes |
|------|----------|-------|
| React → Spring Boot | REST + JSON, Bearer JWT | CORS restricted to frontend origin |
| Spring Boot → MySQL | JDBC | Flyway/Liquibase migrations in later phase |
| Spring Boot → FastAPI | REST + multipart | Async job polling or webhook callback |
| FastAPI → GPU | In-process PyTorch | Model weights loaded at startup |

### Backend responsibilities

- **Authentication:** JWT access/refresh tokens, role-based access (ADMIN, RADIOLOGIST, CLINICIAN, TECHNICIAN)
- **Patient management:** CRUD, search, de-identified metadata
- **Scan management:** Upload metadata, lifecycle (UPLOADED → QUEUED → PROCESSING → COMPLETED / FAILED)
- **File upload:** Multipart ingest, virus-scan hook, local/S3-compatible storage abstraction
- **AI job management:** Submit jobs to FastAPI, track status, retry, timeout handling
- **AI service communication:** RestClient with API key, circuit breaker (Resilience4j in later phase)
- **Analysis results:** Persist segmentation masks, confidence scores, overlay URLs
- **Scan comparison:** Side-by-side diff of two scans for same patient
- **Report management:** PDF/HTML report generation metadata and download links

### AI service responsibilities

- **Image preprocessing:** Resize, normalize, channel conversion
- **JPG/PNG validation:** Magic-byte check, dimension limits, corruption detection
- **Optional DICOM creation:** Derived DICOM from raster input when clinically needed
- **MONAI/PyTorch inference:** Model loading, batch/single inference
- **Segmentation:** Produce mask arrays / PNG overlays
- **Result generation:** Structured JSON + optional NIfTI/DICOM-SEG artifacts

### Cross-cutting concerns

- **Security:** Spring Security 6 stateless JWT; FastAPI validates `X-API-Key` from backend only (not exposed to browser)
- **Observability:** Actuator health/info; structured logging with correlation IDs (`X-Request-Id`)
- **Storage:** `./uploads` locally (dev); S3/MinIO in production
- **Error handling:** RFC 7807 Problem Details from Spring; consistent error envelope from FastAPI

---

## 2. Package Structure (Spring Boot)

Target layout under `com.medvision.backend` (migrate from generated `MedVision.Backend` in Phase 1):

```
com.medvision.backend
├── MedVisionBackendApplication.java
├── config/
│   ├── SecurityConfig.java          ✓ (stub — JWT in Phase 1)
│   ├── WebConfig.java               (CORS, Jackson)
│   ├── JpaConfig.java
│   ├── AsyncConfig.java
│   └── AiServiceClientConfig.java
├── domain/
│   ├── user/
│   │   ├── User.java
│   │   ├── Role.java
│   │   └── UserRepository.java
│   ├── patient/
│   │   ├── Patient.java
│   │   └── PatientRepository.java
│   ├── scan/
│   │   ├── Scan.java
│   │   ├── ScanStatus.java
│   │   ├── ScanType.java
│   │   └── ScanRepository.java
│   ├── ai/
│   │   ├── AiJob.java
│   │   ├── AiJobStatus.java
│   │   └── AiJobRepository.java
│   ├── result/
│   │   ├── AnalysisResult.java
│   │   ├── SegmentationLayer.java
│   │   └── AnalysisResultRepository.java
│   ├── comparison/
│   │   ├── ScanComparison.java
│   │   └── ScanComparisonRepository.java
│   └── report/
│       ├── Report.java
│       └── ReportRepository.java
├── service/
│   ├── auth/
│   ├── patient/
│   ├── scan/
│   ├── storage/
│   │   ├── FileStorageService.java
│   │   └── LocalFileStorageService.java
│   ├── ai/
│   │   ├── AiJobService.java
│   │   └── AiServiceClient.java
│   ├── result/
│   ├── comparison/
│   └── report/
├── web/
│   ├── auth/
│   │   └── AuthController.java
│   ├── patient/
│   │   └── PatientController.java
│   ├── scan/
│   │   └── ScanController.java
│   ├── ai/
│   │   └── AiJobController.java
│   ├── result/
│   │   └── AnalysisResultController.java
│   ├── comparison/
│   │   └── ComparisonController.java
│   ├── report/
│   │   └── ReportController.java
│   └── common/
│       ├── GlobalExceptionHandler.java
│       └── ApiResponse.java
├── dto/
│   ├── request/
│   └── response/
├── mapper/
│   └── (MapStruct mappers — Phase 2)
└── security/
    ├── JwtTokenProvider.java
    ├── JwtAuthenticationFilter.java
    └── UserDetailsServiceImpl.java
```

### React frontend (separate repo / `medvision-frontend/`)

```
src/
├── api/           # Axios/fetch clients per resource
├── auth/          # login, token refresh, protected routes
├── components/    # shared UI
├── features/
│   ├── patients/
│   ├── scans/
│   ├── analysis/
│   ├── comparison/
│   └── reports/
├── hooks/
├── pages/
├── store/         # optional Zustand/Redux
└── utils/
```

### Python FastAPI service (`medvision-ai-service/`)

```
app/
├── main.py
├── config.py
├── api/
│   ├── routes/
│   │   ├── health.py
│   │   ├── jobs.py
│   │   └── models.py
│   └── deps.py
├── core/
│   ├── security.py
│   └── logging.py
├── models/
│   ├── schemas.py
│   └── job.py
├── services/
│   ├── preprocessing.py
│   ├── validation.py
│   ├── dicom_writer.py
│   ├── inference.py
│   └── segmentation.py
└── ml/
    ├── model_registry.py
    └── weights/
```

---

## 3. Database ER Design

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   patients   │       │    scans     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │◄──────│ patient_id   │
│ email (UQ)   │       │ mrn (UQ)     │       │ id (PK)      │
│ password_hash│       │ first_name   │       │ uploaded_by  │──┐
│ role         │       │ last_name    │       │ scan_type    │  │
│ enabled      │       │ date_of_birth│       │ modality     │  │
│ created_at   │       │ gender       │       │ status       │  │
│ updated_at   │       │ created_at   │       │ original_    │  │
└──────────────┘       │ updated_at   │       │   filename   │  │
       ▲               └──────────────┘       │ storage_path │  │
       │                                      │ mime_type    │  │
       └──────────────────────────────────────│ file_size    │  │
                                              │ width/height │  │
                                              │ captured_at  │  │
                                              │ created_at   │  │
                                              └──────┬───────┘  │
                                                     │          │
                     ┌───────────────────────────────┘          │
                     ▼                                          │
              ┌──────────────┐                                  │
              │   ai_jobs    │                                  │
              ├──────────────┤                                  │
              │ id (PK)      │                                  │
              │ scan_id (FK) │                                  │
              │ external_id  │  ← FastAPI job UUID             │
              │ model_name   │                                  │
              │ status       │  QUEUED|RUNNING|COMPLETED|FAILED  │
              │ priority     │                                  │
              │ error_message│                                  │
              │ started_at   │                                  │
              │ completed_at │                                  │
              │ created_at   │                                  │
              └──────┬───────┘                                  │
                     │                                          │
                     ▼                                          │
         ┌───────────────────────┐                             │
         │   analysis_results    │                             │
         ├───────────────────────┤                             │
         │ id (PK)               │                             │
         │ ai_job_id (FK, UQ)    │                             │
         │ scan_id (FK)          │                             │
         │ summary_json          │  findings, metrics          │
         │ confidence_score      │                             │
         │ overlay_storage_path  │                             │
         │ mask_storage_path     │                             │
         │ created_at            │                             │
         └───────────┬───────────┘                             │
                     │                                          │
                     ▼                                          │
         ┌───────────────────────┐                             │
         │ segmentation_layers   │                             │
         ├───────────────────────┤                             │
         │ id (PK)               │                             │
         │ result_id (FK)        │                             │
         │ label                 │  e.g. "tumor", "organ"      │
         │ color_hex             │                             │
         │ area_pixels           │                             │
         │ volume_estimate       │                             │
         │ mask_path             │                             │
         └───────────────────────┘                             │
                                                               │
┌──────────────────────┐         ┌──────────────────────┐      │
│  scan_comparisons    │         │      reports         │      │
├──────────────────────┤         ├──────────────────────┤      │
│ id (PK)              │         │ id (PK)              │      │
│ patient_id (FK)      │         │ scan_id (FK)         │      │
│ baseline_scan_id(FK) │         │ result_id (FK, opt)  │      │
│ followup_scan_id(FK) │         │ generated_by (FK)    │──────┘
│ comparison_json      │         │ title                │
│ delta_summary        │         │ format (PDF/HTML)    │
│ created_by (FK)      │         │ storage_path         │
│ created_at           │         │ status               │
└──────────────────────┘         │ created_at           │
                                 └──────────────────────┘
```

### Key indexes

- `patients(mrn)`, `patients(last_name, first_name)`
- `scans(patient_id, created_at DESC)`, `scans(status)`
- `ai_jobs(scan_id)`, `ai_jobs(status, created_at)`
- `analysis_results(scan_id)`
- `reports(scan_id)`

### Enumerations

| Table | Column | Values |
|-------|--------|--------|
| users | role | ADMIN, RADIOLOGIST, CLINICIAN, TECHNICIAN |
| scans | status | UPLOADED, QUEUED, PROCESSING, COMPLETED, FAILED, ARCHIVED |
| scans | scan_type | CHEST_XRAY, CT_SLICE, MRI_SLICE, ULTRASOUND, OTHER |
| ai_jobs | status | PENDING, QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED |
| reports | status | DRAFT, FINAL, ARCHIVED |

---

## 4. REST API Design (Spring Boot)

Base path: `/api/v1`  
Auth header: `Authorization: Bearer <access_token>`

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register user (admin-only in prod) |
| POST | `/auth/login` | Returns access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate refresh token |
| GET | `/auth/me` | Current user profile |

### Patients

| Method | Path | Description |
|--------|------|-------------|
| GET | `/patients` | List/search (paginated) |
| POST | `/patients` | Create patient |
| GET | `/patients/{id}` | Get by ID |
| PUT | `/patients/{id}` | Update |
| DELETE | `/patients/{id}` | Soft delete |

### Scans

| Method | Path | Description |
|--------|------|-------------|
| GET | `/patients/{patientId}/scans` | List scans for patient |
| POST | `/patients/{patientId}/scans` | Upload scan (multipart) |
| GET | `/scans/{id}` | Scan metadata |
| GET | `/scans/{id}/download` | Download original file |
| DELETE | `/scans/{id}` | Archive scan |
| PATCH | `/scans/{id}/status` | Admin status override |

### AI Jobs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/scans/{scanId}/analyze` | Submit analysis job |
| GET | `/ai-jobs/{id}` | Job status |
| GET | `/scans/{scanId}/ai-jobs` | Job history for scan |
| POST | `/ai-jobs/{id}/cancel` | Cancel pending job |

### Analysis Results

| Method | Path | Description |
|--------|------|-------------|
| GET | `/scans/{scanId}/results` | Latest + historical results |
| GET | `/results/{id}` | Result detail |
| GET | `/results/{id}/overlay` | Segmentation overlay image |
| GET | `/results/{id}/layers` | Segmentation layer list |

### Scan Comparison

| Method | Path | Description |
|--------|------|-------------|
| POST | `/comparisons` | Create comparison (baseline + follow-up scan IDs) |
| GET | `/comparisons/{id}` | Comparison detail |
| GET | `/patients/{patientId}/comparisons` | List comparisons |

### Reports

| Method | Path | Description |
|--------|------|-------------|
| POST | `/scans/{scanId}/reports` | Generate report from result |
| GET | `/reports/{id}` | Report metadata |
| GET | `/reports/{id}/download` | Download PDF/HTML |
| GET | `/patients/{patientId}/reports` | List reports |

### Standard response envelope

```json
{
  "success": true,
  "data": { },
  "meta": { "page": 0, "size": 20, "totalElements": 142 },
  "timestamp": "2026-08-23T14:30:00Z"
}
```

### Error response (RFC 7807)

```json
{
  "type": "https://medvision.ai/errors/validation",
  "title": "Validation Failed",
  "status": 400,
  "detail": "File must be JPG or PNG",
  "instance": "/api/v1/patients/1/scans"
}
```

---

## 5. AI Service API Contract (FastAPI)

Base URL: `http://localhost:8000` (config: `medvision.ai-service.base-url`)  
Auth: `X-API-Key: <shared-secret>` (backend-only)

### Health

```
GET /health
→ 200 { "status": "ok", "gpu_available": true, "models_loaded": ["lung_segmentation_v1"] }
```

### Submit analysis job

```
POST /api/v1/jobs
Content-Type: multipart/form-data

Fields:
  - file: binary (required) — JPG/PNG
  - scan_id: string (required) — backend correlation ID
  - model: string (optional, default "default")
  - options: JSON string (optional)
    {
      "generate_dicom": false,
      "segmentation": true,
      "confidence_threshold": 0.5
    }

→ 202 Accepted
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "QUEUED",
  "scan_id": "123",
  "estimated_seconds": 30
}
```

### Poll job status

```
GET /api/v1/jobs/{job_id}

→ 200
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "scan_id": "123",
  "status": "COMPLETED",
  "progress": 100,
  "started_at": "2026-08-23T14:30:01Z",
  "completed_at": "2026-08-23T14:30:28Z",
  "error": null
}
```

### Fetch job result

```
GET /api/v1/jobs/{job_id}/result

→ 200
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "scan_id": "123",
  "model": "lung_segmentation_v1",
  "inference_device": "cuda:0",
  "confidence_score": 0.94,
  "findings": [
    { "label": "nodule", "confidence": 0.91, "bbox": [120, 80, 45, 45] }
  ],
  "segmentation": {
    "layers": [
      { "label": "lung_left", "area_pixels": 98234, "mask_url": "/artifacts/.../lung_left.png" }
    ],
    "overlay_url": "/artifacts/.../overlay.png"
  },
  "derived_dicom_url": null,
  "metadata": {
    "input_width": 512,
    "input_height": 512,
    "preprocessing_ms": 45,
    "inference_ms": 820
  }
}
```

### Cancel job

```
POST /api/v1/jobs/{job_id}/cancel
→ 200 { "job_id": "...", "status": "CANCELLED" }
```

### Optional webhook callback (Phase 3)

Backend exposes internal endpoint; FastAPI POSTs on completion:

```
POST {backend}/api/v1/internal/ai-callback
X-API-Key: <shared-secret>

{
  "job_id": "...",
  "scan_id": "123",
  "status": "COMPLETED"
}
```

### Error codes (FastAPI)

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | INVALID_IMAGE | Not JPG/PNG or corrupt |
| 413 | FILE_TOO_LARGE | Exceeds size limit |
| 422 | VALIDATION_ERROR | Schema/field error |
| 503 | GPU_UNAVAILABLE | GPU required but not present |
| 500 | INFERENCE_ERROR | Model/runtime failure |

---

## 6. Development Phases

### Phase 0 — Foundation (current)

- [x] Spring Boot project scaffold verified
- [x] Maven build + context load tests passing
- [x] Architecture & API contract documented
- [ ] Package rename `MedVision.Backend` → `com.medvision.backend`
- [ ] Flyway migrations baseline
- [ ] Docker Compose (MySQL + backend + FastAPI stub)

### Phase 1 — Core backend

- JWT authentication & user management
- Patient CRUD
- Scan upload + local file storage
- MySQL schema via Flyway
- Global exception handling + validation
- OpenAPI/Swagger (`springdoc-openapi`)

### Phase 2 — AI integration

- FastAPI service skeleton + health endpoint
- `AiServiceClient` (RestClient)
- AI job entity + status polling scheduler
- Persist analysis results + overlay files
- End-to-end: upload → analyze → view result

### Phase 3 — Clinical features

- Scan comparison service
- Report generation (PDF template)
- React frontend MVP (auth, patients, scans, results viewer)
- Webhook callback from FastAPI (optional)

### Phase 4 — Production hardening

- S3/MinIO storage adapter
- Resilience4j circuit breaker for AI service
- Audit logging, PHI access controls
- GPU node deployment for FastAPI
- CI/CD pipelines, integration tests, load testing

---

## Appendix: Verified project state

| Item | Value |
|------|-------|
| Spring Boot | 4.1.1 |
| Java | 21 (runtime detected: 25) |
| Packaging | JAR |
| Starters | webmvc, data-jpa, security, validation, actuator, devtools |
| Database (prod) | MySQL via `application.properties` |
| Database (dev/test) | H2 profile / test resources |
| Build | `mvnw clean verify` ✓ |
| Startup | `mvnw spring-boot:run -Dspring-boot.run.profiles=dev` ✓ |
| Health | `GET /actuator/health` → UP |
