import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Upload,
  User,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Breadcrumb } from '../ui/Breadcrumb';
import { authService } from '../../services/authService';

interface TopNavProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  sidebarCollapsed,
  onMobileMenuToggle,
}) => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const fullName = user?.fullName || 'Radiologist User';
  const email = user?.email || 'radiologist@medvision.ai';
  const role = user?.role || 'DOCTOR';

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    {
      id: '1',
      title: 'High-Priority Anomaly Detected',
      desc: 'Patient P-1004 (Sarah Connor) - Glioblastoma 94.2% confidence',
      time: '2 mins ago',
      unread: true,
      type: 'critical',
    },
    {
      id: '2',
      title: 'PACS Ingestion Complete',
      desc: 'DICOM Study SCAN-1003 successfully indexed',
      time: '14 mins ago',
      unread: true,
      type: 'info',
    },
    {
      id: '3',
      title: 'Report Signed',
      desc: 'Dr. Sarah Jenkins signed Diagnostic Report #REP-904',
      time: '1 hour ago',
      unread: false,
      type: 'success',
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/patients?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all duration-300 flex items-center justify-between px-6 ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left Area: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-4">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-900 border border-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <Breadcrumb />
        </div>
      </div>

      {/* Middle Area: Global PACS Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 w-80 focus-within:border-cyan-500/50 transition-colors shadow-inner"
      >
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search patient MRN, name, or DICOM study..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-full font-mono"
        />
        <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
          ⌘K
        </kbd>
      </form>

      {/* Right Area: Actions, Notifications & Profile Drawer */}
      <div className="flex items-center gap-3">
        {/* Quick Ingest Scan CTA Button */}
        <Button
          size="sm"
          variant="glow"
          leftIcon={<Upload className="w-3.5 h-3.5" />}
          onClick={() => navigate('/upload')}
          className="hidden sm:inline-flex"
        >
          Ingest Scan
        </Button>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-900 border border-slate-800 transition-colors relative"
            title="PACS Live Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
          </button>

          {/* Notifications Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel rounded-2xl border border-slate-800 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-100">PACS Real-Time Alerts</span>
                  <Badge variant="cyan" size="sm">3 NEW</Badge>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 space-y-2 max-h-80 overflow-y-auto">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/analysis/1');
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      item.unread
                        ? 'bg-slate-900/80 border-cyan-500/30'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-slate-100">{item.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-tight">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Drawer Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center">
              {fullName.charAt(0)}
            </div>
            <span className="hidden md:inline-block text-xs font-semibold text-slate-200">
              {fullName.split(' ')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 glass-panel rounded-2xl border border-slate-800 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="p-3 border-b border-slate-800">
                <p className="text-xs font-bold text-slate-100">{fullName}</p>
                <p className="text-[10px] text-slate-400 font-mono">{email}</p>
                <Badge variant="cyan" size="sm" className="mt-2">
                  {role} ROLE
                </Badge>
              </div>

              <div className="py-1 space-y-1 text-xs">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-900 hover:text-cyan-400 transition-colors"
                >
                  <User className="w-4 h-4" /> Profile & PACS Config
                </button>
                <button
                  onClick={() => {
                    authService.clearAuth();
                    window.location.href = '/login';
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 transition-colors font-medium"
                >
                  Log Out Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
