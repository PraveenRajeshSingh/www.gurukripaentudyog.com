'use client';

import React from 'react';
import { Spinner } from './icons';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'whatsapp';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantCls: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-dark shadow-sm disabled:opacity-60',
  secondary:
    'bg-brand-amber text-ink-primary hover:brightness-105 shadow-sm disabled:opacity-60',
  outline:
    'border-2 border-brand text-brand bg-transparent hover:bg-brand-glow disabled:opacity-60',
  ghost:
    'bg-transparent text-ink-secondary hover:bg-brand-glow hover:text-brand disabled:opacity-60',
  danger:
    'bg-semantic-danger text-white hover:bg-red-800 shadow-sm disabled:opacity-60',
  whatsapp:
    'bg-[#16a34a] text-white hover:bg-[#15803d] shadow-sm disabled:opacity-60',
};

const sizeCls: Record<Size, string> = {
  sm: 'min-h-[40px] px-3.5 py-2 text-xs rounded-md gap-1.5',
  md: 'min-h-[44px] px-4 py-2.5 text-sm rounded-lg gap-2',
  lg: 'min-h-[48px] px-6 py-3.5 text-sm rounded-lg gap-2',
};

/**
 * Shared button primitive — brand-consistent CTAs across pages and modals.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        variantCls[variant],
        sizeCls[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading && <Spinner className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}
