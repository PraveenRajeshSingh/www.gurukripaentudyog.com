import { PricingEngineService } from '../pricing/pricing.service';
import { MockDatabaseService } from '../database/mock-db.service';
import { AuthenticatedUser, EstimationParams } from '../types/domain';
export declare class ApiController {
    private readonly pricingEngine;
    private readonly db;
    constructor(pricingEngine: PricingEngineService, db: MockDatabaseService);
    getTenantBranding(slug: string): {
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            id: string;
            slug: string;
            name: string;
            legalName: string;
            gstin: string;
            phone: string;
            email: string;
            address: string;
            primaryColor: string;
            secondaryColor: string;
        };
        message?: undefined;
    };
    getTenantProducts(slug: string): {
        success: boolean;
        message: string;
        count?: undefined;
        data?: undefined;
    } | {
        success: boolean;
        count: number;
        data: {
            id: string;
            tenantId: string;
            sku: string;
            name: string;
            category: string;
            unitPrice: number;
            trolleyCapacity: number;
            trolleyRate: number;
            description: string;
            features: string[];
            isActive: boolean;
        }[];
        message?: undefined;
    };
    calculateEstimate(params: EstimationParams): {
        success: boolean;
        data: import("../types/domain").EstimationResult;
    };
    createOrder(tenantId: string, user: AuthenticatedUser, body: any): {
        success: boolean;
        message: string;
        data: {
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
    };
    syncOfflineData(tenantId: string, user: AuthenticatedUser, body: {
        deviceId: string;
        entries?: any[];
        tenantId?: string;
        userId?: string;
    }): {
        success: boolean;
        message: string;
        result?: undefined;
    } | {
        success: boolean;
        message: string;
        result: {
            success: boolean;
            count: number;
            applied: any[];
        };
    };
}
