import { PricingEngineService } from '../pricing/pricing.service';
export declare class MockDatabaseService {
    private readonly pricingEngine;
    private tenants;
    private products;
    private orders;
    private syncJournal;
    private auditLogs;
    constructor(pricingEngine: PricingEngineService);
    getTenantBySlug(slug: string): {
        id: string;
        slug: string;
        name: string;
        legalName: string;
        gstin: string;
        phone: string;
        email: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
        primaryColor: string;
        secondaryColor: string;
        isActive: boolean;
    };
    getProductsForTenant(tenantId: string): any[];
    getProductById(tenantId: string, productId: string): any;
    updateProductPrice(tenantId: string, productId: string, patch: Record<string, any>): any;
    createOrder(tenantId: string, orderData: any): {
        id: string;
        tenantId: string;
        orderNumber: string;
        customerName: any;
        customerPhone: any;
        deliveryAddress: any;
        deliveryCity: any;
        items: any;
        subtotal: any;
        cgst: number;
        sgst: number;
        totalAmount: number;
        status: string;
        paymentMethod: any;
        createdAt: string;
    };
    getOrdersForTenant(tenantId: string): any[];
    recordSyncBatch(tenantId: string, deviceId: string, userId: string, entries: any[]): {
        success: boolean;
        count: number;
        applied: any[];
    };
}
