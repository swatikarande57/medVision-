# MedVision AI — Frontend ↔ Backend Integration Map

## 1. Authentication

| React Page | API Required | Endpoint | Status |
|---|---|---|---|
| `LoginPage` | POST login | `POST /api/auth/login` | 🔴 Not connected |
| `RegisterPage` | POST register | `POST /api/auth/register` | 🔴 Not connected |
| `TopNav` / `SettingsPage` | GET current user | `GET /api/auth/me` | 🔴 Not connected |
| All authenticated routes | JWT guard | Axios interceptor + PrivateRoute | 🔴 Not implemented |

### API Contracts

**POST /api/auth/login**
```json
Request:  { "email": "...", "password": "..." }
Response: { "success": true, "data": { "token": "...", "tokenType": "Bearer", "user": { "id": 1, "fullName": "...", "email": "...", "role": "DOCTOR" } } }
```

**POST /api/auth/register**
```json
Request:  { "fullName": "...", "email": "...", "password": "...", "role": "DOCTOR" }
Response: { "success": true, "data": { "token": "...", "user": { ... } } }
```

---

## 2. Patient Management

| React Page | API Required | Endpoint | Status |
|---|---|---|---|
| `PatientsPage` | List all | `GET /api/patients?page=0&size=20` | 🔴 Uses `MOCK_PATIENTS` |
| `PatientsPage` | Search | `GET /api/patients/search?query=...` | 🔴 Mock filter |
| `PatientsPage` | Create | `POST /api/patients` | 🔴 Not connected |
| `PatientDetailsPage` | Get by ID | `GET /api/patients/{id}` | 🔴 Uses mock |
| `PatientDetailsPage` | Update | `PUT /api/patients/{id}` | 🔴 Not connected |
| `PatientDetailsPage` | Delete | `DELETE /api/patients/{id}` | 🔴 Not connected |
| `PatientDetailsPage` | Patient scans | `GET /api/scans/patient/{patientId}` | 🔴 Not connected |

### DTO Contracts

**PatientResponse** (backend):
```json
{ "id": 1, "patientCode": "PT-001", "fullName": "...", "dateOfBirth": "1985-04-12", "gender": "MALE", "phone": "+1...", "createdAt": "...", "updatedAt": "..." }
```

**PatientRequest** (backend):
```json
{ "patientCode": "PT-001", "fullName": "...", "dateOfBirth": "1985-04-12", "gender": "MALE", "phone": "+1..." }
```

---

## 3. Scan Management

| React Page | API Required | Endpoint | Status |
|---|---|---|---|
| `ScanUploadPage` | Upload scan | `POST /api/scans/upload` (multipart) | 🔴 No real upload |
| `ScanUploadPage` | Get scan | `GET /api/scans/{id}` | 🔴 Not connected |
| `DashboardPage` | All scans | `GET /api/scans` | 🔴 Uses mock |

**ScanResponse** (backend):
```json
{ "id": 1, "patientId": 1, "originalFileName": "brain_mri.dcm", "fileType": "DCM", "modality": "MRI", "status": "UPLOADED", "uploadedAt": "..." }
```

**Upload request**: `multipart/form-data`: `patientId`, `file`, `modality` (optional)

---

## 4. AI Analysis

| React Page | API Required | Endpoint | Status |
|---|---|---|---|
| `AIAnalysisPage` | Analysis by scan | `GET /api/analysis/scan/{scanId}` | 🔴 Uses mock heatmap |
| `AIAnalysisPage` | Analysis by ID | `GET /api/analysis/{id}` | 🔴 Not connected |
| `AIAnalysisPage` | Patient analyses | `GET /api/analysis/patient/{patientId}` | 🔴 Not connected |
| `AIAnalysisPage` | Submit job | `POST /api/analysis/jobs` | 🔴 Not connected |
| `AIAnalysisPage` | Job status | `GET /api/analysis/jobs/{jobId}` | 🔴 Not connected |

**AnalysisResponse** (backend):
```json
{ "id": 1, "scanId": 1, "tumorDetected": true, "confidence": 94.2, "affectedAreaPercentage": 3.4, "estimatedArea": 4820.0, "resultSummary": "...", "maskPath": null, "overlayPath": null, "createdAt": "..." }
```

---

## 5. Reports

| React Page | API Required | Endpoint | Status |
|---|---|---|---|
| `ReportsPage` | All reports | `GET /api/reports` | 🔴 Uses `MOCK_REPORTS` |
| `ReportsPage` | By patient | `GET /api/reports/patient/{patientId}` | 🔴 Not connected |
| `ReportsPage` | Generate | `POST /api/reports/generate` | 🔴 Not connected |

---

## 6. Dashboard

| Dashboard Metric | Required API | Endpoint Exists? |
|---|---|---|
| Total patients | `GET /api/patients` (count from Page) | ✅ Yes |
| Scans analyzed | `GET /api/scans` (count) | ✅ Yes |
| Reports | `GET /api/reports` (count) | ✅ Yes |
| Recent patients | `GET /api/patients` (first page) | ✅ Yes |
| Recent scans | `GET /api/scans` | ✅ Yes |

> ⚠️ No dedicated `/api/dashboard/summary` endpoint exists. Dashboard stats must be derived from existing paginated endpoints.

---

## 7. CORS Configuration

**Status**: ✅ Already configured in `SecurityConfig.java`
- Allowed origins: `http://localhost:5173`, `http://127.0.0.1:5173`
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
- Credentials: true
- Authorization header exposed

---

## 8. Type Mapping: React Types → Backend DTOs

| Frontend Type | Backend DTO | Gap |
|---|---|---|
| `UserProfile` | `UserResponse` | Frontend has extra fields (`hospitalName`, `specialty`, `avatarUrl`) — these don't exist in backend |
| `Patient` | `PatientResponse` | Frontend has `mrn`, `age`, `status`, `totalScans` — backend has `patientCode` only |
| `MedicalScan` | `ScanResponse` | Frontend has `imageUrl`, `sliceCount`, `dimensions` — backend only stores file path |
| `AIAnalysisResult` | `AnalysisResponse` | Frontend has rich `findings[]` array — backend stores only summary fields |
| `DiagnosticReport` | `ReportResponse` | Frontend has full text fields — backend only stores `reportPath` |

> Most frontend type fields that don't exist in the backend need to be adapted gracefully (show empty/null).
