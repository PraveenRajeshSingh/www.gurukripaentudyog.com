import React from 'react';
import OrderTracker from '@/features/OrderTracker';

export const metadata = {
  title: 'Track Trolley Delivery | Gurukripa Ent Udyog',
  description: 'Track real-time kiln dispatch and tractor trolley delivery status across Jaunpur, Varanasi, and Eastern UP.'
};

export default function TrackerPage() {
  return (
    <div className="py-12 container mx-auto px-4">
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#C8460A] bg-[rgba(200,70,10,0.08)] px-3 py-1 rounded-full">
          Live Dispatch
        </span>
        <h1 className="text-3xl font-black text-[#1C1009] mt-3">
          Trolley Order Tracking
        </h1>
        <p className="text-xs text-[#6B5545] mt-2">
          Monitor your brick order from kiln chamber firing to trolley loading and road transit to your construction site.
        </p>
      </div>

      <OrderTracker />
    </div>
  );
}
