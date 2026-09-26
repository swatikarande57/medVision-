import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, ArrowRight, ArrowDownRight, ArrowUpRight, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { scanApi } from '../api/scanApi';
import { comparisonApi } from '../api/comparisonApi';
import { getErrorMessage } from '../api/client';
import type { ScanResponse, ComparisonResponse } from '../types/api';

export const ScanComparisonPage: React.FC = () => {
  const [scans, setScans] = useState<ScanResponse[]>([]);
  const [scanAId, setScanAId] = useState<number | null>(null);
  const [scanBId, setScanBId] = useState<number | null>(null);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scanApi.getAllScans();
      setScans(data);
      if (data.length >= 2) {
        setScanAId(data[0].id);
        setScanBId(data[1].id);
      } else if (data.length === 1) {
        setScanAId(data[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchScans();
  }, [fetchScans]);

  const handleGenerateComparison = async () => {
    if (!scanAId || !scanBId || scanAId === scanBId) return;
    setComparing(true);
    setError(null);
    try {
      const result = await comparisonApi.createComparison({
        previousScanId: scanAId,
        currentScanId: scanBId
      });
      setComparison(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setComparing(false);
    }
  };

  const scanA = scans.find((s) => s.id === scanAId);
  const scanB = scans.find((s) => s.id === scanBId);

  const getScanFileUrl = (id: number) => {
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/scans/${id}/file`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            Longitudinal DICOM Scan Comparison
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            AI-assisted longitudinal trend analysis comparing baseline and follow-up medical scans to track disease progression.
          </p>
        </div>

        {scanAId && scanBId && scanAId !== scanBId && (
          <Button
            variant="glow"
            size="sm"
            isLoading={comparing}
            onClick={handleGenerateComparison}
          >
            Compute Progression Delta
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-rose-500/40 bg-rose-950/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-rose-300">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-medium">{error}</span>
            </div>
            <Button size="sm" variant="outline" onClick={fetchScans} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-12 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
          <p className="text-xs">Loading DICOM scan inventory for longitudinal analysis...</p>
        </Card>
      ) : scans.length < 2 ? (
        <Card className="p-12 text-center text-slate-400 space-y-3">
          <AlertTriangle className="w-10 h-10 mx-auto text-amber-400" />
          <p className="text-sm font-semibold text-slate-200">Insufficient Scans For Longitudinal Comparison</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            At least 2 DICOM scans are required to compute baseline vs follow-up progression metrics. Currently {scans.length} scan(s) present in database.
          </p>
        </Card>
      ) : (
        <>
          {/* Delta Metric Analysis Card */}
          {comparison ? (
            <Card className="border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 text-[10px] font-mono mb-1 border border-cyan-500/30">
                      AI-assisted longitudinal trend analysis
                    </div>
                    <h3 className="text-base font-semibold text-slate-100">Lesion Volume Progression Delta</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{comparison.interpretation || 'Automated delta calculation'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 font-mono">
                  <div className="text-center">
                    <div className="text-xs text-slate-400 font-sans">Baseline Area</div>
                    <div className="text-xl font-bold text-slate-200">
                      {comparison.previousAffectedArea != null ? `${comparison.previousAffectedArea.toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-slate-600" />

                  <div className="text-center">
                    <div className="text-xs text-slate-400 font-sans">Follow-up Area</div>
                    <div className="text-xl font-bold text-cyan-400">
                      {comparison.currentAffectedArea != null ? `${comparison.currentAffectedArea.toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>

                  <div className="h-8 w-px bg-slate-800" />

                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-sans">Net Change</div>
                    <div className={`text-xl font-bold flex items-center gap-1 ${
                      (comparison.percentageChange || 0) <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {(comparison.percentageChange || 0) <= 0 ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      {comparison.percentageChange != null ? `${comparison.percentageChange.toFixed(1)}%` : '0.0%'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4 bg-slate-900/60 border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                Select two distinct scans below and click "Compute Progression Delta" to view AI longitudinal analytics.
              </p>
            </Card>
          )}

          {/* Side-by-Side Dual Viewport Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Viewport: Scan A (Baseline) */}
            <Card className="flex flex-col space-y-4">
              <CardHeader>
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="cyan">PRIMARY BASELINE</Badge>
                    {scanA && <span className="text-xs font-mono text-slate-400">{new Date(scanA.uploadedAt).toLocaleDateString()}</span>}
                  </div>
                  <Select
                    value={scanAId?.toString() || ''}
                    onChange={(e) => setScanAId(Number(e.target.value))}
                    options={scans.map((s) => ({
                      value: s.id.toString(),
                      label: `Scan #${s.id} - ${s.originalFileName} (${s.modality})`,
                    }))}
                  />
                </div>
              </CardHeader>

              {scanA && (
                <div className="relative w-full h-[360px] bg-black rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                  <img src={getScanFileUrl(scanA.id)} alt="Scan Baseline" className="max-h-full max-w-full object-contain" />
                  <div className="absolute top-3 left-3 text-[11px] font-mono text-cyan-400 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800">
                    Baseline Scan #{scanA.id} • {scanA.modality}
                  </div>
                </div>
              )}
            </Card>

            {/* Right Viewport: Scan B (Follow-up) */}
            <Card className="flex flex-col space-y-4">
              <CardHeader>
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="emerald">CURRENT FOLLOW-UP</Badge>
                    {scanB && <span className="text-xs font-mono text-slate-400">{new Date(scanB.uploadedAt).toLocaleDateString()}</span>}
                  </div>
                  <Select
                    value={scanBId?.toString() || ''}
                    onChange={(e) => setScanBId(Number(e.target.value))}
                    options={scans.map((s) => ({
                      value: s.id.toString(),
                      label: `Scan #${s.id} - ${s.originalFileName} (${s.modality})`,
                    }))}
                  />
                </div>
              </CardHeader>

              {scanB && (
                <div className="relative w-full h-[360px] bg-black rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                  <img src={getScanFileUrl(scanB.id)} alt="Scan Follow-up" className="max-h-full max-w-full object-contain" />
                  <div className="absolute top-3 left-3 text-[11px] font-mono text-emerald-400 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800">
                    Follow-up Scan #{scanB.id} • {scanB.modality}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
