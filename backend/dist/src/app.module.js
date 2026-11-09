"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const crypto = require("crypto");
const api_controller_1 = require("./controllers/api.controller");
const pricing_service_1 = require("./pricing/pricing.service");
const catalog_pricing_service_1 = require("./pricing/catalog-pricing.service");
const pricing_controller_1 = require("./pricing/pricing.controller");
const payment_idempotency_service_1 = require("./payments/payment-idempotency.service");
const mock_db_service_1 = require("./database/mock-db.service");
const tenant_guard_1 = require("./security/tenant.guard");
const store_service_1 = require("./platform/store.service");
const auth_service_1 = require("./platform/auth.service");
const notify_service_1 = require("./platform/notify.service");
const workflow_service_1 = require("./platform/workflow.service");
const guards_1 = require("./platform/guards");
const auth_controller_1 = require("./platform/auth.controller");
const me_controller_1 = require("./platform/me.controller");
const staff_controller_1 = require("./platform/staff.controller");
const health_controller_1 = require("./platform/health.controller");
const jwtSecret = process.env.JWT_SECRET ||
    (() => {
        console.warn('[auth] JWT_SECRET is not set - using a random per-process secret. Set JWT_SECRET before deploying!');
        return crypto.randomBytes(32).toString('hex');
    })();
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({
                global: true,
                secret: jwtSecret,
                signOptions: { expiresIn: process.env.JWT_EXPIRATION || '12h' },
            }),
        ],
        controllers: [
            api_controller_1.ApiController, auth_controller_1.AuthController, auth_controller_1.PublicController, me_controller_1.MeController,
            staff_controller_1.StaffController, health_controller_1.HealthController, pricing_controller_1.PricingController,
        ],
        providers: [
            pricing_service_1.PricingEngineService, catalog_pricing_service_1.CatalogPricingService, payment_idempotency_service_1.PaymentIdempotencyService,
            mock_db_service_1.MockDatabaseService, tenant_guard_1.TenantIsolationGuard,
            store_service_1.PlatformStoreService, auth_service_1.AuthService, notify_service_1.NotifyService, workflow_service_1.WorkflowService,
            guards_1.JwtAuthGuard, guards_1.RolesGuard, guards_1.RateLimitGuard,
        ],
        exports: [
            pricing_service_1.PricingEngineService, catalog_pricing_service_1.CatalogPricingService, payment_idempotency_service_1.PaymentIdempotencyService,
            mock_db_service_1.MockDatabaseService, store_service_1.PlatformStoreService, workflow_service_1.WorkflowService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map