import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Eye,
  AlertTriangle,
  FileText,
  Sparkles,
  Loader2,
  RefreshCw,
  Play
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { scanApi } from '../api/scanApi';
import { analysisApi } from '../api/analysisApi';
import { getErrorMessage } from '../api/client';
import type { ScanResponse, AnalysisResponse, JobResponse } from '../types/api';

export const AIAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // can be scanId or analysisId
  const navigate = useNavigate();

  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [activeJob, setActiveJob] = useState<JobResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggeringJob, setTriggeringJob] = useState(false);

  const loadScanAndAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parsedId = Number(id);
      if (!parsedId || isNaN(parsedId)) {
        // If no ID, fetch first scan available
        const allScans = await scanApi.getAllScans();
        if (allScans.length > 0) {
          setScan(allScans[0]);
          try {
            const ana = await analysisApi.getAnalysisByScan(allScans[0].id);
            setAnalysis(ana);
          } catch {
            setAnalysis(null);
          }
        }
      } else {
        // Try fetching as scan first
        try {
          const scanData = await scanApi.getScanById(parsedId);
          setScan(scanData);
          try {
            const ana = await analysisApi.getAnalysisByScan(parsedId);
            setAnalysis(ana);
          } catch {
            setAnalysis(null);
          }
        } catch {
          // If scan fetch fails, try fetching analysis by ID directly
          try {
            const anaData = await analysisApi.getAnalysisById(parsedId);
            setAnalysis(anaData);
            const scanData = await scanApi.getScanById(anaData.scanId);
            setScan(scanData);
          } catch {
            setError(`Unable to find scan or analysis record for ID: ${id}`);
          }
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadScanAndAnalysis();
  }, [loadScanAndAnalysis]);

  const handleRunInference = async () => {
    if (!scan) return;
    setTriggeringJob(true);
    setError(null);
    try {
      const job = await analysisApi.createAnalysisJob(scan.id);
      setActiveJob(job);
      // Poll job status
      pollJobStatus(job.jobId);
    } catch (err) {
      setError(getErrorMessage(err));
      setTriggeringJob(false);
    }
  };

  const pollJobStatus = (jobId: number) => {
    const interval = setInterval(async () => {
      try {
        const job = await analysisApi.getJobStatus(jobId);
        setActiveJob(job);
        if (job.status === 'COMPLETED' || job.status === 'FAILED') {
          clearInterval(interval);
          setTriggeringJob(false);
          void loadScanAndAnalysis();
        }
      } catch {
        clearInterval(interval);
        setTriggeringJob(false);
      }
    }, 2000);
  };

  const getScanFileUrl = (scanId: number) => {
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/scans/${scanId}/file`;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              AI Neural Inference & Lesion Detection
            </h1>
            {analysis ? (
              <Badge variant={analysis.tumorDetected ? 'rose' : 'emerald'} pulse>
                {analysis.tumorDetected ? 'TUMOR DETECTED' : 'NORMAL / CLEAR'}
              </Badge>
            ) : (
              <Badge variant="amber">PENDING INFERENCE</Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            {scan ? `Scan #${scan.id} • Modality: ${scan.modality} (${scan.fileType})` : 'Select a scan to inspect'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {scan && (
            <Button
              variant="outline"
              leftIcon={<Eye className="w-4 h-4 text-cyan-400" />}
              onClick={() => navigate(`/viewer/${scan.id}`)}
            >
              Launch DICOM Viewer
            </Button>
          )}
          <Button
            variant="glow"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={() => navigate('/reports')}
          >
            Reports Directory
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-rose-500/40 bg-rose-950/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-rose-300">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-medium">{error}</span>
            </div>
            <Button size="sm" variant="outline" onClick={loadScanAndAnalysis} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-12 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
          <p className="text-xs">Loading analysis telemetry from backend...</p>
        </Card>
      ) : !scan ? (
        <Card className="p-12 text-center text-slate-400 space-y-4">
          <BrainCircuit className="w-12 h-12 mx-auto text-slate-600" />
          <p className="text-base font-semibold text-slate-300">No DICOM Scan Selected</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Please select a DICOM scan from the Patient directory or upload a new scan to perform AI inference.
          </p>
          <Button variant="glow" onClick={() => navigate('/upload')}>
            Upload Scan
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Scan Image & Mask Canvas */}
          <Card className="lg:col-span-2 flex flex-col items-center justify-center p-6 bg-black/80 relative overflow-hidden">
            <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800 mb-4 z-10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-200">Scan #{scan.id} — {scan.originalFileName}</span>
                <Badge variant="cyan">{scan.modality}</Badge>
              </div>

              {scan && !analysis && (
                <Button
                  size="sm"
                  variant="glow"
                  isLoading={triggeringJob}
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                  onClick={handleRunInference}
                >
                  Trigger AI Inference
                </Button>
              )}
            </div>

            {/* Scan Preview Canvas */}
            <div className="relative w-full max-w-[500px] h-[450px] flex items-center justify-center bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
              <img
                src={getScanFileUrl(scan.id)}
                alt="Uploaded DICOM Scan"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback placeholder if image stream fails
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />

              {activeJob && activeJob.status !== 'COMPLETED' && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 p-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    AI PIPELINE: {activeJob.status} ({activeJob.progress}%)
                  </span>
                  <span className="text-[11px] text-slate-400">{activeJob.stage}</span>
                </div>
              )}
            </div>

            {/* Footer Details */}
            <div className="w-full mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Patient ID: #{scan.patientId}</span>
              <span>Status: {scan.status}</span>
              <span>Uploaded: {new Date(scan.uploadedAt).toLocaleDateString()}</span>
            </div>
          </Card>

          {/* Right 1 Col: AI Findings & Confidence Metrics */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Neural Analysis Results
                  </CardTitle>
                  <CardDescription>Real PyTorch & MONAI segmentation metrics</CardDescription>
                </div>
              </CardHeader>

              {analysis ? (
                <div className="space-y-4">
                  {/* Model Metadata Panel */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Model:</span>
                      <span className="text-cyan-300 font-semibold">{analysis.modelName || 'MONAI SegResNet (BraTS 3D)'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Pipeline Mode:</span>
                      <Badge variant={analysis.mode === 'PRODUCTION' ? 'cyan' : 'amber'} size="sm">
                        {analysis.mode || 'PRODUCTION'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Device:</span>
                      <span className="text-slate-200">{analysis.device || 'CPU'}</span>
                    </div>
                    {analysis.inferenceTimeMs != null && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Inference Time:</span>
                        <span className="text-slate-200">{(analysis.inferenceTimeMs / 1000).toFixed(1)}s ({analysis.inferenceTimeMs.toFixed(0)} ms)</span>
                      </div>
                    )}
                  </div>

                  {/* Quantitative Findings */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tumor Detected:</span>
                      <span className={analysis.tumorDetected ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {analysis.tumorDetected ? 'YES — LESION DETECTED' : 'NO LESION DETECTED'}
                      </span>
                    </div>

                    {analysis.affectedVolumeCm3 != null && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Affected Volume:</span>
                        <span className="text-cyan-300 font-bold text-sm">
                          {analysis.affectedVolumeCm3.toFixed(2)} cm³ ({ (analysis.affectedVolumeCm3 * 1000).toFixed(0) } mm³)
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-slate-400">Confidence Score:</span>
                      <span className="text-slate-200 font-bold">
                        {analysis.confidence != null ? `${(analysis.confidence * 100).toFixed(1)}%` : 'N/A (Multi-region Segmenter)'}
                      </span>
                    </div>

                    {analysis.affectedAreaPercentage != null && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">2D Slice Ratio:</span>
                        <span className="text-slate-200">
                          {analysis.affectedAreaPercentage.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* BraTS Sub-region Volumetric Breakdown */}
                  {analysis.regionsJson && (() => {
                    try {
                      const regions = JSON.parse(analysis.regionsJson);
                      if (Array.isArray(regions) && regions.length > 0) {
                        return (
                          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                            <span className="font-bold text-cyan-300 text-xs block">BraTS Sub-Region Segmentation:</span>
                            <div className="space-y-1.5 font-mono text-[11px]">
                              {regions.map((r: any, idx: number) => {
                                const colorMap: Record<string, string> = {
                                  WT: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
                                  TC: 'text-rose-400 border-rose-500/40 bg-rose-950/40',
                                  ET: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40'
                                };
                                const badgeStyle = colorMap[r.labelCode] || 'text-slate-300 border-slate-700 bg-slate-800';
                                return (
                                  <div key={idx} className={`p-2 rounded border flex items-center justify-between ${badgeStyle}`}>
                                    <div>
                                      <span className="font-bold mr-2">[{r.labelCode}]</span>
                                      <span className="text-slate-300">{r.regionName}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-bold">{r.volumeCm3 != null ? `${r.volumeCm3.toFixed(2)} cm³` : `${r.voxelCount} voxels`}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                    } catch {
                      return null;
                    }
                    return null;
                  })()}

                  {analysis.resultSummary && (
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-cyan-300 block mb-1">Clinical Summary:</span>
                      {analysis.resultSummary}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-200">AI Model Inference Pending</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    This scan has not been analyzed by MONAI / PyTorch model yet. Click "Trigger AI Inference" to create a new job.
                  </p>
                  <Button
                    size="sm"
                    variant="glow"
                    isLoading={triggeringJob}
                    leftIcon={<Play className="w-3.5 h-3.5" />}
                    onClick={handleRunInference}
                  >
                    Run AI Inference Job
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
