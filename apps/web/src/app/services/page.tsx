import type { Metadata } from 'next';
import Link from 'next/link';
import { TruckIcon, BuildingIcon, ScaleIcon, CalculatorIcon, PhoneIcon, MessageIcon, ChevronRightIcon } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'Services & Supply Logistics — Gurukripa Ent Udyog',
  description:
    'Brick supply services from the Gurukripa kiln: trolley delivery across Eastern UP, bulk and institutional supply, machine wirecut bricks and free quantity estimation.',
  alternates: { canonical: '/services' },
};

const services = [
  {
    icon: TruckIcon,
    title: 'Trolley Logistics & Site Delivery',
    desc: 'Tractor-trolley loads of 4,000 count-verified bricks delivered across Jaunpur, Varanasi (Lanka), Jalalpur and Trilochan. Same-day dispatch within Jaunpur and 24–48 hour scheduled delivery to nearby districts, confirmed per order by the dispatch desk.',
    highlight: '4,000-brick trolley loads',
  },
  {
    icon: BuildingIcon,
    title: 'Bulk Institutional & Commercial Supply',
    desc: 'Multi-lakh brick orders with staged deliveries for contractors, dealers and public projects — our network includes PWD-approved and PMAY empanelled supply partners in the Jaunpur zone. Bulk-tier rates are quoted per project.',
    highlight: 'Tiered bulk rates on quotation',
  },
  {
    icon: ScaleIcon,
    title: 'Machine Wirecut Bricks',
    desc: 'Precision machine-cut wirecut grades with sharp corners and smooth faces for exposed brickwork and facades, made to the dimensional standards of common ISI brick grading.',
    highlight: 'Uniform dimensions',
  },
  {
    icon: CalculatorIcon,
    title: 'Quantity Estimation & Site Consultation',
    desc: 'Use the 3-in-1 estimator on this site for brick, cement and sand counts with a 5% breakage allowance, or send your wall and boundary dimensions to the kiln team for a review before ordering.',
    highlight: 'Free — no sign-in needed',
  },
];

export default function ServicesPage() {
  return (
    <div className="py-10 sm:py-12 container mx-auto px-4 max-w-4xl">
      <div className="mb-10 text-center">
        <span className="section-eyebrow inline-block bg-brand-glow px-3 py-1 rounded-md">
          Kiln Supply Services
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-ink-primary mt-3 text-balance">
          Manufacturing, Logistics &amp; Estimation Services
        </h1>
        <p className="text-sm text-ink-tertiary mt-2 max-w-2xl mx-auto text-pretty">
          From a single residential trolley to multi-trolley institutional supply across Eastern
          Uttar Pradesh.
        </p>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12 list-none p-0 m-0">
        {services.map((s) => (
          <li
            key={s.title}
            className="bg-white p-5 sm:p-6 rounded-xl border border-neutral-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4 gap-3">
                <s.icon className="w-8 h-8 text-[#C8460A] shrink-0" />
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2 py-1 rounded text-right">
                  {s.highlight}
                </span>
              </div>
              <h2 className="font-extrabold text-base text-[#1C1009] mb-2">{s.title}</h2>
              <p className="text-sm text-[#6B5545] leading-relaxed">{s.desc}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100">
              <Link
                href="/contact"
                className="text-sm font-bold text-[#C8460A] hover:underline inline-flex items-center gap-1 min-h-[44px]"
              >
                Enquire about this service <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <div className="bg-[#8B2E05] text-white p-5 sm:p-8 rounded-xl text-center">
        <h2 className="text-2xl font-black mb-2">Need a trolley schedule or bulk quote?</h2>
        <p className="text-sm text-neutral-200 max-w-xl mx-auto mb-6">
          The dispatch desk confirms routes, load access and vehicle availability for your site
          pincode before an order is accepted.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <a
            href="tel:+919198923230"
            className="inline-flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-amber-400 text-[#1C1009] font-extrabold min-h-[48px] px-6 py-3 rounded-lg text-sm transition"
          >
            <PhoneIcon className="w-4 h-4" /> Call Dispatch: +91 91989 23230
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold min-h-[48px] px-6 py-3 rounded-lg text-sm transition"
          >
            <MessageIcon className="w-4 h-4" /> Submit Formal Enquiry
          </Link>
        </div>
      </div>
    </div>
  );
}
