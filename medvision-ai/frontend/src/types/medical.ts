export type Role = 'DOCTOR' | 'ADMIN';

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  hospitalName?: string;
  specialty?: string;
  avatarUrl?: string;
}

export type ScanType = 'MRI' | 'CT' | 'X_RAY' | 'MAMMOGRAM';
export type ScanModality = 'Brain' | 'Chest' | 'Spine' | 'Abdomen' | 'Musculoskeletal';
export type ScanStatus = 'UPLOADED' | 'PROCESSING' | 'ANALYZED' | 'REVIEWED' | 'FLAGGED';
export type Severity = 'NORMAL' | 'LOW' | 'MODERATE' | 'CRITICAL';

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  contactNumber: string;
  email: string;
  attendingPhysician: string;
  bloodGroup: string;
  status: 'Active' | 'Under Observation' | 'Discharged';
  totalScans: number;
  lastScanDate: string;
  notes?: string;
}

export interface AnomalyFinding {
  id: string;
  location: string;
  type: string; // e.g. "Glioblastoma Multiforme Candidate", "Pulmonary Nodule", "Fracture"
  confidence: number; // e.g. 0.94
  severity: Severity;
  coordinates: { x: number; y: number; width: number; height: number };
  description: string;
  volumeMm3?: number;
}

export interface AIAnalysisResult {
  id: string;
  scanId: string;
  patientId: string;
  analyzedAt: string;
  primaryDiagnosis: string;
  overallSeverity: Severity;
  confidenceScore: number; // 0 to 1
  findings: AnomalyFinding[];
  heatmapUrl: string;
  radiologistNotes?: string;
  verifiedBy?: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_SECOND_OPINION';
  modelName: string;
  modelVersion: string;
  processingTimeMs: number;
}

export interface MedicalScan {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  scanType: ScanType;
  modality: ScanModality;
  bodyPart: string;
  uploadDate: string;
  status: ScanStatus;
  imageUrl: string;
  thumbnailUrl: string;
  dicomFileUrl?: string;
  sliceCount: number;
  currentSlice: number;
  dimensions: string;
  fileSizeMb: number;
  hasAbnormality: boolean;
  aiAnalysis?: AIAnalysisResult;
}

export interface DiagnosticReport {
  id: string;
  reportNumber: string;
  scanId: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  patientAge: number;
  patientGender: string;
  scanType: ScanType;
  dateCreated: string;
  radiologistName: string;
  clinicalHistory: string;
  technique: string;
  aiSummary: string;
  findingsText: string;
  impressionText: string;
  recommendationsText: string;
  status: 'DRAFT' | 'FINAL' | 'AMENDED';
  signedBy?: string;
  signedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  resource: string;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}
