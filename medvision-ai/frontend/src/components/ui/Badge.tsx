import React from 'react';
import { Severity } from '../../types/medical';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo';
  severity?: Severity;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  severity,
  size = 'md',
  pulse = false,
  className = '',
}) => {
  let resolvedVariant = variant || 'slate';

  if (severity) {
    switch (severity) {
      case 'NORMAL':
        resolvedVariant = 'emerald';
        break;
      case 'LOW':
        resolvedVariant = 'cyan';
        break;
      case 'MODERATE':
        resolvedVariant = 'amber';
        break;
      case 'CRITICAL':
        resolvedVariant = 'rose';
        break;
    }
  }

  const variantStyles = {
    cyan: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40',
    emerald: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40',
    amber: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
    rose: 'bg-rose-950/70 text-rose-300 border-rose-500/40',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700',
    indigo: 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border tracking-wide uppercase ${sizeStyles[size]} ${variantStyles[resolvedVariant]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            resolvedVariant === 'rose' ? 'bg-rose-400' : 'bg-cyan-400'
          }`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            resolvedVariant === 'rose' ? 'bg-rose-500' : 'bg-cyan-500'
          }`} />
        </span>
      )}
      {children}
    </span>
  );
};
