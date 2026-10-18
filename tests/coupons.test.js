const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dataJs = fs.readFileSync(path.resolve(__dirname, '../src/js/data.js'), 'utf8');
const scope = {};
new Function('scope', dataJs + '; scope.COUPONS = COUPONS;')(scope);
const { COUPONS } = scope;

function applyDiscount(couponCode, subtotal) {
    const c = COUPONS[couponCode.toUpperCase()];
    if (!c) return 0;
    return c.pct ? Math.round(subtotal * c.pct / 100) : (c.flat || 0);
}

describe('Coupon Discount Calculations', () => {
    test('GURU10 provides 10% discount', () => {
        assert.ok(COUPONS.GURU10);
        assert.equal(COUPONS.GURU10.pct, 10);
        assert.equal(applyDiscount('GURU10', 10000), 1000);
        assert.equal(applyDiscount('guru10', 28200), 2820);
    });

    test('BRICK50 provides ₹50 flat discount', () => {
        assert.ok(COUPONS.BRICK50);
        assert.equal(COUPONS.BRICK50.flat, 50);
        assert.equal(applyDiscount('BRICK50', 1000), 50);
    });

    test('FIRSTORDER provides 15% discount', () => {
        assert.ok(COUPONS.FIRSTORDER);
        assert.equal(COUPONS.FIRSTORDER.pct, 15);
        assert.equal(applyDiscount('FIRSTORDER', 10000), 1500);
    });

    test('Invalid or unknown coupons return 0 discount', () => {
        assert.equal(applyDiscount('UNKNOWN99', 5000), 0);
        assert.equal(applyDiscount('', 5000), 0);
    });
});
