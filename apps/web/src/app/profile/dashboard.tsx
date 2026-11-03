'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatINR, formatNum } from '@gurukripa/api-contracts';
import { api, formatDate } from '@/lib/client-api';
import { setSiteLang } from '@/lib/lang';
import { SESSION_EVENT, notifySessionChange } from '@/lib/session';
import type { MeUser, MeAddress, MeEnquiry, MeQuotation, MeOrder } from '@/types/account';
import Modal from '@/components/ui/Modal';
import StatusPill from '@/components/ui/StatusPill';
import AuthCard from './auth-card';
import {
  Spinner, EditIcon, LogoutIcon, TrashIcon, TruckIcon, MessageIcon,
  BuildingIcon, PhoneIcon, AlertIcon, UserIcon, CheckCircleIcon,
} from '@/components/ui/icons';

const inputCls =
  'w-full min-h-[48px] px-3.5 py-2.5 border border-neutral-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#C8460A]';
const labelCls = 'block text-sm font-bold text-[#4A3728] mb-1';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 bg-[#C8460A] hover:bg-[#8B2E05] disabled:opacity-60 text-white text-sm font-bold min-h-[44px] px-4 rounded-lg transition';
const btnGhost =
  'inline-flex items-center justify-center gap-2 border border-neutral-300 hover:bg-neutral-100 text-[#1C1009] text-sm font-bold min-h-[44px] px-4 rounded-lg transition';

type Session = 'loading' | 'anon' | 'authed' | 'unavailable';
type Tab = 'profile' | 'enquiries' | 'quotations' | 'orders' | 'addresses';

/** Loads a /api/me/* list endpoint when its tab is active. */
function useList<T>(path: string, active: boolean) {
  const [items, setItems] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    setLoading(true);
    setError('');
    api(path).then((r) => {
      if (!alive) return;
      const data = (r.json as any)?.data;
      if (r.ok && Array.isArray(data)) setItems(data as T[]);
      else {
        setItems(null);
        setError(r.status === 503 ? r.message : r.message || 'Could not load this list.');
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [path, active, tick]);

  return { items, loading, error, reload: () => setTick((t) => t + 1) };
}

function ListState({ loading, error, onRetry }: {
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  if (loading)
    return (
      <div className="flex items-center gap-2 text-sm text-[#6B5545] p-6 justify-center">
        <Spinner className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  if (error)
    return (
      <div role="alert" className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-4 flex flex-wrap items-center gap-3">
        <AlertIcon className="w-5 h-5 shrink-0" />
        <span className="flex-1">{error}</span>
        <button onClick={onRetry} className={btnGhost}>Retry</button>
      </div>
    );
  return null;
}

export default function AccountPortal() {
  const [session, setSession] = useState<Session>('loading');
  const [user, setUser] = useState<MeUser | null>(null);
  const [tab, setTab] = useState<Tab>('profile');
  const [notice, setNotice] = useState('');
  const [logoutOpen, setLogoutOpen] = useState(false);

  const checkSession = useCallback(() => {
    setSession('loading');
    api('me/profile').then((r) => {
      if (r.ok && (r.json as any)?.data) {
        setUser((r.json as any).data as MeUser);
        setSession('authed');
      } else if (r.status === 401) {
        setSession('anon');
      } else {
        setSession(r.status === 503 ? 'unavailable' : 'anon');
      }
    });
  }, []);

  useEffect(() => {
    checkSession();
    // Keep in sync with the navbar's account menu (sign-out elsewhere).
    window.addEventListener(SESSION_EVENT, checkSession);
    return () => window.removeEventListener(SESSION_EVENT, checkSession);
  }, [checkSession]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  // ---------------------------------------------------------------- actions
  const logout = async () => {
    await api('login', { method: 'DELETE' });
    setUser(null);
    setSession('anon');
    setLogoutOpen(false);
    setNotice('You have been signed out.');
    notifySessionChange();
  };

  // --------------------------------------------------------------- rendering
  if (session === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-[#6B5545]" role="status">
        <Spinner className="w-5 h-5 animate-spin" /> Checking your session…
      </div>
    );
  }

  if (session === 'unavailable') {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 max-w-md mx-auto text-center space-y-4">
        <AlertIcon className="w-8 h-8 text-amber-600 mx-auto" />
        <h2 className="text-lg font-black text-[#1C1009]">Account service unavailable</h2>
        <p className="text-sm text-[#6B5545]">
          The kiln account service is not reachable right now. Your data is safe — sign-in and
          history will work again as soon as the service is back.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={checkSession} className={btnPrimary}>Try again</button>
          <a href="tel:+919198923230" className={btnGhost}>
            <PhoneIcon className="w-4 h-4" /> Call the kiln
          </a>
        </div>
      </div>
    );
  }

  if (session === 'anon' || !user) {
    return <AuthCard onSignedIn={(u) => { setUser(u); setSession('authed'); setTab('profile'); notifySessionChange(); }} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-wrap items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#8B2E05] text-white flex items-center justify-center font-black text-lg shrink-0" aria-hidden>
          {user.name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-[180px]">
          <h1 className="text-lg sm:text-xl font-black text-[#1C1009]">{user.name}</h1>
          <p className="text-xs text-[#6B5545]">
            {user.role === 'DEALER' ? 'Dealer account' : 'Customer account'} · +91 {user.phone} ·
            since {formatDate(user.createdAt)}
          </p>
        </div>
        <button onClick={() => setLogoutOpen(true)} className={`${btnGhost} text-red-700 border-red-200 hover:bg-red-50`}>
          <LogoutIcon className="w-4 h-4" /> Sign out
        </button>
      </div>

      <div aria-live="polite">
        {notice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg p-3" role="status">
            {notice}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Account sections">
        {(
          [
            ['profile', 'Profile', UserIcon],
            ['enquiries', 'My enquiries', MessageIcon],
            ['quotations', 'Quotations', CheckCircleIcon],
            ['orders', 'Orders', TruckIcon],
            ['addresses', 'Addresses', BuildingIcon],
          ] as [Tab, string, (p: { className?: string }) => React.ReactElement][]
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-full text-sm font-bold whitespace-nowrap border transition ${
              tab === id
                ? 'bg-[#C8460A] text-white border-[#C8460A]'
                : 'bg-white border-neutral-200 text-[#4A3728] hover:border-[#C8460A]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab user={user} onSaved={(u) => { setUser(u); setNotice('Profile updated on the server.'); notifySessionChange(); }} />}
      {tab === 'enquiries' && <EnquiriesTab />}
      {tab === 'quotations' && <QuotationsTab onActioned={setNotice} />}
      {tab === 'orders' && <OrdersTab onActioned={setNotice} />}
      {tab === 'addresses' && <AddressesTab onActioned={setNotice} />}

      {/* Logout confirmation */}
      <Modal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Sign out?"
        description="You will need your phone number and password to view enquiries, quotations and orders again."
        alert
        maxWidth="sm"
      >
        <div className="flex gap-3 pt-2">
          <button onClick={() => setLogoutOpen(false)} className={`${btnGhost} flex-1`} data-autofocus>
            Stay signed in
          </button>
          <button
            onClick={logout}
            className="flex-1 inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white text-sm font-bold min-h-[44px] px-4 rounded-lg transition"
          >
            Sign out
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ------------------------------------------------------------------ Profile
function ProfileTab({ user, onSaved }: { user: MeUser; onSaved: (u: MeUser) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: user.name, email: user.email ?? '', language: user.language ?? 'en' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const isDirty =
    form.name !== user.name || form.email !== (user.email ?? '') || form.language !== (user.language ?? 'en');

  const openEdit = () => {
    setForm({ name: user.name, email: user.email ?? '', language: user.language ?? 'en' });
    setErrors({});
    setSaveError('');
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2 || form.name.trim().length > 80) errs.name = 'Name must be 2–80 characters.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) errs.email = 'Enter a valid email or leave blank.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    setSaveError('');
    const r = await api('me/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        language: form.language,
      }),
    });
    setBusy(false);
    if (r.ok && (r.json as any)?.data) {
      const updated = (r.json as any).data as MeUser;
      onSaved(updated);
      // Flip the site chrome instantly to the saved preference ('en'|'hi';
      // Marathi falls back to English so untranslated UI never breaks).
      setSiteLang(updated.language);
      setOpen(false);
    } else {
      setSaveError(r.message || 'The server rejected the update — nothing was saved.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-extrabold text-[#1C1009] uppercase tracking-wider">Personal details</h2>
          <button onClick={openEdit} className={btnGhost}>
            <EditIcon className="w-4 h-4" /> Edit
          </button>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm m-0">
          <div className="p-3 bg-[#FAFAF9] rounded-lg">
            <dt className="text-[11px] font-bold text-neutral-500 uppercase">Full name</dt>
            <dd className="font-bold text-[#1C1009] mt-0.5">{user.name}</dd>
          </div>
          <div className="p-3 bg-[#FAFAF9] rounded-lg">
            <dt className="text-[11px] font-bold text-neutral-500 uppercase">Mobile (login ID)</dt>
            <dd className="font-bold text-[#1C1009] mt-0.5">+91 {user.phone}</dd>
          </div>
          <div className="p-3 bg-[#FAFAF9] rounded-lg">
            <dt className="text-[11px] font-bold text-neutral-500 uppercase">Email</dt>
            <dd className="font-bold text-[#1C1009] mt-0.5">{user.email || 'Not set'}</dd>
          </div>
          <div className="p-3 bg-[#FAFAF9] rounded-lg">
            <dt className="text-[11px] font-bold text-neutral-500 uppercase">Language</dt>
            <dd className="font-bold text-[#1C1009] mt-0.5">
              {user.language === 'hi' ? 'हिन्दी (Hindi)' : user.language === 'mr' ? 'मराठी (Marathi)' : 'English'}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-neutral-500 mt-3">
          The mobile number is your login ID. To change it, call the kiln office — account merges
          are handled manually for safety.
        </p>
      </section>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit profile" isDirty={isDirty} busy={busy} maxWidth="md">
        <form onSubmit={save} className="space-y-4">
          {saveError && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3">
              {saveError}
            </div>
          )}
          <div>
            <label htmlFor="pf-name" className={labelCls}>Full name *</label>
            <input id="pf-name" type="text" value={form.name} autoComplete="name"
              onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            {errors.name && <p role="alert" className="text-red-600 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="pf-email" className={labelCls}>Email</label>
            <input id="pf-email" type="email" value={form.email} autoComplete="email"
              onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
            {errors.email && <p role="alert" className="text-red-600 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="pf-lang" className={labelCls}>Preferred language</label>
            <select id="pf-lang" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as NonNullable<MeUser['language']> })} className={inputCls}>
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className={`${btnGhost} flex-1`}>Cancel</button>
            <button type="submit" disabled={busy || !isDirty} className={`${btnPrimary} flex-1`} data-autofocus>
              {busy ? <Spinner className="w-4 h-4 animate-spin" /> : null}
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------- Enquiries
function EnquiriesTab() {
  const { items, loading, error, reload } = useList<MeEnquiry>('me/enquiries', true);
  return (
    <section aria-label="My enquiries">
      <ListState loading={loading} error={error} onRetry={reload} />
      {!loading && !error && items && (
        items.length === 0 ? (
          <div className="border border-dashed border-neutral-300 rounded-lg p-8 text-center">
            <p className="text-sm text-[#4A3728] mb-3">No enquiries yet. Enquiries you send from the catalogue or contact page appear here.</p>
            <Link href="/contact" className={btnPrimary}>
              <MessageIcon className="w-4 h-4" /> Send an enquiry
            </Link>
          </div>
        ) : (
          <ul className="space-y-3 list-none p-0 m-0">
            {items.map((enq) => (
              <li key={enq.id} className="bg-white rounded-xl border border-neutral-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm text-[#1C1009]">Ref {enq.id}</h3>
                  <StatusPill status={enq.status} />
                </div>
                <p className="text-xs text-[#6B5545]">{formatDate(enq.createdAt)} · Site: {enq.siteLocation}</p>
                <ul className="mt-2 text-xs text-[#4A3728] space-y-0.5 list-none p-0 m-0">
                  {enq.lines.map((l, i) => (
                    <li key={i}>• {formatNum(l.quantity)} {l.unit} — {l.productName}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  );
}

// --------------------------------------------------------------- Quotations
function QuotationsTab({ onActioned }: { onActioned: (msg: string) => void }) {
  const { items, loading, error, reload } = useList<MeQuotation>('me/quotations', true);
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');
  const [rejecting, setRejecting] = useState<MeQuotation | null>(null);
  const [reason, setReason] = useState('');

  const act = async (q: MeQuotation, verb: 'approve' | 'reject', body?: unknown) => {
    setBusyId(q.id);
    setActionError('');
    const r = await api(`me/quotations/${q.id}/${verb}`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusyId('');
    if (r.ok) {
      onActioned(
        verb === 'approve'
          ? `Quotation ${q.number} approved — your order is confirmed with the kiln.`
          : `Quotation ${q.number} rejected. Our team will follow up.`
      );
      reload();
    } else {
      setActionError(r.message || 'The server did not accept this action.');
    }
  };

  return (
    <section aria-label="My quotations">
      <ListState loading={loading} error={error} onRetry={reload} />
      {actionError && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3 mb-3">{actionError}</div>
      )}
      {!loading && !error && items && (
        items.length === 0 ? (
          <p className="text-sm text-[#6B5545] border border-dashed border-neutral-300 rounded-lg p-6 text-center">
            Quotations prepared by the kiln team for your enquiries will appear here.
          </p>
        ) : (
          <ul className="space-y-3 list-none p-0 m-0">
            {items.map((q) => (
              <li key={q.id} className="bg-white rounded-xl border border-neutral-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm text-[#1C1009]">{q.number}</h3>
                  <StatusPill status={q.status} />
                </div>
                <p className="text-xs text-[#6B5545] mb-2">
                  Created {formatDate(q.createdAt)} · Valid until {formatDate(q.validUntil)}
                </p>
                <table className="w-full text-xs border-collapse mb-2">
                  <thead>
                    <tr className="text-left text-neutral-500">
                      <th className="py-1 font-bold">Item</th>
                      <th className="py-1 font-bold text-right">Qty</th>
                      <th className="py-1 font-bold text-right">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.lines.map((l, i) => (
                      <tr key={i} className="border-t border-neutral-100">
                        <td className="py-1.5">{l.name}</td>
                        <td className="py-1.5 text-right">{formatNum(l.quantity)} {l.unit}</td>
                        <td className="py-1.5 text-right">{formatINR(l.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-xs text-[#4A3728] space-y-0.5 mb-3">
                  {q.discountAmount > 0 && <p>Discount: −{formatINR(q.discountAmount)}</p>}
                  <p>GST (5%): {formatINR(q.cgst + q.sgst)} (CGST {formatINR(q.cgst)} + SGST {formatINR(q.sgst)})</p>
                  <p className="text-base font-black text-[#C8460A]">Total: {formatINR(q.total)}</p>
                </div>
                {q.status === 'SENT' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => act(q, 'approve')}
                      disabled={busyId === q.id}
                      className={`${btnPrimary} bg-emerald-700 hover:bg-emerald-800`}
                    >
                      {busyId === q.id ? <Spinner className="w-4 h-4 animate-spin" /> : null}
                      Approve & confirm order
                    </button>
                    <button
                      onClick={() => { setRejecting(q); setReason(''); }}
                      disabled={busyId === q.id}
                      className={btnGhost}
                    >
                      Reject / ask for changes
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )
      )}

      <Modal
        isOpen={!!rejecting}
        onClose={() => setRejecting(null)}
        title={rejecting ? `Reject ${rejecting.number}?` : ''}
        description="Optionally tell the kiln team why — they can revise the quotation."
        isDirty={!!reason}
        busy={busyId === rejecting?.id}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <label htmlFor="reject-reason" className={labelCls}>Reason (optional)</label>
          <textarea id="reject-reason" rows={3} value={reason} maxLength={500}
            onChange={(e) => setReason(e.target.value)} className={`${inputCls} min-h-[80px]`}
            placeholder="e.g. rate higher than discussed, need delivery by a certain date…" />
          <div className="flex gap-3 pt-1">
            <button onClick={() => setRejecting(null)} className={`${btnGhost} flex-1`} data-autofocus>Keep quotation</button>
            <button
              onClick={() => rejecting && act(rejecting, 'reject', { reason: reason.trim() || undefined })}
              disabled={busyId === rejecting?.id}
              className="flex-1 inline-flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold min-h-[44px] px-4 rounded-lg transition"
            >
              Reject quotation
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

// ------------------------------------------------------------------- Orders
const CANCELLABLE = ['CONFIRMED', 'PRODUCTION'];

function OrdersTab({ onActioned }: { onActioned: (msg: string) => void }) {
  const { items, loading, error, reload } = useList<MeOrder>('me/orders', true);
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancelling, setCancelling] = useState<MeOrder | null>(null);

  const act = async (o: MeOrder, verb: 'cancel' | 'reorder', body?: unknown) => {
    setBusyId(o.id);
    setActionError('');
    const r = await api(`me/orders/${o.id}/${verb}`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusyId('');
    if (r.ok) {
      onActioned(verb === 'cancel' ? `Order ${o.number} cancellation recorded.` : 'Same items re-submitted as a new enquiry.');
      setCancelling(null);
      reload();
    } else {
      setActionError(r.message || 'The server did not accept this action.');
    }
  };

  return (
    <section aria-label="My orders">
      <ListState loading={loading} error={error} onRetry={reload} />
      {actionError && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3 mb-3">{actionError}</div>
      )}
      {!loading && !error && items && (
        items.length === 0 ? (
          <p className="text-sm text-[#6B5545] border border-dashed border-neutral-300 rounded-lg p-6 text-center">
            No orders yet. Approving a quotation creates a confirmed order here.
          </p>
        ) : (
          <ul className="space-y-3 list-none p-0 m-0">
            {items.map((o) => (
              <li key={o.id} className="bg-white rounded-xl border border-neutral-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm text-[#1C1009]">{o.number}</h3>
                  <StatusPill status={o.status} />
                </div>
                <p className="text-xs text-[#6B5545]">
                  {formatDate(o.createdAt)} · {o.deliveryAddress}, {o.deliveryCity}
                </p>
                <p className="text-xs text-[#6B5545] mb-2">
                  {o.expectedDelivery ? `Expected delivery: ${formatDate(o.expectedDelivery)}` : 'Delivery date being confirmed by dispatch'} · {o.paymentMethod}
                </p>
                <p className="text-base font-black text-[#C8460A] mb-3">{formatINR(o.total)}</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/tracker?id=${encodeURIComponent(o.id)}`} className={btnGhost}>
                    <TruckIcon className="w-4 h-4" /> Track
                  </Link>
                  <button
                    onClick={() => act(o, 'reorder')}
                    disabled={busyId === o.id}
                    className={btnPrimary}
                  >
                    {busyId === o.id ? <Spinner className="w-4 h-4 animate-spin" /> : null}
                    Reorder
                  </button>
                  {CANCELLABLE.includes(o.status) && (
                    <button
                      onClick={() => setCancelling(o)}
                      disabled={busyId === o.id}
                      className={btnGhost + ' text-red-700 border-red-200 hover:bg-red-50'}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      <Modal
        isOpen={!!cancelling}
        onClose={() => setCancelling(null)}
        title={cancelling ? `Cancel order ${cancelling.number}?` : ''}
        description="Cancellation is recorded with the kiln. If bricks are already dispatched, the team will contact you."
        alert
        busy={busyId === cancelling?.id}
        maxWidth="sm"
      >
        <div className="flex gap-3 pt-2">
          <button onClick={() => setCancelling(null)} className={`${btnGhost} flex-1`} data-autofocus>Keep order</button>
          <button
            onClick={() => cancelling && act(cancelling, 'cancel')}
            disabled={busyId === cancelling?.id}
            className="flex-1 inline-flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold min-h-[44px] px-4 rounded-lg transition"
          >
            Cancel order
          </button>
        </div>
      </Modal>
    </section>
  );
}

// ---------------------------------------------------------------- Addresses
const PINCODE_RE = /^[1-9]\d{5}$/;

function AddressesTab({ onActioned }: { onActioned: (msg: string) => void }) {
  const { items, loading, error, reload } = useList<MeAddress>('me/addresses', true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: '', line1: '', city: '', state: 'Uttar Pradesh', pincode: '', isDefault: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [localErr, setLocalErr] = useState('');

  const isDirty = !!(form.label || form.line1 || form.city || form.pincode);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    if (form.label.trim().length < 2) errs.label = 'Give this address a short label (e.g. "Site 1").';
    if (form.line1.trim().length < 4) errs.line1 = 'Street / area line is required (4+ characters).';
    if (form.city.trim().length < 2) errs.city = 'City is required.';
    if (form.state.trim().length < 2) errs.state = 'State is required.';
    if (!PINCODE_RE.test(form.pincode)) errs.pincode = 'Enter a valid 6-digit PIN code.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    setSaveError('');
    const r = await api('me/addresses', {
      method: 'POST',
      body: JSON.stringify({
        label: form.label.trim(),
        line1: form.line1.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode,
        isDefault: form.isDefault,
      }),
    });
    setBusy(false);
    if (r.ok) {
      setOpen(false);
      setForm({ label: '', line1: '', city: '', state: 'Uttar Pradesh', pincode: '', isDefault: false });
      onActioned('Address saved.');
      reload();
    } else {
      setSaveError(r.message || 'Could not save the address.');
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    const r = await api(`me/addresses/${id}`, { method: 'DELETE' });
    setDeletingId('');
    if (r.ok) {
      onActioned('Address removed.');
      reload();
    } else {
      setLocalErr(r.message || 'Could not remove the address.');
    }
  };

  return (
    <section aria-label="Saved addresses">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-extrabold text-[#1C1009] uppercase tracking-wider">Delivery / site addresses</h2>
        <button onClick={() => setOpen(true)} className={btnGhost}>
          <BuildingIcon className="w-4 h-4" /> Add address
        </button>
      </div>
      {localErr && <div role="alert" className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3 mb-3">{localErr}</div>}
      <ListState loading={loading} error={error} onRetry={reload} />
      {!loading && !error && items && items.length === 0 && (
        <p className="text-sm text-[#6B5545] border border-dashed border-neutral-300 rounded-lg p-6 text-center">
          No saved addresses yet. Add your construction site so enquiries and orders use it directly.
        </p>
      )}
      {!loading && !error && items && items.length > 0 && (
        <ul className="space-y-3 list-none p-0 m-0">
          {items.map((a) => (
            <li key={a.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-wrap items-start gap-2">
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-bold text-sm text-[#1C1009]">
                  {a.label}
                  {a.isDefault && (
                    <span className="ml-2 text-[11px] font-bold bg-[rgba(200,70,10,0.1)] text-[#C8460A] px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[#6B5545] mt-1">{a.line1}, {a.city}, {a.state} — {a.pincode}</p>
              </div>
              <button
                onClick={() => remove(a.id)}
                disabled={deletingId === a.id}
                aria-label={`Remove address ${a.label}`}
                className="w-11 h-11 inline-flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
              >
                {deletingId === a.id ? <Spinner className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add delivery address" isDirty={isDirty} busy={busy} maxWidth="md">
        <form onSubmit={save} className="space-y-4">
          {saveError && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3">{saveError}</div>
          )}
          <div>
            <label htmlFor="ad-label" className={labelCls}>Label *</label>
            <input id="ad-label" type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
              className={inputCls} placeholder="e.g. Home site — Lanka" />
            {errors.label && <p role="alert" className="text-red-600 text-xs mt-1">{errors.label}</p>}
          </div>
          <div>
            <label htmlFor="ad-line1" className={labelCls}>Street / area *</label>
            <input id="ad-line1" type="text" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })}
              className={inputCls} placeholder="Neighbourhood, landmark, road" />
            {errors.line1 && <p role="alert" className="text-red-600 text-xs mt-1">{errors.line1}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ad-city" className={labelCls}>City *</label>
              <input id="ad-city" type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
              {errors.city && <p role="alert" className="text-red-600 text-xs mt-1">{errors.city}</p>}
            </div>
            <div>
              <label htmlFor="ad-state" className={labelCls}>State *</label>
              <input id="ad-state" type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputCls} />
              {errors.state && <p role="alert" className="text-red-600 text-xs mt-1">{errors.state}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="ad-pin" className={labelCls}>PIN code *</label>
              <input id="ad-pin" type="text" inputMode="numeric" maxLength={6} value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })} className={inputCls} />
              {errors.pincode && <p role="alert" className="text-red-600 text-xs mt-1">{errors.pincode}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-[#4A3728] min-h-[44px]">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="w-5 h-5 accent-[#C8460A]" />
              Use as default
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className={`${btnGhost} flex-1`}>Cancel</button>
            <button type="submit" disabled={busy} className={`${btnPrimary} flex-1`} data-autofocus>
              {busy ? <Spinner className="w-4 h-4 animate-spin" /> : null}
              {busy ? 'Saving…' : 'Save address'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
