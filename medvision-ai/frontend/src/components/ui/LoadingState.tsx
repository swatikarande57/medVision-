import React from 'react';
import { Activity } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Processing AI Analysis...',
  subtext = 'Running deep neural network model inference across DICOM slices',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <Activity className="w-6 h-6 text-cyan-400 absolute animate-pulse" />
      </div>
      <h4 className="text-base font-semibold text-slate-100">{message}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{subtext}</p>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="w-full space-y-3 p-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-10 w-full bg-slate-900/60 rounded-lg animate-pulse" />
    ))}
  </div>
);
