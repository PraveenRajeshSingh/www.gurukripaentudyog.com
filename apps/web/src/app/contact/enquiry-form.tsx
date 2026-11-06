'use client';

import React, { useState } from 'react';
import { PRODUCTS } from '@gurukripa/api-contracts';
import { MessageIcon } from '@/components/ui/icons';
import Button from '@/components/ui/Button';
import { TextField, TextArea, SelectField } from '@/components/ui/Field';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import {
  PHONE_RE,
  NAME_RE,
  EMAIL_RE,
  PIN_RE,
  normalizeIndianPhone,
  whatsappUrl,
} from '@/lib/validation';

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
    if (!PHONE_RE.test(normalizeIndianPhone(form.phone))) e.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (form.email && !EMAIL_RE.test(form.email)) e.email = 'Enter a valid email or leave it blank.';
    const q = Number(form.quantity);
    if (!Number.isFinite(q) || q < 1 || q > 10_000_000) e.quantity = 'Quantity must be between 1 and 10,000,000 pieces.';
    const site = form.deliveryLocation.trim();
    if (site.length < 4 || site.length > 180) e.deliveryLocation = 'Delivery city / site location is required (4–180 characters).';
    if (form.pincode && !PIN_RE.test(form.pincode)) e.pincode = 'PIN code must be 6 digits (or leave blank).';
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
    contactPhone: normalizeIndianPhone(form.phone),
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
    window.open(
      whatsappUrl(
        `Hello Gurukripa Ent Udyog!\n` +
          `Name: ${form.fullName || 'Customer'}\n` +
          `Product: ${form.brickType}\n` +
          `Quantity: ${form.quantity} pcs\n` +
          `Delivery: ${form.deliveryLocation || 'Jaunpur'}`
      ),
      '_blank',
      'noopener'
    );
  };

  if (state.kind === 'ok') {
    return (
      <Card padding="lg" className="text-center space-y-4">
        <h2 className="text-xl font-display font-black text-ink-primary" role="status">
          Enquiry registered
        </h2>
        <p className="text-sm text-ink-tertiary max-w-md mx-auto">
          Thank you, {form.fullName.trim().split(' ')[0]}.{' '}
          {state.ref ? (
            <>
              Your reference is <strong className="text-ink-primary">{state.ref}</strong>.
            </>
          ) : null}{' '}
          The kiln team reviews enquiries during working hours (Mon–Sat, 8 AM – 6 PM) and will
          respond with a rate and delivery quote.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="whatsapp" onClick={handleWhatsAppDirect}>
            <MessageIcon className="w-4 h-4" />
            Follow up on WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setState({ kind: 'idle' });
              setForm((f) => ({ ...f, message: '', quantity: 4000 }));
            }}
          >
            Submit another enquiry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg" as="div">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <h2 className="font-display font-extrabold text-lg text-ink-primary mb-1">Request a Rate Quote</h2>

        {state.kind === 'error' && (
          <Alert tone="error" title="Not sent">
            {state.message}{' '}
            <a href="tel:+919198923230" className="underline font-bold">
              Call +91 91989 23230
            </a>{' '}
            or use WhatsApp below instead.
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            id="ef-name"
            label="Your Full Name"
            requiredMark
            autoComplete="name"
            value={form.fullName}
            onChange={(e) => set({ fullName: e.target.value })}
            placeholder="e.g. Rajesh Kumar"
            error={errors.fullName}
          />
          <TextField
            id="ef-phone"
            label="Mobile Number (10 digits)"
            requiredMark
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={11}
            value={form.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="e.g. 9198923230"
            error={errors.phone}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            id="ef-grade"
            label="Brick Grade"
            requiredMark
            value={form.brickType}
            onChange={(e) => set({ brickType: e.target.value })}
          >
            {PRODUCTS.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} (₹{p.price}/pc)
              </option>
            ))}
          </SelectField>
          <TextField
            id="ef-qty"
            label="Quantity (pieces)"
            requiredMark
            type="number"
            step={1000}
            min={1}
            max={10_000_000}
            value={form.quantity}
            onChange={(e) => set({ quantity: parseInt(e.target.value, 10) || 0 })}
            error={errors.quantity}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            id="ef-loc"
            label="Delivery Location / City"
            requiredMark
            autoComplete="address-level2"
            value={form.deliveryLocation}
            onChange={(e) => set({ deliveryLocation: e.target.value })}
            placeholder="e.g. Jaunpur, Varanasi (Lanka), Jalalpur"
            error={errors.deliveryLocation}
          />
          <TextField
            id="ef-pin"
            label="PIN Code (optional)"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={form.pincode}
            onChange={(e) => set({ pincode: e.target.value })}
            placeholder="e.g. 222001"
            error={errors.pincode}
          />
        </div>

        <TextField
          id="ef-email"
          label="Email (optional)"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
          placeholder="you@example.com"
          error={errors.email}
        />

        <TextArea
          id="ef-msg"
          label="Project details / site access notes"
          rows={3}
          maxLength={1000}
          value={form.message}
          onChange={(e) => set({ message: e.target.value })}
          placeholder="Boundary wall, multi-story building, road width for tractor trolley, target date, etc."
          error={errors.message}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button type="submit" variant="primary" size="lg" fullWidth loading={state.kind === 'busy'}>
            {state.kind === 'busy' ? 'Sending…' : 'Send Enquiry'}
          </Button>
          <Button type="button" variant="whatsapp" size="lg" fullWidth onClick={handleWhatsAppDirect}>
            <MessageIcon className="w-4 h-4" />
            WhatsApp Instead
          </Button>
        </div>

        <p className="text-xs text-neutral-500">
          Enquiries are logged and answered by the kiln team during working hours. No payment is
          collected on this site.
        </p>
      </form>
    </Card>
  );
}
