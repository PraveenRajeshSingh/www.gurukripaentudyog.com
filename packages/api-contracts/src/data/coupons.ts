export interface Coupon {
  pct?: number;
  flat?: number;
  label: string;
}

export const COUPONS: Record<string, Coupon> = {
  GURU10: { pct: 10, label: '10% off' },
  BRICK50: { flat: 50, label: '₹50 off' },
  FIRSTORDER: { pct: 15, label: '15% off for first order' }
};
