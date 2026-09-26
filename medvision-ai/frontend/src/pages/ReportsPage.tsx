import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Printer,
  Eye,
  Search,
  FileSignature,
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { reportApi } from '../api/reportApi';
import { getErrorMessage } from '../api/client';
import type { ReportResponse } from '../types/api';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportResponse | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportApi.getAllReports();
      setReports(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const filteredReports = reports.filter(
    (r) =>
      r.id.toString().includes(searchQuery) ||
      r.patientId.toString().includes(searchQuery) ||
      r.scanId.toString().includes(searchQuery)
  );

  const handleOpenPreview = (report: ReportResponse) => {
    setSelectedReport(report);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            Diagnostic Radiology Reports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured clinical radiology reports generated from completed AI analysis records.
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-rose-500/40 bg-rose-950/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-rose-300">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-medium">{error}</span>
            </div>
            <Button size="sm" variant="outline" onClick={fetchReports} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Search Toolbar */}
      <Card hoverEffect={false}>
        <Input
          placeholder="Search reports by Report ID, Patient ID, or Scan ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
        />
      </Card>

      {/* Reports Directory Table */}
      <Card hoverEffect={false}>
        {loading ? (
          <div className="p-8 text-center text-slate-400 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
            <p className="text-xs">Fetching clinical diagnostic reports from database...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-3">
            <FileText className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No radiology reports found</p>
            <p className="text-xs text-slate-500">Reports are automatically compiled when an AI analysis completes.</p>
          </div>
        ) : (
          <Table headers={['Report ID & Date', 'Patient ID', 'Associated Scan ID', 'Analysis Ref', 'Actions']}>
            {filteredReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-100">#REPORT-{report.id}</span>
                    <span className="text-xs text-slate-400 font-mono">{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-cyan-400">Patient #{report.patientId}</span>
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-300">
                  Scan #{report.scanId}
                </TableCell>
                <TableCell>
                  {report.analysisId ? (
                    <Badge variant="emerald">Analysis #{report.analysisId}</Badge>
                  ) : (
                    <Badge variant="amber">Pending Analysis</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenPreview(report)}
                  >
                    View Report DTO
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </Card>

      {/* PDF Structured Preview Modal */}
      {selectedReport && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Diagnostic Report — #REPORT-${selectedReport.id}`}
          maxWidth="2xl"
        >
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6 text-slate-200 text-xs">
            {/* Report Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-100">MEDVISION AI RADIOLOGY REPORT</h3>
                  <span className="text-[10px] text-cyan-400 font-mono">OFFICIAL HEALTHCARE DATABASE DOCUMENT</span>
                </div>
              </div>
              <div className="text-right text-[10px] font-mono text-slate-400">
                <div>CREATED: {new Date(selectedReport.createdAt).toLocaleString()}</div>
                <div>STATUS: RECORDED</div>
              </div>
            </div>

            {/* Patient & Study Info */}
            <div className="grid grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block">PATIENT ID:</span>
                <span className="text-slate-100 font-bold">#{selectedReport.patientId}</span>
              </div>
              <div>
                <span className="text-slate-400 block">SCAN STUDY ID:</span>
                <span className="text-cyan-400 font-bold">#{selectedReport.scanId}</span>
              </div>
            </div>

            {/* Report File Path */}
            <div className="space-y-2">
              <h4 className="font-bold text-cyan-300">REPORT DOCUMENT REFERENCE:</h4>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-slate-300">
                {selectedReport.reportPath || 'PDF report generated in database'}
              </div>
            </div>

            {/* Electronic Radiologist Signature Box */}
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSignature className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-bold text-emerald-300">ATTENDING RADIOLOGIST</div>
                  <div className="text-[10px] text-slate-400 font-mono">ELECTRONIC RECORD SHA-256 VERIFIED</div>
                </div>
              </div>
              <Badge variant="emerald" size="sm">DATABASE RECORDED</Badge>
            </div>

            {/* Export Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Print Document
              </Button>
              <Button
                variant="glow"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => alert(`Downloading Report #${selectedReport.id}...`)}
              >
                Download Report
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
