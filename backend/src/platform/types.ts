// Gurukripa customer/dealer/admin platform domain types.
// Workflow: enquiry -> admin review -> quotation prepared -> customer approval
//           -> order confirmed -> production -> dispatched -> delivered.

import { AuthenticatedUser, UserRole } from '../types/domain';

export { AuthenticatedUser, UserRole };

export type EnquiryStatus = 'NEW' | 'UNDER_REVIEW' | 'QUOTATION_PREPARED' | 'CLOSED';
export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
export type OrderStatus = 'CONFIRMED' | 'PRODUCTION' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
export type DealerStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type NotificationType =
  | 'ENQUIRY_RECEIVED'
  | 'QUOTATION_READY'
  | 'QUOTATION_APPROVED'
  | 'QUOTATION_REJECTED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_STATUS_CHANGED'
  | 'DISPATCH_COMPLETED'
  | 'DELIVERY_COMPLETED'
  | 'ANNOUNCEMENT';

/** Allowed forward transitions per entity. Anything not listed is rejected server-side. */
export const ENQUIRY_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  NEW: ['UNDER_REVIEW', 'CLOSED'],
  UNDER_REVIEW: ['QUOTATION_PREPARED', 'CLOSED'],
  QUOTATION_PREPARED: ['UNDER_REVIEW', 'CLOSED'],
  CLOSED: [],
};

export const QUOTATION_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ['SENT'],
  SENT: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: [],
};

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CONFIRMED: ['PRODUCTION', 'CANCELLED'],
  PRODUCTION: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

/** Roles considered "staff side" (can act on the workflow). */
export const STAFF_ROLES: UserRole[] = ['STAFF', 'SALES_MANAGER', 'ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'];
export const MANAGER_ROLES: UserRole[] = ['SALES_MANAGER', 'ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'];
export const ADMIN_ROLES: UserRole[] = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'];
export const END_CUSTOMER_ROLES: UserRole[] = ['CUSTOMER', 'DEALER'];

export type AccountStatus = 'ACTIVE' | 'DISABLED' | 'SUSPENDED';

export interface PlatformUser {
  id: string;
  tenantId: string;
  role: UserRole;
  name: string;
  phone: string;
  email?: string;
  passwordHash: string;
  language?: 'en' | 'hi' | 'mr';
  dealerStatus?: DealerStatus;
  firmName?: string;
  gstin?: string;
  licenseNo?: string;
  dealerAddress?: string;
  dealerCity?: string;
  /** Percent discount applied to quotations for approved dealers (0-100). */
  dealerDiscountPct?: number;
  /** Login / ops status — DISABLED and SUSPENDED cannot obtain a session. */
  accountStatus?: AccountStatus;
  /** Optional branch label for multi-yard tenants (no separate Branch table yet). */
  branchName?: string;
  /** Optional login alias; platform auth still uses phone as the primary identifier. */
  username?: string;
  /** Human job label for QA (e.g. Accountant) when JWT role is a close enum match. */
  jobTitle?: string;
  /** Marks seeder-created accounts so production bootstrap never touches them. */
  isTestAccount?: boolean;
  createdAt: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  tenantId: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
}

export interface EnquiryLine {
  productId?: string;
  productName: string;
  quantity: number;
  unit: string; // bricks | trolleys | cuft | bags
}

export interface PlatformEnquiry {
  id: string;
  tenantId: string;
  userId?: string;
  status: EnquiryStatus;
  contactName: string;
  contactPhone: string;
  siteLocation: string;
  notes?: string;
  lines: EnquiryLine[];
  /** Data-URL images uploaded from the app (validated: image mime, size cap). */
  attachments: string[];
  assignedStaffId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationLine {
  productId?: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface PlatformQuotation {
  id: string;
  tenantId: string;
  enquiryId: string;
  userId: string;
  number: string;
  status: QuotationStatus;
  lines: QuotationLine[];
  /** GST-inclusive subtotal of lines (Indian 5% = CGST 2.5 + SGST 2.5). */
  subtotal: number;
  discountAmount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  total: number;
  notes?: string;
  validUntil: string;
  preparedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformOrder {
  id: string;
  tenantId: string;
  userId: string;
  quotationId?: string;
  enquiryId?: string;
  number: string;
  status: OrderStatus;
  lines: QuotationLine[];
  subtotal: number;
  discountAmount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  total: number;
  deliveryAddress: string;
  deliveryCity: string;
  expectedDelivery?: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusEvent {
  id: string;
  tenantId: string;
  entityType: 'ENQUIRY' | 'QUOTATION' | 'ORDER';
  entityId: string;
  fromStatus: string;
  toStatus: string;
  note?: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  at: string;
}

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  preferences: { orderUpdates: boolean; quotations: boolean; announcements: boolean };
  createdAt: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  tenantId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  read: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  audience: 'ALL' | 'CUSTOMER' | 'DEALER';
  isActive: boolean;
  createdById: string;
  createdAt: string;
}

export interface SavedSite {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  meta?: Record<string, any>;
  at: string;
}
