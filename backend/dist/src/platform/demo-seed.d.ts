import { JwtService } from '@nestjs/jwt';
import { PricingEngineService } from '../pricing/pricing.service';
import { MockDatabaseService } from '../database/mock-db.service';
import { PlatformStoreService } from './store.service';
import { AuthService } from './auth.service';
import { NotifyService } from './notify.service';
import { WorkflowService } from './workflow.service';
import { AccountStatus, UserRole } from './types';
export interface SeedAccountSpec {
    key: string;
    fullName: string;
    email: string;
    username: string;
    phone: string;
    role: UserRole;
    jobTitle: string;
    tenantId: string;
    tenantLabel: string;
    tenantSlug: string;
    branch: string;
    status: AccountStatus;
    testPurpose: string;
    dealerStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    dealerDiscountPct?: number;
    firmName?: string;
    gstin?: string;
}
export interface SeededAccount extends SeedAccountSpec {
    userId: string;
    password: string;
    loginOk: boolean;
    loginError?: string;
}
export interface DemoSeedResult {
    accounts: SeededAccount[];
    summary: {
        tenants: number;
        accounts: number;
        byRole: Record<string, number>;
        products: number;
        customers: number;
        orders: number;
        projects: number;
        invoices: number;
        enquiries: number;
        quotations: number;
        loginPass: number;
        loginFail: number;
        permissionPass: number;
        permissionFail: number;
        crossTenantPass: number;
        crossTenantFail: number;
        failures: string[];
    };
    credentialsPath: string;
    datasetPath: string;
}
export declare function createDemoRuntime(): {
    pricing: PricingEngineService;
    mockDb: MockDatabaseService;
    store: PlatformStoreService;
    jwt: JwtService;
    notify: NotifyService;
    workflow: WorkflowService;
    auth: AuthService;
};
export declare function runDemoSeed(options?: {
    reset?: boolean;
    repoRoot?: string;
}): Promise<DemoSeedResult>;
