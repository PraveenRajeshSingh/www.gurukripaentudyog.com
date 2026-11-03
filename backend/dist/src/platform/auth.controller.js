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
exports.PublicController = exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const store_service_1 = require("./store.service");
const workflow_service_1 = require("./workflow.service");
const guards_1 = require("./guards");
const tenant_guard_1 = require("../security/tenant.guard");
const dto_1 = require("./dto");
const TENANT = store_service_1.PlatformStoreService.GURUKRIPA_TENANT_ID;
let AuthController = class AuthController {
    constructor(auth) {
        this.auth = auth;
    }
    register(dto) {
        return this.auth.register(dto);
    }
    registerDealer(dto) {
        return this.auth.registerDealer(dto);
    }
    login(dto) {
        return this.auth.login(dto);
    }
    me(user) {
        return { user, account: this.auth.freshUser(user.id) ? { ...this.auth.freshUser(user.id), passwordHash: undefined } : null };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, guards_1.RateLimit)(8, 60_000),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('dealer-register'),
    (0, guards_1.RateLimit)(5, 60_000),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.DealerRegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "registerDealer", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, guards_1.RateLimit)(10, 60_000),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, guards_1.Authenticated)(),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('api/v1/auth'),
    (0, common_1.UseGuards)(guards_1.RateLimitGuard),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
let PublicController = class PublicController {
    constructor(store, workflow) {
        this.store = store;
        this.workflow = workflow;
    }
    products() {
        return { success: true, count: this.store.productsOf(TENANT).length, data: this.store.productsOf(TENANT) };
    }
    categories() {
        const cats = Array.from(new Set(this.store.productsOf(TENANT).map((p) => p.category)));
        return { success: true, data: cats };
    }
    announcements() {
        return { success: true, data: this.store.listAnnouncements(TENANT, true) };
    }
    async guestEnquiry(dto) {
        if (!dto.contactPhone || !dto.contactName) {
            throw new common_1.BadRequestException('contactName and contactPhone are required for guest enquiries');
        }
        const enq = await this.store.createEnquiry({
            tenantId: TENANT, userId: undefined,
            contactName: dto.contactName, contactPhone: dto.contactPhone,
            siteLocation: dto.siteLocation, notes: dto.notes,
            lines: dto.lines, attachments: dto.attachments || [],
        });
        await this.store.audit({ id: 'guest', role: 'CUSTOMER' }, 'ENQUIRY_CREATED', 'ENQUIRY', enq.id, { guest: true });
        return { success: true, data: enq };
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, common_1.Get)('products'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "products", null);
__decorate([
    (0, common_1.Get)('products/categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "categories", null);
__decorate([
    (0, common_1.Get)('announcements'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "announcements", null);
__decorate([
    (0, common_1.Post)('enquiries'),
    (0, guards_1.RateLimit)(6, 60_000),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateEnquiryDto]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "guestEnquiry", null);
exports.PublicController = PublicController = __decorate([
    (0, common_1.Controller)('api/v1/public'),
    (0, common_1.UseGuards)(guards_1.RateLimitGuard),
    __metadata("design:paramtypes", [store_service_1.PlatformStoreService,
        workflow_service_1.WorkflowService])
], PublicController);
//# sourceMappingURL=auth.controller.js.map