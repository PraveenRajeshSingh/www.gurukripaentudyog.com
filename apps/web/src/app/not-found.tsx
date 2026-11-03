import React from 'react';
import Link from 'next/link';
import { TruckIcon } from '@/components/ui/icons';

export default function NotFound() {
  return (
    <div className="py-24 container mx-auto px-4 text-center max-w-md">
      <TruckIcon className="w-12 h-12 text-[#C8460A] mx-auto mb-4" />
      <h1 className="text-4xl font-black text-[#1C1009] mb-2">404</h1>
      <h2 className="text-xl font-bold text-[#8B2E05] mb-4">Page Not Found</h2>
      <p className="text-sm text-[#6B5545] mb-8 leading-relaxed">
        The page you are looking for has been moved, or its load hasn&apos;t left the kiln yard
        yet.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-[#C8460A] hover:bg-[#8B2E05] text-white text-sm font-bold min-h-[44px] py-3 px-6 rounded-lg transition"
        >
          Return to Homepage
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center border border-neutral-300 hover:bg-neutral-100 text-[#1C1009] text-sm font-bold min-h-[44px] py-3 px-6 rounded-lg transition"
        >
          Brick Catalog
        </Link>
      </div>
    </div>
  );
}
