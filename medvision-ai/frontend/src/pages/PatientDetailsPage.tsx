import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Calendar, BrainCircuit, Eye, Upload, ChevronLeft,
  Activity, Loader2, AlertCircle, RefreshCw, Phone, Hash,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { patientApi } from '../api/patientApi';
import { scanApi } from '../api/scanApi';
import { getErrorMessage } from '../api/client';
import type { PatientResponse, ScanResponse } from '../types/api';

function formatDate(isoStr: string | null): string {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function calcAge(dob: string | null): string {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} yrs`;
}

const STATUS_BADGE: Record<string, 'UPLOADED' | 'ANALYZING' | 'COMPLETE' | 'FAILED'> = {
  UPLOADED: 'UPLOADED',
  PROCESSING: 'ANALYZING',
  ANALYZED: 'COMPLETE',
  FAILED: 'FAILED',
};

export const PatientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [scans, setScans] = useState<ScanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const [p, s] = await Promise.all([
        patientApi.getPatientById(Number(id)),
        scanApi.getScansByPatient(Number(id)),
      ]);
      setPatient(p);
      setScans(s);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-sm text-slate-400">Loading patient record…</span>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-rose-400" />
        <p className="text-sm text-rose-300">{error || 'Patient not found.'}</p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={load} leftIcon={<RefreshCw className="w-4 h-4" />}>Retry</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/patients')} leftIcon={<ChevronLeft className="w-4 h-4" />}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" leftIcon={<ChevronLeft className="w-4 h-4" />} onClick={() => navigate('/patients')}>
            Back to Directory
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{patient.fullName}</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {patient.patientCode} • Registered: {formatDate(patient.createdAt)}
            </p>
          </div>
        </div>
        <Button variant="glow" size="sm" leftIcon={<Upload className="w-4 h-4" />} onClick={() => navigate('/upload')}>
          Upload New Scan
        </Button>
      </div>

      {/* Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2"><User className="w-4 h-4" /> Patient Profile</CardTitle>
          </CardHeader>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Age / Gender:</span>
              <span className="text-slate-100">{calcAge(patient.dateOfBirth)} / {patient.gender ?? '—'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Date of Birth:</span>
              <span className="text-slate-100">{formatDate(patient.dateOfBirth)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Phone:</span>
              <span className="text-slate-100">{patient.phone ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Scans:</span>
              <span className="text-cyan-400 font-bold">{scans.length} Studies</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2"><Hash className="w-4 h-4" /> Record IDs</CardTitle>
          </CardHeader>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Patient Code:</span>
              <span className="text-cyan-300">{patient.patientCode}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">DB ID:</span>
              <span className="text-slate-300">{patient.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Updated:</span>
              <span className="text-slate-300">{formatDate(patient.updatedAt)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-emerald-400 flex items-center gap-2"><Activity className="w-4 h-4" /> Imaging Activity</CardTitle>
          </CardHeader>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Total Scans:</span>
              <span className="text-emerald-400 font-bold">{scans.length}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Analyzed:</span>
              <span className="text-slate-300">{scans.filter(s => s.status === 'ANALYZED').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Latest Scan:</span>
              <span className="text-slate-300">{scans.length > 0 ? formatDate(scans[0].uploadedAt) : '—'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Scan History */}
      <Card hoverEffect={false}>
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
          <CardDescription>All DICOM / imaging studies uploaded for this patient from MySQL.</CardDescription>
        </CardHeader>

        {scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <FileText className="w-10 h-10 text-slate-600" />
            <p className="text-sm text-slate-400">No scans uploaded for this patient yet.</p>
            <Button variant="glow" size="sm" leftIcon={<Upload className="w-4 h-4" />} onClick={() => navigate('/upload')}>
              Upload First Scan
            </Button>
          </div>
        ) : (
          <Table headers={['Scan File', 'Modality', 'File Type', 'Status', 'Uploaded', 'Actions']}>
            {scans.map((scan) => (
              <TableRow key={scan.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-100 text-sm">{scan.originalFileName}</span>
                    <span className="text-xs text-cyan-400 font-mono">ID: {scan.id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="cyan" size="sm">{scan.modality}</Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-300 font-mono">{scan.fileType}</TableCell>
                <TableCell>
                  <Badge
                    variant={scan.status === 'ANALYZED' ? 'emerald' : scan.status === 'PROCESSING' ? 'amber' : scan.status === 'FAILED' ? 'rose' : 'slate'}
                    size="sm"
                    pulse={scan.status === 'PROCESSING'}
                  >
                    {scan.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-400 font-mono">{formatDate(scan.uploadedAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" leftIcon={<Eye className="w-3.5 h-3.5" />} onClick={() => navigate(`/viewer/${scan.id}`)}>
                      Viewer
                    </Button>
                    {scan.status === 'ANALYZED' && (
                      <Button size="sm" variant="glow" leftIcon={<BrainCircuit className="w-3.5 h-3.5" />} onClick={() => navigate(`/analysis/${scan.id}`)}>
                        AI Report
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
};
