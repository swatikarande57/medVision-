import { Patient, MedicalScan, AIAnalysisResult, DiagnosticReport, AuditLog } from '../types/medical';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'PAT-88219',
    mrn: 'MRN-902144',
    fullName: 'Eleanor Vance',
    age: 48,
    gender: 'Female',
    dob: '1978-04-12',
    contactNumber: '+1 (555) 234-8901',
    email: 'eleanor.vance@medmail.org',
    attendingPhysician: 'Dr. Sarah Jenkins, MD',
    bloodGroup: 'A+',
    status: 'Under Observation',
    totalScans: 4,
    lastScanDate: '2026-09-04',
    notes: 'Patient presenting with recurrent migraine with aura and focal neurological deficits.'
  },
  {
    id: 'PAT-73912',
    mrn: 'MRN-841920',
    fullName: 'Robert Sterling',
    age: 62,
    gender: 'Male',
    dob: '1964-11-23',
    contactNumber: '+1 (555) 782-1192',
    email: 'rsterling@medmail.org',
    attendingPhysician: 'Dr. Marcus Vance, MD',
    bloodGroup: 'O+',
    status: 'Active',
    totalScans: 6,
    lastScanDate: '2026-09-05',
    notes: 'Post-op baseline surveillance for pulmonary nodule follow-up.'
  },
  {
    id: 'PAT-61204',
    mrn: 'MRN-773821',
    fullName: 'Sophia Martinez',
    age: 35,
    gender: 'Female',
    dob: '1991-08-19',
    contactNumber: '+1 (555) 349-0021',
    email: 'smartinez@medmail.org',
    attendingPhysician: 'Dr. Sarah Jenkins, MD',
    bloodGroup: 'B+',
    status: 'Active',
    totalScans: 2,
    lastScanDate: '2026-09-01',
    notes: 'Routine lumbar MRI for acute low back pain following lumbar strain.'
  },
  {
    id: 'PAT-94182',
    mrn: 'MRN-552190',
    fullName: 'David Chen',
    age: 57,
    gender: 'Male',
    dob: '1969-02-04',
    contactNumber: '+1 (555) 901-4432',
    email: 'dchen@medmail.org',
    attendingPhysician: 'Dr. Alan Ross, MD',
    bloodGroup: 'AB-',
    status: 'Under Observation',
    totalScans: 5,
    lastScanDate: '2026-09-06',
    notes: 'Abdominal CT following unexplained hepatic enzyme elevation.'
  },
  {
    id: 'PAT-52190',
    mrn: 'MRN-331092',
    fullName: 'Margaret Thorne',
    age: 71,
    gender: 'Female',
    dob: '1955-09-14',
    contactNumber: '+1 (555) 123-9988',
    email: 'mthorne@medmail.org',
    attendingPhysician: 'Dr. Marcus Vance, MD',
    bloodGroup: 'O-',
    status: 'Discharged',
    totalScans: 8,
    lastScanDate: '2026-08-28',
    notes: 'Completed screening regimen. Recommended follow-up in 12 months.'
  }
];

// High-resolution medical SVG image data URLs for realistic brain/chest scans
const BRAIN_MRI_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" fill="none"><rect width="600" height="600" fill="%23050811"/><ellipse cx="300" cy="300" rx="200" ry="240" fill="%231a2332" stroke="%23334155" stroke-width="4"/><path d="M 210 160 C 180 200 160 270 170 340 C 180 400 230 480 300 490 C 370 480 420 400 430 340 C 440 270 420 200 390 160 C 360 120 240 120 210 160 Z" fill="%23263346" stroke="%23475569" stroke-width="2"/><path d="M 300 130 L 300 480" stroke="%2306b6d4" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.6"/><ellipse cx="250" cy="270" rx="45" ry="70" fill="%23334155" opacity="0.8"/><ellipse cx="350" cy="270" rx="45" ry="70" fill="%23334155" opacity="0.8"/><ellipse cx="370" cy="240" rx="28" ry="22" fill="%23ef4444" opacity="0.75" stroke="%23f87171" stroke-width="2"/><text x="370" y="244" fill="white" font-size="12" font-weight="bold" text-anchor="middle">LESION A</text><path d="M 200 380 Q 240 430 300 430 Q 360 430 400 380" stroke="%2364748b" stroke-width="3" fill="none"/></svg>`;

const BRAIN_HEATMAP_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" fill="none"><rect width="600" height="600" fill="%23050811"/><ellipse cx="300" cy="300" rx="200" ry="240" fill="%231a2332" stroke="%23334155" stroke-width="4"/><path d="M 210 160 C 180 200 160 270 170 340 C 180 400 230 480 300 490 C 370 480 420 400 430 340 C 440 270 420 200 390 160 C 360 120 240 120 210 160 Z" fill="%23263346"/><radialGradient id="h1" cx="60%" cy="40%" r="20%"><stop offset="0%" stop-color="%23ef4444" stop-opacity="0.9"/><stop offset="50%" stop-color="%23f97316" stop-opacity="0.7"/><stop offset="80%" stop-color="%23eab308" stop-opacity="0.4"/><stop offset="100%" stop-color="%2306b6d4" stop-opacity="0"/></radialGradient><circle cx="370" cy="240" r="85" fill="url(%23h1)"/><rect x="325" y="195" width="90" height="90" fill="none" stroke="%23f87171" stroke-width="2" stroke-dasharray="4 4"/><text x="328" y="190" fill="%23f87171" font-size="11" font-weight="bold">AI CONF: 94.2%</text></svg>`;

