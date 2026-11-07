'use client';

import React, { useId } from 'react';
import { CloseIcon } from '../icons';
import OverlayBackdrop from './OverlayBackdrop';
import { useFocusTrap } from './useFocusTrap';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleId?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Desktop: edge panel. Mobile always bottom sheet. */
  side?: 'right' | 'bottom';
}

/**
 * Cart / wishlist style drawer — bottom sheet on phones, edge panel on desktop.
 */
export default function Drawer({
  isOpen,
  onClose,
  title,
  titleId: titleIdProp,
  badge,
  icon,
  children,
  footer,
}: DrawerProps) {
  const reactId = useId();
  const titleId = titleIdProp ?? `${reactId}-drawer-title`;
  const panelRef = useFocusTrap(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end animate-fadeIn">
      <OverlayBackdrop onDismiss={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full sm:max-w-md bg-surface-card h-[min(92dvh,100%)] sm:h-full shadow-modal flex flex-col z-10 rounded-t-2xl sm:rounded-none animate-slideUp sm:animate-slideInRight outline-none border-t sm:border-t-0 sm:border-l border-neutral-200"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          backgroundImage:
            'linear-gradient(180deg, rgba(251,234,224,0.45) 0%, transparent 64px)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div className="sheet-handle" aria-hidden="true" />

        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-white/70 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <h2 id={titleId} className="font-display font-extrabold text-base text-ink-primary truncate">
              {title}
            </h2>
            {badge}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center text-neutral-500 rounded-full border border-neutral-200 bg-surface-subtle hover:text-brand hover:bg-brand-glow transition"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div
          className="gb-modal-body flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 overscroll-contain min-h-0"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {children}
        </div>

        {footer && (
          <div className="p-4 border-t border-neutral-200 bg-surface-subtle space-y-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
