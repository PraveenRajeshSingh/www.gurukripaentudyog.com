import type { Metadata } from 'next';
import EnquiryForm from './enquiry-form';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import { MapPinIcon, PhoneIcon, MailIcon, ClockIcon } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'Contact & Enquiry — Gurukripa Ent Udyog | Brick Rates, Availability, Delivery',
  description:
    'Contact the Gurukripa Ent Udyog kiln team in Jaunpur for brick rates, batch availability and site delivery quotes across Eastern Uttar Pradesh. Call, WhatsApp or send an enquiry.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="py-8 sm:py-12 container mx-auto px-4 max-w-5xl">
      <PageHeader
        align="center"
        eyebrow="Direct Customer Service"
        title="Contact Gurukripa Ent Udyog"
        description="Connect with the kiln sales and logistics team for rates, batch availability and delivery schedules."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        <Card padding="lg" className="lg:col-span-5 space-y-6">
          <div>
            <h2 className="font-display font-extrabold text-lg text-ink-primary mb-4">Kiln Bhatta Details</h2>
            <ul className="space-y-5 text-sm text-ink-secondary list-none p-0 m-0">
              <li className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 shrink-0 text-brand" />
                <div>
                  <strong className="block text-ink-primary">Physical Location</strong>
                  <span>Jaunpur–Varanasi Highway, Uttar Pradesh, India</span>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Tractor-trolley loading directly off the highway
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <PhoneIcon className="w-5 h-5 shrink-0 text-brand" />
                <div>
                  <strong className="block text-ink-primary">Telephone &amp; WhatsApp</strong>
                  <a href="tel:+919198923230" className="text-brand font-bold hover:underline">
                    +91 91989 23230
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MailIcon className="w-5 h-5 shrink-0 text-brand" />
                <div>
                  <strong className="block text-ink-primary">Email</strong>
                  <a href="mailto:info@gurukripaentudyog.com" className="hover:underline break-all">
                    info@gurukripaentudyog.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <ClockIcon className="w-5 h-5 shrink-0 text-brand" />
                <div>
                  <strong className="block text-ink-primary">Working Hours</strong>
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
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-dark hover:bg-ink-primary text-white text-sm font-bold min-h-[48px] px-4 rounded-lg transition"
            >
              <PhoneIcon className="w-4 h-4" />
              Call the Bhatta Manager
            </a>
            <p className="text-xs text-neutral-500 mt-2 text-center">
              Fastest for urgent stock and freight questions.
            </p>
          </div>
        </Card>

        <div className="lg:col-span-7">
          <EnquiryForm />
        </div>
      </div>
    </div>
  );
}