const CHEST_CT_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" fill="none"><rect width="600" height="600" fill="%23050811"/><ellipse cx="300" cy="300" rx="220" ry="180" fill="%231a2332" stroke="%23334155" stroke-width="4"/><path d="M 170 230 C 160 300 190 380 260 380 C 280 380 290 350 280 280 C 270 230 220 210 170 230 Z" fill="%230f172a" stroke="%23475569" stroke-width="2"/><path d="M 430 230 C 440 300 410 380 340 380 C 320 380 310 350 320 280 C 330 230 380 210 430 230 Z" fill="%230f172a" stroke="%23475569" stroke-width="2"/><circle cx="210" cy="290" r="18" fill="%23eab308" opacity="0.8" stroke="%23fde047" stroke-width="2"/><text x="210" y="294" fill="white" font-size="10" font-weight="bold" text-anchor="middle">NODULE</text></svg>`;

export const MOCK_ANALYSES: Record<string, AIAnalysisResult> = {
  'ANALYSIS-901': {
    id: 'ANALYSIS-901',
    scanId: 'SCAN-1004',
    patientId: 'PAT-88219',
    analyzedAt: '2026-09-06T14:32:00Z',
    primaryDiagnosis: 'Right Parietal Lobe Hyperintensity (Possible Glioma Candidate)',
    overallSeverity: 'CRITICAL',
    confidenceScore: 0.942,
    heatmapUrl: BRAIN_HEATMAP_SVG,
    modelName: 'MedVision NeuralBrain v4.2',
    modelVersion: '4.2.1-prod',
    processingTimeMs: 1420,
    verificationStatus: 'PENDING',
    findings: [
      {
        id: 'FINDING-01',
        location: 'Right Parietal Lobe (Slice 42/64)',
        type: 'Focal T2/FLAIR Hyperintensity',
        confidence: 0.942,
        severity: 'CRITICAL',
        coordinates: { x: 325, y: 195, width: 90, height: 90 },
        description: 'Well-circumscribed hyperintense region measuring approximately 2.4 x 2.1 cm with mild surrounding mass effect.',
        volumeMm3: 4820
      },
      {
        id: 'FINDING-02',
        location: 'Left Lateral Ventricle',
        type: 'Mild Ventricular Asymmetry',
        confidence: 0.815,
        severity: 'MODERATE',
        coordinates: { x: 220, y: 250, width: 50, height: 60 },
        description: 'Slight compression of the ipsilateral lateral ventricle secondary to mass effect.'
      }
    ],
    radiologistNotes: 'AI findings correlate with clinical symptoms of progressive left-sided weakness. Emergency neurosurgical consultation recommended.'
  }
};

