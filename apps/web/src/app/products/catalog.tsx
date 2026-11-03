'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PRODUCTS, formatINR } from '@gurukripa/api-contracts';
import { useCart } from '@/components/providers/CartProvider';
import { CartIcon, MessageIcon, SearchIcon, CloseIcon, CheckCircleIcon } from '@/components/ui/icons';

const WHATSAPP = 'https://wa.me/919198923230';

const categories = [
  { id: 'all', label: 'All Products' },
  { id: 'shiv-eent', label: 'Shiv Eent Grade-A' },
  { id: 'awwal', label: 'Awwal Bricks' },
  { id: 'laal-peti', label: 'Laal Peti Bricks' },
  { id: 'premium', label: 'Premium & First Class' },
  { id: 'machine-made', label: 'Machine Wirecut' },
  { id: 'standard', label: 'Standard & Hollow' },
];

export default function ProductsCatalog() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [query, setQuery] = useState('');
  const { addItem } = useCart();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (!q) return true;
      // Real search: name, Hindi name, description, unit and feature text.
      return [p.name, p.nameHi ?? '', p.desc, p.unit, ...p.features]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [selectedCategory, query]);

  const addTrolley = (p: (typeof PRODUCTS)[number]) =>
    addItem({ id: p.id, name: p.name, price: p.price, quantity: 4000 });

  return (
    <div className="py-10 sm:py-12 container mx-auto px-4">
      <div className="max-w-3xl mb-6">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#C8460A] bg-[rgba(200,70,10,0.08)] px-3 py-1 rounded-full">
          Direct From Kiln
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#1C1009] mt-2">
          Verified Brick Catalog &amp; Pricing
        </h1>
        <p className="text-sm text-[#6B5545] mt-2">
          Double-fired clay, precision wirecut and structural bricks. Ex-bhatta pricing with 5% GST
          tax invoicing. Final rate depends on quantity and delivery pincode — ask for a quotation.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-4">
        <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5545]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bricks, sizes, uses…"
          aria-label="Search products"
          className="w-full min-h-[48px] pl-10 pr-10 rounded-lg border border-neutral-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8460A]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-[#6B5545] hover:bg-neutral-100"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category filter pills */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
        role="group"
        aria-label="Filter by category"
      >
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            aria-pressed={selectedCategory === c.id}
            className={`px-4 min-h-[44px] rounded-full text-sm font-bold whitespace-nowrap transition border ${
              selectedCategory === c.id
                ? 'bg-[#C8460A] text-white border-[#C8460A]'
                : 'bg-white border-neutral-200 text-[#4A3728] hover:border-[#C8460A]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-[#6B5545] mb-6" aria-live="polite">
        {filtered.length === 0
          ? 'No products match your search.'
          : `Showing ${filtered.length} of ${PRODUCTS.length} products`}
      </p>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-neutral-300 rounded-lg p-8 text-center">
          <p className="text-sm text-[#4A3728] mb-3">
            We could not find a match. The kiln still makes more grades than are listed here.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#C8460A] text-white text-sm font-bold px-5 py-3 rounded-lg min-h-[44px]"
          >
            <MessageIcon className="w-4 h-4" />
            Ask the brick desk
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 list-none p-0 m-0">
          {filtered.map((p) => {
            const trolleyCost = p.price * 4000;
            return (
              <li
                key={p.id}
                className="bg-white rounded-xl border border-neutral-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Product photo */}
                <div className="relative aspect-[4/3] bg-[#F5F0EC]">
                  <Image
                    src={p.img}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  {p.badge && (
                    <span className="absolute top-2 left-2 bg-[#8B2E05] text-white text-[11px] font-bold px-2.5 py-1 rounded">
                      {p.badge}
                    </span>
                  )}
                  <span
                    className={`absolute top-2 right-2 text-[11px] font-bold px-2 py-1 rounded ${
                      p.stock === 'in-stock'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : p.stock === 'low-stock'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    }`}
                  >
                    {p.stockText}
                  </span>
                </div>

                <div className="p-4 grow">
                  <h2 className="font-bold text-base text-[#1C1009]">{p.name}</h2>
                  {p.nameHi && (
                    <span className="text-xs text-[#8B2E05] font-semibold block">{p.nameHi}</span>
                  )}
                  <p className="text-xs text-[#6B5545] mt-1.5 mb-3 leading-relaxed">{p.desc}</p>

                  <ul className="space-y-1 mb-4 text-xs text-[#4A3728] bg-[#FAFAF9] p-3 rounded-lg list-none">
                    {p.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircleIcon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price & actions */}
                <div className="p-4 bg-[#FAFAF9] border-t border-neutral-100 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-xl font-black text-[#C8460A]">{formatINR(p.price)}</span>
                      <span className="text-xs text-[#6B5545] ml-1">/ piece</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#1C1009] block">{formatINR(trolleyCost)}</span>
                      <span className="text-[11px] text-neutral-500">per trolley (4,000)</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => addTrolley(p)}
                      aria-label={`Add one trolley of ${p.name} to enquiry list`}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-[#C8460A] hover:bg-[#8B2E05] text-white text-sm font-bold min-h-[44px] px-3 rounded-lg transition"
                    >
                      <CartIcon className="w-4 h-4" />
                      Add Trolley
                    </button>
                    <a
                      href={`${WHATSAPP}?text=${encodeURIComponent(
                        `Hello Gurukripa, I am interested in ${p.name} (${formatINR(p.price)}/pc). Please share availability and delivery rates.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Enquire about ${p.name} on WhatsApp`}
                      className="inline-flex items-center justify-center w-11 h-11 shrink-0 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg transition"
                    >
                      <MessageIcon className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
