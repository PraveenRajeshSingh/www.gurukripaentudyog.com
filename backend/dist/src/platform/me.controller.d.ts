import { AuthenticatedUser } from '../types/domain';
import { PlatformStoreService } from './store.service';
import { WorkflowService } from './workflow.service';
import { AuthService } from './auth.service';
import { AddressDto, CreateEnquiryDto, DevicePrefsDto, DeviceTokenDto, SavedSiteDto, UpdateProfileDto } from './dto';
export declare class MeController {
    private readonly store;
    private readonly workflow;
    private readonly auth;
    constructor(store: PlatformStoreService, workflow: WorkflowService, auth: AuthService);
    profile(user: AuthenticatedUser): {
        success: boolean;
        data: {
            id: string;
            tenantId: string;
            role: import("../types/domain").UserRole;
            name: string;
            phone: string;
            email?: string;
            language?: "en" | "hi" | "mr";
            dealerStatus?: import("./types").DealerStatus;
            firmName?: string;
            gstin?: string;
            licenseNo?: string;
            dealerAddress?: string;
            dealerCity?: string;
            dealerDiscountPct?: number;
            accountStatus?: import("./types").AccountStatus;
            branchName?: string;
            username?: string;
            jobTitle?: string;
            isTestAccount?: boolean;
            createdAt: string;
        };
    };
    updateProfile(user: AuthenticatedUser, dto: UpdateProfileDto): {
        success: boolean;
        data: Promise<import("./types").PlatformUser>;
    };
    addresses(user: AuthenticatedUser): {
        success: boolean;
        data: import("./types").UserAddress[];
    };
    addAddress(user: AuthenticatedUser, dto: AddressDto): Promise<{
        success: boolean;
        data: import("./types").UserAddress;
    }>;
    removeAddress(user: AuthenticatedUser, id: string): Promise<{
        success: boolean;
    }>;
    createEnquiry(user: AuthenticatedUser, dto: CreateEnquiryDto): Promise<{
        success: boolean;
        data: import("./types").PlatformEnquiry;
    }>;
    myEnquiries(user: AuthenticatedUser): {
        success: boolean;
        data: import("./types").PlatformEnquiry[];
    };
    myEnquiry(user: AuthenticatedUser, id: string): {
        success: boolean;
        data: {
            timeline: import("./types").StatusEvent[];
            id: string;
            tenantId: string;
            userId?: string;
            status: import("./types").EnquiryStatus;
            contactName: string;
            contactPhone: string;
            siteLocation: string;
            notes?: string;
            lines: import("./types").EnquiryLine[];
            attachments: string[];
            assignedStaffId?: string;
            createdAt: string;
            updatedAt: string;
        };
    };
    myQuotations(user: AuthenticatedUser): {
        success: boolean;
        data: import("./types").PlatformQuotation[];
    };
    myQuotation(user: AuthenticatedUser, id: string): {
        success: boolean;
        data: {
            timeline: import("./types").StatusEvent[];
            id: string;
            tenantId: string;
            enquiryId: string;
            userId: string;
            number: string;
            status: import("./types").QuotationStatus;
            lines: import("./types").QuotationLine[];
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
        };
    };
    approveQuotation(user: AuthenticatedUser, id: string): Promise<{
        success: boolean;
        message: string;
        data: import("./types").PlatformOrder;
    }>;
    rejectQuotation(user: AuthenticatedUser, id: string, body: {
        reason?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    myOrders(user: AuthenticatedUser): {
        success: boolean;
        data: import("./types").PlatformOrder[];
    };
    myOrder(user: AuthenticatedUser, id: string): {
        success: boolean;
        data: {
            timeline: import("./types").StatusEvent[];
            id: string;
            tenantId: string;
            userId: string;
            quotationId?: string;
            enquiryId?: string;
            number: string;
            status: import("./types").OrderStatus;
            lines: import("./types").QuotationLine[];
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
        };
    };
    cancelOrder(user: AuthenticatedUser, id: string, body: {
        reason?: string;
    }): Promise<{
        success: boolean;
        data: import("./types").PlatformOrder;
    }>;
    reorder(user: AuthenticatedUser, id: string): Promise<{
        success: boolean;
        data: import("./types").PlatformEnquiry;
    }>;
    invoiceDocument(user: AuthenticatedUser, id: string): {
        success: boolean;
        data: {
            documentType: string;
            business: {
                name: any;
                legalName: any;
                gstin: any;
                address: string;
                phone: any;
                email: any;
            };
            billTo: {
                name: string;
                phone: string;
                address: string;
            };
            invoiceNumber: string;
            date: string;
            status: import("./types").OrderStatus;
            lines: import("./types").QuotationLine[];
            taxableValue: number;
            cgst: number;
            sgst: number;
            total: number;
            paymentMethod: string;
        };
    };
    registerDevice(user: AuthenticatedUser, dto: DeviceTokenDto): Promise<{
        success: boolean;
        data: import("./types").DeviceToken;
    }>;
    updateDevicePrefs(user: AuthenticatedUser, id: string, dto: DevicePrefsDto): Promise<{
        success: boolean;
        data: import("./types").DeviceToken;
    }>;
    notifications(user: AuthenticatedUser): {
        success: boolean;
        data: import("./types").UserNotification[];
    };
    markRead(user: AuthenticatedUser): Promise<{
        success: boolean;
        count: number;
    }>;
    dealerStatus(user: AuthenticatedUser): {
        success: boolean;
        data: {
            dealerStatus: import("./types").DealerStatus;
            firmName: string;
            dealerDiscountPct: number;
        };
    };
    savedSites(user: AuthenticatedUser): {
        success: boolean;
        data: import("./types").SavedSite[];
    };
    addSavedSite(user: AuthenticatedUser, dto: SavedSiteDto): Promise<{
        success: boolean;
        data: import("./types").SavedSite;
    }>;
    dealerOverview(user: AuthenticatedUser): {
        success: boolean;
        data: {
            firmName: string;
            dealerDiscountPct: number;
            orders: import("./types").PlatformOrder[];
            quotations: import("./types").PlatformQuotation[];
            statement: {
                totalOrderValue: number;
                orderCount: number;
            };
        };
    };
}
