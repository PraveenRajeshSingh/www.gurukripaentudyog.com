import type { Metadata } from 'next';
import ProductsCatalog from './catalog';

export const metadata: Metadata = {
  title: 'Brick Catalog & Prices — Gurukripa Ent Udyog | Grade-A, Awwal & Wirecut Bricks',
  description:
    'Verified ex-bhatta prices for double-fired Grade-A red bricks, Awwal bricks, Laal Peti bricks and machine wirecut bricks. Count-verified 4,000-brick trolley loads, 5% GST invoicing.',
  alternates: { canonical: '/products' },
};

export default function ProductsPage() {
  return <ProductsCatalog />;
}
