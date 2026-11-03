'use client';

import React, { useState } from 'react';
import { api } from '@/lib/client-api';
import type { MeUser } from '@/types/account';
import { Spinner, PhoneIcon } from '@/components/ui/icons';

const PHONE_RE = /^[6-9]\d{9}$/;

const inputCls =
  'w-full min-h-[48px] px-3.5 py-2.5 border border-neutral-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#C8460A]';
const labelCls = 'block text-sm font-bold text-[#4A3728] mb-1';

export default function AuthCard({ onSignedIn }: { onSignedIn: (user: MeUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const digits = form.phone.replace(/\D/g, '').slice(-10);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!PHONE_RE.test(digits)) e.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (form.password.length < (mode === 'register' ? 8 : 1))
      e.password = mode === 'register' ? 'Password must be at least 8 characters.' : 'Enter your password.';
    if (mode === 'register') {
      if (form.name.trim().length < 2) e.name = 'Enter your full name.';
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) e.email = 'Enter a valid email or leave blank.';
      if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const finishLogin = async (phone: string, password: string) => {
    const r = await api('login', { method: 'POST', body: JSON.stringify({ phone, password }) });
    const user = (r.json as any)?.user as MeUser | undefined;
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
          // Registration returns a user, but the session cookie is set by /api/login.
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
    <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 max-w-md mx-auto">
      <h2 className="text-xl font-black text-[#1C1009] mb-1">
        {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
      </h2>
      <p className="text-sm text-[#6B5545] mb-5">
        Track enquiries, quotations and orders with the kiln.
      </p>

      {serverError && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3 mb-4">
          {serverError}
          {serverError.includes('not reach') && (
            <a href="tel:+919198923230" className="underline font-bold block mt-1">
              Call +91 91989 23230
            </a>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === 'register' && (
          <div>
            <label htmlFor="au-name" className={labelCls}>Full name *</label>
            <input id="au-name" type="text" autoComplete="name" value={form.name}
              onChange={(e) => set({ name: e.target.value })} className={inputCls} aria-invalid={!!errors.name} />
            {errors.name && <p role="alert" className="text-red-600 text-xs mt-1">{errors.name}</p>}
          </div>
        )}

        <div>
          <label htmlFor="au-phone" className={labelCls}>Mobile number *</label>
          <input id="au-phone" type="tel" inputMode="numeric" autoComplete="tel" maxLength={11}
            value={form.phone} onChange={(e) => set({ phone: e.target.value })}
            className={inputCls} placeholder="9876543210" aria-invalid={!!errors.phone} />
          {errors.phone && <p role="alert" className="text-red-600 text-xs mt-1">{errors.phone}</p>}
        </div>

        {mode === 'register' && (
          <div>
            <label htmlFor="au-email" className={labelCls}>Email (optional)</label>
            <input id="au-email" type="email" autoComplete="email" value={form.email}
              onChange={(e) => set({ email: e.target.value })} className={inputCls} aria-invalid={!!errors.email} />
            {errors.email && <p role="alert" className="text-red-600 text-xs mt-1">{errors.email}</p>}
          </div>
        )}

        <div>
          <label htmlFor="au-pass" className={labelCls}>Password *</label>
          <input id="au-pass" type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={form.password} onChange={(e) => set({ password: e.target.value })}
            className={inputCls} aria-invalid={!!errors.password} />
          {errors.password && <p role="alert" className="text-red-600 text-xs mt-1">{errors.password}</p>}
        </div>

        {mode === 'register' && (
          <div>
            <label htmlFor="au-confirm" className={labelCls}>Confirm password *</label>
            <input id="au-confirm" type="password" autoComplete="new-password" value={form.confirm}
              onChange={(e) => set({ confirm: e.target.value })} className={inputCls} aria-invalid={!!errors.confirm} />
            {errors.confirm && <p role="alert" className="text-red-600 text-xs mt-1">{errors.confirm}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#C8460A] hover:bg-[#8B2E05] disabled:opacity-60 text-white font-bold min-h-[48px] px-4 rounded-lg text-sm transition"
        >
          {busy && <Spinner className="w-4 h-4 animate-spin" />}
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <p className="text-sm text-center text-[#6B5545] mt-4">
        {mode === 'login' ? (
          <>
            New here?{' '}
            <button onClick={() => { setMode('register'); setServerError(''); }} className="font-bold text-[#C8460A] hover:underline">
              Create an account
            </button>
          </>
        ) : (
          <>
            Already registered?{' '}
            <button onClick={() => { setMode('login'); setServerError(''); }} className="font-bold text-[#C8460A] hover:underline">
              Sign in
            </button>
          </>
        )}
      </p>

      <div className="mt-5 pt-4 border-t border-neutral-100 text-xs text-[#6B5545] space-y-2">
        <p>
          Password reset is not available online yet — the kiln office resets passwords by phone:
        </p>
        <a href="tel:+919198923230" className="inline-flex items-center gap-1.5 font-bold text-[#C8460A] hover:underline min-h-[36px]">
          <PhoneIcon className="w-4 h-4" /> +91 91989 23230 (Mon–Sat, 8 AM – 6 PM)
        </a>
      </div>
    </div>
  );
}
