import React from 'react';
import PageLoader from './PageLoader';

interface SkeletonProps {
  className?: string;
}

/** Lightweight placeholder for list / card loading. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={['animate-pulse rounded-md bg-surface-muted', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  );
}

/** Route-level loading — branded kiln loader for web & mobile WebViews. */
export function PageSkeleton({ label = 'Loading Gurukripa…' }: { label?: string }) {
  return <PageLoader label={label} variant="full" />;
}

/** Compact skeleton grid for dashboard panels. */
export function PanelSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-16 w-2/3 rounded-xl" />
    </div>
  );
}
