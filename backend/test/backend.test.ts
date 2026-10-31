import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { PricingEngineService } from '../src/pricing/pricing.service';
import { MockDatabaseService } from '../src/database/mock-db.service';

describe('Pricing Engine & Estimator Tests', () => {
  const pricingService = new PricingEngineService();

  test('GST reverse tax calculation for ₹28,200 trolley matches 5% Indian tax structure', () => {
    // 1 trolley Awwal bricks = ₹28,200
    const calc = pricingService.calculateGstFromInclusiveTotal(28200);

    assert.equal(calc.taxableValue, Math.round(28200 / 1.05)); // 26857
    assert.equal(calc.cgst, Math.round((28200 - 26857) / 2)); // 672
    assert.equal(calc.sgst, 28200 - 26857 - 672); // 671
    assert.equal(calc.taxableValue + calc.cgst + calc.sgst, 28200);
    assert.equal(calc.grandTotal, 28200);
  });

  test('3-in-1 Wall estimation formula accurately computes required bricks & cost', () => {
    // 20ft length, 10ft height, 9-inch wall, ₹12/brick
    const res = pricingService.calculateEstimation({
      type: 'wall',
      lengthFt: 20,
      heightFt: 10,
      thicknessInches: 9,
      unitPrice: 12,
    });

    assert.equal(res.bricksNeeded, 3440);
    assert.equal(res.trolleysCount, 0.9);
    assert.equal(res.totalEstimatedCost, 41280);
    assert.equal(res.cementBags, Math.ceil(3440 * 0.007));
    assert.equal(res.sandCuFt, Math.ceil(3440 * 0.35));
  });

  test('House estimation formula computes total bricks, cement and sand correctly', () => {
    // 1000 sqft, 2 floors, ₹7.05/brick (Awwal)
    const res = pricingService.calculateEstimation({
      type: 'house',
      sqft: 1000,
      floors: 2,
      unitPrice: 7.05,
    });

    assert.equal(res.bricksNeeded, 38000);
    assert.equal(res.trolleysCount, 9.5);
    assert.equal(res.totalEstimatedCost, 267900);
    assert.equal(res.cementBags, 800);
    assert.equal(res.sandCuFt, 3600);
  });
});

describe('Multi-Tenant Data Isolation Tests', () => {
  const pricingService = new PricingEngineService();
  const db = new MockDatabaseService(pricingService);

  test('Tenant Gurukripa only retrieves Gurukripa products and never leaks Tenant Awadh products', () => {
    const guruProducts = db.getProductsForTenant('tenant-gurukripa-001');
    const awadhProducts = db.getProductsForTenant('tenant-awadh-002');

    assert.equal(guruProducts.length, 3);
    assert.equal(awadhProducts.length, 1);

    // Verify all returned items belong strictly to requested tenant
    for (const p of guruProducts) {
      assert.equal(p.tenantId, 'tenant-gurukripa-001');
      assert.notEqual(p.sku, 'AWADH-STD-01');
    }

    for (const p of awadhProducts) {
      assert.equal(p.tenantId, 'tenant-awadh-002');
      assert.equal(p.sku, 'AWADH-STD-01');
    }
  });

  test('Orders created under Tenant Gurukripa are strictly isolated from Tenant Awadh', () => {
    db.createOrder('tenant-gurukripa-001', {
      customerName: 'Ramesh Singh',
      customerPhone: '9415011111',
      deliveryAddress: 'Civil Lines, Jaunpur',
      subtotal: 28200,
      items: [{ productId: 'prod-001', quantity: 4000, price: 7.05 }],
    });

    const guruOrders = db.getOrdersForTenant('tenant-gurukripa-001');
    const awadhOrders = db.getOrdersForTenant('tenant-awadh-002');

    assert.equal(guruOrders.length, 1);
    assert.equal(awadhOrders.length, 0);
    assert.equal(guruOrders[0].customerName, 'Ramesh Singh');
    assert.equal(guruOrders[0].cgst, 672);
  });

  test('Offline sync journaling accurately records batch entries per tenant', () => {
    const syncRes = db.recordSyncBatch('tenant-gurukripa-001', 'dev-android-01', 'driver-10', [
      {
        entityName: 'orders',
        operation: 'UPDATE',
        clientId: 'client-order-del-01',
        payload: { orderId: 'ORD-123', status: 'DELIVERED', signedBy: 'Mr. Gupta' },
        clientTimestamp: new Date().toISOString(),
      },
    ]);

    assert.equal(syncRes.success, true);
    assert.equal(syncRes.count, 1);
    assert.equal(syncRes.applied[0].status, 'APPLIED');
    assert.equal(syncRes.applied[0].tenantId, 'tenant-gurukripa-001');
  });
});
