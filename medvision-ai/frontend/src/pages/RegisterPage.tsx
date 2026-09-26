import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { authApi } from '../api/authApi';
import { authService } from '../services/authService';
import { getErrorMessage } from '../api/client';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'DOCTOR' | 'ADMIN'>('DOCTOR');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const authResponse = await authApi.register({ fullName, email, password, role });
      authService.setToken(authResponse.token);
      authService.setUser(authResponse.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-900/20 via-blue-900/10 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 my-8">
        <div className="text-center mb-6 space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/25 mb-2">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Register Clinical User</h2>
          <p className="text-xs text-slate-400">Join the MedVision AI radiology &amp; medical imaging network</p>
        </div>

        <Card className="border-slate-800 shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300">
                {error}
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. Alexander Wright, MD"
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alexander.wright@hospital.org"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label="Password (min. 8 chars, letters + numbers)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              required
            />

            <Select
              label="Clinical Role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'DOCTOR' | 'ADMIN')}
              options={[
                { value: 'DOCTOR', label: 'Doctor / Radiologist' },
                { value: 'ADMIN', label: 'System Admin / PACS Manager' },
              ]}
            />

            <Button
              type="submit"
              variant="glow"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Medical Account
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="text-cyan-400 hover:underline font-semibold">
              Sign In to Workspace
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
