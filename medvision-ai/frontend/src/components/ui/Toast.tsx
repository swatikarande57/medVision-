import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-cyan-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  };

  const borders = {
    success: 'border-emerald-500/40 bg-emerald-950/90',
    error: 'border-rose-500/40 bg-rose-950/90',
    info: 'border-cyan-500/40 bg-cyan-950/90',
    warning: 'border-amber-500/40 bg-amber-950/90',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl text-slate-100 transition-all transform animate-in slide-in-from-bottom-5 ${borders[toast.type]}`}
        >
          <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">{toast.title}</div>
            {toast.message && (
              <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {toast.message}
              </div>
            )}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
