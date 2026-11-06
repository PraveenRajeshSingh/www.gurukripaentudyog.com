'use client';

import React, { useState } from 'react';
import { api } from '@/lib/client-api';
import type { MeUser } from '@/types/account';
import { PhoneIcon } from '@/components/ui/icons';
import Button from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import { PHONE_RE, EMAIL_RE, normalizeIndianPhone } from '@/lib/validation';

export default function AuthCard({ onSignedIn }: { onSignedIn: (user: MeUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const digits = normalizeIndianPhone(form.phone);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!PHONE_RE.test(digits)) e.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (form.password.length < (mode === 'register' ? 8 : 1))
      e.password = mode === 'register' ? 'Password must be at least 8 characters.' : 'Enter your password.';
    if (mode === 'register') {
      if (form.name.trim().length < 2) e.name = 'Enter your full name.';
      if (form.email && !EMAIL_RE.test(form.email)) e.email = 'Enter a valid email or leave blank.';
      if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const finishLogin = async (phone: string, password: string) => {
    const r = await api('login', { method: 'POST', body: JSON.stringify({ phone, password }) });
    const user = (r.json as { user?: MeUser })?.user;
    if (r.ok && user) {
      onSignedIn(user);
      return true;
    }
    setServerError(r.status === 503 ? r.message : 'Phone or password did not match an account.');
    return false;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy || !validate()) return;
    setBusy(true);
    setServerError('');
    try {
      if (mode === 'login') {
        await finishLogin(digits, form.password);
      } else {
        const r = await api('auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            phone: digits,
            ...(form.email ? { email: form.email.trim() } : {}),
            password: form.password,
          }),
        });
        if (r.ok) {
          const signedIn = await finishLogin(digits, form.password);
          if (!signedIn) setMode('login');
        } else {
          setServerError(r.message || 'Registration failed.');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padding="lg" className="max-w-md mx-auto">
      <h2 className="text-xl font-display font-black text-ink-primary mb-1">
        {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
      </h2>
      <p className="text-sm text-ink-tertiary mb-5">
        Track enquiries, quotations and orders with the kiln.
      </p>

      {serverError && (
        <Alert tone="error" className="mb-4">
          {serverError}
          {serverError.includes('not reach') && (
            <a href="tel:+919198923230" className="underline font-bold block mt-1">
              Call +91 91989 23230
            </a>
          )}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === 'register' && (
          <TextField
            id="au-name"
            label="Full name"
            requiredMark
            autoComplete="name"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            error={errors.name}
          />
        )}

        <TextField
          id="au-phone"
          label="Mobile number"
          requiredMark
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={11}
          value={form.phone}
          onChange={(e) => set({ phone: e.target.value })}
          placeholder="9876543210"
          error={errors.phone}
        />

        {mode === 'register' && (
          <TextField
            id="au-email"
            label="Email (optional)"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
            error={errors.email}
          />
        )}

        <TextField
          id="au-pass"
          label="Password"
          requiredMark
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={form.password}
          onChange={(e) => set({ password: e.target.value })}
          error={errors.password}
        />

        {mode === 'register' && (
          <TextField
            id="au-confirm"
            label="Confirm password"
            requiredMark
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => set({ confirm: e.target.value })}
            error={errors.confirm}
          />
        )}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      <p className="text-sm text-center text-ink-tertiary mt-4">
        {mode === 'login' ? (
          <>
            New here?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setServerError('');
              }}
              className="font-bold text-brand hover:underline"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already registered?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setServerError('');
              }}
              className="font-bold text-brand hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>

      <div className="mt-5 pt-4 border-t border-neutral-100 text-xs text-ink-tertiary space-y-2">
        <p>Password reset is not available online yet — the kiln office resets passwords by phone:</p>
        <a
          href="tel:+919198923230"
          className="inline-flex items-center gap-1.5 font-bold text-brand hover:underline min-h-[36px]"
        >
          <PhoneIcon className="w-4 h-4" /> +91 91989 23230 (Mon–Sat, 8 AM – 6 PM)
        </a>
      </div>
    </Card>
  );
}
