import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Ruler,
  ChevronLeft,
  Contrast,
  Info,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { scanApi } from '../api/scanApi';
import { analysisApi } from '../api/analysisApi';
import { getErrorMessage } from '../api/client';
import type { ScanResponse, AnalysisResponse } from '../types/api';

type WindowingPreset = 'BRAIN' | 'BONE' | 'LUNG' | 'SOFT_TISSUE';

export const MedicalViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Viewer Canvas State
  const [zoom, setZoom] = useState(1.0);
  const [windowPreset, setWindowPreset] = useState<WindowingPreset>('BRAIN');
  const [isInverted, setIsInverted] = useState(false);
  const [activeTool, setActiveTool] = useState<'PAN' | 'ZOOM' | 'MEASURE'>('PAN');
  const [showMetadataDrawer, setShowMetadataDrawer] = useState(false);
  const [measurementLength, setMeasurementLength] = useState<number | null>(14.2);

  // AI Overlay Controls
  const [showOverlay, setShowOverlay] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);

  // Preset values mapping
  const windowValues: Record<WindowingPreset, { width: number; center: number; contrast: string }> = {
    BRAIN: { width: 80, center: 40, contrast: 'brightness(100%) contrast(120%)' },
    BONE: { width: 2000, center: 500, contrast: 'brightness(110%) contrast(200%)' },
    LUNG: { width: 1500, center: -600, contrast: 'brightness(130%) contrast(150%)' },
    SOFT_TISSUE: { width: 350, center: 40, contrast: 'brightness(95%) contrast(110%)' },
  };

  const loadScanDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parsedId = Number(id);
      let targetScan: ScanResponse | null = null;
      if (parsedId && !isNaN(parsedId)) {
        targetScan = await scanApi.getScanById(parsedId);
      } else {
        const allScans = await scanApi.getAllScans();
        if (allScans.length > 0) {
          targetScan = allScans[0];
        } else {
          setError('No DICOM scans available in database.');
        }
      }
      setScan(targetScan);

      if (targetScan) {
        try {
          const ana = await analysisApi.getAnalysisByScan(targetScan.id);
          setAnalysis(ana);
        } catch {
          setAnalysis(null);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadScanDetails();
  }, [loadScanDetails]);

  const handleReset = () => {
    setZoom(1.0);
    setIsInverted(false);
    setWindowPreset('BRAIN');
  };

  const getScanFileUrl = (scanId: number) => {
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/scans/${scanId}/file`;
  };

  const getOverlayFileUrl = (scanId: number) => {
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/analysis/scan/${scanId}/overlay`;
  };

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 p-3 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => navigate('/patients')}
          >
            Directory
          </Button>
          <div className="h-4 w-px bg-slate-800" />
          <span className="text-xs font-semibold text-slate-100">
            {scan ? `Scan #${scan.id} — ${scan.originalFileName}` : 'DICOM Viewer'}
          </span>
          <Badge variant="cyan" size="sm">{scan?.modality || 'MRI'}</Badge>
          {analysis && (
            <Badge variant={analysis.tumorDetected ? 'rose' : 'emerald'} size="sm">
              {analysis.tumorDetected ? 'AI Lesion Overlay Ready' : 'AI Analysis Clear'}
            </Badge>
          )}
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-2">
          {/* AI Overlay Layer Toggle & Opacity Slider */}
          {analysis?.overlayPath && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${
                  showOverlay ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle AI Segmentation Mask Overlay"
              >
                {showOverlay ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                <span>AI Mask</span>
              </button>

              {showOverlay && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 pl-1 border-l border-slate-800">
                  <span>Opacity:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                    className="w-16 accent-cyan-400 cursor-pointer h-1.5 rounded bg-slate-800"
                  />
                  <span className="w-8 text-right text-cyan-300">{(overlayOpacity * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>
          )}

          {/* Windowing Presets Dropdown */}
          <Select
            value={windowPreset}
            onChange={(e) => setWindowPreset(e.target.value as WindowingPreset)}
            options={[
              { value: 'BRAIN', label: 'Brain (WW 80 WL 40)' },
              { value: 'BONE', label: 'Bone (WW 2000 WL 500)' },
              { value: 'LUNG', label: 'Lung (WW 1500 WL -600)' },
              { value: 'SOFT_TISSUE', label: 'Soft Tissue (WW 350 WL 40)' },
            ]}
            className="w-44 py-1.5 text-xs"
          />

          <div className="h-4 w-px bg-slate-800" />

          {/* Zoom In/Out */}
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 3.0))}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Invert Color */}
          <button
            onClick={() => setIsInverted(!isInverted)}
            className={`p-2 rounded-lg transition-colors ${
              isInverted ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Invert Grayscale"
          >
            <Contrast className="w-4 h-4" />
          </button>

          {/* Measurement Ruler Tool */}
          <button
            onClick={() => setActiveTool(activeTool === 'MEASURE' ? 'PAN' : 'MEASURE')}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'MEASURE' ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Measurement Caliper"
          >
            <Ruler className="w-4 h-4" />
          </button>

          {/* Reset View */}
          <button
            onClick={handleReset}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Reset Transformations"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowMetadataDrawer(!showMetadataDrawer)}
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
            title="Inspect DICOM Metadata"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <Card className="border-rose-500/40 bg-rose-950/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-rose-300">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-medium">{error}</span>
            </div>
            <Button size="sm" variant="outline" onClick={loadScanDetails} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Main Viewport Canvas */}
      <div className="flex-1 flex gap-4 overflow-hidden relative">
        <div className="flex-1 bg-black rounded-2xl border border-slate-800 relative flex items-center justify-center overflow-hidden shadow-2xl">
          {loading ? (
            <div className="text-center space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
              <p className="text-xs">Streaming DICOM volume frame...</p>
            </div>
          ) : scan ? (
            <>
              {/* Image Viewport */}
              <div
                style={{
                  transform: `scale(${zoom})`,
                  filter: `${windowValues[windowPreset].contrast} ${isInverted ? 'invert(100%)' : ''}`,
                }}
                className="relative w-full h-full flex items-center justify-center transition-transform duration-150"
              >
                {/* Base Scan MRI */}
                <img
                  src={getScanFileUrl(scan.id)}
                  alt="Scan File Stream"
                  className="max-h-full max-w-full object-contain pointer-events-none select-none"
                />

                {/* AI Segmentation Overlay Image (Composited) */}
                {analysis?.overlayPath && showOverlay && (
                  <img
                    src={getOverlayFileUrl(scan.id)}
                    alt="AI Segmentation Overlay"
                    style={{ opacity: overlayOpacity }}
                    className="absolute max-h-full max-w-full object-contain pointer-events-none select-none transition-opacity duration-150 mix-blend-screen"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}

                {/* Measurement Line Overlay */}
                {activeTool === 'MEASURE' && measurementLength && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-48 h-0.5 bg-cyan-400 shadow-lg shadow-cyan-500/50">
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-cyan-500/40">
                        {measurementLength} mm
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Viewport Overlay Text */}
              <div className="absolute top-4 left-4 pointer-events-none space-y-1 text-[11px] font-mono text-cyan-400/80 bg-slate-950/70 p-3 rounded-xl border border-slate-800 backdrop-blur-sm">
                <div>SCAN ID: #{scan.id}</div>
                <div>PATIENT ID: #{scan.patientId}</div>
                <div>FILE: {scan.originalFileName}</div>
                <div>FORMAT: {scan.fileType}</div>
              </div>

              <div className="absolute top-4 right-4 pointer-events-none text-right space-y-1 text-[11px] font-mono text-cyan-400/80 bg-slate-950/70 p-3 rounded-xl border border-slate-800 backdrop-blur-sm">
                <div>WW: {windowValues[windowPreset].width} / WL: {windowValues[windowPreset].center}</div>
                <div>ZOOM: {(zoom * 100).toFixed(0)}%</div>
                <div>PRESET: {windowPreset}</div>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">No scan loaded.</p>
          )}
        </div>

        {/* Header Metadata Inspector Drawer */}
        {showMetadataDrawer && scan && (
          <div className="w-80 glass-panel rounded-2xl border border-slate-800 p-4 space-y-4 overflow-y-auto animate-in slide-in-from-right-5">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center justify-between pb-2 border-b border-slate-800">
              <span>Database Metadata</span>
              <Badge variant="cyan" size="sm">Backend Record</Badge>
            </h4>

            <div className="space-y-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Scan Primary ID</span>
                <span className="text-cyan-300 font-semibold">#{scan.id}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Patient Foreign Key ID</span>
                <span className="text-slate-200">#{scan.patientId}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Original Upload Name</span>
                <span className="text-slate-200">{scan.originalFileName}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Modality / Extension</span>
                <span className="text-slate-200">{scan.modality} ({scan.fileType})</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Uploaded Timestamp</span>
                <span className="text-slate-200">{new Date(scan.uploadedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
