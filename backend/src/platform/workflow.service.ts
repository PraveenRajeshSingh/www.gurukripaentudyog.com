// Configurable business workflow (requirement D):
//   Customer enquiry -> Admin review -> Quotation prepared -> Customer approval
//   -> Order confirmed -> Production/preparation -> Dispatch -> Delivery completed
//
// Every transition is validated server-side against ENQUIRY_/QUOTATION_/
// ORDER_TRANSITIONS and the actor's role. Customers can never mutate another
// customer's record: ownership is asserted from the verified JWT subject.
import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { PricingEngineService } from '../pricing/pricing.service';
import { PlatformStoreService } from './store.service';
import { NotifyService } from './notify.service';
import { AuthenticatedUser } from '../types/domain';
import {
  ENQUIRY_TRANSITIONS, ORDER_TRANSITIONS, QUOTATION_TRANSITIONS, STAFF_ROLES,
  MANAGER_ROLES, PlatformEnquiry, PlatformOrder, PlatformQuotation, QuotationLine,
} from './types';
import { CreateQuotationDto, OrderStatusDto } from './dto';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

@Injectable()
export class WorkflowService {
  constructor(
    private readonly store: PlatformStoreService,
    private readonly notify: NotifyService,
    private readonly pricing: PricingEngineService,
  ) {}

  private assertStaff(user: AuthenticatedUser): void {
    if (!STAFF_ROLES.includes(user.role)) {
      throw new ForbiddenException('Staff authorization required');
    }
  }

  private assertManager(user: AuthenticatedUser): void {
    if (!MANAGER_ROLES.includes(user.role)) {
      throw new ForbiddenException('Sales manager or administrator authorization required');
    }
  }

  /** Staff may only act on records that belong to their own tenant (unless platform super-admin). */
  assertTenantAccess(user: AuthenticatedUser, tenantId: string): void {
    if (user.role === 'SUPER_ADMIN') return;
    if (!user.tenantId || user.tenantId !== tenantId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }
  }

  private moveEnquiry(enq: PlatformEnquiry, to: string, actor: AuthenticatedUser, note?: string): void {
    const allowed = ENQUIRY_TRANSITIONS[enq.status] || [];
    if (!allowed.includes(to as any)) {
      throw new BadRequestException(`Enquiry cannot move from ${enq.status} to ${to}`);
    }
  }

  // ------------------------------------------------------------ enquiries
  async reviewEnquiry(user: AuthenticatedUser, enquiryId: string): Promise<PlatformEnquiry> {
    this.assertStaff(user);
    const enq = this.mustFindEnquiry(enquiryId);
    this.assertTenantAccess(user, enq.tenantId);
    this.moveEnquiry(enq, 'UNDER_REVIEW', user);
    const updated = await this.store.updateEnquiry(enquiryId, { status: 'UNDER_REVIEW' });
    this.store.addEvent('ENQUIRY', enq.id, 'NEW', 'UNDER_REVIEW', 'Enquiry accepted for review', user);
    await this.store.audit(user, 'ENQUIRY_REVIEW', 'ENQUIRY', enq.id);
    if (enq.userId) {
      await this.notify.notifyUser(enq.userId, enq.tenantId, 'ENQUIRY_RECEIVED',
        'Enquiry under review', `Your enquiry ${enq.id} is being reviewed by our team.`);
    }
    return updated!;
  }

  async assignEnquiry(user: AuthenticatedUser, enquiryId: string, staffId: string): Promise<PlatformEnquiry> {
    this.assertManager(user);
    const enq = this.mustFindEnquiry(enquiryId);
    this.assertTenantAccess(user, enq.tenantId);
    const staff = this.store.findUserById(staffId);
    if (!staff || !STAFF_ROLES.includes(staff.role)) {
      throw new BadRequestException('Assignee must be an active staff account');
    }
    this.assertTenantAccess(user, staff.tenantId);
    const updated = await this.store.updateEnquiry(enquiryId, { assignedStaffId: staffId });
    this.store.addEvent('ENQUIRY', enq.id, enq.status, enq.status, `Assigned to ${staff.name}`, user);
    await this.store.audit(user, 'ENQUIRY_ASSIGNED', 'ENQUIRY', enq.id, { staffId });
    return updated!;
  }

