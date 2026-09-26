import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Eye,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  FileCheck2,
  Lock,
  ArrowRight,
  Database,
  Cpu,
  CheckCircle2,
  Sparkles,
  GitCompare,
  Building
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Medical3DObject } from '../components/landing/Medical3DObject';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BrainCircuit,
      title: '3D Neural Segmentation',
      desc: 'Sub-millimeter volumetric lesion boundary estimation for Glioblastomas, Pulmonary Nodules, and Spinal Degeneration.',
      badge: '98.4% Accuracy',
    },
    {
      icon: Eye,
      title: 'PACS-Native DICOM Viewer',
      desc: 'Multiplanar reconstruction (Axial, Sagittal, Coronal) with windowing presets for Brain, Bone, Lung, and Soft Tissue.',
      badge: 'DICOM 3.0 Compatible',
    },
    {
      icon: GitCompare,
      title: 'Longitudinal Trend Analysis',
      desc: 'Automated temporal volume progression tracking across historical scan series to quantify treatment response.',
      badge: 'Delta Calculation',
    },
    {
      icon: ShieldCheck,
      title: 'HIPAA & GDPR Compliance',
      desc: 'End-to-end AES-256 encryption at rest, Spring Security JWT role-based access control, and full audit logging.',
      badge: 'Enterprise Security',
    },
  ];

  const workflowSteps = [
    { step: '01', title: 'DICOM Ingestion', desc: 'Drag-and-drop PACS scan files or connect via WADO-RS DICOM Web node.' },
    { step: '02', title: 'Neural Preprocessing', desc: 'Automatic intensity normalization, skull stripping, and slice alignment.' },
    { step: '03', title: 'Deep Learning Inference', desc: 'PyTorch UNet3D tensor processing with real-time heatmap segmentation overlays.' },
    { step: '04', title: 'Radiologist Sign-Off', desc: 'Interactive verification dashboard for clinical review, annotation, and electronic signature.' },
  ];

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      {/* Top Floating Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-6 lg:px-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-wider text-slate-100 uppercase">
              MED<span className="text-cyan-400">VISION</span> AI
            </span>
            <span className="text-[10px] text-cyan-400 block font-mono tracking-widest">
              NEXT-GEN RADIOLOGY PACS
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-cyan-400 transition-colors">Capabilities</a>
          <a href="#workflow" className="hover:text-cyan-400 transition-colors">Workflow</a>
          <a href="#architecture" className="hover:text-cyan-400 transition-colors">Architecture</a>
          <a href="#security" className="hover:text-cyan-400 transition-colors">Compliance</a>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="glow" size="sm" onClick={() => navigate('/dashboard')}>
            Launch Workspace
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 lg:px-16 max-w-7xl mx-auto w-full min-h-[90vh] flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />

        {/* Hero Left Text Column */}
        <div className="flex-1 space-y-8 text-center lg:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI-Powered Medical Imaging & Volumetric Radiomics</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 tracking-tight leading-[1.1]">
            Next-Generation <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400">Neural AI</span> for Diagnostic Radiology
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
            MedVision AI empowers radiologists with real-time 3D lesion segmentation, automated DICOM slice anomaly detection, and longitudinal progression analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <Button
              variant="glow"
              size="lg"
              leftIcon={<BrainCircuit className="w-5 h-5" />}
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-8"
            >
              Enter Clinical Workspace
            </Button>
            <Button
              variant="outline"
              size="lg"
              leftIcon={<Eye className="w-5 h-5 text-cyan-400" />}
              onClick={() => navigate('/viewer/SCAN-1004')}
              className="w-full sm:w-auto px-8"
            >
              Launch DICOM Viewer
            </Button>
          </div>

          {/* Telemetry Stats Bar */}
          <div className="pt-6 grid grid-cols-3 gap-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0 text-left">
            <div>
              <span className="text-2xl font-bold font-mono text-cyan-400">98.4%</span>
              <span className="text-xs text-slate-400 block font-medium">Model Precision</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-slate-100">&lt; 380ms</span>
              <span className="text-xs text-slate-400 block font-medium">Inference Speed</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-emerald-400">100%</span>
              <span className="text-xs text-slate-400 block font-medium">DICOM 3.0 Standard</span>
            </div>
          </div>
        </div>

        {/* Hero Right 3D Medical Canvas Container */}
        <div className="flex-1 w-full max-w-lg h-[450px] relative flex items-center justify-center z-10">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 p-2 shadow-2xl backdrop-blur-xl overflow-hidden">
            {/* Animated Medical Scanline */}
            <div className="animate-scanline z-20" />

            {/* 3D Visual Mesh Canvas */}
            <Medical3DObject />

            {/* Viewport Overlay Telemetry */}
            <div className="absolute top-4 left-4 z-20 text-[10px] font-mono text-cyan-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
              SYSTEM: NEURAL MODEL BRAIN_SEG_V2.4 ONLINE
            </div>
            <div className="absolute bottom-4 right-4 z-20 text-[10px] font-mono text-emerald-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
              PACS CONNECTION: ESTABLISHED
            </div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Section */}
      <section id="features" className="py-24 px-6 lg:px-16 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="cyan" size="md">ENTERPRISE RADIOLOGY</Badge>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Engineered for Precision Medical Diagnostics
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Full-stack medical AI architecture combining zero-footprint web PACS rendering with deep learning segmentation pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card key={i} className="flex flex-col justify-between space-y-4 hover:border-cyan-500/50 transition-all">
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400 w-fit">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
                <Badge variant="cyan" size="sm" className="w-fit">{f.badge}</Badge>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 px-6 lg:px-16 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="emerald" size="md">SEAMLESS CLINICAL WORKFLOW</Badge>
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              From PACS Ingestion to Radiologist Sign-Off
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((ws, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 relative">
                <span className="text-3xl font-black font-mono text-cyan-500/30">{ws.step}</span>
                <h4 className="text-sm font-bold text-slate-100">{ws.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{ws.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology & Architecture Section */}
      <section id="architecture" className="py-24 px-6 lg:px-16 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="indigo" size="md">FULL-STACK STACK ARCHITECTURE</Badge>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Robust Enterprise Platform Stack
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                <Database className="w-5 h-5" /> Spring Boot Backend
              </CardTitle>
              <CardDescription>Java 21 • Spring Security • JWT • MySQL</CardDescription>
            </CardHeader>
            <p className="text-xs text-slate-300 leading-relaxed">
              Provides robust REST APIs, role-based authorization for DOCTOR/ADMIN users, DICOM metadata persistence, and transactional patient record management.
            </p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-400 flex items-center gap-2">
                <Cpu className="w-5 h-5" /> Python FastAPI Inference Engine
              </CardTitle>
              <CardDescription>PyTorch • CUDA • UNet3D Model Engine</CardDescription>
            </CardHeader>
            <p className="text-xs text-slate-300 leading-relaxed">
              Executes high-throughput GPU-accelerated volumetric tensor inferences, slice feature extraction, and coordinate bounding box generation.
            </p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-emerald-400 flex items-center gap-2">
                <Layers className="w-5 h-5" /> React 18 Web PACS Client
              </CardTitle>
              <CardDescription>TypeScript • Vite • Tailwind CSS • Three Fiber</CardDescription>
            </CardHeader>
            <p className="text-xs text-slate-300 leading-relaxed">
              Delivers zero-footprint web DICOM slice rendering, multiplanar reconstruction, interactive heatmap overlays, and longitudinal scan comparisons.
            </p>
          </Card>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-12 px-6 lg:px-16 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-slate-100 text-sm tracking-wide">MEDVISION AI PLATFORM</span>
            </div>
            <p className="max-w-sm text-slate-500">
              Medical Artificial Intelligence & Volumetric DICOM Radiomics Software Platform. Designed for clinical radiology assistance.
            </p>
          </div>

          <div className="flex flex-wrap gap-12 text-slate-300">
            <div>
              <h4 className="font-bold text-slate-100 mb-2">Modules</h4>
              <ul className="space-y-1">
                <li><a href="/dashboard" className="hover:text-cyan-400">Dashboard</a></li>
                <li><a href="/patients" className="hover:text-cyan-400">Patients</a></li>
                <li><a href="/upload" className="hover:text-cyan-400">Ingest Scan</a></li>
                <li><a href="/viewer/SCAN-1004" className="hover:text-cyan-400">DICOM Viewer</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-100 mb-2">Compliance</h4>
              <ul className="space-y-1">
                <li className="text-slate-500">HIPAA Compliant</li>
                <li className="text-slate-500">GDPR Ready</li>
                <li className="text-slate-500">DICOM 3.0 Standard</li>
                <li className="text-slate-500">FDA SaMD Guidance</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <span>© 2026 MedVision AI Inc. All rights reserved.</span>
          <span>Disclaimer: AI inferences are intended for clinical decision support and require radiologist verification.</span>
        </div>
      </footer>
    </div>
  );
};
