'use client';

import React, { useState, useMemo } from 'react';
import {
  calculateWallEstimator,
  calculateHouseEstimator,
  calculateBoundaryEstimator,
  formatINR,
  formatNum
} from '@gurukripa/api-contracts';
import { useCart } from '@/components/providers/CartProvider';
import { MessageIcon, CartIcon } from '@/components/ui/icons';

export default function EstimatorStudio() {
  const [tab, setTab] = useState<'wall' | 'house' | 'boundary'>('wall');
  const { addItem } = useCart();

  // Wall inputs
  const [wallLen, setWallLen] = useState<number>(20);
  const [wallHt, setWallHt] = useState<number>(10);
  const [wallThick, setWallThick] = useState<number>(9);
  const [wallPrice, setWallPrice] = useState<number>(12);

  // House inputs
  const [houseArea, setHouseArea] = useState<number>(1000);
  const [houseFloors, setHouseFloors] = useState<number>(1);
  const [housePrice, setHousePrice] = useState<number>(7.05);

  // Boundary inputs
  const [boundPerim, setBoundPerim] = useState<number>(150);
  const [boundHt, setBoundHt] = useState<number>(6);
  const [boundThick, setBoundThick] = useState<number>(4.5);
  const [boundPrice, setBoundPrice] = useState<number>(6.25);

  // Results computation
  const result = useMemo(() => {
    if (tab === 'wall') {
      return calculateWallEstimator(wallLen, wallHt, wallThick, wallPrice);
    } else if (tab === 'house') {
      return calculateHouseEstimator(houseArea, houseFloors, housePrice);
    } else {
      return calculateBoundaryEstimator(boundPerim, boundHt, boundThick, boundPrice);
    }
  }, [tab, wallLen, wallHt, wallThick, wallPrice, houseArea, houseFloors, housePrice, boundPerim, boundHt, boundThick, boundPrice]);

  const handleWhatsAppQuote = () => {
    let details = '';
    if (tab === 'wall') details = `Wall (${wallLen}ft x ${wallHt}ft, ${wallThick}" thick)`;
    else if (tab === 'house') details = `House (${houseArea} sqft, ${houseFloors} floors)`;
    else details = `Boundary Wall (${boundPerim}ft perim, ${boundHt}ft ht)`;

    const msg = `Hello Gurukripa Ent Udyog! Please send an official quote for my project:%0A` +
      `• Project: ${details}%0A` +
      `• Bricks Required: ${formatNum(result.bricks)}%0A` +
      `• Trolleys (4,000/tr): ${result.trolleys}%0A` +
      `• Estimated Budget: ${formatINR(result.estimatedCost)}`;

    window.open(`https://wa.me/919198923230?text=${msg}`, '_blank');
  };

  const handleAddToCart = () => {
    const name = tab === 'wall' ? 'Wall Bricks' : tab === 'house' ? 'House Bricks' : 'Boundary Bricks';
    const price = tab === 'wall' ? wallPrice : tab === 'house' ? housePrice : boundPrice;
    addItem({ name, price, quantity: result.bricks });
  };

  return (
    <div id="estimator" className="bg-white rounded-2xl border border-[rgba(200,70,10,0.15)] shadow-xl overflow-hidden">
      {/* Studio Header */}
      <div className="bg-[#8B2E05] text-white p-4 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-[#F5A623] text-[#1C1009] text-[11px] font-extrabold uppercase px-2.5 py-1 rounded tracking-wider inline-block mb-2">
            3-in-1 Estimator Studio
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Construction Material Calculator</h2>
          <p className="text-neutral-200 text-xs sm:text-sm mt-1">
            Calculate exact brick, cement, sand requirements and estimated costs for walls, full houses, and boundary fencing.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 bg-[#FAFAF9]" role="tablist" aria-label="Estimator modes">
        <button
          onClick={() => setTab('wall')}
          className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold text-center border-b-2 transition ${
            tab === 'wall'
              ? 'border-[#C8460A] text-[#C8460A] bg-white'
              : 'border-transparent text-[#6B5545] hover:text-[#C8460A]'
          }`} role="tab" aria-selected={tab === 'wall'} aria-controls="estimator-panel"
        >
          Wall Estimator
        </button>
        <button
          onClick={() => setTab('house')}
          className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold text-center border-b-2 transition ${
            tab === 'house'
              ? 'border-[#C8460A] text-[#C8460A] bg-white'
              : 'border-transparent text-[#6B5545] hover:text-[#C8460A]'
          }`} role="tab" aria-selected={tab === 'house'} aria-controls="estimator-panel"
        >
          Full House Project
        </button>
        <button
          onClick={() => setTab('boundary')}
          className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold text-center border-b-2 transition ${
            tab === 'boundary'
              ? 'border-[#C8460A] text-[#C8460A] bg-white'
              : 'border-transparent text-[#6B5545] hover:text-[#C8460A]'
          }`} role="tab" aria-selected={tab === 'boundary'} aria-controls="estimator-panel"
        >
          Boundary Wall
        </button>
      </div>

      {/* Studio Body: Inputs + Real-time Results */}
      <div id="estimator-panel" role="tabpanel" aria-label={`${tab} estimator`} className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left: Inputs */}
        <div className="lg:col-span-6 space-y-4">
          {tab === 'wall' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3728] mb-1">Length (feet)</label>
                  <input
                    type="number"
                    value={wallLen}
                    onChange={(e) => setWallLen(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full min-h-[44px] px-3 py-2 border border-neutral-300 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8460A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3728] mb-1">Height (feet)</label>
                  <input
                    type="number"
                    value={wallHt}
                    onChange={(e) => setWallHt(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full min-h-[44px] px-3 py-2 border border-neutral-300 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8460A]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3728] mb-1">Wall Thickness</label>
                  <select
                    value={wallThick}
                    onChange={(e) => setWallThick(parseFloat(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 border border-neutral-300 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8460A]"
                  >
                    <option value={9}>9-inch Outer Wall</option>
                    <option value={4.5}>4.5-inch Partition Wall</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3728] mb-1">Select Brick Grade</label>
                  <select
                    value={wallPrice}
                    onChange={(e) => setWallPrice(parseFloat(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 border border-neutral-300 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8460A]"
                  >
                    <option value={12}>Shiv Eent Grade-A (₹12)</option>
                    <option value={7.05}>Awwal Bricks (₹7.05)</option>
                    <option value={6.25}>Laal Peti Bricks (₹6.25)</option>
                    <option value={10}>Premium Red Bricks (₹10)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {tab === 'house' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#4A3728] mb-1">Built-up Plot Area (sq. ft)</label>
                <input
                  type="number"
                  value={houseArea}
                  onChange={(e) => setHouseArea(Math.max(100, parseFloat(e.target.value) || 0))}
                  className="w-full min-h-[44px] px-3 py-2 border border-neutral-300 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8460A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3728] mb-1">Number of Floors</label>
                  <select
                    value={houseFloors}
                    onChange={(e) => setHouseFloors(parseInt(e.target.value, 10))}
                    className="w-full min-h-[44px] px-3 py-2 border border-neutral-300 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8460A]"
                  >
                    <option value={1}>Single Story (G)</option>
                    <option value={2}>Double Story (G+1)</option>
                    <option value={3}>Triple Story (G+2)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3728] mb-1">Brick Grade</label>
                  <select
                    value={housePrice}
                    onChange={(e) => setHousePrice(parseFloat(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 border border-neutral-300 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8460A]"
                  >
                    <option value={7.05}>Awwal Bricks (₹7.05)</option>
                    <option value={12}>Shiv Eent Grade-A (₹12)</option>
                    <option value={6.25}>Laal Peti Bricks (₹6.25)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {tab === 'boundary' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#4A3728] mb-1">Perimeter / Boundary Length (feet)</label>
                <input
                  type="number"
                  value={boundPerim}
                  onChange={(e) => setBoundPerim(Math.max(10, parseFloat(e.target.value) || 0))}
                  className="w-full min-h-[44px] px-3 py-2 border border-neutral-300 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8460A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3728] mb-1">Wall Height (feet)</label>
                  <input
                    type="number"
                    value={boundHt}
                    onChange={(e) => setBoundHt(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full min-h-[44px] px-3 py-2 border border-neutral-300 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8460A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3728] mb-1">Thickness</label>
                  <select
                    value={boundThick}
                    onChange={(e) => setBoundThick(parseFloat(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 border border-neutral-300 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8460A]"
                  >
                    <option value={4.5}>4.5-inch Standard</option>
                    <option value={9}>9-inch Reinforced</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A3728] mb-1">Brick Grade</label>
                <select
                  value={boundPrice}
                  onChange={(e) => setBoundPrice(parseFloat(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 border border-neutral-300 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8460A]"
                >
                  <option value={6.25}>Laal Peti Bricks (₹6.25)</option>
                  <option value={7.05}>Awwal Bricks (₹7.05)</option>
                  <option value={8}>Standard Bricks (₹8)</option>
                </select>
              </div>
            </>
          )}

          <p className="text-[11px] text-[#6B5545] pt-2">
            Estimates include a 5% construction breakage margin and convert to trolleys at 4,000
            bricks per tractor trolley. Final quote is confirmed by the kiln team.
          </p>
        </div>

        {/* Right: Results Breakdown */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-[#FAFAF9] p-4 sm:p-6 rounded-xl border border-[rgba(200,70,10,0.12)]">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-[#6B5545] uppercase">
              Real-Time Quantity Breakdown
            </span>
            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-sm text-center">
                <div className="text-xl sm:text-2xl font-black text-[#C8460A]">{formatNum(result.bricks)}</div>
                <div className="text-[11px] font-bold text-[#6B5545]">Bricks Needed</div>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-sm text-center">
                <div className="text-xl sm:text-2xl font-black text-[#1C1009]">{result.trolleys}</div>
                <div className="text-[11px] font-bold text-[#6B5545]">Trolleys (4,000/tr)</div>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-sm text-center">
                <div className="text-lg sm:text-xl font-bold text-[#4A3728]">{result.cementBags}</div>
                <div className="text-[11px] font-bold text-[#6B5545]">Cement Bags</div>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-sm text-center">
                <div className="text-lg sm:text-xl font-bold text-[#4A3728]">{result.sandCuFt} cu.ft</div>
                <div className="text-[11px] font-bold text-[#6B5545]">Sand Volume</div>
              </div>
            </div>

            {/* Estimated Budget Box */}
            <div className="bg-amber-500/10 border border-amber-300 rounded-lg p-4 text-center mb-4">
              <div className="text-[10px] font-extrabold tracking-wider text-[#8B2E05] uppercase">
                ESTIMATED BRICK BUDGET
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#C8460A]">{formatINR(result.estimatedCost)}</div>
              <div className="text-[11px] text-[#4A3728] mt-0.5">
                Ex-kiln bhatta rate · delivery and GST confirmed in quotation
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={handleWhatsAppQuote}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold min-h-[44px] px-4 rounded-lg transition"
            >
              <MessageIcon className="w-4 h-4" />
              Instant WhatsApp Quote
            </button>
            <button
              onClick={handleAddToCart}
              className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-[#C8460A] hover:bg-[rgba(200,70,10,0.08)] text-[#C8460A] text-sm font-bold min-h-[44px] px-4 rounded-lg transition"
            >
              <CartIcon className="w-4 h-4" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
