'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CloseIcon } from '../icons';
import Button from '../Button';
import OverlayBackdrop from './OverlayBackdrop';
import { useFocusTrap } from './useFocusTrap';

export interface ModalProps {
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
  /** Sticky footer (actions) outside the scroll region. */
  footer?: React.ReactNode;
}

const maxWidthClass = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
} as const;

/**
 * App-wide dialog — mobile bottom sheet, desktop centered panel.
 * Header + footer stay fixed; only the middle region scrolls.
 * Body scroll is locked via useFocusTrap (scrollY restored on close).
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
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const reactId = useId();
  const titleId = `${reactId}-title`;
  const descId = `${reactId}-desc`;
  const bodyRef = useRef<HTMLDivElement>(null);

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

  const onEscape = useCallback(() => {
    if (guards.current.confirmDiscard) setConfirmDiscard(false);
    else requestDismiss();
  }, [requestDismiss]);

  const panelRef = useFocusTrap(isOpen, onEscape);

  useEffect(() => {
    if (isOpen) {
      setConfirmDiscard(false);
      // Reset inner scroll when reopening so tab switches / re-edits start at top.
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
      style={{
        paddingTop: 'max(0px, env(safe-area-inset-top))',
      }}
    >
      <div className="pointer-events-auto absolute inset-0 animate-fadeIn">
        <OverlayBackdrop onDismiss={requestDismiss} />
      </div>

      <div
        ref={panelRef}
        role={alert ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`gb-modal-panel pointer-events-auto relative z-10 w-full ${maxWidthClass[maxWidth]} bg-surface-card rounded-t-2xl sm:rounded-xl border border-neutral-200 shadow-modal flex flex-col outline-none animate-slideUp`}
        style={{
          maxHeight: 'min(var(--vv-height, 100dvh), 92dvh)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          backgroundImage:
            'linear-gradient(180deg, rgba(251,234,224,0.55) 0%, transparent 72px)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div className="sheet-handle shrink-0" aria-hidden="true" />

        {/* Fixed header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-neutral-100 flex items-start justify-between gap-3 shrink-0 sticky top-0 z-[2] bg-white/90 backdrop-blur-sm">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display font-bold text-base text-ink-primary tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-xs text-ink-tertiary mt-0.5 max-w-[36ch] leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {showCloseButton && !busy && (
            <button
              type="button"
              onClick={requestDismiss}
              className="w-11 h-11 -mr-1.5 shrink-0 rounded-full flex items-center justify-center text-neutral-500 border border-neutral-200 bg-surface-subtle hover:text-brand hover:bg-brand-glow hover:border-brand/20 transition"
              aria-label="Close dialog"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Independent scroll region — does not move the dashboard page */}
        <div
          ref={bodyRef}
          className="gb-modal-body px-4 sm:px-5 py-4 sm:py-5 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain text-sm text-ink-secondary"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
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

        {/* Fixed footer actions */}
        {footer && (
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-neutral-100 bg-surface-subtle shrink-0 sticky bottom-0 z-[2] flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
