import type { Request } from 'express';
import { AuthService } from './auth.service';
import { PlatformStoreService } from './store.service';
import { WorkflowService } from './workflow.service';
import { AuthenticatedUser } from '../types/domain';
import { DealerRegisterDto, LoginDto, RegisterDto, CreateEnquiryDto } from './dto';
import { RecaptchaService } from '../security/recaptcha.service';
export declare class AuthController {
    private readonly auth;
    private readonly recaptcha;
    constructor(auth: AuthService, recaptcha: RecaptchaService);
    register(dto: RegisterDto, req: Request): Promise<{
        user: AuthenticatedUser;
        token: string;
    }>;
    registerDealer(dto: DealerRegisterDto, req: Request): Promise<{
        user: AuthenticatedUser;
        token: string;
        dealerStatus: string;
    }>;
    login(dto: LoginDto, req: Request): Promise<{
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
    private readonly recaptcha;
    constructor(store: PlatformStoreService, workflow: WorkflowService, recaptcha: RecaptchaService);
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
    guestEnquiry(dto: CreateEnquiryDto, req: Request): Promise<{
        success: boolean;
        data: import("./types").PlatformEnquiry;
    }>;
}
