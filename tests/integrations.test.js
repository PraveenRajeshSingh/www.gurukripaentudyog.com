const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mapsJs = fs.readFileSync(path.resolve(__dirname, '../src/services/maps-service.js'), 'utf8');
const paymentJs = fs.readFileSync(path.resolve(__dirname, '../src/services/payment-service.js'), 'utf8');

const mockWindow = {
    GurukripaMaps: {},
    GurukripaPayment: {}
};

const scope = {
    window: mockWindow,
    document: {
        querySelector: () => ({ content: 'rzp_test_mock_123' }),
        getElementById: () => null
    }
};

new Function('scope', `
    const window = scope.window;
    const document = scope.document;
    ${mapsJs}
    ${paymentJs}
`)(scope);

const { GurukripaMaps, GurukripaPayment } = mockWindow;

describe('Production Services & Gateway Integration Test Suite', () => {
    test('Google Maps distance calculation & freight tariff estimation', () => {
        assert.ok(GurukripaMaps, 'GurukripaMaps should be initialized');
        // Jaunpur Bhatta to Lanka Varanasi (~55 km)
        const dist = GurukripaMaps.calculateDistanceKm(25.7476, 82.6837, 25.2818, 82.9984);
        assert.ok(dist >= 50 && dist <= 65, 'Distance between Jaunpur and Varanasi should be approx 55-60km');

        // Freight Tariff calculation: (500 + (55 - 10) * 25) = 500 + 1125 = 1625
        const freight = GurukripaMaps.calculateTransportCharge(dist, 1);
        assert.ok(freight > 1000, 'Freight should account for distance past 10km radius');
    });

    test('Google Maps delivery zone serviceability validation', () => {
        const jaunpurCheck = GurukripaMaps.checkServiceability('Jaunpur 222001');
        assert.equal(jaunpurCheck.serviceable, true);
        assert.ok(jaunpurCheck.estimatedDays.includes('Same-Day'));

        const outOfZone = GurukripaMaps.checkServiceability('Bengaluru 560001');
        assert.equal(outOfZone.serviceable, false);
    });

    test('Razorpay payment order creation and payload validation', () => {
        assert.ok(GurukripaPayment, 'GurukripaPayment should be initialized');
        const orderPayload = GurukripaPayment.createPaymentOrder({
            total: 28200, // 1 trolley of Awwal bricks
            customer: { phone: '9198923230' }
        });

        assert.ok(orderPayload.id.startsWith('order_'), 'Should generate unique order ID');
        assert.equal(orderPayload.amount, 2820000, 'Paise amount should be 100x INR total');
        assert.equal(orderPayload.currency, 'INR');
    });
});
