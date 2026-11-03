// Customer & dealer self-service endpoints (requirements A + B).
// Every route asserts ownership from the verified JWT subject - a customer
// can only ever read or act on their own enquiries, quotations, orders and
// documents (requirement D).
import {
  BadRequestException, Body, Controller, Delete, Get, NotFoundException,
  Param, Patch, Post, Put, UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../security/tenant.guard';
import { AuthenticatedUser } from '../types/domain';
import { Authenticated, RateLimit, RateLimitGuard } from './guards';
import { PlatformStoreService } from './store.service';
import { WorkflowService } from './workflow.service';
import { AuthService } from './auth.service';
import { NotifyService } from './notify.service';
import {
  AddressDto, CreateEnquiryDto, DevicePrefsDto, DeviceTokenDto,
  LoginDto, SavedSiteDto, UpdateProfileDto,
} from './dto';

@Controller('api/v1/me')
@Authenticated()
export class MeController {
  constructor(
    private readonly store: PlatformStoreService,
    private readonly workflow: WorkflowService,
    private readonly auth: AuthService,
  ) {}

  // ------------------------------------------------------------ profile
  @Get('profile')
  profile(@CurrentUser() user: AuthenticatedUser) {
    const fresh = this.auth.freshUser(user.id)!;
    const { passwordHash, ...safe } = fresh;
    return { success: true, data: safe };
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    const updated = this.store.updateUser(user.id, dto);
    return { success: true, data: updated };
  }

  // ----------------------------------------------------------- addresses
  @Get('addresses')
  addresses(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: this.store.addressesOf(user.id) };
  }

  @Post('addresses')
  addAddress(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddressDto) {
    return this.store.addAddress(user.id, user.tenantId, dto).then((a) => ({ success: true, data: a }));
  }

  @Delete('addresses/:id')
  async removeAddress(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const ok = await this.store.removeAddress(user.id, id);
    if (!ok) throw new NotFoundException('Address not found');
    return { success: true };
  }

  // ----------------------------------------------------------- enquiries
  @Post('enquiries')
  async createEnquiry(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEnquiryDto) {
    let siteLocation = dto.siteLocation;
    if (dto.addressId) {
      const addr = this.store.findAddress(user.id, dto.addressId);
      if (!addr) throw new BadRequestException('Unknown address id');
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

  @Get('enquiries')
  myEnquiries(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: this.store.listEnquiries(user.tenantId, { userId: user.id }) };
  }

  @Get('enquiries/:id')
  myEnquiry(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const enq = this.workflow.mustFindEnquiry(id);
    if (enq.userId !== user.id) throw new NotFoundException('Enquiry not found');
    return { success: true, data: { ...enq, timeline: this.store.timeline('ENQUIRY', enq.id) } };
  }

  // ----------------------------------------------------------- quotations
  @Get('quotations')
  myQuotations(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: this.store.listQuotations(user.tenantId, user.id) };
  }

  @Get('quotations/:id')
  myQuotation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const q = this.workflow.mustFindQuotation(id);
    if (q.userId !== user.id) throw new NotFoundException('Quotation not found');
    return { success: true, data: { ...q, timeline: this.store.timeline('QUOTATION', q.id) } };
  }

  @Post('quotations/:id/approve')
  async approveQuotation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const order = await this.workflow.respondToQuotation(user, id, true);
    return { success: true, message: 'Quotation approved and order confirmed', data: order };
  }

  @Post('quotations/:id/reject')
  async rejectQuotation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: { reason?: string }) {
    await this.workflow.respondToQuotation(user, id, false, body?.reason);
    return { success: true, message: 'Quotation rejected; our team will follow up' };
  }

  // --------------------------------------------------------------- orders
  @Get('orders')
  myOrders(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: this.store.listOrders(user.tenantId, user.id) };
  }

  @Get('orders/:id')
  myOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const o = this.workflow.mustFindOrder(id);
    if (o.userId !== user.id) throw new NotFoundException('Order not found');
    return { success: true, data: { ...o, timeline: this.store.timeline('ORDER', o.id) } };
  }

  @Post('orders/:id/cancel')
  cancelOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.workflow
      .changeOrderStatus(user, id, { status: 'CANCELLED', note: body?.reason })
      .then((o) => ({ success: true, data: o }));
  }

  /** Repeat order (requirement B.4): re-submits the same lines as a new enquiry. */
  @Post('orders/:id/reorder')
  async reorder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const o = this.workflow.mustFindOrder(id);
    if (o.userId !== user.id) throw new NotFoundException('Order not found');
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

  /** Invoice/receipt document payload for PDF rendering on the device (A.11). */
  @Get('orders/:id/invoice')
  invoiceDocument(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const o = this.workflow.mustFindOrder(id);
    if (o.userId !== user.id) throw new NotFoundException('Order not found');
    const tenant = (this.store as any).mockDb.getTenantBySlug('gurukripa');
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

  // ------------------------------------------------------------- push
  @Post('devices')
  registerDevice(@CurrentUser() user: AuthenticatedUser, @Body() dto: DeviceTokenDto) {
    return this.store.registerDevice(user.id, dto).then((d) => ({ success: true, data: d }));
  }

  @Put('devices/:id/preferences')
  updateDevicePrefs(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: DevicePrefsDto) {
    return this.store.updateDevicePrefs(user.id, id, dto).then((d) => ({ success: true, data: d }));
  }

  // ------------------------------------------------------- notification inbox
  @Get('notifications')
  notifications(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: this.store.notificationsOf(user.id) };
  }

  @Post('notifications/read-all')
  markRead(@CurrentUser() user: AuthenticatedUser) {
    return this.store.markNotificationsRead(user.id).then((count) => ({ success: true, count }));
  }

  // -------------------------------------------------------------- dealers
  @Get('dealer/status')
  dealerStatus(@CurrentUser() user: AuthenticatedUser) {
    const fresh = this.auth.freshUser(user.id)!;
    if (fresh.role !== 'DEALER') throw new BadRequestException('Not a dealer account');
    return { success: true, data: { dealerStatus: fresh.dealerStatus, firmName: fresh.firmName, dealerDiscountPct: fresh.dealerDiscountPct || 0 } };
  }

  @Get('dealer/sites')
  savedSites(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: this.store.savedSitesOf(user.id) };
  }

  @Post('dealer/sites')
  addSavedSite(@CurrentUser() user: AuthenticatedUser, @Body() dto: SavedSiteDto) {
    return this.store.addSavedSite(user.id, user.tenantId, dto).then((s) => ({ success: true, data: s }));
  }

  /** Approved dealers only: their orders + a simple account statement view. */
  @Get('dealer/overview')
  dealerOverview(@CurrentUser() user: AuthenticatedUser) {
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
}
