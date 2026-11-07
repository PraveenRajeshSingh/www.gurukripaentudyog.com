'use client';

import React, { useState } from 'react';
import { api } from '@/lib/client-api';
import type { MeUser } from '@/types/account';
import { PhoneIcon, EyeIcon, EyeOffIcon } from '@/components/ui/icons';
import Button from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import { PHONE_RE, EMAIL_RE, normalizeIndianPhone } from '@/lib/validation';

function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
  requiredMark,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete: string;
  requiredMark?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-bold text-ink-secondary mb-1">
        {label}
        {requiredMark ? <span className="text-semantic-danger"> *</span> : null}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full min-h-[48px] pl-3.5 pr-12 py-2.5 border rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand ${
            error ? 'border-semantic-danger' : 'border-neutral-300'
          }`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 inline-flex items-center justify-center rounded-lg text-ink-tertiary hover:text-brand hover:bg-brand-glow transition"
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          onClick={() => setShow((s) => !s)}
        >
          {show ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-semantic-danger text-xs mt-1 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AuthCard({ onSignedIn }: { onSignedIn: (user: MeUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirm: '',
    terms: false,
    remember: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const digits = normalizeIndianPhone(form.phone);

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setServerError('');
    setErrors({});
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!PHONE_RE.test(digits)) e.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (form.password.length < (mode === 'register' ? 8 : 1))
      e.password = mode === 'register' ? 'Password must be at least 8 characters.' : 'Enter your password.';
    if (mode === 'register') {
      if (form.name.trim().length < 2) e.name = 'Enter your full name.';
      if (form.email && !EMAIL_RE.test(form.email)) e.email = 'Enter a valid email or leave blank.';
      if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
      if (!form.terms) e.terms = 'Please accept the Terms and Privacy Policy.';
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
          if (!signedIn) switchMode('login');
        } else if (r.status === 409) {
          setServerError('This mobile is already registered. Sign in instead.');
          switchMode('login');
        } else {
          setServerError(r.message || 'Registration failed.');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padding="lg" className="max-w-md mx-auto shadow-card">
      <div className="mb-5">
        <div
          className="grid grid-cols-2 gap-1 p-1 rounded-full bg-surface-subtle border border-neutral-200"
          role="group"
          aria-label="Sign in or create an account"
        >
          <button
            type="button"
            onClick={() => switchMode('login')}
            aria-current={mode === 'login' ? 'true' : undefined}
            className={`min-h-[44px] rounded-full text-sm font-bold transition ${
              mode === 'login'
                ? 'bg-brand text-white shadow-sm'
                : 'text-ink-secondary hover:text-brand'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            aria-current={mode === 'register' ? 'true' : undefined}
            className={`min-h-[44px] rounded-full text-sm font-bold transition ${
              mode === 'register'
                ? 'bg-brand text-white shadow-sm'
                : 'text-ink-secondary hover:text-brand'
            }`}
          >
            Sign Up
          </button>
        </div>
      </div>

      <h2 className="text-xl font-display font-black text-ink-primary mb-1">
        {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
      </h2>
      <p className="text-sm text-ink-tertiary mb-5">
        Track enquiries, quotations and orders with the kiln. Passwords are verified by the server —
        this browser never stores your password.
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

        <PasswordField
          id="au-pass"
          label="Password"
          requiredMark
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={form.password}
          onChange={(v) => set({ password: v })}
          error={errors.password}
        />

        {mode === 'register' && (
          <PasswordField
            id="au-confirm"
            label="Confirm password"
            requiredMark
            autoComplete="new-password"
            value={form.confirm}
            onChange={(v) => set({ confirm: v })}
            error={errors.confirm}
          />
        )}

        {mode === 'login' && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink-secondary min-h-[40px]">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => set({ remember: e.target.checked })}
                className="w-4 h-4 accent-brand"
              />
              Remember me
            </label>
            <a
              href="tel:+919198923230"
              className="text-sm font-bold text-brand hover:underline min-h-[40px] inline-flex items-center"
            >
              Forgot password?
            </a>
          </div>
        )}

        {mode === 'register' && (
          <div>
            <label className="flex items-start gap-2 text-sm text-ink-secondary">
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(e) => set({ terms: e.target.checked })}
                className="w-[18px] h-[18px] mt-0.5 accent-brand shrink-0"
                required
              />
              <span>
                I agree to the{' '}
                <a href="/terms" className="font-bold text-brand hover:underline">
                  Terms
                </a>{' '}
                &amp;{' '}
                <a href="/privacy" className="font-bold text-brand hover:underline">
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.terms && (
              <p role="alert" className="text-semantic-danger text-xs mt-1 font-medium">
                {errors.terms}
              </p>
            )}
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      <p className="text-sm text-center text-ink-tertiary mt-4">
        {mode === 'login' ? (
          <>
            Don&apos;t have an account?{' '}
            <button type="button" onClick={() => switchMode('register')} className="font-bold text-brand hover:underline">
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => switchMode('login')} className="font-bold text-brand hover:underline">
              Sign In
            </button>
          </>
        )}
      </p>

      <div className="mt-5 pt-4 border-t border-neutral-100 text-xs text-ink-tertiary space-y-2">
        <p>Password reset is handled by the yard office (no automatic email reset yet):</p>
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
