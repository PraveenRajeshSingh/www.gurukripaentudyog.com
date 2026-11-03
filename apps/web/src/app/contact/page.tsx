import type { Metadata } from 'next';
import EnquiryForm from './enquiry-form';
import { MapPinIcon, PhoneIcon, MailIcon, ClockIcon } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'Contact & Enquiry — Gurukripa Ent Udyog | Brick Rates, Availability, Delivery',
  description:
    'Contact the Gurukripa Ent Udyog kiln team in Jaunpur for brick rates, batch availability and site delivery quotes across Eastern Uttar Pradesh. Call, WhatsApp or send an enquiry.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="py-10 sm:py-12 container mx-auto px-4 max-w-5xl">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#C8460A] bg-[rgba(200,70,10,0.08)] px-3 py-1 rounded-full">
          Direct Customer Service
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#1C1009] mt-3">
          Contact Gurukripa Ent Udyog
        </h1>
        <p className="text-sm text-[#6B5545] mt-2">
          Connect with the kiln sales and logistics team for rates, batch availability and
          delivery schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kiln contact details — static, server-rendered */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-8 rounded-xl border border-neutral-200 space-y-6">
          <div>
            <h2 className="font-extrabold text-lg text-[#1C1009] mb-4">Kiln Bhatta Details</h2>
            <ul className="space-y-5 text-sm text-[#4A3728] list-none p-0 m-0">
              <li className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 shrink-0 text-[#C8460A]" />
                <div>
                  <strong className="block text-[#1C1009]">Physical Location</strong>
                  <span>Jaunpur–Varanasi Highway, Uttar Pradesh, India</span>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Tractor-trolley loading directly off the highway
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <PhoneIcon className="w-5 h-5 shrink-0 text-[#C8460A]" />
                <div>
                  <strong className="block text-[#1C1009]">Telephone &amp; WhatsApp</strong>
                  <a href="tel:+919198923230" className="text-[#C8460A] font-bold hover:underline">
                    +91 91989 23230
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MailIcon className="w-5 h-5 shrink-0 text-[#C8460A]" />
                <div>
                  <strong className="block text-[#1C1009]">Email</strong>
                  <a href="mailto:info@gurukripaentudyog.com" className="hover:underline break-all">
                    info@gurukripaentudyog.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <ClockIcon className="w-5 h-5 shrink-0 text-[#C8460A]" />
                <div>
                  <strong className="block text-[#1C1009]">Working Hours</strong>
                  <span>Monday – Saturday: 8:00 AM – 6:00 PM</span>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Sunday dispatches by prior arrangement
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-neutral-100">
            <a
              href="tel:+919198923230"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#8B2E05] hover:bg-[#1C1009] text-white text-sm font-bold min-h-[48px] px-4 rounded-lg transition"
            >
              <PhoneIcon className="w-4 h-4" />
              Call the Bhatta Manager
            </a>
            <p className="text-xs text-neutral-500 mt-2 text-center">
              Fastest for urgent stock and freight questions.
            </p>
          </div>
        </div>

        {/* Enquiry form — real submission to the backend */}
        <div className="lg:col-span-7">
          <EnquiryForm />
        </div>
      </div>
    </div>
  );
}
