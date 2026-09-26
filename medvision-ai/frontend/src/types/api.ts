// ============================================================
// API Response Types — matching Spring Boot DTO responses exactly
// ============================================================

/** Wrapper returned by all Spring Boot endpoints */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  timestamp?: string;
  path?: string;
}

/** Paginated response from Spring Boot (Page<T>) */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ============================================================
// Auth
// ============================================================
export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  role: 'DOCTOR' | 'ADMIN';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role?: 'DOCTOR' | 'ADMIN';
}

// ============================================================
// Patients
// ============================================================
export interface PatientResponse {
  id: number;
  patientCode: string;
  fullName: string;
  dateOfBirth: string | null;   // ISO date string "YYYY-MM-DD"
  gender: string | null;        // "MALE" | "FEMALE" | "OTHER"
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientRequest {
  patientCode: string;
  fullName: string;
  dateOfBirth?: string | null;  // "YYYY-MM-DD"
  gender?: string | null;
  phone?: string | null;
}

// ============================================================
// Scans
// ============================================================
export interface ScanResponse {
  id: number;
  patientId: number;
  originalFileName: string;
  fileType: string;
  modality: string;
  status: 'UPLOADED' | 'PROCESSING' | 'ANALYZED' | 'FAILED';
  uploadedAt: string;
}

// ============================================================
// AI Analysis
// ============================================================
export interface AnalysisRegion {
  channelIndex: number;
  labelCode: string;
  regionName: string;
  voxelCount: number;
  volumeCm3: number;
  colorRgb: [number, number, number];
}

export interface AnalysisResponse {
  id: number;
  scanId: number;
  tumorDetected: boolean | null;
  confidence: number | null;      // 0-100 double (null in production MONAI mode)
  affectedAreaPercentage: number | null;
  estimatedArea: number | null;
  resultSummary: string | null;
  maskPath: string | null;
  overlayPath: string | null;
  modelName: string | null;
  mode: string | null;            // "DEMO" | "PRODUCTION"
  device: string | null;           // "CPU" | "CUDA"
  inferenceTimeMs: number | null;
  affectedVolumeCm3: number | null;
  regionsJson: string | null;
  createdAt: string;
}

export interface JobResponse {
  jobId: number;
  scanId: number;
  status: 'QUEUED' | 'VALIDATING' | 'PREPROCESSING' | 'INFERENCE' | 'SEGMENTATION' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  stage: string;
  externalJobId: string;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

// ============================================================
// Reports
// ============================================================
export interface ReportResponse {
  id: number;
  patientId: number;
  scanId: number;
  analysisId: number | null;
  reportPath: string | null;
  createdAt: string;
}

export interface ReportRequest {
  patientId: number;
  scanId: number;
  analysisId?: number | null;
}

// ============================================================
// Dashboard
// ============================================================
export interface DashboardSummaryResponse {
  totalPatients: number;
  totalScans: number;
  processingAnalyses: number;
  completedAnalyses: number;
  reviewRequired: number;
}

// ============================================================
// Comparisons
// ============================================================
export interface ComparisonResponse {
  id: number;
  patientId: number;
  previousScanId: number;
  currentScanId: number;
  previousAffectedArea: number | null;
  currentAffectedArea: number | null;
  absoluteChange: number | null;
  percentageChange: number | null;
  timeDifference: string | null;
  interpretation: string | null;
  createdAt: string;
}

export interface ComparisonRequest {
  previousScanId: number;
  currentScanId: number;
}
