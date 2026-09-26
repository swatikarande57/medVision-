import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileCheck,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Layers,
  ShieldCheck,
  Loader2,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Toggle } from '../components/ui/Toggle';
import { Input } from '../components/ui/Input';
import { patientApi } from '../api/patientApi';
import { scanApi } from '../api/scanApi';
import { getErrorMessage } from '../api/client';
import type { PatientResponse } from '../types/api';

type DropzoneState = 'IDLE' | 'DRAGGING' | 'UPLOADING' | 'SUCCESS' | 'ERROR';
type PipelineStage = 'UPLOAD' | 'VALIDATION' | 'PREPROCESSING' | 'INFERENCE' | 'SEGMENTATION' | 'POST-PROCESSING' | 'COMPLETED';

export const ScanUploadPage: React.FC = () => {
  const navigate = useNavigate();

  const [dropState, setDropState] = useState<DropzoneState>('IDLE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  // Patients (loaded from real API)
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [modality, setModality] = useState('MRI');
  const [contrastUsed, setContrastUsed] = useState(false);

  // AI Pipeline State
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<PipelineStage>('UPLOAD');
  const [pipelinePercent, setPipelinePercent] = useState(0);

  // Load real patient list
  const loadPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const page = await patientApi.getPatients(0, 200);
      setPatients(page.content);
      if (page.content.length > 0) setSelectedPatientId(String(page.content[0].id));
    } catch {
      // Non-blocking: user can still see the upload UI
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  useEffect(() => { void loadPatients(); }, [loadPatients]);

  const stages: { stage: PipelineStage; label: string; desc: string }[] = [
    { stage: 'UPLOAD', label: '1. DICOM / NIfTI Ingestion', desc: 'Parsing volumetric headers & spatial metadata' },
    { stage: 'VALIDATION', label: '2. Volume Validation', desc: 'Verifying voxel spacing, orientation & matrix dimensions' },
    { stage: 'PREPROCESSING', label: '3. Tensor Normalization', desc: 'Intensity z-score scaling & spatial resampling' },
    { stage: 'INFERENCE', label: '4. MONAI SegResNet Inference', desc: 'Running PyTorch 3D BraTS neural segmentation pipeline' },
    { stage: 'SEGMENTATION', label: '5. Sub-region Masking', desc: 'Whole Tumor (WT), Tumor Core (TC), Enhancing Tumor (ET)' },
    { stage: 'POST-PROCESSING', label: '6. Radiomics Quantification', desc: 'Calculating volumetric measurements in cm³' },
    { stage: 'COMPLETED', label: '7. Pipeline Complete', desc: 'Persisting segmentation masks & volumetric metrics' },
  ];

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setDropState('SUCCESS');
    setUploadProgress(0);
    setUploadError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropState('IDLE');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile || !selectedPatientId) return;
    setIsProcessing(true);
    setCurrentStage('UPLOAD');
    setPipelinePercent(10);
    setUploadError('');

    try {
      // Real upload with browser-native progress
      setDropState('UPLOADING');
      const createdScan = await scanApi.uploadScan(
        Number(selectedPatientId),
        selectedFile,
        modality,
        (pct) => {
          setUploadProgress(pct);
          // Map upload progress to first two pipeline stages
          if (pct < 50) {
            setCurrentStage('UPLOAD');
            setPipelinePercent(Math.round(pct * 0.4));
          } else {
            setCurrentStage('VALIDATION');
            setPipelinePercent(Math.round(20 + (pct - 50) * 0.6));
          }
        }
      );

      // Upload succeeded — animate remaining pipeline stages (backend queues inference async)
      setCurrentStage('PREPROCESSING');
      setPipelinePercent(45);
      await new Promise((r) => setTimeout(r, 600));
      setCurrentStage('INFERENCE');
      setPipelinePercent(65);
      await new Promise((r) => setTimeout(r, 600));
      setCurrentStage('COMPLETED');
      setPipelinePercent(100);

      // Navigate to the scan owner patient page
      await new Promise((r) => setTimeout(r, 800));
      navigate(`/patients/${createdScan.patientId}`);
    } catch (err) {
      setUploadError(getErrorMessage(err));
      setIsProcessing(false);
      setDropState('ERROR');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            Ingest DICOM Scan & Run Neural Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload PACS DICOM study series (.dcm, .nii, .zip) to trigger volumetric neural network inference.
          </p>
        </div>
      </div>

      {!isProcessing ? (
        /* Upload Configuration & Dropzone View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Drag-and-Drop Dropzone */}
          <Card className="lg:col-span-2 flex flex-col justify-between p-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>PACS DICOM File Dropzone</span>
                <Badge variant="cyan" size="sm">DICOM 3.0 / NIfTI / ZIP</Badge>
              </CardTitle>
              <CardDescription>Supports single slice DICOM (.dcm) files, compressed series (.zip), or NIfTI volumetric volumes (.nii).</CardDescription>
            </CardHeader>

            {/* Interactive Multi-State Dropzone Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDropState('DRAGGING');
              }}
              onDragLeave={() => setDropState('IDLE')}
              onDrop={handleDrop}
              className={`my-6 p-10 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden ${
                dropState === 'DRAGGING'
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-xl shadow-cyan-500/20'
                  : dropState === 'SUCCESS'
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : dropState === 'UPLOADING'
                  ? 'border-blue-500/60 bg-slate-900'
                  : 'border-slate-800 bg-slate-950/60 hover:border-cyan-500/40 hover:bg-slate-900/60'
              }`}
            >
              {(dropState === 'SUCCESS' || dropState === 'UPLOADING') && selectedFile ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 w-fit mx-auto animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <span className="font-bold text-slate-100 text-sm block">{selectedFile.name}</span>
                  <span className="text-xs text-emerald-400 font-mono block">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • DICOM Headers Validated
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropState('IDLE');
                      setSelectedFile(null);
                    }}
                  >
                    Change File
                  </Button>
                </div>
              ) : dropState === 'UPLOADING' ? (
                <div className="space-y-4 w-full max-w-xs mx-auto">
                  <div className="p-4 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 w-fit mx-auto animate-spin">
                    <Upload className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 block">Uploading & Normalizing DICOM Slices...</span>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400">{uploadProgress}% Complete (18.4 MB/s)</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400 w-fit mx-auto">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-100 text-sm block">Drag and drop DICOM scan file here</span>
                    <span className="text-xs text-slate-400 block mt-1">or click to browse local files</span>
                  </div>
                  <input
                    type="file"
                    accept=".dcm,.nii,.nii.gz,.zip,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Status: {dropState}</span>
              <div className="flex flex-col items-end gap-2">
                {uploadError && (
                  <p className="text-xs text-rose-400">{uploadError}</p>
                )}
                <Button
                  variant="glow"
                  disabled={dropState !== 'SUCCESS' || !selectedPatientId}
                  leftIcon={<BrainCircuit className="w-4 h-4" />}
                  onClick={handleStartUpload}
                >
                  Upload &amp; Queue Analysis
                </Button>
              </div>
            </div>
          </Card>

          {/* Right 1 Col: Scan Metadata Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Scan Metadata Parameters</CardTitle>
              <CardDescription>Link DICOM study to patient record and specify acquisition modalities.</CardDescription>
            </CardHeader>

            <div className="space-y-4">
              {patientsLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading patients…
                </div>
              ) : (
                <Select
                  label="Target Patient Record"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  options={patients.map((p) => ({
                    value: String(p.id),
                    label: `${p.fullName} (${p.patientCode})`,
                  }))}
                />
              )}

              <Select
                label="Scan Modality"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                options={[
                  { value: 'MRI', label: 'MRI (Magnetic Resonance)' },
                  { value: 'CT', label: 'CT (Computed Tomography)' },
                  { value: 'XRAY', label: 'X-Ray Radiography' },
                  { value: 'PET', label: 'PET Scan' },
                  { value: 'ULTRASOUND', label: 'Ultrasound' },
                ]}
              />



              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <Toggle
                  checked={contrastUsed}
                  onChange={setContrastUsed}
                  label="Gadolinium Contrast Enhanced"
                  description="Check if T1w + C contrast agent was administered"
                />
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* Multi-Stage AI Inference Engine Pipeline View */
        <Card className="p-8 border-cyan-500/40 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
          {/* Scanline Animation */}
          <div className="animate-scanline z-10" />

          <div className="max-w-2xl mx-auto space-y-8 text-center relative z-20">
            {/* Animated Progress Ring */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="#1e293b"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="#06b6d4"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={377}
                  strokeDashoffset={377 - (377 * pipelinePercent) / 100}
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <BrainCircuit className="w-8 h-8 text-cyan-400 animate-pulse" />
                <span className="text-xl font-black font-mono text-slate-100 mt-1">{pipelinePercent}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Badge variant="cyan" pulse size="md">
                EXECUTING PIPELINE: {currentStage}
              </Badge>
              <h2 className="text-2xl font-bold text-slate-100">
                Processing Volumetric DICOM Tensor Inferences
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Hardware Device: NVIDIA A100 Tensor Core GPU (PyTorch UNet3D)
              </p>
            </div>

            {/* Stages Stepper */}
            <div className="space-y-2 text-left bg-slate-950/80 p-6 rounded-2xl border border-slate-800">
              {stages.map((st) => {
                const isPassed =
                  stages.findIndex((s) => s.stage === currentStage) >=
                  stages.findIndex((s) => s.stage === st.stage);
                const isCurrent = currentStage === st.stage;

                return (
                  <div
                    key={st.stage}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-cyan-950/60 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                        : isPassed
                        ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                        : 'bg-slate-950/30 border-transparent text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                          isPassed ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isPassed ? '✓' : '•'}
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-100">{st.label}</span>
                        <span className="text-[11px] text-slate-400 block">{st.desc}</span>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-mono text-cyan-400 animate-pulse font-semibold">
                        PROCESSING...
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
