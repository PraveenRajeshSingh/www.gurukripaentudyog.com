import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../security/tenant.guard';
import { AuthenticatedUser } from '../types/domain';
import { Authenticated, RateLimit, RateLimitGuard } from '../platform/guards';
import { ADMIN_ROLES, MANAGER_ROLES } from '../platform/types';
import { MockDatabaseService } from '../database/mock-db.service';
import { CatalogPricingService, CartLineInput, PriceUpdateInput } from './catalog-pricing.service';
import { PaymentIdempotencyService } from '../payments/payment-idempotency.service';
import { RazorpayService } from '../payments/razorpay.service';
import { UseGuards } from '@nestjs/common';

@Controller('api/v1')
export class PricingController {
  constructor(
    private readonly catalog: CatalogPricingService,
    private readonly db: MockDatabaseService,
    private readonly idem: PaymentIdempotencyService,
    private readonly razorpay: RazorpayService,
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
   * Idempotent payment initiation — live Razorpay Orders API when keys are set;
   * otherwise returns a non-chargeable stub. Capture still requires verify/webhook.
   */
  @Post('payments/initiate')
  @Authenticated('CUSTOMER', 'DEALER', ...MANAGER_ROLES, ...ADMIN_ROLES, 'STAFF', 'SALES_MANAGER')
  async initiatePayment(
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
      return { success: true, replay: true, data: record.responseJson, live: this.razorpay.isLiveConfigured() };
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

    try {
      const { order, live } = await this.razorpay.createOrder({
        amountPaise,
        currency: body.currency || 'INR',
        receipt: body.receipt,
        notes: { ...(body.notes || {}), tenantId: user.tenantId, userId: user.id },
        idempotencyKey: key,
      });
      const response = {
        ...order,
        keyId: live ? this.razorpay.publicKeyId() : '',
        live,
      };
      this.idem.succeed(key, {
        resourceType: 'RAZORPAY_ORDER',
        resourceId: order.id,
        gatewayOrderId: order.id,
        responseJson: response,
      });
      return { success: true, replay: false, data: response, live };
    } catch (err) {
      const msg = (err as Error)?.message || 'Payment initiation failed';
      this.idem.fail(key, msg);
      return { success: false, message: msg };
    }
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

    if (!this.razorpay.isLiveConfigured()) {
      this.idem.fail(key, 'RAZORPAY_KEY_SECRET not configured');
      return {
        success: false,
        message: 'Payment verification is not configured on this server. Order stays unpaid until gateway secret is set.',
      };
    }

    if (!this.razorpay.verifyPaymentSignature(orderId, paymentId, String(body.razorpay_signature || ''))) {
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

  /**
   * Razorpay webhook — signature verified with RAZORPAY_WEBHOOK_SECRET.
   * Idempotent on payment entity id.
   */
  @Post('webhooks/razorpay')
  @UseGuards(RateLimitGuard)
  @RateLimit(60, 60_000)
  razorpayWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-razorpay-signature') signature: string | undefined,
    @Body() body: any,
  ) {
    const secret = String(process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
    if (!secret) {
      return { success: false, message: 'Webhook secret not configured' };
    }
    const raw = req.rawBody || Buffer.from(JSON.stringify(body || {}));
    if (!this.razorpay.verifyWebhookSignature(raw, signature)) {
      return { success: false, message: 'Invalid webhook signature' };
    }

    const event = String(body?.event || '');
    const paymentEntity = body?.payload?.payment?.entity;
    const paymentId = String(paymentEntity?.id || '').trim();
    const orderId = String(paymentEntity?.order_id || '').trim();

    if (event === 'payment.captured' && paymentId) {
      const dup = this.idem.assertUniqueCapture(paymentId);
      if (dup.duplicate) {
        return { success: true, replay: true };
      }
      const key = `webhook:${paymentId}`;
      this.idem.begin({
        idempotencyKey: key,
        tenantId: String(paymentEntity?.notes?.tenantId || 'unknown'),
        operation: 'PAYMENT_WEBHOOK',
        request: { paymentId, orderId, event },
      });
      this.idem.succeed(key, {
        resourceType: 'PAYMENT',
        resourceId: paymentId,
        gatewayOrderId: orderId,
        gatewayPaymentId: paymentId,
        responseJson: {
          paid: true,
          orderId,
          paymentId,
          source: 'webhook',
          verifiedAt: new Date().toISOString(),
        },
      });
    }

    return { success: true };
  }
}
