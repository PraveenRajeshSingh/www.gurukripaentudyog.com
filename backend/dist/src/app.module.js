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
const api_controller_1 = require("./controllers/api.controller");
const pricing_service_1 = require("./pricing/pricing.service");
const mock_db_service_1 = require("./database/mock-db.service");
const tenant_guard_1 = require("./security/tenant.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        controllers: [api_controller_1.ApiController],
        providers: [pricing_service_1.PricingEngineService, mock_db_service_1.MockDatabaseService, tenant_guard_1.TenantIsolationGuard],
        exports: [pricing_service_1.PricingEngineService, mock_db_service_1.MockDatabaseService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map