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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../security/tenant.guard");
const guards_1 = require("../platform/guards");
const types_1 = require("../platform/types");
const mock_db_service_1 = require("../database/mock-db.service");
const catalog_pricing_service_1 = require("./catalog-pricing.service");
const payment_idempotency_service_1 = require("../payments/payment-idempotency.service");
let PricingController = class PricingController {
    constructor(catalog, db, idem) {
        this.catalog = catalog;
        this.db = db;
        this.idem = idem;
    }
    catalogPrices(slug) {
        const tenant = this.db.getTenantBySlug(slug);
        if (!tenant)
            return { success: false, message: 'Tenant not found' };
        const data = this.catalog.listCatalog(tenant.id);
        return {
            success: true,
            tenantId: tenant.id,
            updatedAt: new Date().toISOString(),
            count: data.length,
            data,
        };
    }
    validateCart(slug, body) {
        const tenant = this.db.getTenantBySlug(slug);
        if (!tenant)
            return { success: false, message: 'Tenant not found' };
        const result = this.catalog.validateCart(tenant.id, body.lines || []);
        return { success: true, data: result };
    }
    staffProducts(user) {
        return { success: true, data: this.catalog.listCatalog(user.tenantId) };
    }
    priceHistory(user, id, limit) {
        return {
            success: true,
            data: this.catalog.listHistory(user.tenantId, id, limit ? Number(limit) : 100),
        };
    }
    async updatePrice(user, id, body) {
        const data = await this.catalog.updatePrice(user, id, body || {});
        return { success: true, data };
    }
    async activateScheduled(user) {
        const data = await this.catalog.activateDueSchedules(user.tenantId);
        return { success: true, data };
    }
    initiatePayment(user, body) {
        const key = body.idempotencyKey || '';
        const { record, replay } = this.idem.begin({
            idempotencyKey: key,
            tenantId: user.tenantId,
            operation: 'PAYMENT_INITIATE',
            request: {
                amountInr: body.amountInr,
                currency: body.currency || 'INR',
                receipt: body.receipt,
                notes: body.notes,
                userId: user.id,
            },
        });
        if (replay && record.status === 'SUCCEEDED') {
            return { success: true, replay: true, data: record.responseJson };
        }
        if (replay && record.status === 'FAILED') {
            return { success: false, replay: true, message: record.errorMessage || 'Previous attempt failed' };
        }
        this.idem.markProcessing(key);
        const amountPaise = Math.round(Number(body.amountInr || 0) * 100);
        if (!amountPaise || amountPaise < 100) {
            this.idem.fail(key, 'Invalid amount');
            return { success: false, message: 'amountInr must be at least ₹1' };
        }
        const order = {
            id: 'order_' + Buffer.from(key).toString('hex').slice(0, 14),
            entity: 'order',
            amount: amountPaise,
            amount_due: amountPaise,
            amount_paid: 0,
            currency: body.currency || 'INR',
            receipt: body.receipt || `RCPT-${Date.now().toString().slice(-8)}`,
            status: 'created',
            notes: { ...(body.notes || {}), tenantId: user.tenantId, userId: user.id },
            idempotencyKey: key,
        };
        this.idem.succeed(key, {
            resourceType: 'RAZORPAY_ORDER',
            resourceId: order.id,
            gatewayOrderId: order.id,
            responseJson: order,
        });
        return { success: true, replay: false, data: order };
    }
    verifyPayment(user, body) {
        const paymentId = String(body.razorpay_payment_id || '').trim();
        const orderId = String(body.razorpay_order_id || '').trim();
        if (!paymentId || !orderId) {
            return { success: false, message: 'razorpay_order_id and razorpay_payment_id are required' };
        }
        const dup = this.idem.assertUniqueCapture(paymentId);
        if (dup.duplicate) {
            return {
                success: true,
                replay: true,
                message: 'Payment already captured — returning prior result (idempotent)',
                data: dup.record?.responseJson,
            };
        }
        const key = body.idempotencyKey || `verify:${paymentId}`;
        const { record, replay } = this.idem.begin({
            idempotencyKey: key,
            tenantId: user.tenantId,
            operation: 'PAYMENT_VERIFY',
            request: { paymentId, orderId, userId: user.id },
        });
        if (replay && record.status === 'SUCCEEDED') {
            return { success: true, replay: true, data: record.responseJson };
        }
        const secret = process.env.RAZORPAY_KEY_SECRET || '';
        if (!secret) {
            this.idem.fail(key, 'RAZORPAY_KEY_SECRET not configured');
            return {
                success: false,
                message: 'Payment verification is not configured on this server. Order stays unpaid until gateway secret is set.',
            };
        }
        const crypto = require('crypto');
        const expected = crypto
            .createHmac('sha256', secret)
            .update(orderId + '|' + paymentId)
            .digest('hex');
        if (expected !== String(body.razorpay_signature || '')) {
            this.idem.fail(key, 'Invalid signature');
            return { success: false, message: 'Payment signature verification failed' };
        }
        const payload = {
            paid: true,
            orderId,
            paymentId,
            verifiedAt: new Date().toISOString(),
            tenantId: user.tenantId,
            userId: user.id,
        };
        this.idem.succeed(key, {
            resourceType: 'PAYMENT',
            resourceId: paymentId,
            gatewayOrderId: orderId,
            gatewayPaymentId: paymentId,
            responseJson: payload,
        });
        return { success: true, replay: false, data: payload };
    }
};
exports.PricingController = PricingController;
__decorate([
    (0, common_1.Get)('tenants/:slug/catalog/prices'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "catalogPrices", null);
__decorate([
    (0, common_1.Post)('tenants/:slug/cart/validate'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "validateCart", null);
__decorate([
    (0, common_1.Get)('staff/products'),
    (0, guards_1.Authenticated)(...types_1.MANAGER_ROLES, 'SALES_MANAGER', 'STAFF'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "staffProducts", null);
__decorate([
    (0, common_1.Get)('staff/products/:id/price-history'),
    (0, guards_1.Authenticated)(...types_1.MANAGER_ROLES, 'SALES_MANAGER', 'STAFF'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "priceHistory", null);
__decorate([
    (0, common_1.Post)('staff/products/:id/price'),
    (0, guards_1.Authenticated)(...types_1.ADMIN_ROLES, 'SALES_MANAGER'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "updatePrice", null);
__decorate([
    (0, common_1.Post)('staff/pricing/activate-scheduled'),
    (0, guards_1.Authenticated)(...types_1.ADMIN_ROLES),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "activateScheduled", null);
__decorate([
    (0, common_1.Post)('payments/initiate'),
    (0, guards_1.Authenticated)('CUSTOMER', 'DEALER', ...types_1.MANAGER_ROLES, ...types_1.ADMIN_ROLES, 'STAFF', 'SALES_MANAGER'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "initiatePayment", null);
__decorate([
    (0, common_1.Post)('payments/verify'),
    (0, guards_1.Authenticated)('CUSTOMER', 'DEALER', ...types_1.MANAGER_ROLES, ...types_1.ADMIN_ROLES, 'STAFF', 'SALES_MANAGER'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "verifyPayment", null);
exports.PricingController = PricingController = __decorate([
    (0, common_1.Controller)('api/v1'),
    __metadata("design:paramtypes", [catalog_pricing_service_1.CatalogPricingService,
        mock_db_service_1.MockDatabaseService,
        payment_idempotency_service_1.PaymentIdempotencyService])
], PricingController);
//# sourceMappingURL=pricing.controller.js.map