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
exports.StaffController = void 0;
const common_1 = require("@nestjs/common");
const tenant_guard_1 = require("../security/tenant.guard");
const guards_1 = require("./guards");
const types_1 = require("./types");
const store_service_1 = require("./store.service");
const workflow_service_1 = require("./workflow.service");
const notify_service_1 = require("./notify.service");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
let StaffController = class StaffController {
    constructor(store, workflow, notify, auth) {
        this.store = store;
        this.workflow = workflow;
        this.notify = notify;
        this.auth = auth;
    }
    enquiries(user, status, mine) {
        return {
            success: true,
            data: this.store.listEnquiries(user.tenantId, {
                status: status,
                assignedStaffId: mine === '1' ? user.id : undefined,
            }),
        };
    }
    enquiry(user, id) {
        const enq = this.workflow.mustFindEnquiry(id);
        return { success: true, data: { ...enq, timeline: this.store.timeline('ENQUIRY', enq.id), customer: enq.userId ? { ...this.auth.freshUser(enq.userId), passwordHash: undefined } : null } };
    }
    review(user, id) {
        return this.workflow.reviewEnquiry(user, id).then((e) => ({ success: true, data: e }));
    }
    assign(user, id, dto) {
        return this.workflow.assignEnquiry(user, id, dto.staffId).then((e) => ({ success: true, data: e }));
    }
    staffMembers(user) {
        return { success: true, data: this.store.listStaff(user.tenantId).map((s) => ({ id: s.id, name: s.name, role: s.role })) };
    }
    createQuotation(user, id, dto) {
        return this.workflow.createQuotation(user, id, dto).then((q) => ({ success: true, data: q }));
    }
    sendQuotation(user, id) {
        return this.workflow.sendQuotation(user, id).then((q) => ({ success: true, data: q }));
    }
    quotations(user) {
        return { success: true, data: this.store.listQuotations(user.tenantId) };
    }
    orders(user, status) {
        const all = this.store.listOrders(user.tenantId);
        return { success: true, data: status ? all.filter((o) => o.status === status) : all };
    }
    orderStatus(user, id, dto) {
        return this.workflow.changeOrderStatus(user, id, dto).then((o) => ({ success: true, data: o }));
    }
    dealers(status) {
        return { success: true, data: this.store.listDealers(this.tenant(), status).map((d) => ({ ...d, passwordHash: undefined })) };
    }
    async dealerDecision(user, id, dto) {
        const dealer = this.auth.freshUser(id);
        if (!dealer || dealer.role !== 'DEALER')
            throw new common_1.NotFoundException('Dealer application not found');
        await this.store.updateUser(id, { dealerStatus: dto.status, dealerDiscountPct: dto.status === 'APPROVED' ? dto.dealerDiscountPct ?? 0 : undefined });
        await this.store.audit(user, `DEALER_${dto.status}`, 'USER', id, { dealerDiscountPct: dto.dealerDiscountPct });
        await this.notify.notifyUser(id, dealer.tenantId, 'ANNOUNCEMENT', dto.status === 'APPROVED' ? 'Dealer account approved' : 'Dealer application rejected', dto.status === 'APPROVED' ? 'Your dealer pricing is now active in the app.' : 'Contact the branch office for details.');
        return { success: true, message: `Dealer ${dto.status.toLowerCase()}` };
    }
    async createAnnouncement(user, dto) {
        const a = await this.store.saveAnnouncement({
            id: this.store.newId('ann'), tenantId: user.tenantId,
            title: dto.title, body: dto.body, audience: dto.audience || 'ALL',
            isActive: dto.isActive !== false, createdById: user.id, createdAt: this.store.now(),
        });
        await this.store.audit(user, 'ANNOUNCEMENT_CREATED', 'ANNOUNCEMENT', a.id);
        const audience = a.audience === 'ALL' ? ['CUSTOMER', 'DEALER'] : [a.audience];
        for (const u of this.store.users.filter((x) => x.tenantId === user.tenantId && audience.includes(x.role))) {
            await this.notify.notifyUser(u.id, u.tenantId, 'ANNOUNCEMENT', a.title, a.body);
        }
        return { success: true, data: a };
    }
    patchAnnouncement(user, id, dto) {
        const a = this.store.findAnnouncement(id);
        if (!a)
            throw new common_1.NotFoundException('Announcement not found');
        return this.store.saveAnnouncement({ ...a, ...dto }).then((x) => ({ success: true, data: x }));
    }
    stats(user) {
        const t = user.tenantId;
        const orders = this.store.listOrders(t);
        const active = orders.filter((o) => o.status !== 'CANCELLED');
        const revenue = active.reduce((s, o) => s + o.total, 0);
        const byStatus = {};
        for (const o of orders)
            byStatus[o.status] = (byStatus[o.status] || 0) + 1;
        return {
            success: true,
            data: {
                enquiries: { total: this.store.enquiries.filter((e) => e.tenantId === t).length, open: this.store.enquiries.filter((e) => e.tenantId === t && e.status !== 'CLOSED').length },
                quotations: { total: this.store.quotations.filter((q) => q.tenantId === t).length, awaitingCustomer: this.store.quotations.filter((q) => q.tenantId === t && q.status === 'SENT').length },
                orders: { total: orders.length, byStatus, revenue: Math.round(revenue * 100) / 100 },
                dealers: { pending: this.store.listDealers(t, 'PENDING').length, approved: this.store.listDealers(t, 'APPROVED').length },
                customers: this.store.users.filter((u) => u.tenantId === t && u.role === 'CUSTOMER').length,
            },
        };
    }
    audit(user, limit) {
        return { success: true, data: this.store.listAudit(user.tenantId, Number(limit) || 200) };
    }
    async exportCsv(user, entity, res) {
        const t = user.tenantId;
        let rows = [];
        if (entity === 'enquiries')
            rows = this.store.listEnquiries(t);
        else if (entity === 'quotations')
            rows = this.store.listQuotations(t);
        else if (entity === 'orders')
            rows = this.store.listOrders(t);
        else
            throw new common_1.BadRequestException('Export supports enquiries | quotations | orders');
        const lineSummary = (r) => (r.lines || []).map((l) => `${l.quantity} ${l.unit} of ${l.name || l.productName}`).join(' | ');
        const cols = entity === 'orders'
            ? ['number', 'status', 'deliveryAddress', 'lines', 'subtotal', 'discountAmount', 'taxableValue', 'cgst', 'sgst', 'total', 'createdAt']
            : entity === 'quotations'
                ? ['number', 'status', 'userId', 'lines', 'subtotal', 'discountAmount', 'total', 'validUntil', 'createdAt']
                : ['id', 'status', 'contactName', 'contactPhone', 'siteLocation', 'lines', 'createdAt'];
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const body = [
            cols.join(','),
            ...rows.map((r) => cols.map((c) => esc(c === 'lines' ? lineSummary(r) : r[c])).join(',')),
        ].join('\n');
        await this.store.audit(user, 'CSV_EXPORT', entity, 'all');
        res.setHeader('content-type', 'text/csv; charset=utf-8');
        res.setHeader('content-disposition', `attachment; filename="gurukripa-${entity}.csv"`);
        res.send(body);
    }
    tenant() {
        return store_service_1.PlatformStoreService.GURUKRIPA_TENANT_ID;
    }
};
exports.StaffController = StaffController;
__decorate([
    (0, common_1.Get)('enquiries'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('mine')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "enquiries", null);
__decorate([
    (0, common_1.Get)('enquiries/:id'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "enquiry", null);
__decorate([
    (0, common_1.Post)('enquiries/:id/review'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "review", null);
__decorate([
    (0, common_1.Post)('enquiries/:id/assign'),
    (0, guards_1.RequireRoles)('SALES_MANAGER', 'ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.StaffAssignDto]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "assign", null);
__decorate([
    (0, common_1.Get)('staff-members'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "staffMembers", null);
__decorate([
    (0, common_1.Post)('enquiries/:id/quotation'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.CreateQuotationDto]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "createQuotation", null);
__decorate([
    (0, common_1.Post)('quotations/:id/send'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "sendQuotation", null);
__decorate([
    (0, common_1.Get)('quotations'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "quotations", null);
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "orders", null);
__decorate([
    (0, common_1.Post)('orders/:id/status'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.OrderStatusDto]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "orderStatus", null);
__decorate([
    (0, common_1.Get)('dealers'),
    (0, guards_1.RequireRoles)(...types_1.ADMIN_ROLES),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "dealers", null);
__decorate([
    (0, common_1.Post)('dealers/:id/decision'),
    (0, guards_1.RequireRoles)(...types_1.ADMIN_ROLES),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.DealerApprovalDto]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "dealerDecision", null);
__decorate([
    (0, common_1.Post)('announcements'),
    (0, guards_1.RequireRoles)(...types_1.ADMIN_ROLES),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.AnnouncementDto]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "createAnnouncement", null);
__decorate([
    (0, common_1.Patch)('announcements/:id'),
    (0, guards_1.RequireRoles)(...types_1.ADMIN_ROLES),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "patchAnnouncement", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)('audit'),
    (0, guards_1.RequireRoles)(...types_1.ADMIN_ROLES),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "audit", null);
__decorate([
    (0, common_1.Get)('export/:entity.csv'),
    (0, guards_1.RequireRoles)(...types_1.MANAGER_ROLES),
    __param(0, (0, tenant_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('entity')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "exportCsv", null);
exports.StaffController = StaffController = __decorate([
    (0, common_1.Controller)('api/v1/staff'),
    (0, guards_1.Authenticated)(...types_1.STAFF_ROLES),
    __metadata("design:paramtypes", [store_service_1.PlatformStoreService,
        workflow_service_1.WorkflowService,
        notify_service_1.NotifyService,
        auth_service_1.AuthService])
], StaffController);
//# sourceMappingURL=staff.controller.js.map