export const MOCK_SCANS: MedicalScan[] = [
  {
    id: 'SCAN-1004',
    patientId: 'PAT-88219',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-902144',
    scanType: 'MRI',
    modality: 'Brain',
    bodyPart: 'Brain T2 FLAIR',
    uploadDate: '2026-09-06T14:30:12Z',
    status: 'ANALYZED',
    imageUrl: BRAIN_MRI_SVG,
    thumbnailUrl: BRAIN_MRI_SVG,
    sliceCount: 64,
    currentSlice: 42,
    dimensions: '512 x 512 x 64',
    fileSizeMb: 148.5,
    hasAbnormality: true,
    aiAnalysis: MOCK_ANALYSES['ANALYSIS-901']
  },
  {
    id: 'SCAN-1003',
    patientId: 'PAT-73912',
    patientName: 'Robert Sterling',
    patientMrn: 'MRN-841920',
    scanType: 'CT',
    modality: 'Chest',
    bodyPart: 'Thorax High-Res',
    uploadDate: '2026-09-05T09:15:44Z',
    status: 'REVIEWED',
    imageUrl: CHEST_CT_SVG,
    thumbnailUrl: CHEST_CT_SVG,
    sliceCount: 128,
    currentSlice: 64,
    dimensions: '512 x 512 x 128',
    fileSizeMb: 210.2,
    hasAbnormality: true,
    aiAnalysis: {
      id: 'ANALYSIS-900',
      scanId: 'SCAN-1003',
      patientId: 'PAT-73912',
      analyzedAt: '2026-09-05T09:18:00Z',
      primaryDiagnosis: 'Solitary Subpleural Nodule (Right Middle Lobe)',
      overallSeverity: 'MODERATE',
      confidenceScore: 0.887,
      heatmapUrl: CHEST_CT_SVG,
      modelName: 'MedVision ChestNet v3.1',
      modelVersion: '3.1.0',
      processingTimeMs: 1150,
      verificationStatus: 'APPROVED',
      verifiedBy: 'Dr. Sarah Jenkins, MD',
      findings: [
        {
          id: 'FINDING-10',
          location: 'Right Middle Lobe',
          type: 'Subpleural Nodule',
          confidence: 0.887,
          severity: 'MODERATE',
          coordinates: { x: 190, y: 270, width: 40, height: 40 },
          description: '6mm solid nodule without calcification. Stable compared to baseline scan from 6 months prior.'
        }
      ]
    }
  },
  {
    id: 'SCAN-1002',
    patientId: 'PAT-61204',
    patientName: 'Sophia Martinez',
    patientMrn: 'MRN-773821',
    scanType: 'MRI',
    modality: 'Spine',
    bodyPart: 'Lumbar Spine T1/T2',
    uploadDate: '2026-09-04T16:45:00Z',
    status: 'ANALYZED',
    imageUrl: BRAIN_MRI_SVG,
    thumbnailUrl: BRAIN_MRI_SVG,
    sliceCount: 32,
    currentSlice: 16,
    dimensions: '256 x 256 x 32',
    fileSizeMb: 85.4,
    hasAbnormality: false,
    aiAnalysis: {
      id: 'ANALYSIS-899',
      scanId: 'SCAN-1002',
      patientId: 'PAT-61204',
      analyzedAt: '2026-09-04T16:47:00Z',
      primaryDiagnosis: 'No Acute Disc Herniation or Spinal Stenosis',
      overallSeverity: 'NORMAL',
      confidenceScore: 0.981,
      heatmapUrl: BRAIN_MRI_SVG,
      modelName: 'MedVision SpineNet v2.0',
      modelVersion: '2.0.4',
      processingTimeMs: 980,
      verificationStatus: 'APPROVED',
      verifiedBy: 'Dr. Alan Ross, MD',
      findings: []
    }
  },
  {
    id: 'SCAN-1001',
    patientId: 'PAT-94182',
    patientName: 'David Chen',
    patientMrn: 'MRN-552190',
    scanType: 'CT',
    modality: 'Abdomen',
    bodyPart: 'Abdomen & Pelvis',
    uploadDate: '2026-09-03T11:20:10Z',
    status: 'PROCESSING',
    imageUrl: CHEST_CT_SVG,
    thumbnailUrl: CHEST_CT_SVG,
    sliceCount: 96,
    currentSlice: 48,
    dimensions: '512 x 512 x 96',
    fileSizeMb: 160.0,
    hasAbnormality: false
  }
];

export const MOCK_REPORTS: DiagnosticReport[] = [
  {
    id: 'REP-2026-089',
    reportNumber: 'MV-REP-88219-01',
    scanId: 'SCAN-1004',
    patientId: 'PAT-88219',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-902144',
    patientAge: 48,
    patientGender: 'Female',
    scanType: 'MRI',
    dateCreated: '2026-09-06',
    radiologistName: 'Dr. Sarah Jenkins, MD (Chief Radiologist)',
    clinicalHistory: '48-year-old female presenting with severe right-sided headaches, nausea, and recent onset left arm paresis.',
    technique: 'Multiplanar axial, coronal, and sagittal T1, T2, and FLAIR MRI of the brain without contrast.',
    aiSummary: 'MedVision AI detection algorithm identified a high-probability hyperintense mass in the right parietal lobe (94.2% confidence).',
    findingsText: 'There is a discrete 2.4 x 2.1 cm area of hyperintensity on T2/FLAIR images located within the right parietal cortical and subcortical white matter. Mild surrounding vasogenic edema is present. No midline shift observed.',
    impressionText: '1. Right parietal lobe intra-axial mass suspicious for primary glial neoplasm.\n2. Recommend urgent contrast-enhanced MRI and neurosurgical evaluation.',
    recommendationsText: 'Follow-up post-contrast MRI within 48 hours. Consider stereotactic biopsy.',
    status: 'FINAL',
    signedBy: 'Dr. Sarah Jenkins, MD',
    signedAt: '2026-09-06T15:10:00Z'
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-09-06T15:10:00Z',
    userId: 'USR-101',
    userName: 'Dr. Sarah Jenkins',
    userRole: 'DOCTOR',
    action: 'SIGNED_REPORT',
    resource: 'Report #MV-REP-88219-01',
    ipAddress: '192.168.1.45',
    status: 'SUCCESS'
  },
  {
    id: 'LOG-002',
    timestamp: '2026-09-06T14:32:00Z',
    userId: 'SYSTEM_AI',
    userName: 'MedVision AI Engine',
    userRole: 'ADMIN',
    action: 'RUN_INFERENCE',
    resource: 'Scan #SCAN-1004 (Brain MRI)',
    ipAddress: '127.0.0.1',
    status: 'SUCCESS'
  },
  {
    id: 'LOG-003',
    timestamp: '2026-09-06T14:30:12Z',
    userId: 'USR-101',
    userName: 'Dr. Sarah Jenkins',
    userRole: 'DOCTOR',
    action: 'UPLOAD_DICOM',
    resource: 'Patient #PAT-88219 Scan File',
    ipAddress: '192.168.1.45',
    status: 'SUCCESS'
  }
];
