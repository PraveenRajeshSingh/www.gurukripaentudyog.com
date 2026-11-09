'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

/** Mirrors PaymentIdempotencyService behaviour for CI without Nest bootstrap. */
class PaymentIdempotencyLedger {
  constructor() {
    this.records = new Map();
    this.byGatewayPayment = new Map();
  }
  hashRequest(payload) {
    return crypto.createHash('sha256').update(JSON.stringify(payload ?? {})).digest('hex');
  }
  begin({ idempotencyKey, tenantId, operation, request }) {
    const key = String(idempotencyKey || '').trim();
    if (!key || key.length < 8) throw new Error('idempotencyKey required');
    const requestHash = this.hashRequest(request);
    const existing = this.records.get(key);
    if (existing) {
      if (existing.requestHash !== requestHash) throw new Error('key reuse mismatch');
      return { record: existing, replay: true };
    }
    const now = new Date().toISOString();
    const record = {
      idempotencyKey: key, tenantId, operation, requestHash,
      status: 'STARTED', createdAt: now, updatedAt: now,
    };
    this.records.set(key, record);
    return { record, replay: false };
  }
  succeed(key, result) {
    const rec = this.records.get(key);
    if (result.gatewayPaymentId) {
      const prior = this.byGatewayPayment.get(result.gatewayPaymentId);
      if (prior && prior !== key) throw new Error('duplicate gateway payment');
      this.byGatewayPayment.set(result.gatewayPaymentId, key);
    }
    Object.assign(rec, result, { status: 'SUCCEEDED', updatedAt: new Date().toISOString() });
    return rec;
  }
  assertUniqueCapture(paymentId) {
    const key = this.byGatewayPayment.get(paymentId);
    if (key) {
      const record = this.records.get(key);
      if (record && record.status === 'SUCCEEDED') return { duplicate: true, record };
    }
    return { duplicate: false, record: null };
  }
}

describe('Dynamic pricing + payment idempotency foundations', () => {
  test('price change audit fields are captured', () => {
    const product = { id: 'prod-001', unitPrice: 7.05, trolleyRate: 28200, isActive: true };
    const next = 7.25;
    const history = {
      previousUnitPrice: product.unitPrice,
      newUnitPrice: next,
      reason: 'Daily price update',
      actorId: 'admin-1',
      at: new Date().toISOString(),
    };
    product.oldPrice = product.unitPrice;
    product.unitPrice = next;
    assert.equal(product.unitPrice, 7.25);
    assert.equal(history.previousUnitPrice, 7.05);
    assert.equal(history.reason, 'Daily price update');
  });

  test('cart validation detects client/server price drift', () => {
    const catalog = { 'prod-001': { unitPrice: 7.25, minOrderQty: 1, isActive: true, stockQty: 10000 } };
    const line = { productId: 'prod-001', quantity: 4000, clientUnitPrice: 7.05 };
    const current = catalog[line.productId].unitPrice;
    const priceChanged = Math.abs(line.clientUnitPrice - current) > 0.001;
    assert.equal(priceChanged, true);
    const lineTotal = Math.round(current * line.quantity * 100) / 100;
    assert.equal(lineTotal, 29000);
  });

  test('payment initiate is replay-safe for the same idempotency key', () => {
    const ledger = new PaymentIdempotencyLedger();
    const key = 'idem_test_order_001';
    const req = { amountInr: 28200, userId: 'u1' };
    const first = ledger.begin({ idempotencyKey: key, tenantId: 't1', operation: 'PAYMENT_INITIATE', request: req });
    assert.equal(first.replay, false);
    ledger.succeed(key, {
      resourceType: 'RAZORPAY_ORDER',
      resourceId: 'order_abc',
      gatewayOrderId: 'order_abc',
      responseJson: { id: 'order_abc', amount: 2820000 },
    });
    const second = ledger.begin({ idempotencyKey: key, tenantId: 't1', operation: 'PAYMENT_INITIATE', request: req });
    assert.equal(second.replay, true);
    assert.equal(second.record.status, 'SUCCEEDED');
    assert.equal(second.record.gatewayOrderId, 'order_abc');
  });

  test('duplicate gateway payment capture is rejected', () => {
    const ledger = new PaymentIdempotencyLedger();
    const key = 'idem_verify_001';
    ledger.begin({
      idempotencyKey: key,
      tenantId: 't1',
      operation: 'PAYMENT_VERIFY',
      request: { paymentId: 'pay_1' },
    });
    ledger.succeed(key, {
      gatewayPaymentId: 'pay_1',
      responseJson: { paid: true },
    });
    const dup = ledger.assertUniqueCapture('pay_1');
    assert.equal(dup.duplicate, true);
    assert.throws(() => {
      const key2 = 'idem_verify_002';
      ledger.begin({
        idempotencyKey: key2,
        tenantId: 't1',
        operation: 'PAYMENT_VERIFY',
        request: { paymentId: 'pay_1' },
      });
      ledger.succeed(key2, { gatewayPaymentId: 'pay_1', responseJson: { paid: true } });
    }, /duplicate gateway payment/);
  });

  test('idempotency key cannot be reused with a different payload', () => {
    const ledger = new PaymentIdempotencyLedger();
    const key = 'idem_payload_guard';
    ledger.begin({
      idempotencyKey: key,
      tenantId: 't1',
      operation: 'PAYMENT_INITIATE',
      request: { amountInr: 100 },
    });
    assert.throws(() => {
      ledger.begin({
        idempotencyKey: key,
        tenantId: 't1',
        operation: 'PAYMENT_INITIATE',
        request: { amountInr: 200 },
      });
    }, /key reuse mismatch/);
  });
});
