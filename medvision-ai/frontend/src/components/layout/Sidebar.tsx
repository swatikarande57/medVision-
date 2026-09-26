import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Upload,
  BrainCircuit,
  Eye,
  GitCompare,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LogOut,
  X
} from 'lucide-react';
import { authService } from '../../services/authService';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}) => {
  const location = useLocation();
  const user = authService.getUser();
  const fullName = user?.fullName || 'Radiologist';
  const role = user?.role || 'DOCTOR';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Patient Directory', path: '/patients', icon: Users },
    { label: 'Ingest Scan', path: '/upload', icon: Upload },
    { label: 'AI Inference', path: '/analysis/1', icon: BrainCircuit },
    { label: 'DICOM Viewer', path: '/viewer/1', icon: Eye },
    { label: 'Scan Comparison', path: '/compare', icon: GitCompare },
    { label: 'Diagnostic Reports', path: '/reports', icon: FileText },
    { label: 'PACS & Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    authService.clearAuth();
    window.location.href = '/login';
  };

  const content = (
    <aside
      className={`h-full flex flex-col justify-between bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-100 text-sm tracking-wider uppercase">
                MED<span className="text-cyan-400">VISION</span> AI
              </span>
              <span className="text-[10px] text-cyan-400/80 font-mono tracking-widest">
                PACS SAAS v2.4
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggle}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path.split('/')[1] ? `/${item.path.split('/')[1]}` : item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                }`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}

              {/* Active Glow Bar */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-lg shadow-cyan-400" />
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
            {fullName.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-100 truncate">{fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Logout Session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400/90 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> HIPAA SECURE
            </span>
            <span className="text-slate-500">PROD-OK</span>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-40">
        {content}
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative w-64 max-w-xs z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
