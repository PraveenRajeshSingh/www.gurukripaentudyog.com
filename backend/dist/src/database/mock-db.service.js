"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockDatabaseService = void 0;
const common_1 = require("@nestjs/common");
const pricing_service_1 = require("../pricing/pricing.service");
let MockDatabaseService = class MockDatabaseService {
    constructor(pricingEngine) {
        this.pricingEngine = pricingEngine;
        this.tenants = [
            {
                id: 'tenant-gurukripa-001',
                slug: 'gurukripa',
                name: 'Gurukripa Bricks Industry',
                legalName: 'Gurukripa Ent Udyog Pvt Ltd',
                gstin: '09AAACG7481M1Z2',
                phone: '+91 94150 12345',
                email: 'contact@gurukripaentudyog.com',
                address: 'Shahganj Road, Kheta Sarai',
                city: 'Jaunpur',
                state: 'Uttar Pradesh',
                pincode: '222139',
                primaryColor: '#C8460A',
                secondaryColor: '#2A2A2A',
                isActive: true,
            },
            {
                id: 'tenant-awadh-002',
                slug: 'awadh-bricks',
                name: 'Awadh Brick Kiln & Suppliers',
                legalName: 'Awadh Construction & Bhatta Ltd',
                gstin: '09AABCA9999M1Z5',
                phone: '+91 98390 11223',
                email: 'sales@awadhbricks.com',
                address: 'Varanasi Bypass Road',
                city: 'Varanasi',
                state: 'Uttar Pradesh',
                pincode: '221002',
                primaryColor: '#0284C7',
                secondaryColor: '#0F172A',
                isActive: true,
            },
        ];
        this.products = [
            {
                id: 'prod-001',
                tenantId: 'tenant-gurukripa-001',
                sku: 'GURU-AWWAL-01',
                name: 'Awwal Bricks (आव्वल ईंट)',
                category: 'awwal',
                unitPrice: 7.05,
                trolleyCapacity: 4000,
                trolleyRate: 28200,
                gstRate: 5,
                minOrderQty: 1000,
                stockQty: 50000,
                retailPrice: 7.05,
                wholesalePrice: 6.8,
                description: 'High-strength Awwal bricks for heavy load-bearing structural walls.',
                features: ['Double-fired', 'Uniform 230x110x70mm', 'IS:1077 compliant'],
                isActive: true,
            },
            {
                id: 'prod-002',
                tenantId: 'tenant-gurukripa-001',
                sku: 'GURU-LAAL-02',
                name: 'Laal Peti Bricks (लाल पेटी ईंट)',
                category: 'laal-peti',
                unitPrice: 6.25,
                trolleyCapacity: 4000,
                trolleyRate: 25000,
                gstRate: 5,
                minOrderQty: 1000,
                stockQty: 80000,
                retailPrice: 6.25,
                wholesalePrice: 6.0,
                description: 'All-purpose natural clay bricks for homes and boundary walls.',
                features: ['Natural clay', 'Affordable', '25,000 per trolley'],
                isActive: true,
            },
            {
                id: 'prod-003',
                tenantId: 'tenant-gurukripa-001',
                sku: 'GURU-SHIV-03',
                name: 'Shiv Eent Grade-A',
                category: 'shiv-eent',
                unitPrice: 12.00,
                trolleyCapacity: 4000,
                trolleyRate: 48000,
                gstRate: 5,
                minOrderQty: 1000,
                stockQty: 20000,
                retailPrice: 12,
                description: 'Ultra-premium Grade-A brick with double-fired durability.',
                features: ['Double-fired process', 'Weather resistant'],
                isActive: true,
            },
            {
                id: 'prod-101',
                tenantId: 'tenant-awadh-002',
                sku: 'AWADH-STD-01',
                name: 'Awadh Standard Kiln Bricks',
                category: 'standard',
                unitPrice: 7.50,
                trolleyCapacity: 4000,
                trolleyRate: 30000,
                gstRate: 5,
                minOrderQty: 1000,
                stockQty: 30000,
                retailPrice: 7.5,
                description: 'Awadh regional standard construction bricks.',
                features: ['Well fired', 'Batch certified'],
                isActive: true,
            },
        ];
        this.orders = [];
        this.syncJournal = [];
        this.auditLogs = [];
    }
    getTenantBySlug(slug) {
        return this.tenants.find((t) => t.slug === slug || t.id === slug);
    }
    getProductsForTenant(tenantId) {
        return this.products.filter((p) => p.tenantId === tenantId && p.isActive);
    }
    getProductById(tenantId, productId) {
        return this.products.find((p) => p.tenantId === tenantId && p.id === productId);
    }
    updateProductPrice(tenantId, productId, patch) {
        const product = this.getProductById(tenantId, productId);
        if (!product)
            return null;
        Object.assign(product, patch, { updatedAt: new Date().toISOString() });
        this.auditLogs.push({
            tenantId,
            action: 'PRODUCT_PRICE_CHANGED',
            entityType: 'PRODUCT',
            entityId: productId,
            meta: {
                unitPrice: patch.unitPrice,
                oldPrice: patch.oldPrice,
                priceUpdatedBy: patch.priceUpdatedBy,
            },
            timestamp: new Date().toISOString(),
        });
        return product;
    }
    createOrder(tenantId, orderData) {
        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const gstCalc = this.pricingEngine.calculateGstFromInclusiveTotal(orderData.subtotal);
        const newOrder = {
            id: orderId,
            tenantId,
            orderNumber: `INV-${Date.now()}`,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            deliveryAddress: orderData.deliveryAddress,
            deliveryCity: orderData.deliveryCity || 'Jaunpur',
            items: orderData.items,
            subtotal: orderData.subtotal,
            cgst: gstCalc.cgst,
            sgst: gstCalc.sgst,
            totalAmount: gstCalc.grandTotal,
            status: 'CONFIRMED',
            paymentMethod: orderData.paymentMethod || 'COD',
            createdAt: new Date().toISOString(),
        };
        this.orders.push(newOrder);
        this.auditLogs.push({
            tenantId,
            action: 'ORDER_CREATED',
            entityType: 'ORDER',
            entityId: orderId,
            timestamp: new Date().toISOString(),
        });
        return newOrder;
    }
    getOrdersForTenant(tenantId) {
        return this.orders.filter((o) => o.tenantId === tenantId);
    }
    recordSyncBatch(tenantId, deviceId, userId, entries) {
        const applied = [];
        for (const entry of entries) {
            const journalItem = {
                id: `sync-${Date.now()}-${Math.random()}`,
                tenantId,
                deviceId,
                userId,
                entityName: entry.entityName,
                operation: entry.operation,
                clientId: entry.clientId,
                payload: entry.payload,
                clientTimestamp: entry.clientTimestamp,
                serverTimestamp: new Date().toISOString(),
                status: 'APPLIED',
            };
            this.syncJournal.push(journalItem);
            applied.push(journalItem);
        }
        return { success: true, count: applied.length, applied };
    }
};
exports.MockDatabaseService = MockDatabaseService;
exports.MockDatabaseService = MockDatabaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pricing_service_1.PricingEngineService])
], MockDatabaseService);
//# sourceMappingURL=mock-db.service.js.map