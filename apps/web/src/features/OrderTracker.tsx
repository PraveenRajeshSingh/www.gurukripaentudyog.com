'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatINR, formatNum } from '@gurukripa/api-contracts';
import { api, formatDateTime } from '@/lib/client-api';
import type { MeOrder } from '@/types/account';
import { ORDER_STEPS } from '@/types/account';
import StatusPill from '@/components/ui/StatusPill';
import { Spinner, TruckIcon, PhoneIcon, MessageIcon, UserIcon, AlertIcon } from '@/components/ui/icons';

interface TimelineEvent {
  fromStatus: string;
  toStatus: string;
  note?: string;
  actorName: string;
  at: string;
}

const btnGhost =
  'inline-flex items-center justify-center gap-2 border border-neutral-300 hover:bg-neutral-100 text-[#1C1009] text-sm font-bold min-h-[44px] px-4 rounded-lg transition';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 bg-[#C8460A] hover:bg-[#8B2E05] text-white text-sm font-bold min-h-[44px] px-4 rounded-lg transition';

const STEP_LABELS: Record<string, string> = {
  CONFIRMED: 'Order confirmed',
  PRODUCTION: 'In kiln production',
  DISPATCHED: 'Loaded & dispatched',
  DELIVERED: 'Delivered to site',
};

export default function OrderTracker() {
  const [auth, setAuth] = useState<'checking' | 'anon' | 'authed' | 'unavailable'>('checking');
  const [orders, setOrders] = useState<MeOrder[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState<(MeOrder & { timeline?: TimelineEvent[] }) | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [listError, setListError] = useState('');

  // Deep link from the account dashboard: /tracker?id=<order id>
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) setSelectedId(id);
  }, []);

  const loadOrders = useCallback(() => {
    setListError('');
    api('me/orders').then((r) => {
      if (r.status === 401) return setAuth('anon');
      if (r.status === 503) return setAuth('unavailable');
      if (!r.ok) {
        setAuth('authed');
        setListError(r.message || 'Could not load your orders.');
        return;
      }
      setAuth('authed');
      const list = ((r.json as any)?.data ?? []) as MeOrder[];
      setOrders(list);
      setSelectedId((cur) => cur || list[0]?.id || '');
    });
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailBusy(true);
    api(`me/orders/${encodeURIComponent(selectedId)}`).then((r) => {
      setDetailBusy(false);
      if (r.ok && (r.json as any)?.data) setDetail((r.json as any).data);
      else setDetail(null);
    });
  }, [selectedId]);

  // ------------------------------------------------------------- guest view
  if (auth === 'checking') {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[#6B5545]" role="status">
        <Spinner className="w-5 h-5 animate-spin" /> Loading your orders…
      </div>
    );
  }

  if (auth !== 'authed') {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 max-w-xl mx-auto text-center space-y-4">
        <TruckIcon className="w-9 h-9 text-[#C8460A] mx-auto" />
        <h2 className="text-lg font-black text-[#1C1009]">
          {auth === 'unavailable' ? 'Tracking service unavailable' : 'Sign in to track your orders'}
        </h2>
        <p className="text-sm text-[#6B5545]">
          {auth === 'unavailable'
            ? 'The kiln service is not reachable right now, so live order status cannot be shown.'
            : 'Order status comes straight from the kiln workflow — it is tied to your account, so a quick sign-in is required.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {auth === 'unavailable' ? (
            <button onClick={loadOrders} className={btnPrimary}>Try again</button>
          ) : (
            <Link href="/profile" className={btnPrimary}>
              <UserIcon className="w-4 h-4" /> Sign in
            </Link>
          )}
          <a href="tel:+919198923230" className={btnGhost}>
            <PhoneIcon className="w-4 h-4" /> Ask dispatch: +91 91989 23230
          </a>
        </div>
      </div>
    );
  }

  if (listError) {
    return (
      <div role="alert" className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-4 flex flex-wrap items-center gap-3 max-w-xl mx-auto">
        <AlertIcon className="w-5 h-5 shrink-0" />
        <span className="flex-1">{listError}</span>
        <button onClick={loadOrders} className={btnGhost}>Retry</button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="border border-dashed border-neutral-300 rounded-lg p-8 text-center max-w-xl mx-auto">
        <p className="text-sm text-[#4A3728] mb-3">
          No orders on this account yet. Orders are created automatically when you approve a
          quotation prepared by the kiln team.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/profile" className={btnPrimary}>View quotations</Link>
          <Link href="/contact" className={btnGhost}>
            <MessageIcon className="w-4 h-4" /> Start an enquiry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Order picker */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <label htmlFor="ot-order" className="block text-sm font-bold text-[#4A3728] mb-1">
          Select order
        </label>
        <select
          id="ot-order"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full min-h-[48px] px-3 py-2.5 border border-neutral-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#C8460A] bg-white"
        >
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.number} — {formatDateShort(o.createdAt)} — {o.status}
            </option>
          ))}
        </select>
      </div>

      {/* Detail */}
      {detailBusy || !detail ? (
        <div className="flex items-center justify-center gap-2 py-10 text-[#6B5545]" role="status">
          <Spinner className="w-4 h-4 animate-spin" /> Loading order status…
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-black text-lg text-[#1C1009]">{detail.number}</h2>
            <StatusPill status={detail.status} />
          </div>

          {detail.status === 'CANCELLED' ? (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-4">
              This order was cancelled. Contact dispatch before planning any reload:
              {' '}
              <a href="tel:+919198923230" className="underline font-bold">+91 91989 23230</a>.
            </div>
          ) : (
            <ol className="relative space-y-6 list-none p-0 m-0" aria-label="Order progress">
              {ORDER_STEPS.map((step, idx) => {
                const currentIdx = ORDER_STEPS.indexOf(detail.status);
                const done = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <li key={step} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        aria-hidden
                        className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                          done ? 'bg-[#C8460A] border-[#C8460A]' : 'bg-white border-neutral-300'
                        }`}
                      />
                      {idx < ORDER_STEPS.length - 1 && (
                        <span aria-hidden className={`w-0.5 flex-1 min-h-[24px] ${done ? 'bg-[#C8460A]' : 'bg-neutral-200'}`} />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className={`text-sm font-bold ${done ? 'text-[#1C1009]' : 'text-neutral-400'}`}>
                        {STEP_LABELS[step]}
                        {isCurrent && <span className="ml-2 text-[11px] font-bold text-[#C8460A] uppercase">current</span>}
                      </p>
                      {done && (
                        <p className="text-xs text-[#6B5545]">
                          {stepEventTime(detail.timeline, step)}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Order facts from the backend */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm m-0">
            <div className="p-3 bg-[#FAFAF9] rounded-lg">
              <dt className="text-[11px] font-bold text-neutral-500 uppercase">Deliver to</dt>
              <dd className="font-bold text-[#1C1009] mt-0.5">{detail.deliveryAddress}, {detail.deliveryCity}</dd>
            </div>
            <div className="p-3 bg-[#FAFAF9] rounded-lg">
              <dt className="text-[11px] font-bold text-neutral-500 uppercase">Expected delivery</dt>
              <dd className="font-bold text-[#1C1009] mt-0.5">
                {detail.expectedDelivery ? formatDateShort(detail.expectedDelivery) : 'Being confirmed by dispatch'}
              </dd>
            </div>
            <div className="p-3 bg-[#FAFAF9] rounded-lg">
              <dt className="text-[11px] font-bold text-neutral-500 uppercase">Payment</dt>
              <dd className="font-bold text-[#1C1009] mt-0.5">{detail.paymentMethod}</dd>
            </div>
            <div className="p-3 bg-[#FAFAF9] rounded-lg">
              <dt className="text-[11px] font-bold text-neutral-500 uppercase">Order total (incl. GST)</dt>
              <dd className="font-bold text-[#C8460A] mt-0.5">{formatINR(detail.total)}</dd>
            </div>
          </dl>

          <div>
            <h3 className="text-xs font-extrabold text-[#1C1009] uppercase tracking-wider mb-2">Items</h3>
            <ul className="text-xs text-[#4A3728] space-y-1 list-none p-0 m-0">
              {detail.lines.map((l, i) => (
                <li key={i}>• {formatNum(l.quantity)} {l.unit} — {l.name} ({formatINR(l.unitPrice)}/{l.unit.replace(/s$/, '')})</li>
              ))}
            </ul>
          </div>

          {detail.timeline && detail.timeline.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold text-[#1C1009] uppercase tracking-wider mb-2">
                Activity log
              </h3>
              <ul className="space-y-2 text-xs list-none p-0 m-0">
                {detail.timeline.map((t, i) => (
                  <li key={i} className="border-l-2 border-neutral-200 pl-3 py-0.5">
                    <span className="font-bold text-[#1C1009]">{formatDateTime(t.at)}</span>{' '}
                    — {t.fromStatus !== 'NEW' && t.fromStatus !== '' ? `${t.fromStatus} → ` : ''}{t.toStatus}
                    <span className="text-neutral-500 block">by {t.actorName}{t.note ? ` · ${t.note}` : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-neutral-500">
            Status updates are recorded by kiln staff at each step. For on-road position of your
            trolley, call dispatch with the order number.
          </p>
        </div>
      )}
    </div>
  );
}

function formatDateShort(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

function stepEventTime(timeline: TimelineEvent[] | undefined, step: string): string {
  const hit = timeline?.filter((t) => t.toStatus === step).pop();
  return hit ? formatDateTime(hit.at) : 'Recorded (date unavailable)';
}
