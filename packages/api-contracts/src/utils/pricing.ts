import { COUPONS } from '../data/coupons';

export function calculateCouponDiscount(code: string | undefined, subtotal: number): number {
  if (!code) return 0;
  const coupon = COUPONS[code.toUpperCase().trim()];
  if (!coupon) return 0;

  if (coupon.pct) {
    return Math.round((subtotal * coupon.pct) / 100);
  }
  if (coupon.flat) {
    return Math.min(coupon.flat, subtotal);
  }
  return 0;
}

export interface GstBreakdown {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
}

/**
 * 5% GST calculation for brick construction products.
 * Intra-state: 2.5% CGST + 2.5% SGST.
 * Inter-state: 5% IGST.
 */
export function calculateGst(taxableAmount: number, isInterState = false): GstBreakdown {
  if (isInterState) {
    const igst = Number((taxableAmount * 0.05).toFixed(2));
    const grandTotal = Math.round(taxableAmount + igst);
    return {
      taxableAmount,
      cgst: 0,
      sgst: 0,
      igst,
      totalTax: igst,
      grandTotal
    };
  }

  const cgst = Number((taxableAmount * 0.025).toFixed(2));
  const sgst = Number((taxableAmount * 0.025).toFixed(2));
  const totalTax = Number((cgst + sgst).toFixed(2));
  const grandTotal = Math.round(taxableAmount + totalTax);

  return {
    taxableAmount,
    cgst,
    sgst,
    igst: 0,
    totalTax,
    grandTotal
  };
}

/**
 * Indian Rupee formatting with ₹ symbol and Indian grouping (e.g. ₹1,25,000)
 */
export function formatINR(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '₹0';
  return '₹' + Number(val).toLocaleString('en-IN');
}

/**
 * Number formatting with Indian grouping without ₹ symbol (e.g. 1,25,000)
 */
export function formatNum(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0';
  return Number(val).toLocaleString('en-IN');
}
