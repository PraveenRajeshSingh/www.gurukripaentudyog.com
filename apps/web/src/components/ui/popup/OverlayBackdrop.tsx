'use client';

import React from 'react';

interface OverlayBackdropProps {
  onDismiss?: () => void;
  className?: string;
}

/** Shared dimmed backdrop for Modal / Drawer. */
export default function OverlayBackdrop({ onDismiss, className = '' }: OverlayBackdropProps) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label="Dismiss dialog"
      className={`absolute inset-0 border-0 cursor-default ${className}`}
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(200,70,10,0.18), transparent 55%), rgba(28,16,9,0.58)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onDismiss}
    />
  );
}
