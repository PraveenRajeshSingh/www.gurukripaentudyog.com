const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  PRODUCTS,
  COUPONS,
  calculateWallEstimator,
  calculateHouseEstimator,
  calculateBoundaryEstimator,
  calculateGst,
  calculateCouponDiscount,
  formatINR,
  EnquirySchema,
  WallEstimatorSchema
} = require('../dist/index');

describe('API Contracts & Core Logic Unit Tests', () => {
  it('Product catalog has all 8 verified products with required fields', () => {
    assert.equal(PRODUCTS.length, 8);
    for (const p of PRODUCTS) {
      assert.ok(p.id);
      assert.ok(p.name);
      assert.ok(p.price > 0);
      assert.ok(p.img);
      assert.ok(Array.isArray(p.features));
    }
  });

  it('Wall Estimator matches verified production formula', () => {
    const res = calculateWallEstimator(20, 10, 9, 12);
    assert.equal(res.bricks, 3440);
    assert.equal(res.trolleys, 0.9);
    assert.equal(res.cementBags, Math.ceil(3440 * 0.007));
    assert.equal(res.sandCuFt, Math.ceil(3440 * 0.35));
    assert.equal(res.estimatedCost, 3440 * 12);
  });

  it('House Estimator matches verified formula', () => {
    const res = calculateHouseEstimator(1000, 2, 7.05);
    assert.equal(res.bricks, 37000);
    assert.equal(res.trolleys, 9.3);
    assert.equal(res.estimatedCost, Math.ceil(37000 * 7.05));
  });

  it('Boundary Estimator matches verified formula', () => {
    const res = calculateBoundaryEstimator(150, 6, 4.5, 6.25);
    assert.equal(res.bricks, 7740);
    assert.equal(res.trolleys, 1.9);
    assert.equal(res.estimatedCost, Math.ceil(7740 * 6.25));
  });

  it('5% GST splits correctly into 2.5% CGST + 2.5% SGST', () => {
    const tax = calculateGst(10000, false);
    assert.equal(tax.cgst, 250);
    assert.equal(tax.sgst, 250);
    assert.equal(tax.totalTax, 500);
    assert.equal(tax.grandTotal, 10500);
  });

  it('Coupon discount calculations work properly', () => {
    assert.equal(calculateCouponDiscount('GURU10', 1000), 100);
    assert.equal(calculateCouponDiscount('BRICK50', 1000), 50);
    assert.equal(calculateCouponDiscount('FIRSTORDER', 1000), 150);
    assert.equal(calculateCouponDiscount('UNKNOWN', 1000), 0);
  });

  it('Currency formatting formats Indian comma grouping', () => {
    assert.equal(formatINR(25000), '₹25,000');
    assert.equal(formatINR(100000), '₹1,00,000');
  });

  it('Zod-lite runtime schema validates enquiry input', () => {
    const valid = {
      fullName: 'Rajesh Singh',
      phone: '9198923230',
      brickType: 'Shiv Eent Grade-A',
      quantity: 4000,
      deliveryLocation: 'Jaunpur'
    };
    const parsed = EnquirySchema.parse(valid);
    assert.equal(parsed.fullName, 'Rajesh Singh');

    assert.throws(() => {
      EnquirySchema.parse({
        fullName: 'R', // too short
        phone: '123'   // invalid
      });
    });
  });
});
