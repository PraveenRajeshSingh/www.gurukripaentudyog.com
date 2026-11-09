'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pricingJs = fs.readFileSync(
  path.resolve(__dirname, '../src/services/catalog-pricing-service.js'),
  'utf8'
);
const paymentJs = fs.readFileSync(
  path.resolve(__dirname, '../src/services/payment-service.js'),
  'utf8'
);

const storage = Object.create(null);
const mockWindow = {
  GurukripaCatalogPricing: {},
  GurukripaPayment: {},
};
const scope = {
  window: mockWindow,
  document: {
    readyState: 'complete',
    addEventListener() {},
    querySelector: () => ({ content: 'rzp_test_mock' }),
  },
  sessionStorage: {
    _d: Object.create(null),
    getItem(k) { return this._d[k] || null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; },
  },
  PRODUCTS: [
    { id: 7, name: 'Awwal', category: 'awwal', price: 7.05, oldPrice: null, unit: 'per piece', img: '' },
    { id: 8, name: 'Laal Peti', category: 'laal-peti', price: 6.25, oldPrice: null, unit: 'per piece', img: '' },
  ],
  getSafeStorage(key, fallback) {
    return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : fallback;
  },
  setSafeStorage(key, value) {
    storage[key] = value;
  },
};

global.PRODUCTS = scope.PRODUCTS;
global.getSafeStorage = scope.getSafeStorage;
global.setSafeStorage = scope.setSafeStorage;

new Function('scope', `
  const window = scope.window;
  const document = scope.document;
  const sessionStorage = scope.sessionStorage;
  const PRODUCTS = scope.PRODUCTS;
  const getSafeStorage = scope.getSafeStorage;
  const setSafeStorage = scope.setSafeStorage;
  ${pricingJs}
  ${paymentJs}
`)(scope);

const { GurukripaCatalogPricing, GurukripaPayment } = mockWindow;

describe('Centralized catalog pricing + payment idempotency (storefront)', () => {
  test('setProductPrice updates PRODUCTS and writes audit history', () => {
    GurukripaCatalogPricing.setProductPrice(7, 7.35, { reason: 'Morning rate', updatedBy: 'test' });
    assert.equal(scope.PRODUCTS.find((p) => p.id === 7).price, 7.35);
    assert.equal(GurukripaCatalogPricing.getProductPrice(7), 7.35);
    const hist = GurukripaCatalogPricing.getHistory(7);
    assert.ok(hist.length >= 1);
    assert.equal(hist[0].previousPrice, 7.05);
    assert.equal(hist[0].newPrice, 7.35);
  });

  test('syncCartPrices flags changes and never keeps stale unit price', () => {
    const cart = [{ id: 7, name: 'Awwal', price: 7.05, qty: 4000 }];
    GurukripaCatalogPricing.setProductPrice(7, 7.5, { reason: 'Midday' });
    const result = GurukripaCatalogPricing.syncCartPrices(cart);
    assert.equal(result.changes.length, 1);
    assert.equal(cart[0].price, 7.5);
    assert.equal(cart[0].previousPrice, 7.05);
    assert.equal(cart[0].priceChanged, true);
  });

  test('checkout confirmation required until acknowledged', () => {
    const cart = [{ id: 8, name: 'Laal Peti', price: 6.25, qty: 1000 }];
    GurukripaCatalogPricing.setProductPrice(8, 6.5, { reason: 'Evening' });
    assert.equal(GurukripaCatalogPricing.needsCheckoutConfirmation(cart), true);
    const sync = GurukripaCatalogPricing.syncCartPrices(cart);
    GurukripaCatalogPricing.acknowledgeCartPrices(sync.changes);
    assert.equal(GurukripaCatalogPricing.needsCheckoutConfirmation(cart), false);
  });

  test('payment orders reuse a stable id for the same idempotency key', () => {
    const key = GurukripaPayment.createIdempotencyKey('customer-phone-order');
    const a = GurukripaPayment.createPaymentOrder({ total: 28200, idempotencyKey: key, customer: { phone: '999' } });
    const b = GurukripaPayment.createPaymentOrder({ total: 28200, idempotencyKey: key, customer: { phone: '999' } });
    assert.equal(a.id, b.id);
    assert.equal(a.idempotencyKey, key);
    assert.equal(a.amount, 2820000);
  });
});
