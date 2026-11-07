import type { Response } from 'express';
import { AuthenticatedUser, UserRole } from '../types/domain';
import { PlatformStoreService } from './store.service';
import { WorkflowService } from './workflow.service';
import { NotifyService } from './notify.service';
import { AuthService } from './auth.service';
import { AnnouncementDto, CreateQuotationDto, DealerApprovalDto, OrderStatusDto, StaffAssignDto } from './dto';
export declare class StaffController {
    private readonly store;
    private readonly workflow;
    private readonly notify;
    private readonly auth;
    constructor(store: PlatformStoreService, workflow: WorkflowService, notify: NotifyService, auth: AuthService);
    enquiries(user: AuthenticatedUser, status?: string, mine?: string): {
        success: boolean;
        data: import("./types").PlatformEnquiry[];
    };
    enquiry(user: AuthenticatedUser, id: string): {
        success: boolean;
        data: {
            timeline: import("./types").StatusEvent[];
            customer: {
                passwordHash: any;
                id: string;
                tenantId: string;
                role: UserRole;
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
                createdAt: string;
            };
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
    review(user: AuthenticatedUser, id: string): Promise<{
        success: boolean;
        data: import("./types").PlatformEnquiry;
    }>;
    assign(user: AuthenticatedUser, id: string, dto: StaffAssignDto): Promise<{
        success: boolean;
        data: import("./types").PlatformEnquiry;
    }>;
    staffMembers(user: AuthenticatedUser): {
        success: boolean;
        data: {
            id: string;
            name: string;
            role: UserRole;
        }[];
    };
    createQuotation(user: AuthenticatedUser, id: string, dto: CreateQuotationDto): Promise<{
        success: boolean;
        data: import("./types").PlatformQuotation;
    }>;
    sendQuotation(user: AuthenticatedUser, id: string): Promise<{
        success: boolean;
        data: import("./types").PlatformQuotation;
    }>;
    quotations(user: AuthenticatedUser): {
        success: boolean;
        data: import("./types").PlatformQuotation[];
    };
    orders(user: AuthenticatedUser, status?: string): {
        success: boolean;
        data: import("./types").PlatformOrder[];
    };
    orderStatus(user: AuthenticatedUser, id: string, dto: OrderStatusDto): Promise<{
        success: boolean;
        data: import("./types").PlatformOrder;
    }>;
    dealers(user: AuthenticatedUser, status?: string): {
        success: boolean;
        data: {
            passwordHash: any;
            id: string;
            tenantId: string;
            role: UserRole;
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
            createdAt: string;
        }[];
    };
    dealerDecision(user: AuthenticatedUser, id: string, dto: DealerApprovalDto): Promise<{
        success: boolean;
        message: string;
    }>;
    createAnnouncement(user: AuthenticatedUser, dto: AnnouncementDto): Promise<{
        success: boolean;
        data: import("./types").Announcement;
    }>;
    patchAnnouncement(user: AuthenticatedUser, id: string, dto: Partial<AnnouncementDto>): Promise<{
        success: boolean;
        data: import("./types").Announcement;
    }>;
    stats(user: AuthenticatedUser): {
        success: boolean;
        data: {
            enquiries: {
                total: number;
                open: number;
            };
            quotations: {
                total: number;
                awaitingCustomer: number;
            };
            orders: {
                total: number;
                byStatus: Record<string, number>;
                revenue: number;
            };
            dealers: {
                pending: number;
                approved: number;
            };
            customers: number;
        };
    };
    audit(user: AuthenticatedUser, limit?: string): {
        success: boolean;
        data: import("./types").AuditLog[];
    };
    exportCsv(user: AuthenticatedUser, entity: string, res: Response): Promise<void>;
}
