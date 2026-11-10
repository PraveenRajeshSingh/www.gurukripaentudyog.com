import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export type RazorpayOrderPayload = {
  id: string;
  entity: string;
  amount: number;
  amount_due: number;
  amount_paid: number;
  currency: string;
  receipt: string;
  status: string;
  notes?: Record<string, string>;
  idempotencyKey?: string;
};

/**
 * Razorpay Orders API wrapper.
 * Without RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET, createOrder returns a synthetic
 * stub (never treat as paid). Webhook HMAC uses RAZORPAY_WEBHOOK_SECRET.
 */
@Injectable()
export class RazorpayService {
  private readonly log = new Logger(RazorpayService.name);

  isLiveConfigured(): boolean {
    return !!(
      String(process.env.RAZORPAY_KEY_ID || '').trim() &&
      String(process.env.RAZORPAY_KEY_SECRET || '').trim()
    );
  }

  publicKeyId(): string {
    return String(process.env.RAZORPAY_KEY_ID || '').trim();
  }

  async createOrder(input: {
    amountPaise: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
    idempotencyKey?: string;
  }): Promise<{ order: RazorpayOrderPayload; live: boolean }> {
    const currency = input.currency || 'INR';
    const receipt = input.receipt || `RCPT-${Date.now().toString().slice(-8)}`;
    const notes = input.notes || {};

    if (!this.isLiveConfigured()) {
      const stubId = 'order_' + Buffer.from(input.idempotencyKey || String(Date.now())).toString('hex').slice(0, 14);
      this.log.warn('Razorpay keys missing — returning synthetic order stub (not chargeable).');
      return {
        live: false,
        order: {
          id: stubId,
          entity: 'order',
          amount: input.amountPaise,
          amount_due: input.amountPaise,
          amount_paid: 0,
          currency,
          receipt,
          status: 'created',
          notes: { ...notes, stub: 'true' },
          idempotencyKey: input.idempotencyKey,
        },
      };
    }

    const auth = Buffer.from(
      `${this.publicKeyId()}:${String(process.env.RAZORPAY_KEY_SECRET).trim()}`,
    ).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: input.amountPaise,
        currency,
        receipt,
        notes,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.log.error(`Razorpay order create failed: ${res.status} ${text.slice(0, 200)}`);
      throw new Error('Unable to create payment order with gateway');
    }

    const data = (await res.json()) as RazorpayOrderPayload;
    return {
      live: true,
      order: {
        ...data,
        idempotencyKey: input.idempotencyKey,
      },
    };
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const secret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();
    if (!secret) return false;
    const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    return expected === String(signature || '');
  }

  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string | undefined): boolean {
    const secret = String(process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
    if (!secret) return false;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
      .digest('hex');
    return expected === String(signatureHeader || '');
  }
}
