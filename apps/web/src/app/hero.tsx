'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageIcon } from '../components/ui/icons';

const WHATSAPP_HERO =
  'https://wa.me/919198923230?text=Hello%20Gurukripa%20Ent%20Udyog,%20I%20would%20like%20to%20inquire%20about%20current%20brick%20rates.';

export default function HeroSection() {
  return (
    <section className="bg-[#8B2E05] text-white border-b-4 border-[#C8460A]" aria-labelledby="hero-heading">
      <div className="container mx-auto px-4 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-5">
          <p className="inline-block bg-[#FAFAF9] text-[#8B2E05] text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded">
            Direct Kiln Manufacturer · Jaunpur–Varanasi Highway
          </p>
          <h1 id="hero-heading" className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Gurukripa Ent Udyog
            <span className="block text-amber-300">गुरुकृपा ईंट उद्योग</span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-200 leading-relaxed max-w-2xl">
            Double-fired red clay bricks, high-load Awwal bricks and machine-made wirecut bricks —
            supplied straight from our bhatta to sites across Eastern Uttar Pradesh, with
            count-verified 4,000-brick trolley loads and 5% GST invoicing.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="#estimator"
              className="bg-[#F5A623] hover:bg-amber-400 text-[#1C1009] font-bold text-sm px-6 py-3.5 rounded-lg transition min-h-[48px] inline-flex items-center"
            >
              Estimate Bricks &amp; Trolleys
            </a>
            <Link
              href="/products"
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-6 py-3.5 rounded-lg border border-white/30 transition min-h-[48px] inline-flex items-center"
            >
              Catalog &amp; Trolley Rates
            </Link>
            <a
              href={WHATSAPP_HERO}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-sm px-5 py-3.5 rounded-lg transition min-h-[48px] inline-flex items-center gap-2"
            >
              <MessageIcon className="w-4 h-4" />
              +91 91989 23230
            </a>
          </div>

          <dl className="pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-200">
            <div>
              <dt className="text-white font-bold">Standard trolley</dt>
              <dd>4,000 bricks per full load</dd>
            </div>
            <div>
              <dt className="text-white font-bold">GST compliance</dt>
              <dd>5% (2.5% CGST + 2.5% SGST)</dd>
            </div>
            <div>
              <dt className="text-white font-bold">Kiln technology</dt>
              <dd>Double-fired alluvial clay</dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-5">
          <figure className="border-4 border-white/20 rounded-lg overflow-hidden bg-neutral-900">
            <Image
              src="/images/trolley_brick.png"
              alt="Brick-loaded tractor trolley at the Gurukripa kiln yard"
              width={900}
              height={640}
              priority
              className="w-full h-auto object-cover"
            />
            <figcaption className="text-[11px] text-neutral-300 px-3 py-2">
              Trolley dispatch at the Jaunpur kiln.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
