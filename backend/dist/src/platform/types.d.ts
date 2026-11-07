import { AuthenticatedUser, UserRole } from '../types/domain';
export { AuthenticatedUser, UserRole };
export type EnquiryStatus = 'NEW' | 'UNDER_REVIEW' | 'QUOTATION_PREPARED' | 'CLOSED';
export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
export type OrderStatus = 'CONFIRMED' | 'PRODUCTION' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
export type DealerStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type NotificationType = 'ENQUIRY_RECEIVED' | 'QUOTATION_READY' | 'QUOTATION_APPROVED' | 'QUOTATION_REJECTED' | 'ORDER_CONFIRMED' | 'ORDER_STATUS_CHANGED' | 'DISPATCH_COMPLETED' | 'DELIVERY_COMPLETED' | 'ANNOUNCEMENT';
export declare const ENQUIRY_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]>;
export declare const QUOTATION_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]>;
export declare const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]>;
export declare const STAFF_ROLES: UserRole[];
export declare const MANAGER_ROLES: UserRole[];
export declare const ADMIN_ROLES: UserRole[];
export declare const END_CUSTOMER_ROLES: UserRole[];
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
    dealerDiscountPct?: number;
    accountStatus?: AccountStatus;
    branchName?: string;
    username?: string;
    jobTitle?: string;
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
    unit: string;
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
    preferences: {
        orderUpdates: boolean;
        quotations: boolean;
        announcements: boolean;
    };
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
