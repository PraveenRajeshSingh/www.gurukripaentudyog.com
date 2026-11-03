'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

/* ------------------------------------------------------------------ */
/* Cart store — single source of truth for every page in the app.      */
/* Persisted to localStorage; cart lives across navigation & reloads.  */
/* ------------------------------------------------------------------ */

export interface CartItem {
  id?: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  count: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (index: number, qty: number) => void;
  removeItem: (index: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CART_KEY = 'gk_web_cart';
const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

function readCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // Defensive: only accept well-shaped rows, never trust stored JSON.
    return parsed.filter(
      (it: CartItem) =>
        typeof it?.name === 'string' &&
        typeof it?.price === 'number' &&
        it.price >= 0 &&
        typeof it?.quantity === 'number' &&
        it.quantity > 0
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load once on client mount (SSG-safe: no window during build).
  useEffect(() => {
    setItems(readCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* storage full / private mode — cart still works in memory */
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.name === item.name);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity };
        return copy;
      }
      return [...prev, item];
    });
    setIsOpen(true);
  }, []);

  const updateQuantity = useCallback((index: number, qty: number) => {
    setItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      // Bulk minimum: 100 pcs; below that, remove the line instead.
      if (qty < 100) return prev.filter((_, i) => i !== index);
      const copy = [...prev];
      copy[index] = { ...copy[index], quantity: qty };
      return copy;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isOpen,
      count: items.length,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    }),
    [items, isOpen, addItem, updateQuantity, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/* ------------------------------------------------------------------ */
/* Privacy consent — only shows when the app actually uses analytics.  */
/* BACKEND_ANALYTICS is off by default, so no banner appears unless    */
/* the operator enables it (anti-slop rule: no fake consent demand).   */
/* ------------------------------------------------------------------ */

const CONSENT_KEY = 'gk_web_consent';
const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ID ? true : false;

interface ConsentContextValue {
  needsConsent: boolean;
  accepted: boolean;
  accept: () => void;
  decline: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used inside <ConsentProvider>');
  return ctx;
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [decided, setDecided] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    try {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      if (stored) setDecided(stored === 'accepted');
    } catch {}
  }, []);

  const record = (value: 'accepted' | 'declined') => {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch {}
    setDecided(value === 'accepted');
  };

  const value = useMemo<ConsentContextValue>(
    () => ({
      needsConsent: ANALYTICS_ENABLED && decided === null,
      accepted: decided === true,
      accept: () => record('accepted'),
      decline: () => record('declined'),
    }),
    [decided]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ConsentProvider>{children}</ConsentProvider>
    </CartProvider>
  );
}
