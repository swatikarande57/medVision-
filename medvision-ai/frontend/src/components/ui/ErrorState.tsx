import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load medical records',
  message = 'An unexpected network error occurred while communicating with the MedVision backend.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-xl border border-rose-500/30 bg-rose-950/20">
      <div className="p-3 rounded-full bg-rose-900/40 text-rose-400 mb-3 border border-rose-500/30">
        <AlertOctagon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="text-xs text-slate-300 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="danger" size="sm" leftIcon={<RotateCcw className="w-3.5 h-3.5" />} className="mt-4">
          Retry Request
        </Button>
      )}
    </div>
  );
};
