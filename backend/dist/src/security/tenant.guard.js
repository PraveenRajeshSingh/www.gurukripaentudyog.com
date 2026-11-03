"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = exports.TenantIsolationGuard = exports.CurrentUser = exports.CurrentTenant = void 0;
require("reflect-metadata");
const common_1 = require("@nestjs/common");
exports.CurrentTenant = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user?.tenantId && !request.tenantId) {
        throw new common_1.UnauthorizedException('Tenant context is missing or unauthenticated');
    }
    return request.user?.tenantId || request.tenantId;
});
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user) {
        throw new common_1.UnauthorizedException('User is not authenticated');
    }
    return request.user;
});
let TenantIsolationGuard = class TenantIsolationGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user?.role === 'SUPER_ADMIN') {
            return true;
        }
        if (!user || !user.tenantId) {
            throw new common_1.UnauthorizedException('Unauthenticated: Missing tenant authorization token');
        }
        const requestedTenantId = request.params?.tenantId || request.body?.tenantId;
        if (requestedTenantId && requestedTenantId !== user.tenantId) {
            throw new common_1.ForbiddenException(`Cross-Tenant Access Violation: You do not have permission to access tenant ${requestedTenantId}`);
        }
        request.tenantId = user.tenantId;
        return true;
    }
};
exports.TenantIsolationGuard = TenantIsolationGuard;
exports.TenantIsolationGuard = TenantIsolationGuard = __decorate([
    (0, common_1.Injectable)()
], TenantIsolationGuard);
const Roles = (...roles) => (0, common_1.SetMetadata)('jwt:roles', roles);
exports.Roles = Roles;
//# sourceMappingURL=tenant.guard.js.map