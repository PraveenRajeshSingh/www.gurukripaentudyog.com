import React from 'react';
import Link from 'next/link';
import BrandLogo from '../ui/BrandLogo';
import {
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
  ShieldIcon,
} from '../ui/icons';

export default function Footer() {
  return (
    <footer className="bg-ink-primary text-surface-bg pt-10 sm:pt-14 pb-[max(2rem,env(safe-area-inset-bottom))] border-t-4 border-brand">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <BrandLogo size={44} />
            <div>
              <span className="font-display font-bold text-lg tracking-tight block">Gurukripa Ent Udyog</span>
              <span className="text-xs text-neutral-400 block">गुरुकृपा ईंट उद्योग</span>
            </div>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed mb-4">
            Direct kiln manufacturer of double-fired red clay bricks, machine wirecut, and Awwal
            bricks. Serving Jaunpur, Varanasi, Sultanpur, and Eastern UP with count-verified
            trolley dispatch.
          </p>
          <p className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
            <ShieldIcon className="w-4 h-4" />
            5% GST Invoicing (CGST 2.5% + SGST 2.5%)
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-brand pl-2">
            Explore
          </h2>
          <ul className="space-y-1 text-xs text-neutral-300">
            {[
              ['/products', 'Brick Catalog & Trolley Rates'],
              ['/#estimator', '3-in-1 Material Estimator'],
              ['/services', 'Bulk Supply & Delivery'],
              ['/about', 'Kiln Process & Standards'],
              ['/tracker', 'Order & Trolley Tracker'],
              ['/contact', 'Request a Rate Quote'],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="hover:text-amber-400 transition inline-flex items-center min-h-[40px] py-1"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-brand pl-2">
            Delivery Areas
          </h2>
          <p className="text-xs text-neutral-300 mb-3">
            Tractor-trolley site delivery across the Jaunpur–Varanasi belt, including:
          </p>
          <ul className="grid grid-cols-2 gap-2 text-xs text-neutral-300 list-none">
            {['Jaunpur City', 'Varanasi (Lanka)', 'Jalalpur', 'Trilochan', 'Shahganj', 'Sultanpur'].map(
              (city) => (
                <li key={city} className="bg-white/5 p-2 rounded-md flex items-center gap-1.5 min-h-[40px]">
                  <MapPinIcon className="w-3.5 h-3.5 text-brand shrink-0" /> {city}
                </li>
              )
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-brand pl-2">
            Contact the Kiln
          </h2>
          <ul className="space-y-3 text-xs text-neutral-300 list-none">
            <li className="flex items-start gap-2">
              <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0 text-brand" aria-hidden="true" />
              <span>Jaunpur–Varanasi Highway, Uttar Pradesh, India</span>
            </li>
            <li className="flex items-center gap-2 min-h-[40px]">
              <PhoneIcon className="w-4 h-4 shrink-0 text-brand" aria-hidden="true" />
              <a href="tel:+919198923230" className="text-white font-bold hover:underline">
                +91 91989 23230
              </a>
            </li>
            <li className="flex items-center gap-2 min-h-[40px]">
              <MailIcon className="w-4 h-4 shrink-0 text-brand" aria-hidden="true" />
              <a href="mailto:info@gurukripaentudyog.com" className="hover:underline break-all">
                info@gurukripaentudyog.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 shrink-0 text-brand" aria-hidden="true" />
              <span>Mon – Sat: 8:00 AM – 6:00 PM</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-4 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
        <div>
          © {new Date().getFullYear()} Gurukripa Ent Udyog (गुरुकृपा ईंट उद्योग). All rights reserved.
        </div>
        <nav aria-label="Legal links" className="flex gap-4">
          <Link href="/privacy" className="hover:underline min-h-[40px] inline-flex items-center">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:underline min-h-[40px] inline-flex items-center">
            Terms of Supply
          </Link>
        </nav>
      </div>
    </footer>
  );
}
