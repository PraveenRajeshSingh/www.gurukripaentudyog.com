'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  calculateGst,
  calculateCouponDiscount,
  formatINR,
  formatNum,
} from '@gurukripa/api-contracts';
import { useCart } from '../components/providers/CartProvider';
import { CartIcon, CloseIcon, TrashIcon, MessageIcon } from '../components/ui/icons';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Global cart drawer — reads the shared CartProvider state, so items added
 * on any page (home, catalog, estimator) persist and one drawer serves all.
 * Checkout is an honest WhatsApp handoff: no order is marked as placed here.
 */
export default function CartDrawer() {
  const { isOpen, closeCart, items, updateQuantity, removeItem } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');

  const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const discount = calculateCouponDiscount(appliedCoupon || undefined, subtotal);
  const taxable = Math.max(0, subtotal - discount);
  const gst = calculateGst(taxable, false);

  useEffect(() => {
    if (!isOpen) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
    }, 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeCart();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = coupon.trim().toUpperCase();
    if (code === 'GURU10' || code === 'BRICK50' || code === 'FIRSTORDER') {
      setAppliedCoupon(code);
    } else {
      setAppliedCoupon(null);
      setCouponError('Invalid coupon code. Try GURU10, BRICK50, or FIRSTORDER');
    }
  };

  const handleCheckoutWhatsApp = () => {
    let summary = 'Hello Gurukripa Ent Udyog! I would like to place an order:%0A';
    items.forEach((it, i) => {
      summary += `${i + 1}. ${it.name} - ${formatNum(it.quantity)} pcs @ ₹${it.price} = ${formatINR(it.price * it.quantity)}%0A`;
    });
    if (appliedCoupon) {
      summary += `Coupon (${appliedCoupon}): -${formatINR(discount)}%0A`;
    }
    summary += `Taxable: ${formatINR(taxable)}%0A`;
    summary += `GST (5% CGST+SGST): ${formatINR(gst.totalTax)}%0A`;
    summary += `*Total Order Value: ${formatINR(gst.grandTotal)}*%0A`;
    summary += 'Please confirm trolley availability and delivery schedule.';
    window.open(`https://wa.me/919198923230?text=${summary}`, '_blank', 'noopener');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col z-10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-[#FAFAF9] shrink-0">
          <div className="flex items-center gap-2">
            <CartIcon className="w-5 h-5 text-[#C8460A]" />
            <h2 id="cart-drawer-title" className="font-extrabold text-base text-[#1C1009]">
              Your Cart
            </h2>
            <span className="bg-[#C8460A] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <button
            onClick={closeCart}
            className="w-11 h-11 flex items-center justify-center text-neutral-500 hover:text-black rounded-lg hover:bg-neutral-100"
            aria-label="Close cart"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
          {items.length === 0 ? (
            <div className="text-center py-12 text-[#6B5545]">
              <p className="font-bold">Your cart is empty.</p>
              <p className="text-xs text-neutral-400 mt-1">
                Browse the catalog or use the 3-in-1 Estimator to add brick loads.
              </p>
            </div>
          ) : (
            items.map((it, idx) => (
              <div
                key={`${it.name}-${idx}`}
                className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex justify-between items-center gap-3"
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-[#1C1009] truncate">{it.name}</h3>
                  <div className="text-xs text-[#6B5545]">
                    ₹{it.price} each · {formatNum(it.quantity)} pcs
                  </div>
                  <div className="text-xs font-bold text-[#C8460A] mt-1">
                    {formatINR(it.price * it.quantity)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(idx, it.quantity - 500)}
                    className="w-10 h-10 bg-white border border-neutral-300 rounded font-bold hover:bg-neutral-100"
                    aria-label={`Reduce ${it.name} by 500 pieces`}
                  >
                    −
                  </button>
                  <span className="text-xs font-bold w-14 text-center" aria-live="polite">
                    {formatNum(it.quantity)}
                  </span>
                  <button
                    onClick={() => updateQuantity(idx, it.quantity + 500)}
                    className="w-10 h-10 bg-white border border-neutral-300 rounded font-bold hover:bg-neutral-100"
                    aria-label={`Increase ${it.name} by 500 pieces`}
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-red-600 hover:text-red-800 ml-1 w-10 h-10 flex items-center justify-center rounded hover:bg-red-50"
                    aria-label={`Remove ${it.name} from cart`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Coupon */}
          {items.length > 0 && (
            <div className="pt-2">
              <label htmlFor="cart-coupon" className="block text-xs font-bold text-[#4A3728] mb-1">
                Coupon / Discount Code
              </label>
              <div className="flex gap-2">
                <input
                  id="cart-coupon"
                  type="text"
                  placeholder="e.g. GURU10"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2.5 border border-neutral-300 rounded-lg text-xs font-semibold uppercase"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="bg-[#C8460A] hover:bg-[#8B2E05] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition min-h-[44px]"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-[11px] text-green-700 font-bold mt-1.5" role="status">
                  Coupon {appliedCoupon} applied — {formatINR(discount)} off.
                </p>
              )}
              {couponError && (
                <p className="text-[11px] text-red-600 font-medium mt-1.5" role="alert">
                  {couponError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Totals & checkout */}
        {items.length > 0 && (
          <div className="p-4 border-t border-neutral-200 bg-[#FAFAF9] space-y-2 shrink-0">
            <div className="flex justify-between text-xs text-[#6B5545]">
              <span>Subtotal:</span>
              <span className="font-bold text-[#1C1009]">{formatINR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-green-700 font-semibold">
                <span>Discount ({appliedCoupon}):</span>
                <span>-{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-[#6B5545]">
              <span>GST (5%: CGST 2.5% + SGST 2.5%):</span>
              <span className="font-bold text-[#1C1009]">{formatINR(gst.totalTax)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-[#1C1009] pt-2 border-t border-neutral-200">
              <span>Total Estimate:</span>
              <span className="text-[#C8460A]">{formatINR(gst.grandTotal)}</span>
            </div>

            <button
              onClick={handleCheckoutWhatsApp}
              className="w-full mt-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 text-sm min-h-[48px]"
            >
              <MessageIcon className="w-4 h-4" />
              Send Order to Kiln via WhatsApp
            </button>
            <p className="text-[10px] text-center text-neutral-500">
              The kiln team confirms availability and delivery schedule before the order is
              accepted. No payment is collected here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
