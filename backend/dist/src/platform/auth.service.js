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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const store_service_1 = require("./store.service");
const ROUNDS = 10;
let AuthService = class AuthService {
    constructor(store, jwt) {
        this.store = store;
        this.jwt = jwt;
    }
    async onModuleInit() {
        const phone = process.env.BOOTSTRAP_ADMIN_PHONE;
        const pass = process.env.BOOTSTRAP_ADMIN_PASSWORD;
        if (!phone || !pass)
            return;
        const tenantId = store_service_1.PlatformStoreService.GURUKRIPA_TENANT_ID;
        if (this.store.users.some((u) => u.role === 'ADMIN' && u.tenantId === tenantId))
            return;
        if (this.store.findUserByPhone(tenantId, phone))
            return;
        await this.store.createUser({
            tenantId, role: 'ADMIN', name: 'Administrator', phone,
            passwordHash: await bcrypt.hash(pass, ROUNDS),
        });
        console.log('[auth] bootstrap administrator created from environment.');
    }
    resolveTenantId(slug) {
        if (!slug || slug === 'gurukripa')
            return store_service_1.PlatformStoreService.GURUKRIPA_TENANT_ID;
        const tenant = this.mockTenantLookup(slug);
        if (!tenant)
            throw new common_1.ConflictException('Unknown business tenant');
        return tenant.id;
    }
    mockTenantLookup(slug) {
        return this.store.mockDb?.getTenantBySlug?.(slug);
    }
    async register(dto) {
        const tenantId = this.resolveTenantId(dto.tenantSlug);
        if (this.store.findUserByPhone(tenantId, dto.phone)) {
            throw new common_1.ConflictException('An account already exists for this phone number');
        }
        const user = await this.store.createUser({
            tenantId, role: 'CUSTOMER', name: dto.name, phone: dto.phone,
            email: dto.email, language: dto.language,
            passwordHash: await bcrypt.hash(dto.password, ROUNDS),
        });
        return this.issueSession(user);
    }
    async registerDealer(dto) {
        const tenantId = this.resolveTenantId(dto.tenantSlug);
        if (this.store.findUserByPhone(tenantId, dto.phone)) {
            throw new common_1.ConflictException('An account already exists for this phone number');
        }
        const user = await this.store.createUser({
            tenantId, role: 'DEALER', name: dto.name, phone: dto.phone, email: dto.email,
            language: dto.language, dealerStatus: 'PENDING',
            firmName: dto.firmName, gstin: dto.gstin, licenseNo: dto.licenseNo,
            dealerAddress: dto.dealerAddress, dealerCity: dto.dealerCity,
            passwordHash: await bcrypt.hash(dto.password, ROUNDS),
        });
        const session = this.issueSession(user);
        return { ...session, dealerStatus: 'PENDING' };
    }
    async login(dto) {
        const tenantId = this.resolveTenantId(dto.tenantSlug);
        const user = this.store.findUserByPhone(tenantId, dto.phone);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid phone number or password');
        if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Invalid phone number or password');
        }
        if (user.role === 'DEALER' && user.dealerStatus === 'REJECTED') {
            throw new common_1.ForbiddenException('Dealer application was rejected. Contact the branch office.');
        }
        return this.issueSession(user);
    }
    issueSession(user) {
        const claims = {
            id: user.id, sub: user.id, tenantId: user.tenantId,
            name: user.name, phone: user.phone, email: user.email, role: user.role,
        };
        const token = this.jwt.sign(claims);
        return { user: { id: user.id, tenantId: user.tenantId, name: user.name, phone: user.phone, email: user.email, role: user.role }, token };
    }
    freshUser(userId) {
        return this.store.findUserById(userId);
    }
    assertDealerApproved(user) {
        const fresh = this.freshUser(user.id);
        if (!fresh)
            throw new common_1.UnauthorizedException('Account no longer exists');
        if (fresh.role !== 'DEALER' || fresh.dealerStatus !== 'APPROVED') {
            throw new common_1.ForbiddenException('Dealer account pending administrator approval');
        }
        return fresh;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.PlatformStoreService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map