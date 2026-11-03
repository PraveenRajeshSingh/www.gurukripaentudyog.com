'use client';

import React, { useState } from 'react';
import { PRODUCTS } from '@gurukripa/api-contracts';
import { MessageIcon, Spinner } from '@/components/ui/icons';

// Mirrors backend validation (platform/dto.ts) so users get instant feedback;
// the API route re-validates server-side and NestJS validates again.
const PHONE_RE = /^[6-9]\d{9}$/;
const NAME_RE = /^[A-Za-z][A-Za-z\s.'-]{1,79}$/;

const inputCls =
  'w-full min-h-[48px] px-3.5 py-2.5 border border-neutral-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#C8460A]';
const labelCls = 'block text-sm font-bold text-[#4A3728] mb-1';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'ok'; ref?: string }
  | { kind: 'error'; message: string };

export default function EnquiryForm() {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    brickType: PRODUCTS[0]?.name ?? '',
    quantity: 4000,
    deliveryLocation: '',
    pincode: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<SubmitState>({ kind: 'idle' });

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!NAME_RE.test(form.fullName.trim())) e.fullName = 'Enter your full name (letters, 2–80 characters).';
    if (!PHONE_RE.test(form.phone.replace(/\D/g, '').slice(-10))) e.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) e.email = 'Enter a valid email or leave it blank.';
    const q = Number(form.quantity);
    if (!Number.isFinite(q) || q < 1 || q > 10_000_000) e.quantity = 'Quantity must be between 1 and 10,000,000 pieces.';
    const site = form.deliveryLocation.trim();
    if (site.length < 4 || site.length > 180) e.deliveryLocation = 'Delivery city / site location is required (4–180 characters).';
    if (form.pincode && !/^[1-9]\d{5}$/.test(form.pincode)) e.pincode = 'PIN code must be 6 digits (or leave blank).';
    if (form.message.length > 1000) e.message = 'Notes must be under 1000 characters.';
    return e;
  };

  const siteLocation = () =>
    `${form.deliveryLocation.trim()}${form.pincode ? ` – ${form.pincode}` : ''}, Uttar Pradesh`;

  const notesWithEmail = () => {
    const extra = [form.email ? `Email: ${form.email}` : '', form.pincode ? `PIN: ${form.pincode}` : '']
      .filter(Boolean)
      .join(' · ');
    const base = form.message.trim();
    if (base && extra) return `${base}\n${extra}`.slice(0, 1000);
    return (base || extra).slice(0, 1000) || undefined;
  };

  const payload = () => ({
    lines: [{ productName: form.brickType, quantity: Math.round(Number(form.quantity)), unit: 'bricks' }],
    siteLocation: siteLocation(),
    contactName: form.fullName.trim(),
    contactPhone: form.phone.replace(/\D/g, '').slice(-10),
    notes: notesWithEmail(),
  });

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (state.kind === 'busy') return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setState({ kind: 'idle' });
      return;
    }

    setState({ kind: 'busy' });
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload()),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        const ref = json?.data?.id || json?.data?.enquiryId || json?.data?.number;
        setState({ kind: 'ok', ref: ref ? String(ref) : undefined });
      } else {
        setState({
          kind: 'error',
          message:
            json?.message || json?.error || 'Your enquiry could not be registered. Please try again.',
        });
      }
    } catch {
      setState({ kind: 'error', message: 'Network problem — your enquiry was NOT sent. Please retry or call us.' });
    }
  };

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Hello Gurukripa Ent Udyog!\n` +
        `Name: ${form.fullName || 'Customer'}\n` +
        `Product: ${form.brickType}\n` +
        `Quantity: ${form.quantity} pcs\n` +
        `Delivery: ${form.deliveryLocation || 'Jaunpur'}`
    );
    window.open(`https://wa.me/919198923230?text=${text}`, '_blank', 'noopener');
  };

  if (state.kind === 'ok') {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-neutral-200 text-center space-y-4">
        <h2 className="text-xl font-black text-[#1C1009]" role="status">
          Enquiry registered
        </h2>
        <p className="text-sm text-[#6B5545] max-w-md mx-auto">
          Thank you, {form.fullName.trim().split(' ')[0]}.{' '}
          {state.ref ? (
            <>
              Your reference is <strong className="text-[#1C1009]">{state.ref}</strong>.
            </>
          ) : null}{' '}
          The kiln team reviews enquiries during working hours (Mon–Sat, 8 AM – 6 PM) and will
          respond with a rate and delivery quote.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={handleWhatsAppDirect}
            className="inline-flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold min-h-[44px] px-5 rounded-lg transition"
          >
            <MessageIcon className="w-4 h-4" />
            Follow up on WhatsApp
          </button>
          <button
            onClick={() => {
              setState({ kind: 'idle' });
              setForm((f) => ({ ...f, message: '', quantity: 4000 }));
            }}
            className="inline-flex items-center justify-center border-2 border-[#C8460A] text-[#C8460A] text-sm font-bold min-h-[44px] px-5 rounded-lg hover:bg-[rgba(200,70,10,0.08)] transition"
          >
            Submit another enquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 sm:p-8 rounded-xl border border-neutral-200 space-y-4"
      noValidate
    >
      <h2 className="font-extrabold text-lg text-[#1C1009] mb-1">Request a Rate Quote</h2>

      {state.kind === 'error' && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3"
        >
          <strong className="block">Not sent</strong>
          {state.message}{' '}
          <a href="tel:+919198923230" className="underline font-bold">
            Call +91 91989 23230
          </a>{' '}
          or use WhatsApp below instead.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ef-name" className={labelCls}>Your Full Name *</label>
          <input
            id="ef-name"
            type="text"
            autoComplete="name"
            value={form.fullName}
            onChange={(e) => set({ fullName: e.target.value })}
            className={inputCls}
            placeholder="e.g. Rajesh Kumar"
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && <p role="alert" className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label htmlFor="ef-phone" className={labelCls}>Mobile Number (10 digits) *</label>
          <input
            id="ef-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={11}
            value={form.phone}
            onChange={(e) => set({ phone: e.target.value })}
            className={inputCls}
            placeholder="e.g. 9198923230"
            aria-invalid={!!errors.phone}
          />
          {errors.phone && <p role="alert" className="text-red-600 text-xs mt-1">{errors.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ef-grade" className={labelCls}>Brick Grade *</label>
          <select
            id="ef-grade"
            value={form.brickType}
            onChange={(e) => set({ brickType: e.target.value })}
            className={inputCls}
          >
            {PRODUCTS.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} (₹{p.price}/pc)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ef-qty" className={labelCls}>Quantity (pieces) *</label>
          <input
            id="ef-qty"
            type="number"
            step={1000}
            min={1}
            max={10_000_000}
            value={form.quantity}
            onChange={(e) => set({ quantity: parseInt(e.target.value, 10) || 0 })}
            className={inputCls}
            aria-invalid={!!errors.quantity}
          />
          {errors.quantity && <p role="alert" className="text-red-600 text-xs mt-1">{errors.quantity}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ef-loc" className={labelCls}>Delivery Location / City *</label>
          <input
            id="ef-loc"
            type="text"
            autoComplete="address-level2"
            value={form.deliveryLocation}
            onChange={(e) => set({ deliveryLocation: e.target.value })}
            className={inputCls}
            placeholder="e.g. Jaunpur, Varanasi (Lanka), Jalalpur"
            aria-invalid={!!errors.deliveryLocation}
          />
          {errors.deliveryLocation && (
            <p role="alert" className="text-red-600 text-xs mt-1">{errors.deliveryLocation}</p>
          )}
        </div>

        <div>
          <label htmlFor="ef-pin" className={labelCls}>PIN Code (optional)</label>
          <input
            id="ef-pin"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={form.pincode}
            onChange={(e) => set({ pincode: e.target.value })}
            className={inputCls}
            placeholder="e.g. 222001"
            aria-invalid={!!errors.pincode}
          />
          {errors.pincode && <p role="alert" className="text-red-600 text-xs mt-1">{errors.pincode}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="ef-email" className={labelCls}>Email (optional)</label>
        <input
          id="ef-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
          className={inputCls}
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
        />
        {errors.email && <p role="alert" className="text-red-600 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="ef-msg" className={labelCls}>Project details / site access notes</label>
        <textarea
          id="ef-msg"
          rows={3}
          maxLength={1000}
          value={form.message}
          onChange={(e) => set({ message: e.target.value })}
          className={`${inputCls} min-h-[88px]`}
          placeholder="Boundary wall, multi-story building, road width for tractor trolley, target date, etc."
        />
        {errors.message && <p role="alert" className="text-red-600 text-xs mt-1">{errors.message}</p>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          type="submit"
          disabled={state.kind === 'busy'}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-[#C8460A] hover:bg-[#8B2E05] disabled:opacity-60 text-white font-bold min-h-[48px] px-4 rounded-lg text-sm transition"
        >
          {state.kind === 'busy' && <Spinner className="w-4 h-4 animate-spin" />}
          {state.kind === 'busy' ? 'Sending…' : 'Send Enquiry'}
        </button>
        <button
          type="button"
          onClick={handleWhatsAppDirect}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold min-h-[48px] px-4 rounded-lg text-sm transition"
        >
          <MessageIcon className="w-4 h-4" />
          WhatsApp Instead
        </button>
      </div>

      <p className="text-xs text-neutral-500">
        Enquiries are logged and answered by the kiln team during working hours. No payment is
        collected on this site.
      </p>
    </form>
  );
}
