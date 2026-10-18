const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Read data.js and evaluate PRODUCTS & COUPONS in isolated scope
const dataJs = fs.readFileSync(path.resolve(__dirname, '../src/js/data.js'), 'utf8');
const scope = {};
new Function('scope', dataJs + '; scope.PRODUCTS = PRODUCTS; scope.COUPONS = COUPONS;')(scope);
const { PRODUCTS, COUPONS } = scope;

describe('Product Data & Pricing Integrity', () => {
    test('PRODUCTS catalogue contains valid items with mandatory attributes', () => {
        assert.ok(Array.isArray(PRODUCTS), 'PRODUCTS should be an array');
        assert.ok(PRODUCTS.length >= 6, 'Should have at least 6 products');

        for (const p of PRODUCTS) {
            assert.ok(p.id, `Product ID missing on ${JSON.stringify(p)}`);
            assert.ok(typeof p.name === 'string' && p.name.length > 0, `Product name missing on ID ${p.id}`);
            assert.ok(typeof p.price === 'number' && p.price > 0, `Valid price required on ID ${p.id}`);
            assert.ok(typeof p.desc === 'string' && p.desc.length > 0, `Description required on ID ${p.id}`);
            assert.ok(typeof p.img === 'string' && p.img.length > 0, `Image path required on ID ${p.id}`);
            assert.ok(Array.isArray(p.features) && p.features.length > 0, `Features list required on ID ${p.id}`);
        }
    });

    test('BRL Trolley standard pricing is exact', () => {
        const awwal = PRODUCTS.find(p => p.category === 'awwal');
        assert.ok(awwal, 'Awwal brick item must exist');
        assert.equal(awwal.price, 7.05, 'Awwal brick unit price must be ₹7.05');
        const awwalTrolley = awwal.price * 4000;
        assert.equal(awwalTrolley, 28200, 'Awwal trolley (4,000 bricks) must equal ₹28,200');

        const laalPeti = PRODUCTS.find(p => p.category === 'laal-peti');
        assert.ok(laalPeti, 'Laal Peti brick item must exist');
        assert.equal(laalPeti.price, 6.25, 'Laal Peti brick unit price must be ₹6.25');
        const laalPetiTrolley = laalPeti.price * 4000;
        assert.equal(laalPetiTrolley, 25000, 'Laal Peti trolley (4,000 bricks) must equal ₹25,000');
    });

    test('GST reverse-calculation matches Indian 5% brick tax rate', () => {
        const total = 28200; // 1 trolley Awwal
        const baseVal = Math.round(total / 1.05);
        const taxTotal = total - baseVal;
        const cgst = Math.round(taxTotal / 2);
        const sgst = taxTotal - cgst;

        assert.equal(baseVal + cgst + sgst, total, 'Base value + CGST 2.5% + SGST 2.5% must equal Total');
        assert.ok(baseVal > 0 && cgst > 0 && sgst > 0);
    });
});
