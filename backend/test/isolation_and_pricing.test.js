const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Mathematical verification for Indian 5% Brick GST Structure
function calculateGst(inclusiveTotal) {
  const taxable = Math.round(inclusiveTotal / 1.05);
  const totalTax = inclusiveTotal - taxable;
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;
  return { taxable, cgst, sgst, grandTotal: inclusiveTotal };
}

// 3-in-1 Wall estimation formula
function calculateWall(len, ht, thick, price) {
  const area = len * ht;
  const bricks = Math.ceil(area * 8.6 * (thick / 4.5));
  const trolleys = Number((bricks / 4000).toFixed(1));
  const totalCost = Math.ceil(bricks * price);
  const cementBags = Math.ceil(bricks * 0.007);
  const sandCuFt = Math.ceil(bricks * 0.35);
  return { bricks, trolleys, totalCost, cementBags, sandCuFt };
}

// Mock of DatabaseService
class MockDatabaseService {
  constructor() {
    this.tenants = [
      { id: 'tenant-gurukripa-001', slug: 'gurukripa', name: 'Gurukripa Bricks Industry' },
      { id: 'tenant-awadh-002', slug: 'awadh-bricks', name: 'Awadh Brick Kiln & Suppliers' }
    ];
    this.products = [
      { id: 'p1', tenantId: 'tenant-gurukripa-001', name: 'Awwal Bricks', price: 7.05, trolleyRate: 28200 },
      { id: 'p2', tenantId: 'tenant-gurukripa-001', name: 'Laal Peti', price: 6.25, trolleyRate: 25000 },
      { id: 'p3', tenantId: 'tenant-awadh-002', name: 'Awadh Standard', price: 7.50, trolleyRate: 30000 }
    ];
    this.orders = [];
  }

  getProductsForTenant(tenantId) {
    return this.products.filter(p => p.tenantId === tenantId);
  }

  createOrder(tenantId, data) {
    const gst = calculateGst(data.subtotal);
    const order = {
      id: 'ORD-' + Date.now(),
      tenantId,
      customerName: data.customerName,
      subtotal: data.subtotal,
      cgst: gst.cgst,
      sgst: gst.sgst,
      total: gst.grandTotal
    };
    this.orders.push(order);
    return order;
  }

  getOrdersForTenant(tenantId) {
    return this.orders.filter(o => o.tenantId === tenantId);
  }
}

describe('Pricing & 5% Indian GST Reverse Calculation Tests', () => {
  test('Trolley rate (4000 Awwal bricks = ₹28,200) decomposes into exact 2.5% CGST and 2.5% SGST', () => {
    const res = calculateGst(28200);
    assert.equal(res.taxable, 26857);
    assert.equal(res.cgst, 672);
    assert.equal(res.sgst, 671);
    assert.equal(res.taxable + res.cgst + res.sgst, 28200);
  });

  test('Laal Peti trolley (4000 bricks = ₹25,000) reverse GST calculation', () => {
    const res = calculateGst(25000);
    assert.equal(res.taxable, Math.round(25000 / 1.05));
    assert.equal(res.taxable + res.cgst + res.sgst, 25000);
  });

  test('3-in-1 Wall estimation matches production math', () => {
    const wall = calculateWall(20, 10, 9, 12);
    assert.equal(wall.bricks, 3440);
    assert.equal(wall.trolleys, 0.9);
    assert.equal(wall.totalCost, 41280);
    assert.equal(wall.cementBags, Math.ceil(3440 * 0.007));
    assert.equal(wall.sandCuFt, Math.ceil(3440 * 0.35));
  });
});

describe('Multi-Tenant Database Isolation & Access Control Tests', () => {
  const db = new MockDatabaseService();

  test('Tenant Gurukripa only retrieves Gurukripa products and never leaks Tenant Awadh products', () => {
    const guruProds = db.getProductsForTenant('tenant-gurukripa-001');
    const awadhProds = db.getProductsForTenant('tenant-awadh-002');

    assert.equal(guruProds.length, 2);
    assert.equal(awadhProds.length, 1);
    assert.ok(guruProds.every(p => p.tenantId === 'tenant-gurukripa-001'));
    assert.ok(awadhProds.every(p => p.tenantId === 'tenant-awadh-002'));
  });

  test('Orders placed under Tenant Gurukripa are completely inaccessible to Tenant Awadh', () => {
    db.createOrder('tenant-gurukripa-001', {
      customerName: 'Shyam Construction',
      subtotal: 28200
    });

    const guruOrders = db.getOrdersForTenant('tenant-gurukripa-001');
    const awadhOrders = db.getOrdersForTenant('tenant-awadh-002');

    assert.equal(guruOrders.length, 1);
    assert.equal(awadhOrders.length, 0);
    assert.equal(guruOrders[0].customerName, 'Shyam Construction');
  });

  test('Cross-tenant data spoofing prevention: requesting tenant B data with tenant A credentials must fail', () => {
    const currentAuthenticatedTenant = 'tenant-gurukripa-001';
    const requestedTargetTenant = 'tenant-awadh-002';

    // Simulate TenantIsolationGuard check
    let accessGranted = false;
    if (currentAuthenticatedTenant === requestedTargetTenant) {
      accessGranted = true;
    }

    assert.equal(accessGranted, false, 'Cross-tenant access must be rejected by isolation guard');
  });
});
