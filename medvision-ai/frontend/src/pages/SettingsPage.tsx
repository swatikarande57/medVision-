import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Building,
  Lock,
  Cpu,
  ShieldCheck,
  Save,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import { authApi } from '../api/authApi';
import { authService } from '../services/authService';
import { getErrorMessage } from '../api/client';
import type { UserResponse } from '../types/api';

export const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<UserResponse | null>(authService.getUser());
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'pacs' | 'ai' | 'security'>('profile');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // PACS Node State
  const [aeTitle, setAeTitle] = useState('MEDVISION_PACS_01');
  const [pacsHost, setPacsHost] = useState('127.0.0.1');
  const [pacsPort, setPacsPort] = useState('104');

  // AI Model State
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.75);
  const [useGpuAcceleration, setUseGpuAcceleration] = useState(true);

  const loadUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      authService.setUser(currentUser);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUserProfile();
  }, [loadUserProfile]);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            System & PACS Configuration
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            PACS DICOM network nodes, AI model sensitivity parameters, and JWT session security.
          </p>
        </div>

        <Button
          variant="glow"
          size="sm"
          leftIcon={<Save className="w-4 h-4" />}
          onClick={handleSave}
        >
          {savedSuccess ? 'Settings Saved!' : 'Save Configurations'}
        </Button>
      </div>

      {error && (
        <Card className="border-rose-500/40 bg-rose-950/20 p-4">
          <div className="flex items-center gap-3 text-rose-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        </Card>
      )}

      {/* Tabs Toolbar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'profile', label: 'User Profile', icon: User },
          { id: 'pacs', label: 'PACS DICOM Node', icon: Building },
          { id: 'ai', label: 'AI Model Sensitivity', icon: Cpu },
          { id: 'security', label: 'JWT & Security', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs transition-all ${
                isActive
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10 font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Authenticated User Profile</CardTitle>
            <CardDescription>Personal details and role authorization loaded from Spring Boot security context.</CardDescription>
          </CardHeader>
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
              <p className="text-xs">Fetching user metadata from GET /api/auth/me...</p>
            </div>
          ) : user ? (
            <div className="space-y-4 max-w-xl">
              <Input label="Full Name" value={user.fullName} readOnly />
              <Input label="Email Address" value={user.email} readOnly />
              <Input label="Assigned Role" value={user.role} readOnly />
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 font-mono">
                User ID: #{user.id} • Account Status: ACTIVE
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">User profile not available. Please sign in again.</p>
          )}
        </Card>
      )}

      {/* Tab 2: PACS DICOM Node */}
      {activeTab === 'pacs' && (
        <Card>
          <CardHeader>
            <CardTitle>PACS DICOM Web Node Integration</CardTitle>
            <CardDescription>WADO-RS / C-STORE PACS server node settings.</CardDescription>
          </CardHeader>
          <div className="space-y-4 max-w-xl">
            <Input label="Application Entity Title (AE Title)" value={aeTitle} onChange={(e) => setAeTitle(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="PACS Host IP" value={pacsHost} onChange={(e) => setPacsHost(e.target.value)} />
              <Input label="DICOM Port" value={pacsPort} onChange={(e) => setPacsPort(e.target.value)} />
            </div>
            <Input label="WADO-RS Endpoint URL" defaultValue="http://127.0.0.1:8080/dicom-web" />
          </div>
        </Card>
      )}

      {/* Tab 3: AI Model Sensitivity */}
      {activeTab === 'ai' && (
        <Card>
          <CardHeader>
            <CardTitle>AI Model Inference Parameters</CardTitle>
            <CardDescription>Adjust neural network confidence thresholds and hardware GPU settings.</CardDescription>
          </CardHeader>
          <div className="space-y-6 max-w-xl">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-200 mb-2">
                <span>Minimum Anomaly Confidence Cutoff:</span>
                <span className="text-cyan-400 font-mono">{(confidenceThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <Toggle
                checked={useGpuAcceleration}
                onChange={setUseGpuAcceleration}
                label="CUDA GPU Acceleration (PyTorch / MONAI)"
                description="Enable GPU tensor processing for fast inference execution"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: JWT & Security */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Spring Security & JWT Controls</CardTitle>
            <CardDescription>Role-based authorization and session expiration settings.</CardDescription>
          </CardHeader>
          <div className="space-y-4 max-w-xl">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs space-y-1">
              <div className="font-bold text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> BCrypt & JWT Authentication Active
              </div>
              <p className="text-slate-400">Tokens expire every 24 hours. Auth endpoints protected with Spring Security filters.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
