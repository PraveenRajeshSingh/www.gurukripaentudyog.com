// Staff / sales-manager / administrator operations (requirements C + D).
// Role gates are enforced per route by RolesGuard on the verified JWT claim;
// Administrators (ADMIN or SUPER_ADMIN) additionally control dealers,
// announcements, audit and exports.
import {
  BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch,
  Post, Query, Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../security/tenant.guard';
import { AuthenticatedUser, UserRole } from '../types/domain';
import { Authenticated, RateLimitGuard, RequireRoles, RolesGuard, JwtAuthGuard } from './guards';
import { ADMIN_ROLES, MANAGER_ROLES, STAFF_ROLES } from './types';
import { PlatformStoreService } from './store.service';
import { WorkflowService } from './workflow.service';
import { NotifyService } from './notify.service';
import { AuthService } from './auth.service';
import {
  AnnouncementDto, CreateQuotationDto, DealerApprovalDto, OrderStatusDto,
  StaffAssignDto,
} from './dto';

@Controller('api/v1/staff')
@Authenticated(...STAFF_ROLES)
export class StaffController {
  constructor(
    private readonly store: PlatformStoreService,
    private readonly workflow: WorkflowService,
    private readonly notify: NotifyService,
    private readonly auth: AuthService,
  ) {}

  // ----------------------------------------------------------- enquiries
  @Get('enquiries')
  enquiries(@CurrentUser() user: AuthenticatedUser, @Query('status') status?: string, @Query('mine') mine?: string) {
    return {
      success: true,
      data: this.store.listEnquiries(user.tenantId, {
        status: status as any,
        assignedStaffId: mine === '1' ? user.id : undefined,
      }),
    };
  }

  @Get('enquiries/:id')
  enquiry(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const enq = this.workflow.mustFindEnquiry(id);
    return { success: true, data: { ...enq, timeline: this.store.timeline('ENQUIRY', enq.id), customer: enq.userId ? { ...this.auth.freshUser(enq.userId), passwordHash: undefined } : null } };
  }

  @Post('enquiries/:id/review')
  review(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.workflow.reviewEnquiry(user, id).then((e) => ({ success: true, data: e }));
  }

  @Post('enquiries/:id/assign')
  @RequireRoles('SALES_MANAGER', 'ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')
  assign(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: StaffAssignDto) {
    return this.workflow.assignEnquiry(user, id, dto.staffId).then((e) => ({ success: true, data: e }));
  }

  @Get('staff-members')
  staffMembers(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: this.store.listStaff(user.tenantId).map((s) => ({ id: s.id, name: s.name, role: s.role })) };
  }

  // ----------------------------------------------------------- quotations
  @Post('enquiries/:id/quotation')
  createQuotation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateQuotationDto) {
    return this.workflow.createQuotation(user, id, dto).then((q) => ({ success: true, data: q }));
  }

  @Post('quotations/:id/send')
  sendQuotation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.workflow.sendQuotation(user, id).then((q) => ({ success: true, data: q }));
  }

  @Get('quotations')
  quotations(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: this.store.listQuotations(user.tenantId) };
  }

  // --------------------------------------------------------------- orders
  @Get('orders')
  orders(@CurrentUser() user: AuthenticatedUser, @Query('status') status?: string) {
    const all = this.store.listOrders(user.tenantId);
    return { success: true, data: status ? all.filter((o) => o.status === status) : all };
  }

  @Post('orders/:id/status')
  orderStatus(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: OrderStatusDto) {
    // Dispatch-side transitions also open to DISPATCHER/WAREHOUSE staff roles.
    return this.workflow.changeOrderStatus(user, id, dto).then((o) => ({ success: true, data: o }));
  }

  // -------------------------------------------------------------- dealers
  @Get('dealers')
  @RequireRoles(...ADMIN_ROLES)
  dealers(@Query('status') status?: string) {
    return { success: true, data: this.store.listDealers(this.tenant(), status).map((d) => ({ ...d, passwordHash: undefined })) };
  }

  @Post('dealers/:id/decision')
  @RequireRoles(...ADMIN_ROLES)
  async dealerDecision(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: DealerApprovalDto) {
    const dealer = this.auth.freshUser(id);
    if (!dealer || dealer.role !== 'DEALER') throw new NotFoundException('Dealer application not found');
    await this.store.updateUser(id, { dealerStatus: dto.status, dealerDiscountPct: dto.status === 'APPROVED' ? dto.dealerDiscountPct ?? 0 : undefined });
    await this.store.audit(user, `DEALER_${dto.status}`, 'USER', id, { dealerDiscountPct: dto.dealerDiscountPct });
    await this.notify.notifyUser(id, dealer.tenantId, 'ANNOUNCEMENT',
      dto.status === 'APPROVED' ? 'Dealer account approved' : 'Dealer application rejected',
      dto.status === 'APPROVED' ? 'Your dealer pricing is now active in the app.' : 'Contact the branch office for details.');
    return { success: true, message: `Dealer ${dto.status.toLowerCase()}` };
  }

  // --------------------------------------------------------- announcements
  @Post('announcements')
  @RequireRoles(...ADMIN_ROLES)
  async createAnnouncement(@CurrentUser() user: AuthenticatedUser, @Body() dto: AnnouncementDto) {
    const a = await this.store.saveAnnouncement({
      id: this.store.newId('ann'), tenantId: user.tenantId,
      title: dto.title, body: dto.body, audience: dto.audience || 'ALL',
      isActive: dto.isActive !== false, createdById: user.id, createdAt: this.store.now(),
    });
    await this.store.audit(user, 'ANNOUNCEMENT_CREATED', 'ANNOUNCEMENT', a.id);
    // Notify opted-in users of the new announcement (inbox record; transport
    // follows each device's preferences).
    const audience = a.audience === 'ALL' ? ['CUSTOMER', 'DEALER'] : [a.audience];
    for (const u of this.store.users.filter((x) => x.tenantId === user.tenantId && audience.includes(x.role))) {
      await this.notify.notifyUser(u.id, u.tenantId, 'ANNOUNCEMENT', a.title, a.body);
    }
    return { success: true, data: a };
  }

  @Patch('announcements/:id')
  @RequireRoles(...ADMIN_ROLES)
  patchAnnouncement(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: Partial<AnnouncementDto>) {
    const a = this.store.findAnnouncement(id);
    if (!a) throw new NotFoundException('Announcement not found');
    return this.store.saveAnnouncement({ ...a, ...dto }).then((x) => ({ success: true, data: x }));
  }

  // --------------------------------------------------------------- stats
  @Get('stats')
  stats(@CurrentUser() user: AuthenticatedUser) {
    const t = user.tenantId;
    const orders = this.store.listOrders(t);
    const active = orders.filter((o) => o.status !== 'CANCELLED');
    const revenue = active.reduce((s, o) => s + o.total, 0);
    const byStatus: Record<string, number> = {};
    for (const o of orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1;
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

  // ---------------------------------------------------------- audit trail
  @Get('audit')
  @RequireRoles(...ADMIN_ROLES)
  audit(@CurrentUser() user: AuthenticatedUser, @Query('limit') limit?: string) {
    return { success: true, data: this.store.listAudit(user.tenantId, Number(limit) || 200) };
  }

  // --------------------------------------------------------- CSV exports
  @Get('export/:entity.csv')
  @RequireRoles(...MANAGER_ROLES)
  async exportCsv(@CurrentUser() user: AuthenticatedUser, @Param('entity') entity: string, @Res() res: Response) {
    const t = user.tenantId;
    let rows: any[] = [];
    if (entity === 'enquiries') rows = this.store.listEnquiries(t);
    else if (entity === 'quotations') rows = this.store.listQuotations(t);
    else if (entity === 'orders') rows = this.store.listOrders(t);
    else throw new BadRequestException('Export supports enquiries | quotations | orders');

    const lineSummary = (r: any) => (r.lines || []).map((l: any) => `${l.quantity} ${l.unit} of ${l.name || l.productName}`).join(' | ');
    const cols = entity === 'orders'
      ? ['number', 'status', 'deliveryAddress', 'lines', 'subtotal', 'discountAmount', 'taxableValue', 'cgst', 'sgst', 'total', 'createdAt']
      : entity === 'quotations'
        ? ['number', 'status', 'userId', 'lines', 'subtotal', 'discountAmount', 'total', 'validUntil', 'createdAt']
        : ['id', 'status', 'contactName', 'contactPhone', 'siteLocation', 'lines', 'createdAt'];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = [
      cols.join(','),
      ...rows.map((r: any) => cols.map((c) => esc(c === 'lines' ? lineSummary(r) : r[c])).join(',')),
    ].join('\n');
    await this.store.audit(user, 'CSV_EXPORT', entity, 'all');
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.setHeader('content-disposition', `attachment; filename="gurukripa-${entity}.csv"`);
    res.send(body);
  }

  private tenant(): string {
    return PlatformStoreService.GURUKRIPA_TENANT_ID;
  }
}
