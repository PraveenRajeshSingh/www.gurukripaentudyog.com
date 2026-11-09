import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../security/tenant.guard';
import { AuthenticatedUser } from '../types/domain';
import { Authenticated } from '../platform/guards';
import { ADMIN_ROLES, MANAGER_ROLES } from '../platform/types';
import { MockDatabaseService } from '../database/mock-db.service';
import { CatalogPricingService, CartLineInput, PriceUpdateInput } from './catalog-pricing.service';
import { PaymentIdempotencyService } from '../payments/payment-idempotency.service';

@Controller('api/v1')
export class PricingController {
  constructor(
    private readonly catalog: CatalogPricingService,
    private readonly db: MockDatabaseService,
    private readonly idem: PaymentIdempotencyService,
  ) {}

  /** Public daily catalogue for a tenant slug — single source for storefront sync. */
  @Get('tenants/:slug/catalog/prices')
  catalogPrices(@Param('slug') slug: string) {
    const tenant = this.db.getTenantBySlug(slug);
    if (!tenant) return { success: false, message: 'Tenant not found' };
    const data = this.catalog.listCatalog(tenant.id);
    return {
      success: true,
      tenantId: tenant.id,
      updatedAt: new Date().toISOString(),
      count: data.length,
      data,
    };
  }

  /** Server-side cart revalidation before checkout. */
  @Post('tenants/:slug/cart/validate')
  validateCart(@Param('slug') slug: string, @Body() body: { lines?: CartLineInput[] }) {
    const tenant = this.db.getTenantBySlug(slug);
    if (!tenant) return { success: false, message: 'Tenant not found' };
    const result = this.catalog.validateCart(tenant.id, body.lines || []);
    return { success: true, data: result };
  }

  @Get('staff/products')
  @Authenticated(...MANAGER_ROLES, 'SALES_MANAGER', 'STAFF')
  staffProducts(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: this.catalog.listCatalog(user.tenantId) };
  }

  @Get('staff/products/:id/price-history')
  @Authenticated(...MANAGER_ROLES, 'SALES_MANAGER', 'STAFF')
  priceHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return {
      success: true,
      data: this.catalog.listHistory(user.tenantId, id, limit ? Number(limit) : 100),
    };
  }

  @Post('staff/products/:id/price')
  @Authenticated(...ADMIN_ROLES, 'SALES_MANAGER')
  async updatePrice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: PriceUpdateInput,
  ) {
    const data = await this.catalog.updatePrice(user, id, body || ({} as PriceUpdateInput));
    return { success: true, data };
  }

  @Post('staff/pricing/activate-scheduled')
  @Authenticated(...ADMIN_ROLES)
  async activateScheduled(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.catalog.activateDueSchedules(user.tenantId);
    return { success: true, data };
  }

  /**
   * Idempotent payment initiation stub — creates a Razorpay-shaped order payload
   * keyed by Idempotency-Key / body.idempotencyKey. Capture still requires webhook
   * signature verification with RAZORPAY_KEY_SECRET on a live deployment.
   */
  @Post('payments/initiate')
  @Authenticated('CUSTOMER', 'DEALER', ...MANAGER_ROLES, ...ADMIN_ROLES, 'STAFF', 'SALES_MANAGER')
  initiatePayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: {
      idempotencyKey?: string;
      amountInr?: number;
      currency?: string;
      receipt?: string;
      notes?: Record<string, string>;
    },
  ) {
    const key = body.idempotencyKey || '';
    const { record, replay } = this.idem.begin({
      idempotencyKey: key,
      tenantId: user.tenantId,
      operation: 'PAYMENT_INITIATE',
      request: {
        amountInr: body.amountInr,
        currency: body.currency || 'INR',
        receipt: body.receipt,
        notes: body.notes,
        userId: user.id,
      },
    });
    if (replay && record.status === 'SUCCEEDED') {
      return { success: true, replay: true, data: record.responseJson };
    }
    if (replay && record.status === 'FAILED') {
      return { success: false, replay: true, message: record.errorMessage || 'Previous attempt failed' };
    }

    this.idem.markProcessing(key);
    const amountPaise = Math.round(Number(body.amountInr || 0) * 100);
    if (!amountPaise || amountPaise < 100) {
      this.idem.fail(key, 'Invalid amount');
      return { success: false, message: 'amountInr must be at least ₹1' };
    }

    const order = {
      id: 'order_' + Buffer.from(key).toString('hex').slice(0, 14),
      entity: 'order',
      amount: amountPaise,
      amount_due: amountPaise,
      amount_paid: 0,
      currency: body.currency || 'INR',
      receipt: body.receipt || `RCPT-${Date.now().toString().slice(-8)}`,
      status: 'created',
      notes: { ...(body.notes || {}), tenantId: user.tenantId, userId: user.id },
      idempotencyKey: key,
    };
    this.idem.succeed(key, {
      resourceType: 'RAZORPAY_ORDER',
      resourceId: order.id,
      gatewayOrderId: order.id,
      responseJson: order,
    });
    return { success: true, replay: false, data: order };
  }

  /** Idempotent capture / verify — rejects duplicate gateway payment ids. */
  @Post('payments/verify')
  @Authenticated('CUSTOMER', 'DEALER', ...MANAGER_ROLES, ...ADMIN_ROLES, 'STAFF', 'SALES_MANAGER')
  verifyPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: {
      idempotencyKey?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    },
  ) {
    const paymentId = String(body.razorpay_payment_id || '').trim();
    const orderId = String(body.razorpay_order_id || '').trim();
    if (!paymentId || !orderId) {
      return { success: false, message: 'razorpay_order_id and razorpay_payment_id are required' };
    }

    const dup = this.idem.assertUniqueCapture(paymentId);
    if (dup.duplicate) {
      return {
        success: true,
        replay: true,
        message: 'Payment already captured — returning prior result (idempotent)',
        data: dup.record?.responseJson,
      };
    }

    const key = body.idempotencyKey || `verify:${paymentId}`;
    const { record, replay } = this.idem.begin({
      idempotencyKey: key,
      tenantId: user.tenantId,
      operation: 'PAYMENT_VERIFY',
      request: { paymentId, orderId, userId: user.id },
    });
    if (replay && record.status === 'SUCCEEDED') {
      return { success: true, replay: true, data: record.responseJson };
    }

    // Live deployments must HMAC-verify razorpay_signature with RAZORPAY_KEY_SECRET.
    // Without a secret we refuse to mark paid — never trust the browser alone.
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    if (!secret) {
      this.idem.fail(key, 'RAZORPAY_KEY_SECRET not configured');
      return {
        success: false,
        message: 'Payment verification is not configured on this server. Order stays unpaid until gateway secret is set.',
      };
    }

    const crypto = require('crypto') as typeof import('crypto');
    const expected = crypto
      .createHmac('sha256', secret)
      .update(orderId + '|' + paymentId)
      .digest('hex');
    if (expected !== String(body.razorpay_signature || '')) {
      this.idem.fail(key, 'Invalid signature');
      return { success: false, message: 'Payment signature verification failed' };
    }

    const payload = {
      paid: true,
      orderId,
      paymentId,
      verifiedAt: new Date().toISOString(),
      tenantId: user.tenantId,
      userId: user.id,
    };
    this.idem.succeed(key, {
      resourceType: 'PAYMENT',
      resourceId: paymentId,
      gatewayOrderId: orderId,
      gatewayPaymentId: paymentId,
      responseJson: payload,
    });
    return { success: true, replay: false, data: payload };
  }
}
