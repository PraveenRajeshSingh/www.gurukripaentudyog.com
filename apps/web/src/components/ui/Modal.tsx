'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon } from './icons';

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
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Single responsive dialog primitive used app-wide.
 * - Mobile (<640px): full-width bottom sheet; desktop: centered, max 896px.
 * - Safe-area insets for notches / gesture bars; internal scrolling.
 * - Focus is trapped, moves into the dialog on open, and returns to the
 *   trigger on close (WCAG 2.2 AA).
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
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`).current;
  const descId = useRef(`modal-desc-${Math.random().toString(36).slice(2, 9)}`).current;

  // Keep latest guards without re-running the mount effect.
  const guards = useRef({ isDirty, busy });
  guards.current = { isDirty, busy };

  const requestDismiss = useCallback(() => {
    if (guards.current.busy) return;
    if (guards.current.isDirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setConfirmDiscard(false);
    restoreRef.current = document.activeElement as HTMLElement | null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog (autofocus target or the panel itself).
    const focusTimer = window.setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')
        ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
        ?? panelRef.current;
      el?.focus({ preventScroll: true });
    }, 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (confirmDiscard) setConfirmDiscard(false);
        else requestDismiss();
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
      // Restore focus to the element that opened the popup.
      restoreRef.current?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 sm:pt-[max(1rem,env(safe-area-inset-top))] bg-black/60 backdrop-blur-sm"
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
        className={`w-full ${maxWidthClass} bg-white rounded-t-2xl sm:rounded-xl border border-neutral-200 shadow-lg overflow-hidden max-h-[92dvh] sm:max-h-[85vh] flex flex-col animate-slideUp outline-none focus-visible:ring-2 focus-visible:ring-[#C8460A]`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Mobile tactile drag handle (visual affordance only) */}
        <div
          className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mt-2.5 sm:hidden shrink-0"
          aria-hidden="true"
        />

        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-start justify-between gap-3 shrink-0 bg-[#FAFAF9]">
          <div className="min-w-0">
            <h2 id={titleId} className="font-bold text-base text-[#1C1009] tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-xs text-[#6B5545] mt-0.5">
                {description}
              </p>
            )}
          </div>

          {showCloseButton && !busy && (
            <button
              onClick={requestDismiss}
              className="w-10 h-10 -mr-1.5 shrink-0 rounded-full flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-200 transition"
              aria-label="Close dialog"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="p-5 overflow-y-auto overscroll-contain flex-1 text-sm text-[#4A3728]">
          {children}

          {/* In-dialog discard guard (no native window.confirm). */}
          {confirmDiscard && (
            <div
              className="mt-5 p-4 rounded-lg border border-amber-300 bg-amber-50 text-[#7c4a03]"
              role="alert"
            >
              <p className="text-xs font-semibold">
                You have unsaved changes. Discard them and close this dialog?
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setConfirmDiscard(false)}
                  className="flex-1 min-h-[44px] rounded-lg border border-neutral-300 bg-white text-xs font-bold text-[#1C1009] hover:bg-neutral-100"
                  data-autofocus
                >
                  Keep editing
                </button>
                <button
                  onClick={() => {
                    setConfirmDiscard(false);
                    onClose();
                  }}
                  className="flex-1 min-h-[44px] rounded-lg bg-[#B91C1C] text-xs font-bold text-white hover:bg-red-800"
                >
                  Discard changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
