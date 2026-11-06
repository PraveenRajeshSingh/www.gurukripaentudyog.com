import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import HeroSection from './hero';
import EstimatorStudio from '@/features/EstimatorStudio';
import ProductCardGrid from './product-grid';
import { MessageIcon } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'Home — Gurukripa Ent Udyog | Double-Fired Red Brick Manufacturer, Jaunpur',
  description:
    'Gurukripa Ent Udyog (गुरुकृपा ईंट उद्योग) manufactures double-fired red clay bricks, Awwal bricks and machine wirecut bricks on the Jaunpur–Varanasi Highway. Count-verified 4,000-brick trolley loads with 5% GST invoicing.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />

      {/* Key grades — server-rendered for SEO; cards add to the shared cart */}
      <ProductCardGrid />

      {/* 3-in-1 Estimator */}
      <section className="py-6 sm:py-10 bg-surface-subtle border-y border-neutral-300" aria-labelledby="estimator-heading">
        <div className="container mx-auto px-4">
          <EstimatorStudio />
        </div>
      </section>

      {/* Manufacturing process */}
      <section className="py-10 sm:py-14 container mx-auto px-4" aria-labelledby="process-heading">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4 text-sm text-ink-secondary leading-relaxed">
            <span className="section-eyebrow block">
              Kiln Engineering
            </span>
            <h2 id="process-heading" className="font-display text-2xl sm:text-3xl font-black text-ink-primary">
              The Double-Fired Brick Advantage
            </h2>
            <p>
              Traditional single-pass rural kilns often produce underburnt cores susceptible to
              efflorescence and dampness. Gurukripa Ent Udyog fires alluvial Gangetic clay in a
              continuous chamber kiln using coal blended with agricultural biomass, then soaks the
              charge at high temperature a second time before cooling.
            </p>
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-white border-l-4 border-brand border-t border-r border-b border-neutral-200 rounded-r-md">
                <strong className="block text-ink-primary text-sm">1. Alluvial clay preparation</strong>
                <span className="text-xs">
                  Desilted clay with uniform plasticity gives sharp edges and minimal dimensional
                  distortion during firing.
                </span>
              </div>
              <div className="p-3 bg-white border-l-4 border-brand border-t border-r border-b border-neutral-200 rounded-r-md">
                <strong className="block text-ink-primary text-sm">2. Double-firing heat soak</strong>
                <span className="text-xs">
                  High-temperature curing produces the characteristic ringing tone when two bricks
                  are struck together and keeps water absorption low.
                </span>
              </div>
              <div className="p-3 bg-white border-l-4 border-brand border-t border-r border-b border-neutral-200 rounded-r-md">
                <strong className="block text-ink-primary text-sm">3. Count-verified trolley loads</strong>
                <span className="text-xs">
                  Standard loads are stacked in count-verifiable rows of 4,000 bricks so contractors
                  receive exactly what they pay for.
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <figure className="border border-neutral-300 rounded-xl overflow-hidden bg-white shadow-card">
              <Image
                src="/images/gurukripaEnt.jpg"
                alt="Gurukripa Ent Udyog kiln yard on the Jaunpur–Varanasi Highway"
                width={900}
                height={600}
                className="w-full h-auto"
              />
              <figcaption className="text-xs text-ink-tertiary px-4 py-2">
                Off-highway loading yard at the Gurukripa bhatta, Jaunpur–Varanasi Highway.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Delivery belt */}
      <section className="py-12 bg-white border-t border-neutral-200" aria-labelledby="logistics-heading">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-8">
            <span className="section-eyebrow block">
              Logistics Network
            </span>
            <h2 id="logistics-heading" className="font-display text-2xl font-black text-ink-primary mt-1">
              Site Delivery Across Eastern Uttar Pradesh
            </h2>
            <p className="text-sm text-ink-tertiary mt-1">
              Regular routes from the kiln gate. Delivery scheduling and freight are confirmed per
              order — ask the dispatch desk for your site pincode.
            </p>
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 text-sm text-center font-bold text-ink-primary list-none">
            {['Jaunpur City', 'Varanasi (Lanka)', 'Jalalpur', 'Trilochan', 'Shahganj', 'Sultanpur'].map((c) => (
              <li key={c} className="p-3 sm:p-4 bg-surface-subtle border border-neutral-200 rounded-lg">
                {c}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link
              href="/contact"
              className="brand-btn-primary"
            >
              <MessageIcon className="w-4 h-4" />
              Request a delivery quote for your site
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
