import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { VENDORS } from '@gurukripa/api-contracts';
import { FlameIcon, ScaleIcon, BuildingIcon, MapPinIcon, TruckIcon } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'About Our Kiln — Gurukripa Ent Udyog',
  description:
    'Gurukripa Ent Udyog is a double-fired red clay brick manufacturer on the Jaunpur–Varanasi Highway, making bricks since 1998 with a verified supplier and logistics network.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="py-10 sm:py-12 container mx-auto px-4 max-w-4xl">
      <div className="mb-10 text-center">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#C8460A] bg-[rgba(200,70,10,0.08)] px-3 py-1 rounded-full">
          Kiln Heritage & Craftsmanship
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#1C1009] mt-3">
          About Gurukripa Ent Udyog (गुरुकृपा ईंट उद्योग)
        </h1>
        <p className="text-sm text-[#6B5545] mt-2 max-w-2xl mx-auto">
          On the Jaunpur–Varanasi Highway in Eastern Uttar Pradesh, Gurukripa Ent Udyog has
          manufactured red clay bricks since 1998 for homes, contractors and public projects.
        </p>
      </div>

      <div className="space-y-8 text-sm text-[#4A3728] leading-relaxed">
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-neutral-200">
          <h2 className="text-xl font-black text-[#1C1009] mb-3">Our Manufacturing Standards</h2>
          <p>
            Brick making is an exact discipline. We select alluvial clay from the Gangetic plains,
            screen out foreign material and work the mud to uniform plasticity so fired bricks
            come out with sharp edges and consistent dimensions.
          </p>
          <p className="mt-3">
            Our continuous chamber kiln uses double-firing technology: coal, supplied by Shyam
            Coal &amp; Fuel Suppliers, is blended with agricultural biomass supplied by UP Biomass
            Energy Pvt. Ltd. The second high-temperature heat soak hardens the core, reduces
            water absorption and lends the bricks their characteristic ringing tone.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#FAFAF9] p-5 rounded-xl border border-neutral-200">
            <FlameIcon className="w-7 h-7 text-[#C8460A] mb-2" />
            <h3 className="font-bold text-[#1C1009] text-base mb-1">Double-Fired</h3>
            <p className="text-xs text-[#6B5545]">
              A second heat soak eliminates soft cores, giving the brick a distinct bell tone and
              low water absorption.
            </p>
          </div>
          <div className="bg-[#FAFAF9] p-5 rounded-xl border border-neutral-200">
            <ScaleIcon className="w-7 h-7 text-[#C8460A] mb-2" />
            <h3 className="font-bold text-[#1C1009] text-base mb-1">Count-Verified Trolleys</h3>
            <p className="text-xs text-[#6B5545]">
              Standard trolley loads are stacked in count-verifiable rows of 4,000 bricks so
              contractors can check what they pay for.
            </p>
          </div>
          <div className="bg-[#FAFAF9] p-5 rounded-xl border border-neutral-200">
            <BuildingIcon className="w-7 h-7 text-[#C8460A] mb-2" />
            <h3 className="font-bold text-[#1C1009] text-base mb-1">Institutional Supply</h3>
            <p className="text-xs text-[#6B5545]">
              Our network includes government-project suppliers and PMAY empanelled partners in
              the Jaunpur zone (see partner list below).
            </p>
          </div>
        </div>

        <figure className="bg-white p-4 rounded-xl border border-neutral-200 m-0">
          <Image
            src="/images/gurukripaEnt1.png"
            alt="Brick stacking rows at the Gurukripa Ent Udyog kiln"
            width={1000}
            height={560}
            className="w-full h-auto rounded"
          />
          <figcaption className="text-xs text-[#6B5545] mt-2">
            Trolley-load stacking rows at the bhatta yard.
          </figcaption>
        </figure>

        <div className="bg-white p-6 sm:p-8 rounded-xl border border-neutral-200">
          <h2 className="text-xl font-black text-[#1C1009] mb-1">
            Authorized Partners &amp; Supply Network
          </h2>
          <p className="text-xs text-[#6B5545] mb-5">
            Long-standing suppliers, dealers and logistics partners named by the kiln.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0 m-0">
            {VENDORS.map((v) => (
              <li key={v.name} className="p-4 bg-[#FAFAF9] rounded-lg border border-neutral-200 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  {v.type === 'logistics' ? (
                    <TruckIcon className="w-5 h-5 text-[#C8460A] shrink-0" />
                  ) : (
                    <BuildingIcon className="w-5 h-5 text-[#C8460A] shrink-0" />
                  )}
                  <span className="font-bold text-[#1C1009] text-sm">{v.name}</span>
                </div>
                <div className="text-neutral-500 text-[11px] mb-1 flex items-center gap-1">
                  <MapPinIcon className="w-3.5 h-3.5" /> {v.location} · Partner since {v.since}
                </div>
                <p className="text-[#6B5545]">{v.desc}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#C8460A] hover:bg-[#8B2E05] text-white font-bold min-h-[48px] py-3 px-8 rounded-lg transition"
          >
            <MapPinIcon className="w-4 h-4" />
            Visit the Bhatta or Request an Inspection
          </Link>
        </div>
      </div>
    </div>
  );
}
