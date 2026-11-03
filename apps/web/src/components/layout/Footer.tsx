import React from 'react';
import Link from 'next/link';
import {
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
  ShieldIcon,
} from '../ui/icons';

export default function Footer() {
  return (
    <footer className="bg-[#1C1009] text-[#FAFAF9] pt-10 sm:pt-14 pb-8 sm:pb-10 border-t-4 border-[#C8460A]">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10">
        {/* Col 1: Brand */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#C8460A] text-white flex items-center justify-center font-black text-xl" aria-hidden="true">
              GE
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block">Gurukripa Ent Udyog</span>
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

        {/* Col 2: Navigation */}
        <nav aria-label="Footer navigation">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#C8460A] pl-2">
            Explore
          </h2>
          <ul className="space-y-2 text-xs text-neutral-300">
            <li><Link href="/products" className="hover:text-amber-400 transition inline-block py-0.5">Brick Catalog &amp; Trolley Rates</Link></li>
            <li><Link href="/#estimator" className="hover:text-amber-400 transition inline-block py-0.5">3-in-1 Material Estimator</Link></li>
            <li><Link href="/services" className="hover:text-amber-400 transition inline-block py-0.5">Bulk Supply &amp; Delivery</Link></li>
            <li><Link href="/about" className="hover:text-amber-400 transition inline-block py-0.5">Kiln Process &amp; Standards</Link></li>
            <li><Link href="/tracker" className="hover:text-amber-400 transition inline-block py-0.5">Order &amp; Trolley Tracker</Link></li>
            <li><Link href="/contact" className="hover:text-amber-400 transition inline-block py-0.5">Request a Rate Quote</Link></li>
          </ul>
        </nav>

        {/* Col 3: Delivery belt */}
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#C8460A] pl-2">
            Delivery Areas
          </h2>
          <p className="text-xs text-neutral-300 mb-3">
            Tractor-trolley site delivery across the Jaunpur–Varanasi belt, including:
          </p>
          <ul className="grid grid-cols-2 gap-2 text-xs text-neutral-300 list-none">
            <li className="bg-white/5 p-2 rounded flex items-center gap-1.5"><MapPinIcon className="w-3.5 h-3.5 text-[#C8460A] shrink-0" /> Jaunpur City</li>
            <li className="bg-white/5 p-2 rounded flex items-center gap-1.5"><MapPinIcon className="w-3.5 h-3.5 text-[#C8460A] shrink-0" /> Varanasi (Lanka)</li>
            <li className="bg-white/5 p-2 rounded flex items-center gap-1.5"><MapPinIcon className="w-3.5 h-3.5 text-[#C8460A] shrink-0" /> Jalalpur</li>
            <li className="bg-white/5 p-2 rounded flex items-center gap-1.5"><MapPinIcon className="w-3.5 h-3.5 text-[#C8460A] shrink-0" /> Trilochan</li>
            <li className="bg-white/5 p-2 rounded flex items-center gap-1.5"><MapPinIcon className="w-3.5 h-3.5 text-[#C8460A] shrink-0" /> Shahganj</li>
            <li className="bg-white/5 p-2 rounded flex items-center gap-1.5"><MapPinIcon className="w-3.5 h-3.5 text-[#C8460A] shrink-0" /> Sultanpur</li>
          </ul>
        </div>

        {/* Col 4: Contact */}
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#C8460A] pl-2">
            Contact the Kiln
          </h2>
          <ul className="space-y-3 text-xs text-neutral-300 list-none">
            <li className="flex items-start gap-2">
              <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0 text-[#C8460A]" aria-hidden="true" />
              <span>Jaunpur–Varanasi Highway, Uttar Pradesh, India</span>
            </li>
            <li className="flex items-center gap-2">
              <PhoneIcon className="w-4 h-4 shrink-0 text-[#C8460A]" aria-hidden="true" />
              <a href="tel:+919198923230" className="text-white font-bold hover:underline">
                +91 91989 23230
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MailIcon className="w-4 h-4 shrink-0 text-[#C8460A]" aria-hidden="true" />
              <a href="mailto:info@gurukripaentudyog.com" className="hover:underline break-all">
                info@gurukripaentudyog.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 shrink-0 text-[#C8460A]" aria-hidden="true" />
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
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:underline">Terms of Supply</Link>
        </nav>
      </div>
    </footer>
  );
}
