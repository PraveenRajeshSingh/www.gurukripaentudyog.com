import { OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PlatformStoreService } from './store.service';
import { AuthenticatedUser, PlatformUser } from './types';
import { DealerRegisterDto, LoginDto, RegisterDto } from './dto';
export interface SessionPayload extends AuthenticatedUser {
    sub?: string;
}
export declare class AuthService implements OnModuleInit {
    private readonly store;
    private readonly jwt;
    constructor(store: PlatformStoreService, jwt: JwtService);
    onModuleInit(): Promise<void>;
    private resolveTenantId;
    private mockTenantLookup;
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
    private issueSession;
    freshUser(userId: string): PlatformUser | undefined;
    assertDealerApproved(user: AuthenticatedUser): PlatformUser;
}
