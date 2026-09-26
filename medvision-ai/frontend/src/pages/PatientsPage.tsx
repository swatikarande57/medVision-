import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  UserPlus,
  Eye,
  RefreshCw,
  AlertCircle,
  Loader2,
  Calendar,
  Phone,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { patientApi } from '../api/patientApi';
import { getErrorMessage } from '../api/client';
import type { PatientResponse } from '../types/api';

function calcAge(dob: string | null): string {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} yrs`;
}

function formatDate(isoStr: string | null): string {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();

  // --- Data state ---
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Search / filter ---
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');

  // --- Add Patient Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [newCode, setNewCode] = useState(`PT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newName, setNewName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newGender, setNewGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
  const [newPhone, setNewPhone] = useState('');

  // --- Load patients ---
  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const page = await patientApi.getPatients(0, 100);
      setPatients(page.content);
      setTotalCount(page.totalElements);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPatients();
  }, [loadPatients]);

  // --- Client-side filter (search + gender) ---
  const filtered = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.patientCode.toLowerCase().includes(q) ||
      (p.phone ?? '').toLowerCase().includes(q);
    const matchesGender = genderFilter === 'ALL' || p.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  // --- Create patient ---
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;
    setIsSaving(true);
    setSaveError('');
    try {
      const created = await patientApi.createPatient({
        patientCode: newCode,
        fullName: newName,
        dateOfBirth: newDob || null,
        gender: newGender,
        phone: newPhone || null,
      });
      setPatients([created, ...patients]);
      setTotalCount((t) => t + 1);
      setIsModalOpen(false);
      setNewName('');
      setNewDob('');
      setNewPhone('');
      setNewCode(`PT-${Math.floor(1000 + Math.random() * 9000)}`);
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            Patient Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isLoading ? 'Loading…' : `${totalCount} patients registered — backed by MySQL`}
          </p>
        </div>
        <Button
          variant="glow"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Register New Patient
        </Button>
      </div>

      {/* Search & Filter */}
      <Card hoverEffect={false}>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search by name, patient code, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Genders' },
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
          </div>
          <Button variant="outline" size="sm" onClick={loadPatients} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card hoverEffect={false}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-sm text-slate-400">Loading patient records from database…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <div className="text-center">
              <p className="text-sm text-rose-300 font-medium">{error}</p>
              <p className="text-xs text-slate-500 mt-1">Ensure Spring Boot is running on port 8080</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadPatients} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Users className="w-10 h-10 text-slate-600" />
            <p className="text-sm text-slate-400 font-medium">
              {searchQuery ? `No patients matching "${searchQuery}"` : 'No patients registered yet.'}
            </p>
            {!searchQuery && (
              <Button variant="glow" size="sm" leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
                Register First Patient
              </Button>
            )}
          </div>
        ) : (
          <Table headers={['Patient', 'Date of Birth / Age', 'Gender', 'Phone', 'Registered', 'Actions']}>
            {filtered.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {patient.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-100">{patient.fullName}</span>
                      <span className="text-xs text-cyan-400 font-mono">{patient.patientCode}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-300 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {formatDate(patient.dateOfBirth)} ({calcAge(patient.dateOfBirth)})
                  </div>
                </TableCell>
                <TableCell>
                  {patient.gender ? (
                    <Badge variant={patient.gender === 'MALE' ? 'cyan' : patient.gender === 'FEMALE' ? 'indigo' : 'slate'} size="sm">
                      {patient.gender}
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-500">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    {patient.phone ?? '—'}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-400 font-mono">
                  {formatDate(patient.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </Card>

      {/* Register New Patient Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSaveError(''); }}
        title="Register New Patient Record"
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePatient} className="space-y-4">
          {saveError && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300">
              {saveError}
            </div>
          )}
          <Input
            label="Patient Code (MRN)"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="PT-1234"
            required
          />
          <Input
            label="Full Name"
            placeholder="e.g. Eleanor Vance"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={newDob}
              onChange={(e) => setNewDob(e.target.value)}
            />
            <Select
              label="Gender"
              value={newGender}
              onChange={(e) => setNewGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
              options={[
                { value: 'FEMALE', label: 'Female' },
                { value: 'MALE', label: 'Male' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
          </div>
          <Input
            label="Phone Number"
            placeholder="+1 555 000 0000"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => { setIsModalOpen(false); setSaveError(''); }}>
              Cancel
            </Button>
            <Button type="submit" variant="glow" isLoading={isSaving}>
              Register Patient
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
