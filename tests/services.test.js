const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dataJs = fs.readFileSync(path.resolve(__dirname, '../src/js/data.js'), 'utf8');
const servicesJs = fs.readFileSync(path.resolve(__dirname, '../src/services/index.js'), 'utf8');

const mockWindow = {
    GurukripaServices: {}
};
const mockStorage = new Map();
const scope = {
    window: mockWindow,
    getSafeStorage: (k, def) => mockStorage.get(k) || def,
    setSafeStorage: (k, v) => mockStorage.set(k, v)
};

new Function('scope', `
    const window = scope.window;
    const getSafeStorage = scope.getSafeStorage;
    const setSafeStorage = scope.setSafeStorage;
    ${dataJs}
    ${servicesJs}
`)(scope);

const { ProductService, PricingService, OrderService } = mockWindow.GurukripaServices;

describe('Gurukripa Services Architecture', () => {
    test('ProductService correctly retrieves and searches products', () => {
        assert.ok(ProductService, 'ProductService should be defined');
        const all = ProductService.getAll();
        assert.ok(all.length >= 6, 'Should load all products from catalog');

        const single = ProductService.getById(1);
        assert.ok(single, 'Product with ID 1 should exist');
        assert.equal(single.id, 1);

        const awwalCat = ProductService.getByCategory('awwal');
        assert.ok(awwalCat.length >= 1, 'Should find products in awwal category');

        const searchRes = ProductService.search('wirecut');
        assert.ok(searchRes.length >= 1, 'Should find products matching search');
        assert.ok(searchRes[0].name.toLowerCase().includes('wirecut'));
    });

    test('PricingService calculates cart subtotals and GST breakdowns', () => {
        assert.ok(PricingService, 'PricingService should be defined');
        assert.equal(PricingService.getTrolleyRate('awwal'), 28200);
        assert.equal(PricingService.getTrolleyRate('laal-peti'), 25000);
        assert.equal(PricingService.calculateLineTotal(7.05, 4000), 28200);

        const items = [
            { price: 10, qty: 500 },
            { price: 12, qty: 1000 }
        ];
        assert.equal(PricingService.calculateCartSubtotal(items), 17000);

        const gst = PricingService.calculateGSTBreakdown(28200, 5);
        assert.equal(gst.base + gst.cgst + gst.sgst, 28200);
    });

    test('OrderService creates, stores, and retrieves orders', () => {
        assert.ok(OrderService, 'OrderService should be defined');
        const order = OrderService.createOrder({
            id: 'GBI-TEST-9999',
            items: [{ id: 1, name: 'Shiv Eent', qty: 1000 }],
            total: 12000,
            customer: { name: 'Praveen Singh' }
        });

        assert.equal(order.id, 'GBI-TEST-9999');
        assert.equal(order.status, 'Confirmed');

        const retrieved = OrderService.getOrderById('GBI-TEST-9999');
        assert.ok(retrieved, 'Should retrieve stored order by ID');
        assert.equal(retrieved.total, 12000);
    });
});
