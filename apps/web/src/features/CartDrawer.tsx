'use client';

import React, { useState } from 'react';
import {
  calculateGst,
  calculateCouponDiscount,
  formatINR,
  formatNum,
} from '@gurukripa/api-contracts';
import { useCart } from '../components/providers/CartProvider';
import { CartIcon, TrashIcon, MessageIcon } from '../components/ui/icons';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { TextField } from '../components/ui/Field';
import { Drawer } from '../components/ui/popup';
import { WHATSAPP_BASE } from '../lib/validation';

/**
 * Global cart drawer — shared CartProvider state.
 * Desktop: right-edge panel. Mobile: bottom sheet (matches Modal pattern).
 * Checkout is an honest WhatsApp handoff.
 */
export default function CartDrawer() {
  const { isOpen, closeCart, items, updateQuantity, removeItem } = useCart();
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');

  const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const discount = calculateCouponDiscount(appliedCoupon || undefined, subtotal);
  const taxable = Math.max(0, subtotal - discount);
  const gst = calculateGst(taxable, false);

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
    let summary = 'Hello Gurukripa Ent Udyog! I would like to place an order:\n';
    items.forEach((it, i) => {
      summary += `${i + 1}. ${it.name} - ${formatNum(it.quantity)} pcs @ ₹${it.price} = ${formatINR(it.price * it.quantity)}\n`;
    });
    if (appliedCoupon) {
      summary += `Coupon (${appliedCoupon}): -${formatINR(discount)}\n`;
    }
    summary += `Taxable: ${formatINR(taxable)}\n`;
    summary += `GST (5% CGST+SGST): ${formatINR(gst.totalTax)}\n`;
    summary += `*Total Order Value: ${formatINR(gst.grandTotal)}*\n`;
    summary += 'Please confirm trolley availability and delivery schedule.';
    window.open(`${WHATSAPP_BASE}?text=${encodeURIComponent(summary)}`, '_blank', 'noopener');
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeCart}
      title="Your Cart"
      titleId="cart-drawer-title"
      icon={<CartIcon className="w-5 h-5 text-brand shrink-0" />}
      badge={
        <span className="bg-brand text-white text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
          {items.length}
        </span>
      }
      footer={
        items.length > 0 ? (
          <>
            <div className="flex justify-between text-xs text-ink-tertiary">
              <span>Subtotal:</span>
              <span className="font-bold text-ink-primary">{formatINR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-semantic-success font-semibold">
                <span>Discount ({appliedCoupon}):</span>
                <span>-{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-ink-tertiary">
              <span>GST (5%: CGST 2.5% + SGST 2.5%):</span>
              <span className="font-bold text-ink-primary">{formatINR(gst.totalTax)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-ink-primary pt-2 border-t border-neutral-200">
              <span>Total Estimate:</span>
              <span className="text-brand">{formatINR(gst.grandTotal)}</span>
            </div>

            <Button variant="whatsapp" size="lg" fullWidth onClick={handleCheckoutWhatsApp} className="mt-2">
              <MessageIcon className="w-4 h-4" />
              Send Order to Kiln via WhatsApp
            </Button>
            <p className="text-[10px] text-center text-neutral-500">
              The kiln team confirms availability and delivery schedule before the order is
              accepted. No payment is collected here.
            </p>
          </>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={<CartIcon className="w-5 h-5" />}
          title="Your cart is empty."
          description="Browse the catalog or use the 3-in-1 Estimator to add brick loads."
        />
      ) : (
        items.map((it, idx) => (
          <div
            key={`${it.name}-${idx}`}
            className="p-3 bg-surface-subtle rounded-lg border border-neutral-200 flex flex-col xs:flex-row justify-between items-stretch xs:items-center gap-3"
          >
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-ink-primary truncate">{it.name}</h3>
              <div className="text-xs text-ink-tertiary">
                ₹{it.price} each · {formatNum(it.quantity)} pcs
              </div>
              <div className="text-xs font-bold text-brand mt-1">
                {formatINR(it.price * it.quantity)}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end xs:self-auto">
              <button
                type="button"
                onClick={() => updateQuantity(idx, it.quantity - 500)}
                className="w-10 h-10 bg-white border border-neutral-300 rounded-md font-bold hover:bg-neutral-100"
                aria-label={`Reduce ${it.name} by 500 pieces`}
              >
                −
              </button>
              <span className="text-xs font-bold w-14 text-center" aria-live="polite">
                {formatNum(it.quantity)}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(idx, it.quantity + 500)}
                className="w-10 h-10 bg-white border border-neutral-300 rounded-md font-bold hover:bg-neutral-100"
                aria-label={`Increase ${it.name} by 500 pieces`}
              >
                +
              </button>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="text-semantic-danger hover:text-red-800 ml-1 w-10 h-10 flex items-center justify-center rounded-md hover:bg-red-50"
                aria-label={`Remove ${it.name} from cart`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}

      {items.length > 0 && (
        <div className="pt-2 space-y-2">
          <TextField
            id="cart-coupon"
            label="Coupon / Discount Code"
            type="text"
            placeholder="e.g. GURU10"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            className="uppercase text-xs font-semibold min-h-[44px]"
            error={couponError || undefined}
          />
          <Button variant="primary" size="sm" onClick={handleApplyCoupon} className="w-full xs:w-auto">
            Apply coupon
          </Button>
          {appliedCoupon && (
            <p className="text-[11px] text-semantic-success font-bold" role="status">
              Coupon {appliedCoupon} applied — {formatINR(discount)} off.
            </p>
          )}
        </div>
      )}
    </Drawer>
  );
}
