// Mirrors backend/src/platform/types.ts (customer-visible fields only).
export type EnquiryStatus = 'NEW' | 'UNDER_REVIEW' | 'QUOTATION_PREPARED' | 'CLOSED';
export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
export type OrderStatus = 'CONFIRMED' | 'PRODUCTION' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface MeUser {
  id: string;
  role: string;
  name: string;
  phone: string;
  email?: string;
  language?: 'en' | 'hi' | 'mr';
  firmName?: string;
  dealerStatus?: string;
  createdAt: string;
}

export interface MeAddress {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
}

export interface MeEnquiryLine {
  productName: string;
  quantity: number;
  unit: string;
}

export interface MeEnquiry {
  id: string;
  status: EnquiryStatus;
  siteLocation: string;
  notes?: string;
  lines: MeEnquiryLine[];
  createdAt: string;
  updatedAt: string;
}

export interface MeQuotationLine {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface MeQuotation {
  id: string;
  number: string;
  status: QuotationStatus;
  lines: MeQuotationLine[];
  subtotal: number;
  discountAmount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  total: number;
  notes?: string;
  validUntil: string;
  createdAt: string;
}

export interface MeOrder {
  id: string;
  number: string;
  status: OrderStatus;
  lines: MeQuotationLine[];
  total: number;
  deliveryAddress: string;
  deliveryCity: string;
  expectedDelivery?: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export const ORDER_STEPS: OrderStatus[] = ['CONFIRMED', 'PRODUCTION', 'DISPATCHED', 'DELIVERED'];

export const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  UNDER_REVIEW: 'Under review',
  QUOTATION_PREPARED: 'Quotation ready',
  CLOSED: 'Closed',
  DRAFT: 'Draft',
  SENT: 'Awaiting your response',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CONFIRMED: 'Confirmed',
  PRODUCTION: 'In production',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};
