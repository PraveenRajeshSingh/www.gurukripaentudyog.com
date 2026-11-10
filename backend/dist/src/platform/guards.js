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
exports.Authenticated = exports.RateLimitGuard = exports.RolesGuard = exports.JwtAuthGuard = exports.RateLimit = exports.RequireRoles = exports.RATE_LIMIT_KEY = exports.JWT_ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const tenant_guard_1 = require("../security/tenant.guard");
exports.JWT_ROLES_KEY = 'jwt:roles';
exports.RATE_LIMIT_KEY = 'platform:rateLimit';
const RequireRoles = (...roles) => (0, common_1.SetMetadata)(exports.JWT_ROLES_KEY, roles);
exports.RequireRoles = RequireRoles;
const RateLimit = (max, windowMs) => (0, common_1.SetMetadata)(exports.RATE_LIMIT_KEY, { max, windowMs });
exports.RateLimit = RateLimit;
let JwtAuthGuard = class JwtAuthGuard {
    constructor(jwt) {
        this.jwt = jwt;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const header = request.headers?.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing bearer token');
        }
        try {
            const payload = await this.jwt.verifyAsync(header.slice(7));
            request.user = { id: payload.id, tenantId: payload.tenantId, name: payload.name, phone: payload.phone, email: payload.email, role: payload.role };
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired session token');
        }
        return true;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], JwtAuthGuard);
let RolesGuard = class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const required = this.reflector.getAllAndOverride(exports.JWT_ROLES_KEY, [
            context.getHandler(), context.getClass(),
        ]);
        if (!required || required.length === 0)
            return true;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            throw new common_1.UnauthorizedException('Unauthenticated');
        const held = new Set([user.role]);
        if (user.role === 'SUPER_ADMIN')
            held.add('TENANT_ADMIN');
        if (!required.some((r) => held.has(r))) {
            throw new common_1.ForbiddenException(`Requires role: ${required.join(' | ')}`);
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
let RateLimitGuard = class RateLimitGuard {
    canActivate(context) {
        const cfg = this.reflectorCfg(context);
        if (!cfg)
            return true;
        const request = context.switchToHttp().getRequest();
        const key = `${request.ip || 'unknown'}:${context.getHandler()?.name}`;
        const now = Date.now();
        const windowStart = now - cfg.windowMs;
        const recent = (this.hits.get(key) || []).filter((t) => t > windowStart);
        if (recent.length >= cfg.max) {
            throw new common_1.ForbiddenException('Too many requests — please slow down and retry shortly.');
        }
        recent.push(now);
        this.hits.set(key, recent);
        if (this.hits.size > 10_000) {
            for (const [k, times] of this.hits) {
                if (!times.some((t) => t > windowStart))
                    this.hits.delete(k);
            }
        }
        return true;
    }
    reflectorCfg(context) {
        return this.reflector.getAllAndOverride(exports.RATE_LIMIT_KEY, [context.getHandler(), context.getClass()]);
    }
    constructor(reflector) {
        this.reflector = reflector;
        this.hits = new Map();
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RateLimitGuard);
const Authenticated = (...roles) => (0, common_1.applyDecorators)((0, common_1.UseGuards)(JwtAuthGuard, tenant_guard_1.TenantIsolationGuard, RolesGuard), ...(roles.length ? [(0, exports.RequireRoles)(...roles)] : []));
exports.Authenticated = Authenticated;
//# sourceMappingURL=guards.js.map