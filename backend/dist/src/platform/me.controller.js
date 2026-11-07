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
exports.MeController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../security/tenant.guard");
const guards_1 = require("./guards");
const store_service_1 = require("./store.service");
const workflow_service_1 = require("./workflow.service");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
let MeController = class MeController {
    constructor(store, workflow, auth) {
        this.store = store;
        this.workflow = workflow;
        this.auth = auth;
    }
    profile(user) {
        const fresh = this.auth.freshUser(user.id);
        const { passwordHash, ...safe } = fresh;
        return { success: true, data: safe };
    }
    updateProfile(user, dto) {
        const updated = this.store.updateUser(user.id, dto);
        return { success: true, data: updated };
    }
    addresses(user) {
        return { success: true, data: this.store.addressesOf(user.id) };
    }
    addAddress(user, dto) {
        return this.store.addAddress(user.id, user.tenantId, dto).then((a) => ({ success: true, data: a }));
    }
    async removeAddress(user, id) {
        const ok = await this.store.removeAddress(user.id, id);
        if (!ok)
            throw new common_1.NotFoundException('Address not found');
        return { success: true };
    }
    async createEnquiry(user, dto) {
        let siteLocation = dto.siteLocation;
        if (dto.addressId) {
            const addr = this.store.findAddress(user.id, dto.addressId);
            if (!addr)
                throw new common_1.BadRequestException('Unknown address id');
            siteLocation = `${addr.line1}, ${addr.city} ${addr.pincode}`;
        }
        const enq = await this.store.createEnquiry({
            tenantId: user.tenantId, userId: user.id,
            contactName: dto.contactName || user.name, contactPhone: dto.contactPhone || user.phone,
            siteLocation, notes: dto.notes, lines: dto.lines, attachments: dto.attachments || [],
        });
        await this.store.audit(user, 'ENQUIRY_CREATED', 'ENQUIRY', enq.id);
        return { success: true, data: enq };
    }
    myEnquiries(user) {
        return { success: true, data: this.store.listEnquiries(user.tenantId, { userId: user.id }) };
    }
    myEnquiry(user, id) {
        const enq = this.workflow.mustFindEnquiry(id);
        if (enq.userId !== user.id)
            throw new common_1.NotFoundException('Enquiry not found');
        return { success: true, data: { ...enq, timeline: this.store.timeline('ENQUIRY', enq.id) } };
    }
    myQuotations(user) {
        return { success: true, data: this.store.listQuotations(user.tenantId, user.id) };
    }
    myQuotation(user, id) {
        const q = this.workflow.mustFindQuotation(id);
        if (q.userId !== user.id)
            throw new common_1.NotFoundException('Quotation not found');
        return { success: true, data: { ...q, timeline: this.store.timeline('QUOTATION', q.id) } };
    }
    async approveQuotation(user, id) {
        const order = await this.workflow.respondToQuotation(user, id, true);
        return { success: true, message: 'Quotation approved and order confirmed', data: order };
    }
    async rejectQuotation(user, id, body) {
        await this.workflow.respondToQuotation(user, id, false, body?.reason);
        return { success: true, message: 'Quotation rejected; our team will follow up' };
    }
    myOrders(user) {
        return { success: true, data: this.store.listOrders(user.tenantId, user.id) };
    }
    myOrder(user, id) {
        const o = this.workflow.mustFindOrder(id);
        if (o.userId !== user.id)
            throw new common_1.NotFoundException('Order not found');
        return { success: true, data: { ...o, timeline: this.store.timeline('ORDER', o.id) } };
    }
    cancelOrder(user, id, body) {
        return this.workflow
            .changeOrderStatus(user, id, { status: 'CANCELLED', note: body?.reason })
            .then((o) => ({ success: true, data: o }));
    }
    async reorder(user, id) {
        const o = this.workflow.mustFindOrder(id);
        if (o.userId !== user.id)
            throw new common_1.NotFoundException('Order not found');
        const enq = await this.store.createEnquiry({
            tenantId: user.tenantId, userId: user.id,
            contactName: user.name, contactPhone: user.phone,
            siteLocation: o.deliveryAddress, notes: `Repeat order request - previously ${o.number}`,
            lines: o.lines.map((l) => ({ productId: l.productId, productName: l.name, quantity: l.quantity, unit: l.unit })),
            attachments: [],
        });
        await this.store.audit(user, 'ORDER_REPEAT_ENQUIRY', 'ORDER', o.id, { newEnquiryId: enq.id });
        return { success: true, data: enq };
    }
    invoiceDocument(user, id) {
        const o = this.workflow.mustFindOrder(id);
        this.workflow.assertTenantAccess(user, o.tenantId);
        if (o.userId !== user.id)
            throw new common_1.NotFoundException('Order not found');
        const tenant = this.store.mockDb?.getTenantBySlug?.(o.tenantId)
            || this.store.mockDb?.getTenantBySlug?.('gurukripa');
        if (!tenant)
            throw new common_1.NotFoundException('Business profile not found for this order');
        return {
            success: true,
            data: {
                documentType: 'TAX_INVOICE',
                business: { name: tenant.name, legalName: tenant.legalName, gstin: tenant.gstin, address: `${tenant.address}, ${tenant.city}`, phone: tenant.phone, email: tenant.email },
                billTo: { name: user.name, phone: user.phone, address: o.deliveryAddress },
                invoiceNumber: o.number, date: o.createdAt, status: o.status,
                lines: o.lines, taxableValue: o.taxableValue, cgst: o.cgst, sgst: o.sgst, total: o.total,
                paymentMethod: o.paymentMethod,
            },
        };
    }
    registerDevice(user, dto) {
        return this.store.registerDevice(user.id, dto).then((d) => ({ success: true, data: d }));
    }
    updateDevicePrefs(user, id, dto) {
        return this.store.updateDevicePrefs(user.id, id, dto).then((d) => ({ success: true, data: d }));
    }
    notifications(user) {
        return { success: true, data: this.store.notificationsOf(user.id) };
    }
    markRead(user) {
        return this.store.markNotificationsRead(user.id).then((count) => ({ success: true, count }));
    }
    dealerStatus(user) {
        const fresh = this.auth.freshUser(user.id);
        if (fresh.role !== 'DEALER')
            throw new common_1.BadRequestException('Not a dealer account');
        return { success: true, data: { dealerStatus: fresh.dealerStatus, firmName: fresh.firmName, dealerDiscountPct: fresh.dealerDiscountPct || 0 } };
    }
    savedSites(user) {
        return { success: true, data: this.store.savedSitesOf(user.id) };
    }
    addSavedSite(user, dto) {
        return this.store.addSavedSite(user.id, user.tenantId, dto).then((s) => ({ success: true, data: s }));
    }
    dealerOverview(user) {
        const fresh = this.auth.assertDealerApproved(user);
        const orders = this.store.listOrders(user.tenantId, user.id);
        const quotations = this.store.listQuotations(user.tenantId, user.id);
        const totalValue = orders.filter((o) => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0);
        return {
            success: true,
            data: {
                firmName: fresh.firmName, dealerDiscountPct: fresh.dealerDiscountPct || 0,
                orders, quotations,
                statement: { totalOrderValue: Math.round(totalValue * 100) / 100, orderCount: orders.length },
            },
        };
    }
};
exports.MeController = MeController;
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "profile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('addresses'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "addresses", null);
__decorate([
    (0, common_1.Post)('addresses'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.AddressDto]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "addAddress", null);
__decorate([
    (0, common_1.Delete)('addresses/:id'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "removeAddress", null);
__decorate([
    (0, common_1.Post)('enquiries'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateEnquiryDto]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "createEnquiry", null);
__decorate([
    (0, common_1.Get)('enquiries'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "myEnquiries", null);
__decorate([
    (0, common_1.Get)('enquiries/:id'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "myEnquiry", null);
__decorate([
    (0, common_1.Get)('quotations'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "myQuotations", null);
__decorate([
    (0, common_1.Get)('quotations/:id'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "myQuotation", null);
__decorate([
    (0, common_1.Post)('quotations/:id/approve'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "approveQuotation", null);
__decorate([
    (0, common_1.Post)('quotations/:id/reject'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "rejectQuotation", null);
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "myOrders", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "myOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/cancel'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/reorder'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "reorder", null);
__decorate([
    (0, common_1.Get)('orders/:id/invoice'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "invoiceDocument", null);
__decorate([
    (0, common_1.Post)('devices'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DeviceTokenDto]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "registerDevice", null);
__decorate([
    (0, common_1.Put)('devices/:id/preferences'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.DevicePrefsDto]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "updateDevicePrefs", null);
__decorate([
    (0, common_1.Get)('notifications'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "notifications", null);
__decorate([
    (0, common_1.Post)('notifications/read-all'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "markRead", null);
__decorate([
    (0, common_1.Get)('dealer/status'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "dealerStatus", null);
__decorate([
    (0, common_1.Get)('dealer/sites'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "savedSites", null);
__decorate([
    (0, common_1.Post)('dealer/sites'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SavedSiteDto]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "addSavedSite", null);
__decorate([
    (0, common_1.Get)('dealer/overview'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MeController.prototype, "dealerOverview", null);
exports.MeController = MeController = __decorate([
    (0, common_1.Controller)('api/v1/me'),
    (0, guards_1.Authenticated)(),
    __metadata("design:paramtypes", [store_service_1.PlatformStoreService,
        workflow_service_1.WorkflowService,
        auth_service_1.AuthService])
], MeController);
//# sourceMappingURL=me.controller.js.map