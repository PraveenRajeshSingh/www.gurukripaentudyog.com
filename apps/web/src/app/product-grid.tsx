'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PRODUCTS, formatINR } from '@gurukripa/api-contracts';
import { useCart } from '../components/providers/CartProvider';

/**
 * Homepage "key grades" strip. Server-data driven from the verified
 * api-contracts catalogue; adds a full trolley load to the shared cart.
 */
export default function ProductCardGrid() {
  const { addItem } = useCart();

  return (
    <section className="py-10 sm:py-14 container mx-auto px-4" aria-labelledby="grades-heading">
      <div className="border-b-2 border-neutral-200 pb-4 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
        <div>
          <span className="text-xs font-bold text-[#C8460A] uppercase tracking-wider">
            Bhatta Products
          </span>
          <h2 id="grades-heading" className="text-2xl sm:text-3xl font-black text-[#1C1009]">
            Brick Grades &amp; Factory Rates
          </h2>
        </div>
        <Link href="/products" className="text-xs font-bold text-[#C8460A] hover:underline py-1">
          View full catalog &amp; specifications →
        </Link>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 list-none">
        {PRODUCTS.slice(0, 4).map((p) => {
          const trolleyPrice = p.price * 4000;
          return (
            <li key={p.id} className="bg-white border border-neutral-300 rounded-lg overflow-hidden flex flex-col justify-between hover:border-[#C8460A] transition">
              <div>
                <div className="h-44 bg-neutral-100 border-b border-neutral-200 relative">
                  <Image
                    src={p.img}
                    alt={p.name}
                    fill
                    sizes="(min-width:1024px) 25vw, (min-width:768px) 50vw, 100vw"
                    className="object-contain p-2"
                  />
                  {p.badge && (
                    <span className="absolute top-2 left-2 bg-[#8B2E05] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {p.badge}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-base text-[#1C1009]">{p.name}</h3>
                  {p.nameHi && (
                    <p className="text-xs font-semibold text-[#8B2E05]">{p.nameHi}</p>
                  )}
                  <p className="text-xs text-[#6B5545] mt-2 mb-3 leading-relaxed">{p.desc}</p>

                  <ul className="space-y-1 text-xs text-[#4A3728] border-t border-neutral-100 pt-2 list-none">
                    {p.features.map((feat) => (
                      <li key={feat}>{feat}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-[#FAFAF9] border-t border-neutral-200 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xl font-black text-[#C8460A]">{formatINR(p.price)}</p>
                  <p className="text-[10px] text-neutral-500">{formatINR(trolleyPrice)} / trolley (4k)</p>
                </div>
                <button
                  onClick={() => addItem({ id: p.id, name: p.name, price: p.price, quantity: 4000 })}
                  className="bg-[#C8460A] hover:bg-[#8B2E05] text-white text-xs font-bold px-3 py-2.5 rounded transition min-h-[44px]"
                  aria-label={`Add one 4,000-brick trolley of ${p.name} to cart`}
                >
                  + Add Trolley
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
