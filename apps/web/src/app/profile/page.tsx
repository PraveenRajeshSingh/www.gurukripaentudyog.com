import type { Metadata } from 'next';
import AccountPortal from './dashboard';

export const metadata: Metadata = {
  title: 'My Account — Gurukripa Ent Udyog',
  description:
    'Sign in to view your enquiries, quotations, orders and saved site addresses with the Gurukripa Ent Udyog kiln.',
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <div className="py-8 sm:py-12 container mx-auto px-4 max-w-3xl">
      <AccountPortal />
    </div>
  );
}
