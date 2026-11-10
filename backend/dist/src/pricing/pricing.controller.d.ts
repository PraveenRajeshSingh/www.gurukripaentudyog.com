import type { Request } from 'express';
import { AuthenticatedUser } from '../types/domain';
import { MockDatabaseService } from '../database/mock-db.service';
import { CatalogPricingService, CartLineInput, PriceUpdateInput } from './catalog-pricing.service';
import { PaymentIdempotencyService } from '../payments/payment-idempotency.service';
import { RazorpayService } from '../payments/razorpay.service';
export declare class PricingController {
    private readonly catalog;
    private readonly db;
    private readonly idem;
    private readonly razorpay;
    constructor(catalog: CatalogPricingService, db: MockDatabaseService, idem: PaymentIdempotencyService, razorpay: RazorpayService);
    catalogPrices(slug: string): {
        success: boolean;
        message: string;
        tenantId?: undefined;
        updatedAt?: undefined;
        count?: undefined;
        data?: undefined;
    } | {
        success: boolean;
        tenantId: string;
        updatedAt: string;
        count: number;
        data: {
            id: any;
            tenantId: any;
            sku: any;
            name: any;
            category: any;
            unitPrice: number;
            oldPrice: number;
            trolleyCapacity: any;
            trolleyRate: number;
            wholesalePrice: number;
            retailPrice: number;
            bulkPrice: number;
            gstRate: number;
            minOrderQty: number;
            stockQty: number;
            supplierName: any;
            logoUrl: any;
            description: any;
            features: any;
            imageUrl: any;
            isActive: boolean;
            priceUpdatedAt: any;
            priceUpdatedBy: any;
        }[];
        message?: undefined;
    };
    validateCart(slug: string, body: {
        lines?: CartLineInput[];
    }): {
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            ok: boolean;
            requiresCustomerConfirmation: boolean;
            lines: ({
                productId: string;
                ok: boolean;
                code: string;
                message: string;
                currentUnitPrice?: undefined;
                minOrderQty?: undefined;
                stockQty?: undefined;
                name?: undefined;
                quantity?: undefined;
                previousClientUnitPrice?: undefined;
                priceChanged?: undefined;
                lineTotal?: undefined;
                gstRate?: undefined;
                trolleyRate?: undefined;
            } | {
                productId: string;
                ok: boolean;
                code: string;
                message: string;
                currentUnitPrice: number;
                minOrderQty: number;
                stockQty?: undefined;
                name?: undefined;
                quantity?: undefined;
                previousClientUnitPrice?: undefined;
                priceChanged?: undefined;
                lineTotal?: undefined;
                gstRate?: undefined;
                trolleyRate?: undefined;
            } | {
                productId: string;
                ok: boolean;
                code: string;
                message: string;
                stockQty: number;
                currentUnitPrice: number;
                minOrderQty?: undefined;
                name?: undefined;
                quantity?: undefined;
                previousClientUnitPrice?: undefined;
                priceChanged?: undefined;
                lineTotal?: undefined;
                gstRate?: undefined;
                trolleyRate?: undefined;
            } | {
                productId: string;
                ok: boolean;
                name: any;
                quantity: number;
                currentUnitPrice: number;
                previousClientUnitPrice: number;
                priceChanged: boolean;
                lineTotal: number;
                gstRate: number;
                trolleyRate: number;
                minOrderQty: number;
                stockQty: number;
                code?: undefined;
                message?: undefined;
            })[];
            subtotal: number;
            gst: import("./pricing.service").GstTaxCalculation;
            payableTotal: number;
            validatedAt: string;
        };
        message?: undefined;
    };
    staffProducts(user: AuthenticatedUser): {
        success: boolean;
        data: {
            id: any;
            tenantId: any;
            sku: any;
            name: any;
            category: any;
            unitPrice: number;
            oldPrice: number;
            trolleyCapacity: any;
            trolleyRate: number;
            wholesalePrice: number;
            retailPrice: number;
            bulkPrice: number;
            gstRate: number;
            minOrderQty: number;
            stockQty: number;
            supplierName: any;
            logoUrl: any;
            description: any;
            features: any;
            imageUrl: any;
            isActive: boolean;
            priceUpdatedAt: any;
            priceUpdatedBy: any;
        }[];
    };
    priceHistory(user: AuthenticatedUser, id: string, limit?: string): {
        success: boolean;
        data: import("./catalog-pricing.service").PriceHistoryRow[];
    };
    updatePrice(user: AuthenticatedUser, id: string, body: PriceUpdateInput): Promise<{
        success: boolean;
        data: {
            scheduled: boolean;
            data: {
                id: string;
                tenantId: string;
                productId: string;
                unitPrice: number;
                trolleyRate: number;
                wholesalePrice: number;
                retailPrice: number;
                bulkPrice: number;
                gstRate: number;
                minOrderQty: number;
                stockQty: number;
                reason: string;
                status: "PENDING";
                actorId: string;
                createdAt: string;
                activateAt: string;
            };
        } | {
            product: {
                id: any;
                tenantId: any;
                sku: any;
                name: any;
                category: any;
                unitPrice: number;
                oldPrice: number;
                trolleyCapacity: any;
                trolleyRate: number;
                wholesalePrice: number;
                retailPrice: number;
                bulkPrice: number;
                gstRate: number;
                minOrderQty: number;
                stockQty: number;
                supplierName: any;
                logoUrl: any;
                description: any;
                features: any;
                imageUrl: any;
                isActive: boolean;
                priceUpdatedAt: any;
                priceUpdatedBy: any;
            };
            history: import("./catalog-pricing.service").PriceHistoryRow;
        };
    }>;
    activateScheduled(user: AuthenticatedUser): Promise<{
        success: boolean;
        data: {
            activated: number;
            items: any[];
        };
    }>;
    initiatePayment(user: AuthenticatedUser, body: {
        idempotencyKey?: string;
        amountInr?: number;
        currency?: string;
        receipt?: string;
        notes?: Record<string, string>;
    }): Promise<{
        success: boolean;
        replay: boolean;
        data: any;
        live: boolean;
        message?: undefined;
    } | {
        success: boolean;
        replay: boolean;
        message: string;
        data?: undefined;
        live?: undefined;
    } | {
        success: boolean;
        message: string;
        replay?: undefined;
        data?: undefined;
        live?: undefined;
    }>;
    verifyPayment(user: AuthenticatedUser, body: {
        idempotencyKey?: string;
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
    }): {
        success: boolean;
        message: string;
        replay?: undefined;
        data?: undefined;
    } | {
        success: boolean;
        replay: boolean;
        message: string;
        data: any;
    } | {
        success: boolean;
        replay: boolean;
        data: any;
        message?: undefined;
    };
    razorpayWebhook(req: Request & {
        rawBody?: Buffer;
    }, signature: string | undefined, body: any): {
        success: boolean;
        message: string;
        replay?: undefined;
    } | {
        success: boolean;
        replay: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message?: undefined;
        replay?: undefined;
    };
}
