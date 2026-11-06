import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClientProviders } from '@/components/providers/CartProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/features/CartDrawer';

const SITE_URL = 'https://www.gurukripaentudyog.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Gurukripa Ent Udyog | Double-Fired Red Brick Manufacturer, Jaunpur',
    template: '%s — Gurukripa Ent Udyog',
  },
  description:
    'Gurukripa Ent Udyog (गुरुकृपा ईंट उद्योग) manufactures double-fired red clay bricks, Awwal bricks and machine wirecut bricks on the Jaunpur–Varanasi Highway. Count-verified 4,000-brick trolley loads with 5% GST invoicing.',
  keywords: [
    'Gurukripa Ent Udyog',
    'gurukripa bricks',
    'brick manufacturer jaunpur',
    'bhatta varanasi',
    'awwal bricks rate',
    'laal peti bricks',
    'red clay bricks uttar pradesh',
    'brick estimator',
  ],
  authors: [{ name: 'Gurukripa Ent Udyog' }],
  openGraph: {
    title: 'Gurukripa Ent Udyog — Double-Fired Red Bricks & Trolley Delivery',
    description:
      'Double-fired red clay bricks direct from the kiln. Serving Jaunpur, Varanasi and Eastern Uttar Pradesh.',
    url: SITE_URL,
    siteName: 'Gurukripa Ent Udyog',
    images: [
      {
        url: '/images/hero-banner.png',
        width: 1200,
        height: 630,
        alt: 'Gurukripa Ent Udyog brick kiln and trolley loads',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gurukripa Ent Udyog | Red Bricks Manufacturer',
    description:
      'Double-fired red bricks, Awwal and wirecut grades with count-verified trolley loads.',
    images: ['/images/hero-banner.png'],
  },
  icons: {
    icon: [{ url: '/images/logo-new.svg', type: 'image/svg+xml' }, { url: '/favicon.ico' }],
    apple: '/images/app-icon.jpg',
  },
  manifest: '/manifest.webmanifest',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#A83226',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* App Router root layout — fonts apply site-wide (rule targets pages/_document). */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800;9..144,900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-surface-bg text-ink-primary font-body antialiased">
        <ClientProviders>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:text-brand focus:font-bold focus:px-4 focus:py-3 focus:rounded-b-lg focus:shadow-md"
          >
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content" className="flex-1 w-full">
            {children}
          </main>
          <Footer />
          <CartDrawer />
        </ClientProviders>
      </body>
    </html>
  );
}
