import React from 'react';

export const metadata = {
  title: 'Terms of Service | Gurukripa Ent Udyog',
  description: 'Terms of service, delivery policies, and invoicing guidelines for Gurukripa Ent Udyog.'
};

export default function TermsPage() {
  return (
    <div className="py-12 container mx-auto px-4 max-w-3xl">
      <h1 className="text-3xl font-black text-[#1C1009] mb-4">Terms & Conditions of Supply</h1>
      <p className="text-xs text-neutral-400 mb-8">Effective Date: November 2, 2026</p>

      <div className="space-y-6 text-xs text-[#4A3728] leading-relaxed bg-white p-8 rounded-2xl border border-[rgba(200,70,10,0.12)]">
        <section>
          <h2 className="font-bold text-sm text-[#1C1009] mb-2">1. Brick Quantities & Trolley Standard</h2>
          <p>
            Standard tractor trolley delivery is measured at 4,000 bricks per full trolley. Buyers are encouraged to inspect counting and stacking upon site delivery before release of transport vehicles.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-sm text-[#1C1009] mb-2">2. Breakage Allowance</h2>
          <p>
            As per standard ceramic and construction manufacturing norms (IS 1077), a standard transit handling breakage of up to 3% to 5% is customary. Our 3-in-1 Estimator incorporates a 5% contingency margin in all calculations.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-sm text-[#1C1009] mb-2">3. GST & Invoicing</h2>
          <p>
            All commercial transactions are governed by Indian Goods and Services Tax (GST) at 5% (2.5% CGST + 2.5% SGST for intra-state Uttar Pradesh supply, or 5% IGST for inter-state deliveries).
          </p>
        </section>

        <section>
          <h2 className="font-bold text-sm text-[#1C1009] mb-2">4. Site Access & Unloading</h2>
          <p>
            Customer is responsible for ensuring reasonable road clearance for heavy tractor trolley access to the unloading location.
          </p>
        </section>
      </div>
    </div>
  );
}
