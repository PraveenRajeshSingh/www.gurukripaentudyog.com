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
exports.ApiController = void 0;
const common_1 = require("@nestjs/common");
const pricing_service_1 = require("../pricing/pricing.service");
const mock_db_service_1 = require("../database/mock-db.service");
let ApiController = class ApiController {
    constructor(pricingEngine, db) {
        this.pricingEngine = pricingEngine;
        this.db = db;
    }
    getTenantBranding(slug) {
        const tenant = this.db.getTenantBySlug(slug);
        if (!tenant) {
            return { success: false, message: 'Tenant not found' };
        }
        return {
            success: true,
            data: {
                id: tenant.id,
                slug: tenant.slug,
                name: tenant.name,
                legalName: tenant.legalName,
                gstin: tenant.gstin,
                phone: tenant.phone,
                email: tenant.email,
                address: tenant.address,
                primaryColor: tenant.primaryColor,
                secondaryColor: tenant.secondaryColor,
            },
        };
    }
    getTenantProducts(slug) {
        const tenant = this.db.getTenantBySlug(slug);
        if (!tenant)
            return { success: false, message: 'Tenant not found' };
        const products = this.db.getProductsForTenant(tenant.id);
        return { success: true, count: products.length, data: products };
    }
    calculateEstimate(params) {
        const result = this.pricingEngine.calculateEstimation(params);
        return { success: true, data: result };
    }
    createOrder(body) {
        const tenantId = body.tenantId;
        if (!tenantId) {
            throw new common_1.UnauthorizedException('Tenant ID is required to place an order');
        }
        const order = this.db.createOrder(tenantId, body);
        return { success: true, message: 'Order created successfully', data: order };
    }
    syncOfflineData(body) {
        if (!body.tenantId || !body.deviceId) {
            throw new common_1.UnauthorizedException('Tenant ID and Device ID are mandatory for sync transactions');
        }
        const result = this.db.recordSyncBatch(body.tenantId, body.deviceId, body.userId, body.entries || []);
        return { success: true, message: 'Offline sync journal applied successfully', result };
    }
};
exports.ApiController = ApiController;
__decorate([
    (0, common_1.Get)('tenants/:slug/branding'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ApiController.prototype, "getTenantBranding", null);
__decorate([
    (0, common_1.Get)('tenants/:slug/products'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ApiController.prototype, "getTenantProducts", null);
__decorate([
    (0, common_1.Post)('calculator/estimate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApiController.prototype, "calculateEstimate", null);
__decorate([
    (0, common_1.Post)('orders'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApiController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('sync/push'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApiController.prototype, "syncOfflineData", null);
exports.ApiController = ApiController = __decorate([
    (0, common_1.Controller)('api/v1'),
    __metadata("design:paramtypes", [pricing_service_1.PricingEngineService,
        mock_db_service_1.MockDatabaseService])
], ApiController);
//# sourceMappingURL=api.controller.js.map