'use client';

import React from 'react';
import BrandLogo from './BrandLogo';

interface PageLoaderProps {
  label?: string;
  /** full = fills main content area; inline = compact block; overlay = covers viewport */
  variant?: 'full' | 'inline' | 'overlay';
}

/**
 * Branded page loader — kiln brick stack animation + logo.
 * Respects prefers-reduced-motion via CSS.
 */
export default function PageLoader({
  label = 'Loading…',
  variant = 'full',
}: PageLoaderProps) {
  const shell =
    variant === 'overlay'
      ? 'fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-surface-bg/92 backdrop-blur-sm px-6'
      : variant === 'inline'
        ? 'flex flex-col items-center justify-center gap-4 py-10 px-4'
        : 'min-h-[50vh] flex flex-col items-center justify-center gap-5 px-4 py-16';

  return (
    <div className={shell} role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <div className="relative flex flex-col items-center">
        <div className="brand-loader-glow absolute inset-0 rounded-full blur-2xl opacity-40 pointer-events-none" aria-hidden />
        <BrandLogo size={64} className="relative z-[1] shadow-hover" />
        <div className="brand-loader-bricks mt-5" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>
      <p className="text-sm font-semibold text-ink-secondary tracking-wide">{label}</p>
      <span className="sr-only">{label}</span>
    </div>
  );
}
