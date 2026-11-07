import { AuthService } from './auth.service';
import { PlatformStoreService } from './store.service';
import { WorkflowService } from './workflow.service';
import { AuthenticatedUser } from '../types/domain';
import { DealerRegisterDto, LoginDto, RegisterDto, CreateEnquiryDto } from './dto';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto): Promise<{
        user: AuthenticatedUser;
        token: string;
    }>;
    registerDealer(dto: DealerRegisterDto): Promise<{
        user: AuthenticatedUser;
        token: string;
        dealerStatus: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: AuthenticatedUser;
        token: string;
    }>;
    me(user: AuthenticatedUser): {
        user: AuthenticatedUser;
        account: {
            passwordHash: any;
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
}
export declare class PublicController {
    private readonly store;
    private readonly workflow;
    constructor(store: PlatformStoreService, workflow: WorkflowService);
    products(): {
        success: boolean;
        count: number;
        data: any[];
    };
    categories(): {
        success: boolean;
        data: any[];
    };
    announcements(): {
        success: boolean;
        data: import("./types").Announcement[];
    };
    guestEnquiry(dto: CreateEnquiryDto): Promise<{
        success: boolean;
        data: import("./types").PlatformEnquiry;
    }>;
}
