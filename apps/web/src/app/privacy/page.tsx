import React from 'react';

export const metadata = {
  title: 'Privacy Policy | Gurukripa Ent Udyog',
  description: 'Privacy policy and customer data handling standards for Gurukripa Ent Udyog.'
};

export default function PrivacyPage() {
  return (
    <div className="py-12 container mx-auto px-4 max-w-3xl">
      <h1 className="text-3xl font-black text-[#1C1009] mb-4">Privacy Policy</h1>
      <p className="text-xs text-neutral-400 mb-8">Effective Date: November 2, 2026</p>

      <div className="space-y-6 text-xs text-[#4A3728] leading-relaxed bg-white p-8 rounded-2xl border border-[rgba(200,70,10,0.12)]">
        <section>
          <h2 className="font-bold text-sm text-[#1C1009] mb-2">1. Information We Collect</h2>
          <p>
            Gurukripa Ent Udyog collects customer contact details (such as full name, phone number, delivery address, and pincode) solely for quoting prices, executing orders, and dispatching tractor trolleys to construction sites.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-sm text-[#1C1009] mb-2">2. Use of Information</h2>
          <p>
            Your details are used strictly for order fulfillment, delivery coordination with our verified logistics drivers, and GST invoicing compliance under Indian Tax Regulations. We never sell, rent, or trade customer information to third parties.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-sm text-[#1C1009] mb-2">3. Data Security & Storage</h2>
          <p>
            All submitted enquiries and order requests are stored securely with encrypted communication channels. Offline cached data in the mobile app or PWA resides solely within your device storage.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-sm text-[#1C1009] mb-2">4. Contact Information</h2>
          <p>
            For privacy queries or data deletion requests, email us at <a href="mailto:info@gurukripaentudyog.com" className="text-[#C8460A] font-bold">info@gurukripaentudyog.com</a> or call +91 91989 23230.
          </p>
        </section>
      </div>
    </div>
  );
}
