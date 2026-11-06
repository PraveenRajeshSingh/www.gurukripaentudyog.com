'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageIcon } from '../components/ui/icons';
import { WHATSAPP_BASE } from '../lib/validation';

const WHATSAPP_HERO = `${WHATSAPP_BASE}?text=${encodeURIComponent(
  'Hello Gurukripa Ent Udyog, I would like to inquire about current brick rates.'
)}`;

/**
 * First viewport: brand + one headline + one support line + CTA group + full-bleed visual.
 * Supporting stats live below the primary CTA row so phones stay uncluttered.
 */
export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden border-b-4 border-brand text-white"
      aria-labelledby="hero-heading"
    >
      {/* Full-bleed kiln atmosphere */}
      <div className="absolute inset-0">
        <Image
          src="/images/trolley_brick.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-brand-dark/95 via-brand-dark/88 to-brand-dark/55"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-brand-dark/30"
          aria-hidden
        />
      </div>

      <div className="relative container mx-auto px-4 py-14 sm:py-16 md:py-20 lg:py-24 min-h-[min(88vh,640px)] flex flex-col justify-center">
        <div className="max-w-2xl space-y-5">
          <p className="inline-flex items-center bg-white/95 text-brand-dark text-[11px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md shadow-sm">
            Direct Kiln · Jaunpur–Varanasi Highway
          </p>

          <h1
            id="hero-heading"
            className="font-display text-4xl xs:text-5xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] text-balance"
          >
            Gurukripa Ent Udyog
            <span className="block mt-1 text-brand-amber text-2xl xs:text-3xl sm:text-4xl font-extrabold">
              गुरुकृपा ईंट उद्योग
            </span>
          </h1>

          <p className="text-sm sm:text-base text-white/85 leading-relaxed max-w-xl text-pretty">
            Double-fired red clay bricks with count-verified 4,000-brick trolley loads and honest
            5% GST invoicing — straight from the bhatta to your site.
          </p>

          <div className="flex flex-col xs:flex-row flex-wrap gap-3 pt-1">
            <a
              href="#estimator"
              className="inline-flex items-center justify-center min-h-[48px] px-6 py-3.5 rounded-lg font-bold text-sm bg-brand-amber text-ink-primary hover:brightness-105 transition shadow-sm"
            >
              Estimate Bricks &amp; Trolleys
            </a>
            <Link
              href="/products"
              className="inline-flex items-center justify-center min-h-[48px] px-6 py-3.5 rounded-lg font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/35 transition"
            >
              View Catalog
            </Link>
            <a
              href={WHATSAPP_HERO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3.5 rounded-lg font-bold text-sm bg-[#16a34a] hover:bg-[#15803d] text-white transition"
            >
              <MessageIcon className="w-4 h-4" />
              WhatsApp Quote
            </a>
          </div>
        </div>

        {/* Secondary facts — below hero CTAs, still in first fold on large screens */}
        <dl className="relative mt-10 pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-white/80 max-w-3xl">
          <div>
            <dt className="text-white font-bold font-display">Standard trolley</dt>
            <dd>4,000 bricks per full load</dd>
          </div>
          <div>
            <dt className="text-white font-bold font-display">GST compliance</dt>
            <dd>5% (2.5% CGST + 2.5% SGST)</dd>
          </div>
          <div>
            <dt className="text-white font-bold font-display">Kiln technology</dt>
            <dd>Double-fired alluvial clay</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
