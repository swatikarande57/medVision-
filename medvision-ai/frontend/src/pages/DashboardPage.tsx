import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BrainCircuit,
  Clock,
  AlertTriangle,
  Upload,
  Eye,
  Activity,
  ShieldCheck,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Skeleton } from '../components/ui/Skeleton';
import { dashboardApi } from '../api/dashboardApi';
import { scanApi } from '../api/scanApi';
import { getErrorMessage } from '../api/client';
import type { DashboardSummaryResponse, ScanResponse } from '../types/api';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [scans, setScans] = useState<ScanResponse[]>([]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, scansData] = await Promise.all([
        dashboardApi.getSummary(),
        scanApi.getAllScans()
      ]);
      setSummary(sumData);
      setScans(scansData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            Clinical Telemetry Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time PACS DICOM scan ingestion, AI inference queue metrics, and patient activity stream.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Users className="w-4 h-4 text-cyan-400" />}
            onClick={() => navigate('/patients')}
          >
            Patient Directory
          </Button>
          <Button
            variant="glow"
            size="sm"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => navigate('/upload')}
          >
            Ingest DICOM Scan
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
            <Button size="sm" variant="outline" onClick={loadDashboardData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* 4 Metric Telemetry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Patients */}
        <Card className="border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
            <Badge variant="cyan" size="sm">PATIENTS</Badge>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-8 w-20 bg-slate-800" />
            ) : (
              <span className="text-2xl font-black font-mono text-slate-100">{summary?.totalPatients ?? 0}</span>
            )}
            <span className="text-xs text-slate-400 block font-medium mt-0.5">Total Registered Patients</span>
          </div>
        </Card>

        {/* Metric 2: Total Scans */}
        <Card className="border-blue-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-blue-950/80 border border-blue-500/40 text-blue-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <Badge variant="indigo" size="sm">INGESTED</Badge>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-8 w-20 bg-slate-800" />
            ) : (
              <span className="text-2xl font-black font-mono text-slate-100">{summary?.totalScans ?? 0}</span>
            )}
            <span className="text-xs text-slate-400 block font-medium mt-0.5">Scans Ingested</span>
          </div>
        </Card>

        {/* Metric 3: Pending Pipeline */}
        <Card className="border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-400">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <Badge variant="amber" size="sm">IN QUEUE</Badge>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-8 w-16 bg-slate-800" />
            ) : (
              <span className="text-2xl font-black font-mono text-amber-300">{summary?.processingAnalyses ?? 0}</span>
            )}
            <span className="text-xs text-slate-400 block font-medium mt-0.5">Pending AI Pipeline</span>
          </div>
        </Card>

        {/* Metric 4: Review Required */}
        <Card className="border-rose-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <Badge severity="CRITICAL" size="sm">REVIEW</Badge>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-8 w-16 bg-slate-800" />
            ) : (
              <span className="text-2xl font-black font-mono text-rose-300">{summary?.reviewRequired ?? 0}</span>
            )}
            <span className="text-xs text-slate-400 block font-medium mt-0.5">Review Required</span>
          </div>
        </Card>
      </div>

      {/* Scans Table & System Status Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Scans Table */}
        <Card className="lg:col-span-2" hoverEffect={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent DICOM Scans</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => navigate('/patients')}>
                View All Scans
              </Button>
            </div>
          </CardHeader>

          {loading ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
              <p className="text-xs">Loading telemetry records...</p>
            </div>
          ) : scans.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <BrainCircuit className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No DICOM scans ingested yet</p>
              <p className="text-xs text-slate-500">Upload a scan from the PACS ingest module to see real telemetry.</p>
              <Button size="sm" variant="glow" onClick={() => navigate('/upload')} leftIcon={<Upload className="w-4 h-4" />}>
                Upload First Scan
              </Button>
            </div>
          ) : (
            <Table headers={['Scan ID & Modality', 'Original Filename', 'Status', 'Uploaded At', 'Action']}>
              {scans.slice(0, 6).map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-100">#SCAN-{scan.id}</span>
                      <span className="text-xs text-cyan-400 font-mono">{scan.modality} ({scan.fileType})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-300 font-mono">{scan.originalFileName}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={scan.status === 'UPLOADED' ? 'cyan' : scan.status === 'PROCESSING' ? 'amber' : scan.status === 'ANALYZED' ? 'emerald' : 'rose'}>
                      {scan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 font-mono">
                    {new Date(scan.uploadedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => navigate(`/analysis/scan/${scan.id}`)}
                    >
                      Viewer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </Card>

        {/* Right 1 Col: PACS & API Telemetry Status */}
        <Card hoverEffect={false}>
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> System Integration Status
            </CardTitle>
            <CardDescription>Active Spring Boot REST API & MySQL data stream connection.</CardDescription>
          </CardHeader>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-emerald-400 font-bold">DATABASE CONNECTED</span>
                <span className="text-slate-500">MySQL 8.0</span>
              </div>
              <p className="text-slate-400">Patient, Scan, and Analysis schemas loaded with zero mock data.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-cyan-400 font-bold">REST API PIPELINE</span>
                <span className="text-slate-500">JWT Security</span>
              </div>
              <p className="text-slate-400">Bearer tokens active on all protected clinical routes.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-amber-400 font-bold">AI INFERENCE ENGINE</span>
                <span className="text-slate-500">Pipeline Pending</span>
              </div>
              <p className="text-slate-400">PyTorch & MONAI fast API service connection pending.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
