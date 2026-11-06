import React from 'react';
import OrderTracker from '@/features/OrderTracker';

export const metadata = {
  title: 'Track Trolley Delivery | Gurukripa Ent Udyog',
  description: 'Track real-time kiln dispatch and tractor trolley delivery status across Jaunpur, Varanasi, and Eastern UP.'
};

export default function TrackerPage() {
  return (
    <div className="py-8 sm:py-12 container mx-auto px-4 max-w-3xl">
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="section-eyebrow inline-block bg-brand-glow px-3 py-1 rounded-md">
          Live Dispatch
        </span>
        <h1 className="font-display text-3xl font-black text-ink-primary mt-3">
          Trolley Order Tracking
        </h1>
        <p className="text-sm text-ink-tertiary mt-2 text-pretty">
          Monitor your brick order from kiln chamber firing to trolley loading and road transit to your construction site.
        </p>
      </div>

      <OrderTracker />
    </div>
  );
}
