'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatINR, formatNum } from '@gurukripa/api-contracts';
import { api, formatDateTime } from '@/lib/client-api';
import type { MeOrder } from '@/types/account';
import { ORDER_STEPS } from '@/types/account';
import StatusPill from '@/components/ui/StatusPill';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import PageLoader from '@/components/ui/PageLoader';
import { SelectField } from '@/components/ui/Field';
import { TruckIcon, PhoneIcon, MessageIcon, UserIcon } from '@/components/ui/icons';

interface TimelineEvent {
  fromStatus: string;
  toStatus: string;
  note?: string;
  actorName: string;
  at: string;
}

const STEP_LABELS: Record<string, string> = {
  CONFIRMED: 'Order confirmed',
  PRODUCTION: 'In kiln production',
  DISPATCHED: 'Loaded & dispatched',
  DELIVERED: 'Delivered to site',
};

/**
 * Auth-gated order timeline. Does not invent GPS/map positions —
 * on-road location still requires a dispatch call with the order number.
 */
export default function OrderTracker() {
  const [auth, setAuth] = useState<'checking' | 'anon' | 'authed' | 'unavailable'>('checking');
  const [orders, setOrders] = useState<MeOrder[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState<(MeOrder & { timeline?: TimelineEvent[] }) | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [listError, setListError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

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
        setListError(r.error?.message || r.message || 'Could not load your orders.');
        return;
      }
      setAuth('authed');
      setUpdatedAt(new Date().toISOString());
      const list = ((r.json as { data?: MeOrder[] })?.data ?? []) as MeOrder[];
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
      if (r.ok && (r.json as { data?: MeOrder })?.data) {
        setDetail((r.json as { data: MeOrder & { timeline?: TimelineEvent[] } }).data);
        setUpdatedAt(new Date().toISOString());
      } else setDetail(null);
    });
  }, [selectedId]);

  if (auth === 'checking') {
    return <PageLoader label="Loading your orders…" variant="inline" />;
  }

  if (auth !== 'authed') {
    return (
      <Card padding="lg" className="max-w-xl mx-auto text-center space-y-4">
        <TruckIcon className="w-9 h-9 text-brand mx-auto" />
        <h2 className="text-lg font-display font-black text-ink-primary">
          {auth === 'unavailable' ? 'Tracking service unavailable' : 'Sign in to track your orders'}
        </h2>
        <p className="text-sm text-ink-tertiary">
          {auth === 'unavailable'
            ? 'The kiln service is not reachable right now, so live order status cannot be shown.'
            : 'Order status comes straight from the kiln workflow — it is tied to your account, so a quick sign-in is required.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {auth === 'unavailable' ? (
            <Button variant="primary" onClick={loadOrders}>
              Try again
            </Button>
          ) : (
            <Link href="/profile" className="brand-btn-primary">
              <UserIcon className="w-4 h-4" /> Sign in
            </Link>
          )}
          <a href="tel:+919198923230" className="brand-btn-outline">
            <PhoneIcon className="w-4 h-4" /> Ask dispatch: +91 91989 23230
          </a>
        </div>
      </Card>
    );
  }

  if (listError) {
    return (
      <div className="max-w-xl mx-auto">
        <Alert tone="error" title="Could not load orders">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex-1">{listError}</span>
            <Button variant="outline" size="sm" onClick={loadOrders}>
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<TruckIcon className="w-5 h-5" />}
        title="No orders on this account yet"
        description="Orders are created automatically when you approve a quotation prepared by the kiln team."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/profile" className="brand-btn-primary">
              View quotations
            </Link>
            <Link href="/contact" className="brand-btn-outline">
              <MessageIcon className="w-4 h-4" /> Start an enquiry
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card padding="sm" className="!p-4">
        <SelectField
          id="ot-order"
          label="Select order"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.number} — {formatDateShort(o.createdAt)} — {o.status}
            </option>
          ))}
        </SelectField>
        {updatedAt && (
          <p className="text-[11px] text-ink-tertiary mt-2" role="status">
            Last refreshed {formatDateTime(updatedAt)}. Status is staff-recorded — not a live GPS map.
          </p>
        )}
      </Card>

      {detailBusy || !detail ? (
        <PageLoader label="Loading order status…" variant="inline" />
      ) : (
        <Card padding="md" className="space-y-5 !p-0 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-brand via-brand-amber to-brand-dark" aria-hidden />
          <div className="px-5 pt-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display font-black text-lg text-ink-primary">{detail.number}</h2>
            <StatusPill status={detail.status} />
          </div>
          <div className="px-5 pb-5 space-y-5">

          {detail.status === 'CANCELLED' ? (
            <Alert tone="error" title="Order cancelled">
              Contact dispatch before planning any reload:{' '}
              <a href="tel:+919198923230" className="underline font-bold">
                +91 91989 23230
              </a>
              .
            </Alert>
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
                          done ? 'bg-brand border-brand' : 'bg-white border-neutral-300'
                        }`}
                      />
                      {idx < ORDER_STEPS.length - 1 && (
                        <span
                          aria-hidden
                          className={`w-0.5 flex-1 min-h-[24px] ${done ? 'bg-brand' : 'bg-neutral-200'}`}
                        />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className={`text-sm font-bold ${done ? 'text-ink-primary' : 'text-neutral-400'}`}>
                        {STEP_LABELS[step]}
                        {isCurrent && (
                          <span className="ml-2 text-[11px] font-bold text-brand uppercase">current</span>
                        )}
                      </p>
                      {done && (
                        <p className="text-xs text-ink-tertiary">{stepEventTime(detail.timeline, step)}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm m-0">
            <div className="p-3 bg-surface-subtle rounded-lg">
              <dt className="text-[11px] font-bold text-neutral-500 uppercase">Deliver to</dt>
              <dd className="font-bold text-ink-primary mt-0.5">
                {detail.deliveryAddress}, {detail.deliveryCity}
              </dd>
            </div>
            <div className="p-3 bg-surface-subtle rounded-lg">
              <dt className="text-[11px] font-bold text-neutral-500 uppercase">Expected delivery</dt>
              <dd className="font-bold text-ink-primary mt-0.5">
                {detail.expectedDelivery
                  ? formatDateShort(detail.expectedDelivery)
                  : 'Being confirmed by dispatch'}
              </dd>
            </div>
            <div className="p-3 bg-surface-subtle rounded-lg">
              <dt className="text-[11px] font-bold text-neutral-500 uppercase">Payment</dt>
              <dd className="font-bold text-ink-primary mt-0.5">{detail.paymentMethod}</dd>
            </div>
            <div className="p-3 bg-surface-subtle rounded-lg">
              <dt className="text-[11px] font-bold text-neutral-500 uppercase">Order total (incl. GST)</dt>
              <dd className="font-bold text-brand mt-0.5">{formatINR(detail.total)}</dd>
            </div>
          </dl>

          <div>
            <h3 className="text-xs font-extrabold text-ink-primary uppercase tracking-wider mb-2">Items</h3>
            <ul className="text-xs text-ink-secondary space-y-1 list-none p-0 m-0">
              {detail.lines.map((l, i) => (
                <li key={i}>
                  • {formatNum(l.quantity)} {l.unit} — {l.name} (
                  {formatINR(l.unitPrice)}/{l.unit.replace(/s$/, '')})
                </li>
              ))}
            </ul>
          </div>

          {detail.timeline && detail.timeline.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold text-ink-primary uppercase tracking-wider mb-2">
                Activity log
              </h3>
              <ul className="space-y-2 text-xs list-none p-0 m-0">
                {detail.timeline.map((t, i) => (
                  <li key={i} className="border-l-2 border-neutral-200 pl-3 py-0.5">
                    <span className="font-bold text-ink-primary">{formatDateTime(t.at)}</span> —{' '}
                    {t.fromStatus !== 'NEW' && t.fromStatus !== '' ? `${t.fromStatus} → ` : ''}
                    {t.toStatus}
                    <span className="text-neutral-500 block">
                      by {t.actorName}
                      {t.note ? ` · ${t.note}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button variant="outline" size="sm" onClick={loadOrders}>
              Refresh status
            </Button>
            <a href="tel:+919198923230" className="brand-btn-outline !min-h-[40px] !text-xs">
              <PhoneIcon className="w-4 h-4" /> Call dispatch for trolley position
            </a>
          </div>

          <p className="text-xs text-neutral-500">
            Status updates are recorded by kiln staff at each step. This screen does not fabricate
            map coordinates or ETA — ask dispatch with your order number for on-road position.
          </p>
          </div>
        </Card>
      )}
    </div>
  );
}

function formatDateShort(iso?: string) {
  return iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
}

function stepEventTime(timeline: TimelineEvent[] | undefined, step: string): string {
  const hit = timeline?.filter((t) => t.toStatus === step).pop();
  return hit ? formatDateTime(hit.at) : 'Recorded (date unavailable)';
}
