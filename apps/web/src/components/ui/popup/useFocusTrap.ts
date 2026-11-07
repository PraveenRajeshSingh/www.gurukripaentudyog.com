'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Nested Modal/Drawer share one body pin so unlock restores the original scrollY. */
let lockCount = 0;
let lockedScrollY = 0;
let vvCleanup: (() => void) | null = null;

function syncVisualViewportVar() {
  if (typeof document === 'undefined') return;
  const vv = window.visualViewport;
  const h = vv ? vv.height : window.innerHeight;
  document.documentElement.style.setProperty('--vv-height', `${h}px`);
}

function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    syncVisualViewportVar();
    document.documentElement.classList.add('gb-popup-open');
    document.body.classList.add('gb-popup-open');
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.position = 'fixed';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    if (window.visualViewport) {
      const onVv = () => syncVisualViewportVar();
      window.visualViewport.addEventListener('resize', onVv, { passive: true });
      window.visualViewport.addEventListener('scroll', onVv, { passive: true });
      vvCleanup = () => {
        window.visualViewport?.removeEventListener('resize', onVv);
        window.visualViewport?.removeEventListener('scroll', onVv);
        vvCleanup = null;
      };
    }
  }
  lockCount += 1;
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount !== 0) return;
  if (vvCleanup) vvCleanup();
  document.documentElement.classList.remove('gb-popup-open');
  document.body.classList.remove('gb-popup-open');
  document.body.style.top = '';
  document.body.style.position = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, lockedScrollY || 0);
}

/**
 * Focus trap + body scroll lock + Escape for popup surfaces.
 * Returns a ref to attach to the dialog panel.
 */
export function useFocusTrap(isOpen: boolean, onEscape: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!isOpen) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    lockBodyScroll();

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
        onEscapeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
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
    };
    document.addEventListener('keydown', onKey, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey, true);
      unlockBodyScroll();
      restoreRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  return panelRef;
}

export { FOCUSABLE };