  // ------------------------------------------------------------ quotations
  async createQuotation(user: AuthenticatedUser, enquiryId: string, dto: CreateQuotationDto): Promise<PlatformQuotation> {
    this.assertStaff(user);
    const enq = this.mustFindEnquiry(enquiryId);
    this.assertTenantAccess(user, enq.tenantId);
    if (enq.status !== 'UNDER_REVIEW' && enq.status !== 'QUOTATION_PREPARED') {
      throw new BadRequestException(`Quotation requires an enquiry under review (current: ${enq.status})`);
    }
    if (!enq.userId) {
      throw new BadRequestException('Enquiry has no linked customer account; register the customer first');
    }
    const customer = this.store.findUserById(enq.userId)!;

    const lines: QuotationLine[] = dto.lines.map((l) => ({
      productId: l.productId, name: l.name, quantity: l.quantity, unit: l.unit,
      unitPrice: l.unitPrice, lineTotal: round2(l.quantity * l.unitPrice),
    }));
    const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));

    // Approved dealers get their contracted discount unless staff overrides.
    let discount = round2(dto.discountAmount || 0);
    if (customer.role === 'DEALER' && customer.dealerStatus === 'APPROVED' && customer.dealerDiscountPct) {
      const autoDiscount = round2((subtotal * customer.dealerDiscountPct) / 100);
      discount = Math.max(discount, autoDiscount);
    }
    if (discount > subtotal) throw new BadRequestException('Discount cannot exceed the subtotal');

    const net = round2(subtotal - discount);
    // Quoted rates are GST-inclusive (matches the storefront's 5% inclusive
    // pricing); the engine decomposes CGST/SGST on the server, never the client.
    const tax = this.pricing.calculateGstFromInclusiveTotal(net);
    const validDays = dto.validDays || 7;

    const quotation = await this.store.createQuotation({
      tenantId: enq.tenantId, enquiryId: enq.id, userId: enq.userId,
      number: `QTN-${Date.now()}`,
      lines, subtotal, discountAmount: discount,
      taxableValue: tax.taxableValue, cgst: tax.cgst, sgst: tax.sgst, total: net,
      notes: dto.notes,
      validUntil: new Date(Date.now() + validDays * 86400_000).toISOString(),
      preparedById: user.id,
    });
    this.store.addEvent('QUOTATION', quotation.id, 'DRAFT', 'DRAFT', 'Quotation prepared', user);
    await this.store.audit(user, 'QUOTATION_CREATED', 'QUOTATION', quotation.id, { enquiryId });

    if (dto.sendNow) await this.sendQuotation(user, quotation.id);
    return this.store.findQuotation(quotation.id)!;
  }

  async sendQuotation(user: AuthenticatedUser, quotationId: string): Promise<PlatformQuotation> {
    this.assertStaff(user);
    const q = this.mustFindQuotation(quotationId);
    this.assertTenantAccess(user, q.tenantId);
    if (!(QUOTATION_TRANSITIONS[q.status] || []).includes('SENT')) {
      throw new BadRequestException(`Quotation cannot be sent from status ${q.status}`);
    }
    const updated = await this.store.updateQuotation(quotationId, { status: 'SENT' });
    this.store.addEvent('QUOTATION', q.id, q.status, 'SENT', 'Quotation sent to customer', user);

    const enq = this.findEnquiryById(q.enquiryId);
    if (enq && enq.status === 'UNDER_REVIEW') {
      await this.store.updateEnquiry(enq.id, { status: 'QUOTATION_PREPARED' });
      this.store.addEvent('ENQUIRY', enq.id, enq.status, 'QUOTATION_PREPARED', 'Quotation issued', user);
    }
    await this.store.audit(user, 'QUOTATION_SENT', 'QUOTATION', q.id);
    await this.notify.notifyUser(q.userId, q.tenantId, 'QUOTATION_READY',
      `Quotation ${q.number} ready`, `Total Rs ${q.total}. Reply from the app to approve or reject.`);
    return updated!;
  }

  /** Customer-side action: only the quotation owner may approve/reject. */
  async respondToQuotation(user: AuthenticatedUser, quotationId: string, approve: boolean, reason?: string): Promise<PlatformOrder | null> {
    const q = this.mustFindQuotation(quotationId);
    this.assertTenantAccess(user, q.tenantId);
    if (q.userId !== user.id) throw new ForbiddenException('Quotations are visible only to their owner');
    if (user.role !== 'CUSTOMER' && user.role !== 'DEALER') throw new ForbiddenException('Only customers can respond to quotations');
    if (!(QUOTATION_TRANSITIONS[q.status] || []).includes(approve ? 'APPROVED' : 'REJECTED')) {
      throw new BadRequestException(`Quotation cannot be ${approve ? 'approved' : 'rejected'} from status ${q.status}`);
    }

    const to = approve ? 'APPROVED' : 'REJECTED';
    await this.store.updateQuotation(q.id, { status: to as any });
    this.store.addEvent('QUOTATION', q.id, q.status, to, reason || (approve ? 'Approved by customer' : 'Rejected by customer'), user);
    await this.store.audit(user, approve ? 'QUOTATION_APPROVED' : 'QUOTATION_REJECTED', 'QUOTATION', q.id);

    if (!approve) {
      await this.notify.notifyUser(q.userId, q.tenantId, 'QUOTATION_REJECTED',
        `Quotation ${q.number} rejected`, 'Our sales team will follow up with a revised quotation.');
      const staffViewers = this.store.listStaff(q.tenantId);
      for (const s of staffViewers) {
        await this.notify.notifyUser(s.id, q.tenantId, 'QUOTATION_REJECTED', `Quotation ${q.number} rejected`, 'Customer declined the quotation; a revision may be needed.');
      }
      return null;
    }

    // Approval auto-converts to a confirmed order (workflow step 5).
    const defaultAddr = this.store.addressesOf(user.id).find((a) => a.isDefault);
    const enq = this.findEnquiryById(q.enquiryId);
    const order = await this.store.createOrder({
      tenantId: q.tenantId, userId: q.userId, quotationId: q.id, enquiryId: q.enquiryId,
      number: `ORD-${Date.now()}`,
      lines: q.lines, subtotal: q.subtotal, discountAmount: q.discountAmount,
      taxableValue: q.taxableValue, cgst: q.cgst, sgst: q.sgst, total: q.total,
      deliveryAddress: defaultAddr ? `${defaultAddr.line1}, ${defaultAddr.city} ${defaultAddr.pincode}` : (enq?.siteLocation || 'To be confirmed'),
      deliveryCity: defaultAddr?.city || enq?.siteLocation.split(',').pop()?.trim() || 'Jaunpur',
      paymentMethod: 'PAYMENT_ON_DELIVERY',
    });
    this.store.addEvent('ORDER', order.id, 'CONFIRMED', 'CONFIRMED', `Created from approved quotation ${q.number}`, user);
    await this.notify.notifyUser(order.userId, order.tenantId, 'ORDER_CONFIRMED',
      `Order ${order.number} confirmed`, `Quotation approved - total Rs ${order.total}. We will keep you posted on every step.`);
    return order;
  }

  // ---------------------------------------------------------------- orders
  async changeOrderStatus(user: AuthenticatedUser, orderId: string, dto: OrderStatusDto): Promise<PlatformOrder> {
    const order = this.mustFindOrder(orderId);
    this.assertTenantAccess(user, order.tenantId);
    const to = dto.status as any;

    const isCustomerCancelling = (user.role === 'CUSTOMER' || user.role === 'DEALER');
    if (isCustomerCancelling) {
      if (order.userId !== user.id) throw new ForbiddenException('Orders are visible only to their owner');
      if (to !== 'CANCELLED') throw new ForbiddenException('Customers can only cancel an order before production starts');
    } else {
      this.assertStaff(user);
    }

    if (!(ORDER_TRANSITIONS[order.status] || []).includes(to)) {
      throw new BadRequestException(`Order cannot move from ${order.status} to ${to}`);
    }

    const updated = await this.store.updateOrder(order.id, {
      status: to,
      ...(dto.expectedDelivery ? { expectedDelivery: dto.expectedDelivery } : {}),
    });
    this.store.addEvent('ORDER', order.id, order.status, to, dto.note || `Status set to ${to}`, user);
    await this.store.audit(user, `ORDER_${to}`, 'ORDER', order.id, { from: order.status });

    const messages: Record<string, { type: any; title: string; body: string }> = {
      PRODUCTION: { type: 'ORDER_STATUS_CHANGED', title: `Order ${order.number}: preparation started`, body: 'Your bricks are being loaded/measured at the yard.' },
      DISPATCHED: { type: 'DISPATCH_COMPLETED', title: `Order ${order.number} dispatched`, body: `Trolley on the way.${dto.expectedDelivery ? ` ETA ${dto.expectedDelivery}.` : ''}` },
      DELIVERED: { type: 'DELIVERY_COMPLETED', title: `Order ${order.number} delivered`, body: 'Delivery completed. Thank you for your business!' },
      CANCELLED: { type: 'ORDER_STATUS_CHANGED', title: `Order ${order.number} cancelled`, body: dto.note || 'The order was cancelled.' },
    };
    const m = messages[to];
    if (m) {
      await this.notify.notifyUser(order.userId, order.tenantId, m.type, m.title, m.body);
    }
    return updated!;
  }

  // ------------------------------------------------------------- lookups
  mustFindEnquiry(id: string): PlatformEnquiry {
    const e = this.store.findEnquiry(id);
    if (!e) throw new NotFoundException('Enquiry not found');
    return e;
  }

  private findEnquiryById(id: string): PlatformEnquiry | undefined {
    return this.store.findEnquiry(id);
  }

  mustFindQuotation(id: string): PlatformQuotation {
    const q = this.store.findQuotation(id);
    if (!q) throw new NotFoundException('Quotation not found');
    return q;
  }

  mustFindOrder(id: string): PlatformOrder {
    const o = this.store.findOrder(id);
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }
}
