export declare class RegisterDto {
    name: string;
    phone: string;
    email?: string;
    password: string;
    tenantSlug?: string;
    language?: 'en' | 'hi' | 'mr';
}
export declare class LoginDto {
    phone: string;
    password: string;
}
export declare class DealerRegisterDto extends RegisterDto {
    firmName: string;
    gstin?: string;
    licenseNo?: string;
    dealerAddress: string;
    dealerCity: string;
}
export declare class UpdateProfileDto {
    name?: string;
    email?: string;
    language?: 'en' | 'hi' | 'mr';
}
export declare class AddressDto {
    label: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    isDefault?: boolean;
}
export declare class EnquiryLineDto {
    productId?: string;
    productName: string;
    quantity: number;
    unit: string;
}
export declare class CreateEnquiryDto {
    lines: EnquiryLineDto[];
    siteLocation: string;
    notes?: string;
    contactPhone?: string;
    contactName?: string;
    attachments?: string[];
    addressId?: string;
}
export declare class QuotationLineDto {
    productId?: string;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
}
export declare class CreateQuotationDto {
    lines: QuotationLineDto[];
    discountAmount?: number;
    notes?: string;
    validDays?: number;
    sendNow?: boolean;
}
export declare class StaffAssignDto {
    staffId: string;
}
export declare class OrderStatusDto {
    status: string;
    note?: string;
    expectedDelivery?: string;
}
export declare class DeviceTokenDto {
    token: string;
    platform: 'android' | 'ios' | 'web';
    preferences?: {
        orderUpdates?: boolean;
        quotations?: boolean;
        announcements?: boolean;
    };
}
export declare class DevicePrefsDto {
    orderUpdates?: boolean;
    quotations?: boolean;
    announcements?: boolean;
}
export declare class AnnouncementDto {
    title: string;
    body: string;
    audience?: 'ALL' | 'CUSTOMER' | 'DEALER';
    isActive?: boolean;
}
export declare class SavedSiteDto {
    name: string;
    address: string;
    city: string;
    lat?: number;
    lng?: number;
}
export declare class DealerApprovalDto {
    status: 'APPROVED' | 'REJECTED';
    dealerDiscountPct?: number;
}
