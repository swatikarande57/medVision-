import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`bg-slate-800/60 animate-pulse rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
};
