import { PricingEngineService } from '../pricing/pricing.service';
export interface ITenantDataService {
    getTenantBySlug(slug: string): Promise<any>;
    getProductsForTenant(tenantId: string): Promise<any[]>;
    createOrder(tenantId: string, orderData: any): Promise<any>;
    getOrdersForTenant(tenantId: string): Promise<any[]>;
    recordSyncBatch(tenantId: string, deviceId: string, userId: string, entries: any[]): Promise<any>;
}
export declare class DatabaseService implements ITenantDataService {
    private readonly pricingEngine;
    private pg;
    private fallbackTenants;
    private fallbackProducts;
    private fallbackOrders;
    private fallbackSyncJournal;
    private fallbackAuditLogs;
    constructor(pricingEngine: PricingEngineService);
    getTenantBySlug(slug: string): Promise<any>;
    getProductsForTenant(tenantId: string): Promise<any[]>;
    createOrder(tenantId: string, orderData: any): Promise<any>;
    getOrdersForTenant(tenantId: string): Promise<any[]>;
    recordSyncBatch(tenantId: string, deviceId: string, userId: string, entries: any[]): Promise<any>;
}
