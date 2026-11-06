'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CloseIcon } from './icons';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  /** Renders role="alertdialog" for confirmations / destructive actions. */
  alert?: boolean;
  showCloseButton?: boolean;
  /** Unsolved form data: backdrop & ESC ask "Discard changes?" first. */
  isDirty?: boolean;
  /** While true (async save in flight) all dismissal paths are blocked. */
  busy?: boolean;
  /** Optional sticky footer (actions) outside the scroll region. */
  footer?: React.ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Single responsive dialog primitive used app-wide.
 * - Mobile (<640px): full-width bottom sheet; desktop: centered.
 * - Safe-area insets; internal scrolling; focus trap; Escape + dirty guard.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  alert = false,
  showCloseButton = true,
  isDirty = false,
  busy = false,
  footer,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const reactId = useId();
  const titleId = `${reactId}-title`;
  const descId = `${reactId}-desc`;

  const guards = useRef({ isDirty, busy, confirmDiscard });
  guards.current = { isDirty, busy, confirmDiscard };

  const requestDismiss = useCallback(() => {
    if (guards.current.busy) return;
    if (guards.current.isDirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }, [onClose]);

  const requestDismissRef = useRef(requestDismiss);
  requestDismissRef.current = requestDismiss;

  useEffect(() => {
    if (!isOpen) return;
    setConfirmDiscard(false);
    restoreRef.current = document.activeElement as HTMLElement | null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const el =
        panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ??
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
        panelRef.current;
      el?.focus({ preventScroll: true });
    }, 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (guards.current.confirmDiscard) setConfirmDiscard(false);
        else requestDismissRef.current();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const nodes = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
        ).filter((n) => n.offsetParent !== null);
        if (nodes.length === 0) {
          e.preventDefault();
          panelRef.current.focus({ preventScroll: true });
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === panelRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-2xl',
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 sm:pt-[max(1rem,env(safe-area-inset-top))] bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) requestDismiss();
      }}
    >
      <div
        ref={panelRef}
        role={alert ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`w-full ${maxWidthClass} bg-surface-card rounded-t-2xl sm:rounded-xl border border-neutral-200 shadow-modal overflow-hidden max-h-[min(92dvh,100%)] sm:max-h-[85vh] flex flex-col animate-slideUp outline-none`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="sheet-handle" aria-hidden="true" />

        <div className="px-5 py-4 border-b border-neutral-100 flex items-start justify-between gap-3 shrink-0 bg-surface-subtle">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display font-bold text-base text-ink-primary tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-xs text-ink-tertiary mt-0.5">
                {description}
              </p>
            )}
          </div>

          {showCloseButton && !busy && (
            <button
              onClick={requestDismiss}
              className="w-11 h-11 -mr-1.5 shrink-0 rounded-full flex items-center justify-center text-neutral-500 hover:text-ink-primary hover:bg-neutral-200 transition"
              aria-label="Close dialog"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-5 overflow-y-auto overscroll-contain flex-1 text-sm text-ink-secondary">
          {children}

          {confirmDiscard && (
            <div
              className="mt-5 p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-950"
              role="alert"
            >
              <p className="text-xs font-semibold">
                You have unsaved changes. Discard them and close this dialog?
              </p>
              <div className="flex flex-col xs:flex-row gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => setConfirmDiscard(false)}
                  data-autofocus
                  className="!border-neutral-300 !text-ink-primary"
                >
                  Keep editing
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    setConfirmDiscard(false);
                    onClose();
                  }}
                >
                  Discard changes
                </Button>
              </div>
            </div>
          )}
        </div>

        {footer && (
          <div className="px-5 py-4 border-t border-neutral-100 bg-surface-subtle shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
