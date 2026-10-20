const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Load the ERP modules into one isolated scope that shares a single
// mock window.GurukripaERP object and a Map-backed localStorage stub —
// the same harness style as tests/services.test.js.
const files = ['erp-core.js', 'erp-inventory.js', 'erp-documents.js', 'erp-crm.js', 'erp-analytics.js', 'erp-calculators.js', 'erp-logistics.js', 'erp-notify.js', 'erp-invoice.js'];
const src = files.map(f => fs.readFileSync(path.resolve(__dirname, '../src/js/' + f), 'utf8'));

let mockStorage;
let ERP;
function loadERP(actor) {
    mockStorage = new Map();
    const mockWindow = { GurukripaERP: {} };
    const scope = {
        window: mockWindow,
        getSafeStorage: (k, def) => (mockStorage.has(k) ? mockStorage.get(k) : def),
        setSafeStorage: (k, v) => mockStorage.set(k, v)
    };
    new Function('scope', `
        const window = scope.window;
        const getSafeStorage = scope.getSafeStorage;
        const setSafeStorage = scope.setSafeStorage;
        ${src.join('\n')}
    `)(scope);
    ERP = mockWindow.GurukripaERP;
    ERP.Core.setActor(actor || { name: 'Owner', role: 'owner' });
    return ERP;
}

describe('ERP Core — numbering, units, RBAC, audit', () => {
    beforeEach(() => loadERP());

    test('document numbers are sequential and financial-year scoped', () => {
        const fy = ERP.Core.finYear('2026-10-20');
        assert.equal(fy, '2026-27');
        const a = ERP.Core.nextNumber('invoice');
        const b = ERP.Core.nextNumber('invoice');
        assert.match(a, /^INV\/2026-27\/0001$/);
        assert.match(b, /^INV\/2026-27\/0002$/);
        // different type has its own independent sequence
        assert.match(ERP.Core.nextNumber('quotation'), /^QTN\/2026-27\/0001$/);
    });

    test('unit conversions use explicit brick factors', () => {
        assert.equal(ERP.Core.toBase(3, 'trolley'), 12000);
        assert.equal(ERP.Core.fromBase(12000, 'trolley'), 3);
        assert.equal(ERP.Core.toBase(1, 'thousand'), 1000);
        assert.throws(() => ERP.Core.toBase(1, 'crate'), /Unknown unit/);
    });

    test('RBAC permits owner and forbids customer from finalizing invoices', () => {
        assert.equal(ERP.Core.can({ role: 'owner' }, 'invoice.finalize'), true);
        assert.equal(ERP.Core.can({ role: 'customer' }, 'invoice.finalize'), false);
        assert.throws(() => ERP.Core.assertCan({ role: 'customer' }, 'invoice.finalize'), /Forbidden/);
    });

    test('audit log is append-only with actor + timestamp + record ref', () => {
        ERP.Core.logAudit('test.action', 'invoice', 'INV-1', { note: 'hello' });
        const log = ERP.Core.getAudit({ entity: 'invoice' });
        assert.equal(log.length, 1);
        assert.equal(log[0].action, 'test.action');
        assert.equal(log[0].entityId, 'INV-1');
        assert.ok(log[0].ts && log[0].user);
    });
});

describe('ERP Inventory — ledger, oversell guard, valuation', () => {
    beforeEach(() => loadERP());

    test('bootstrap from products then receive/dispatch keeps balances consistent', () => {
        ERP.Inventory.bootstrapFromProducts([{ id: 100, name: 'Awwal', category: 'awwal', price: 7.05 }]);
        ERP.Inventory.upsertItem({ id: 100, unitCost: 5, hasCost: true });
        ERP.Inventory.receive({ item: 100, warehouse: 'main', qty: 5000, unit: 'piece', cost: 5, ref: 'GRN-1' });
        assert.equal(ERP.Inventory.onHand(100), 5000);
        ERP.Inventory.dispatch({ item: 100, warehouse: 'main', qty: 1000, unit: 'piece', ref: 'CHL-1' });
        assert.equal(ERP.Inventory.onHand(100), 4000);
        const val = ERP.Inventory.valuation();
        assert.equal(val.available, true);
        assert.equal(val.total, 20000); // 4000 pcs * weighted avg ₹5
    });

    test('overselling is rejected (no negative stock)', () => {
        ERP.Inventory.upsertItem({ id: 1, name: 'X' });
        ERP.Inventory.receive({ item: 1, warehouse: 'main', qty: 100 });
        assert.throws(() => ERP.Inventory.dispatch({ item: 1, warehouse: 'main', qty: 250 }), /Insufficient stock/);
        assert.equal(ERP.Inventory.onHand(1), 100);
    });

    test('reservations reduce available but not on-hand; transfers move stock', () => {
        ERP.Inventory.upsertItem({ id: 2, name: 'Y' });
        ERP.Inventory.receive({ item: 2, warehouse: 'main', qty: 1000 });
        ERP.Inventory.reserve({ item: 2, warehouse: 'main', qty: 300 });
        assert.equal(ERP.Inventory.onHand(2), 1000);
        assert.equal(ERP.Inventory.available(2), 700);
        ERP.Inventory.transfer({ item: 2, from: 'main', to: 'yard2', qty: 400 });
        assert.equal(ERP.Inventory.onHand(2, 'main'), 600);
        assert.equal(ERP.Inventory.onHand(2, 'yard2'), 400);
    });

    test('lowStock reflects reorder levels', () => {
        ERP.Inventory.upsertItem({ id: 3, name: 'Z', reorderLevel: 500 });
        ERP.Inventory.receive({ item: 3, warehouse: 'main', qty: 100 });
        assert.deepEqual(ERP.Inventory.lowStock().map(s => s.item), [3]);
    });
});

describe('ERP Documents — GST engine + lifecycle + payments', () => {
    beforeEach(() => loadERP());

    test('exclusive intra-state tax splits CGST/SGST and reconciles totals', () => {
        const r = ERP.Documents.computeTotals([{ item: 1, qty: 100, unit: 'piece', unitPrice: 10, taxRate: 5, hsn: '69041000' }], { scheme: 'exclusive', place: 'intra' });
        assert.equal(r.totals.taxableValue, 1000);
        assert.equal(r.totals.cgst, 25);
        assert.equal(r.totals.sgst, 25);
        assert.equal(r.totals.grandTotal, 1050);
    });

    test('inclusive pricing backs tax out of the amount', () => {
        const r = ERP.Documents.computeTotals([{ item: 1, qty: 100, unitPrice: 10, taxRate: 5, hsn: '6904' }], { scheme: 'inclusive', place: 'intra', roundOff: false });
        assert.equal(r.totals.taxableValue, 952.38);
        assert.equal(r.totals.taxTotal, 47.62);
    });

    test('inter-state uses IGST only', () => {
        const r = ERP.Documents.computeTotals([{ item: 1, qty: 10, unitPrice: 100, taxRate: 12, hsn: '6904' }], { place: 'inter' });
        assert.equal(r.totals.igst, 120);
        assert.equal(r.totals.cgst, 0);
        assert.equal(r.totals.sgst, 0);
    });

    test('discount is applied and capped at line gross', () => {
        const r = ERP.Documents.computeTotals([{ item: 1, qty: 10, unitPrice: 100, discountPct: 10, taxRate: 0, hsn: 'x' }], { scheme: 'exclusive' });
        assert.equal(r.totals.discountTotal, 100);
        assert.equal(r.totals.taxableValue, 900);
        assert.equal(r.totals.grandTotal, 900);
    });

    test('grand total is rounded to the nearest rupee by default', () => {
        const r = ERP.Documents.computeTotals([{ item: 1, qty: 3, unitPrice: 33.33, taxRate: 5, hsn: 'x' }], {});
        assert.equal(Math.abs(r.totals.grandTotal - Math.round(r.totals.grandTotal)), 0);
    });

    test('quotation → order → invoice conversion, finalize consumes stock', () => {
        ERP.Inventory.upsertItem({ id: 10, name: 'B', hasCost: true, unitCost: 4 });
        ERP.Inventory.receive({ item: 10, warehouse: 'main', qty: 4000, cost: 4 });
        const q = ERP.Documents.createDocument('quotation', { customerId: 'cu10', warehouse: 'main', lines: [{ item: 10, qty: 1000, unit: 'piece', unitPrice: 7.05, taxRate: 5, hsn: '6904' }], tax: { place: 'intra' } });
        assert.equal(q.lines[0].qty, 1000);
        const so = ERP.Documents.convertQuotationToOrder(q.id);
        const inv = ERP.Documents.createInvoiceFromOrder(so.id);
        assert.equal(inv.status, 'draft');
        const fin = ERP.Documents.finalize(inv.id);
        assert.equal(fin.status, 'finalized');
        // dispatch consumed 1000 pcs
        assert.equal(ERP.Inventory.onHand(10), 3000);
    });

    test('payments are idempotent by txnId and drive invoice status', () => {
        ERP.Inventory.upsertItem({ id: 11, name: 'C' });
        ERP.Inventory.receive({ item: 11, warehouse: 'main', qty: 5000 });
        const inv = ERP.Documents.createDocument('invoice', { customerId: 'cu1', warehouse: 'main', lines: [{ item: 11, qty: 1000, unitPrice: 10, taxRate: 5, hsn: '6904' }], tax: { place: 'intra' } });
        ERP.Documents.finalize(inv.id);
        assert.equal(inv.balance, 10500);
        ERP.Documents.recordPayment(inv.id, { amount: 5000, method: 'upi', txnId: 'TX-1' });
        let d = ERP.Documents.getDoc(inv.id);
        assert.equal(d.status, 'partially_paid');
        assert.equal(d.balance, 5500);
        // duplicate webhook for same txn must not double count
        const dup = ERP.Documents.recordPayment(inv.id, { amount: 5000, method: 'upi', txnId: 'TX-1' });
        assert.equal(dup.duplicate, true);
        d = ERP.Documents.getDoc(inv.id);
        assert.equal(d.paidTotal, 5000);
        ERP.Documents.recordPayment(inv.id, { amount: 5500, txnId: 'TX-2' });
        d = ERP.Documents.getDoc(inv.id);
        assert.equal(d.status, 'paid');
        assert.equal(d.balance, 0);
    });

    test('credit note reduces receivable without deleting the invoice', () => {
        const inv = ERP.Documents.createDocument('invoice', { customerId: 'cu2', lines: [{ item: 1, qty: 100, unitPrice: 10, taxRate: 0, hsn: 'x' }], tax: {} });
        ERP.Documents.finalize(inv.id);
        ERP.Documents.issueCreditNote(inv.id, { reason: 'short supply' });
        const d = ERP.Documents.getDoc(inv.id);
        assert.equal(d.balance, 0); // full credit
        assert.ok(ERP.Documents.getDoc(inv.id).status !== 'cancelled');
        assert.equal(ERP.Documents.listDocs('credit_note').length, 1);
    });

    test('finalization is refused for a non-permitted role', () => {
        loadERP({ name: 'Sales', role: 'sales' }); // sales cannot finalize
        const inv = ERP.Documents.createDocument('invoice', { lines: [{ item: 1, qty: 1, unitPrice: 10, taxRate: 0, hsn: 'x' }] });
        assert.throws(() => ERP.Documents.finalize(inv.id), /Forbidden/);
    });

    test('PO does not add stock until goods-received note', () => {
        ERP.Inventory.upsertItem({ id: 20, name: 'Clay' });
        const po = ERP.Documents.createDocument('purchase_order', { supplierId: 's1', warehouse: 'main', lines: [{ item: 20, qty: 800, unitPrice: 2, taxRate: 0, hsn: 'x' }] });
        ERP.Documents.finalize(po.id, { role: 'owner' });
        assert.equal(ERP.Inventory.onHand(20), 0);
        ERP.Documents.receivePurchase(po.id, [{ item: 20, qty: 800, unit: 'piece', unitCost: 2 }], { role: 'owner' });
        assert.equal(ERP.Inventory.onHand(20), 800);
    });
});

describe('ERP CRM + Analytics — aging, statements, real dashboards, CSV', () => {
    beforeEach(() => {
        loadERP();
        ERP.Inventory.upsertItem({ id: 1, name: 'A', category: 'awwal', hasCost: true, unitCost: 5 });
        ERP.Inventory.receive({ item: 1, warehouse: 'main', qty: 10000, cost: 5 });
        ERP.CRM.upsertCustomer({ id: 'c1', name: 'Builder', segment: 'builder', creditLimit: 50000, creditTermsDays: 30 });
        ERP.CRM.upsertCustomer({ id: 'c2', name: 'Retail', segment: 'retail' });
        // invoice finalized today (not overdue) for c1
        const i1 = ERP.Documents.createDocument('invoice', { customerId: 'c1', warehouse: 'main', lines: [{ item: 1, qty: 1000, unitPrice: 10, taxRate: 5, hsn: '6904' }], tax: { place: 'intra' } });
        ERP.Documents.finalize(i1.id);
        // overdue invoice for c2: craft an old due date directly
        const i2 = ERP.Documents.createDocument('invoice', { customerId: 'c2', warehouse: 'main', lines: [{ item: 1, qty: 500, unitPrice: 10, taxRate: 0, hsn: '6904' }], tax: {} });
        ERP.Documents.finalize(i2.id);
        const all = ERP.Documents.listDocs('invoice');
        for (const d of all) { if (d.id === i2.id) { d.dueDate = new Date(Date.now() - 45 * 86400000).toISOString(); } }
    });

    test('aging buckets place overdue balances correctly', () => {
        const ag = ERP.CRM.aging();
        assert.equal(ag.buckets.b31_60, 5000); // the c2 5000 invoice is ~45 days past due
        assert.equal(ag.buckets.b0_30, 10500); // c1 invoice is current
        assert.equal(ag.buckets.total, 15500);
    });

    test('credit limit check reflects live balance', () => {
        const chk = ERP.CRM.withinCreditLimit('c1', 40000);
        assert.equal(chk.creditLimit, 50000);
        assert.equal(chk.projected, 40000 + 10500);
        assert.equal(chk.ok, false);
    });

    test('statement shows a running balance from documents', () => {
        const st = ERP.CRM.statement('c1');
        assert.ok(st.lines.length >= 1);
        assert.equal(st.closingBalance, st.lines[st.lines.length - 1].running);
    });

    test('KPIs are computed from real records, not placeholders', () => {
        const k = ERP.Analytics.kpi('year');
        assert.equal(k.hasData, true);
        assert.equal(k.orders.count, 2);
        assert.ok(k.receivables.outstanding > 0);
        assert.equal(k.receivables.overdue > 0, true);
    });

    test('top products and sales-by-segment aggregate correctly', () => {
        assert.equal(ERP.Analytics.topProducts()[0].item, 1);
        const bySeg = ERP.Analytics.salesBySegment();
        assert.ok(bySeg.builder > 0);
        assert.ok(bySeg.retail > 0);
    });

    test('gross profit computes when cost exists; net profit defers without expenses', () => {
        const gp = ERP.Analytics.grossProfit();
        assert.equal(gp.available, true);
        assert.equal(gp.cogs, 1500 * 5);
        const np = ERP.Analytics.netProfit();
        assert.equal(np.available, false);
        assert.match(np.reason, /expense/i);
        ERP.CRM.addExpense({ amount: 1000, category: 'fuel' });
        const np2 = ERP.Analytics.netProfit();
        assert.equal(np2.available, true);
        assert.equal(np2.netProfit, np2.grossProfit - 1000);
    });

    test('CSV export escapes quotes and commas', () => {
        const csv = ERP.Analytics.toCSV([{ a: 'x,y', b: 'he said "hi"' }], ['a', 'b']);
        assert.ok(csv.includes('"x,y"'));
        assert.ok(csv.includes('"he said ""hi"""'));
    });

    test('empty ledger yields zero KPIs (no fabricated numbers)', () => {
        loadERP();
        const k = ERP.Analytics.kpi('month');
        assert.equal(k.hasData, false);
        assert.equal(k.sales.month, 0);
        assert.equal(k.orders.count, 0);
    });
});

describe('ERP Documents — landed cost, debit notes, tax & cash registers', () => {
    beforeEach(() => loadERP());

    test('landed cost allocates charges and the last line absorbs the residual', () => {
        const lines = [{ item: 1, qty: 100, unitCost: 10 }, { item: 2, qty: 200, unitCost: 5 }];
        const r = ERP.Documents.computeLandedCost(lines, [{ amount: 200, basis: 'value' }], { method: 'value' });
        assert.equal(r.totalPurchase, 2000);
        assert.equal(r.totalCharges, 200);
        assert.equal(r.landedValue, 2200);
        // exact allocation: shares of allocated == totalCharges, no double count
        const alloc = r.lines.reduce((s, l) => s + l.allocated, 0);
        assert.equal(alloc, 200);
        assert.equal(r.lines[0].landedUnitCost, 11);   // (1000+100)/100
        assert.equal(r.lines[1].landedUnitCost, 5.5);  // (1000+100)/200
    });

    test('quantity and equal bases also reconcile to the full charge total', () => {
        const lines = [{ item: 1, qty: 100, unitCost: 10 }, { item: 2, qty: 300, unitCost: 10 }];
        ['quantity', 'equal'].forEach(method => {
            const r = ERP.Documents.computeLandedCost(lines, [{ amount: 100 }], { method });
            const alloc = Math.round(r.lines.reduce((s, l) => s + l.allocated, 0) * 100) / 100;
            assert.equal(alloc, 100, method + ' residual exactness');
        });
    });

    test('debit note raises the receivable without touching the invoice lines', () => {
        const inv = ERP.Documents.createDocument('invoice', { customerId: 'c1', lines: [{ item: 1, qty: 1000, unitPrice: 10, taxRate: 0, hsn: 'x' }], tax: {} });
        ERP.Documents.finalize(inv.id);
        ERP.Documents.recordPayment(inv.id, { amount: 10000, method: 'cash', txnId: 'TX-1' });
        let d = ERP.Documents.getDoc(inv.id);
        assert.equal(d.status, 'paid');
        assert.equal(d.balance, 0);
        const dn = ERP.Documents.issueDebitNote(inv.id, { amount: 2000, reason: 'interest' });
        assert.equal(dn.totals.grandTotal, 2000);
        d = ERP.Documents.getDoc(inv.id);
        assert.equal(ERP.Documents.debitedAmount(d), 2000);
        assert.equal(d.balance, 2000);          // 10000 - 0 + 2000 - 10000
        assert.equal(d.status, 'partially_paid');
        assert.equal(ERP.Documents.listDocs('debit_note').length, 1);
    });

    test('tax summary nets invoices, credit and debit notes by rate', () => {
        const inv = ERP.Documents.createDocument('invoice', { lines: [{ item: 1, qty: 1000, unitPrice: 1, taxRate: 5, hsn: '6904' }], tax: { place: 'intra' } });
        ERP.Documents.finalize(inv.id); // taxable 1000 -> cgst 25 + sgst 25
        const ts = ERP.Documents.taxSummary();
        assert.equal(ts.taxableValue, 1000);
        assert.equal(ts.cgst, 25);
        assert.equal(ts.sgst, 25);
        assert.equal(ts.igst, 0);
        assert.equal(ts.taxTotal, 50);
    });

    test('cash/bank register nets inflows against expenses', () => {
        const inv = ERP.Documents.createDocument('invoice', { lines: [{ item: 1, qty: 1000, unitPrice: 10, taxRate: 0, hsn: 'x' }], tax: {} });
        ERP.Documents.finalize(inv.id);
        ERP.Documents.recordPayment(inv.id, { amount: 5000, method: 'upi', txnId: 'TX-9' });
        ERP.CRM.addExpense({ amount: 1000, category: 'fuel' });
        const reg = ERP.Documents.cashBankRegister();
        assert.equal(reg.totalIn, 5000);
        assert.equal(reg.totalOut, 1000);
        assert.equal(reg.net, 4000);
    });
});

describe('ERP Inventory — idempotent movements & reconciliation', () => {
    beforeEach(() => loadERP());

    test('a retried movement with the same idem key is applied only once', () => {
        ERP.Inventory.upsertItem({ id: 1, name: 'X' });
        const first = ERP.Inventory.receive({ item: 1, warehouse: 'main', qty: 100, idem: 'OFFLINE-1' });
        const replay = ERP.Inventory.receive({ item: 1, warehouse: 'main', qty: 100, idem: 'OFFLINE-1' });
        assert.equal(replay.id, first.id);         // returns the original row
        assert.equal(ERP.Inventory.onHand(1), 100); // never double-counted
    });

    test('reconciliation posts a signed adjust for the counted difference', () => {
        ERP.Inventory.upsertItem({ id: 2, name: 'Y' });
        ERP.Inventory.receive({ item: 2, warehouse: 'main', qty: 100 });
        const r = ERP.Inventory.reconcile(2, 'main', 90, { ref: 'COUNT-1' });
        assert.equal(r.adjusted, true);
        assert.equal(r.diff, -10);
        assert.equal(ERP.Inventory.onHand(2), 90);
        const same = ERP.Inventory.reconcile(2, 'main', 90, { ref: 'COUNT-2' });
        assert.equal(same.adjusted, false); // no drift -> no movement
    });
});

describe('ERP CRM — price resolution & lead pipeline', () => {
    beforeEach(() => loadERP());

    test('price resolution honours deal price, list item, tier then segment default', () => {
        const pl = ERP.CRM.upsertPriceList({ name: 'Dealer', items: [{ item: 1, price: 8 }], tiers: [{ minQty: 5000, price: 7 }] });
        ERP.CRM.upsertCustomer({ id: 'pd', name: 'Dealer Co', segment: 'builder', priceList: pl.id });
        assert.equal(ERP.CRM.priceFor('pd', 1, 100), 8);       // list item price
        assert.equal(ERP.CRM.priceFor('pd', 999, 6000), 7);     // falls to bulk tier
        ERP.CRM.setDealPrice('pd', 1, 5);                        // negotiated overrides list
        assert.equal(ERP.CRM.priceFor('pd', 1, 100), 5);
    });

    test('segment default list applies when customer has no assigned list', () => {
        ERP.CRM.upsertPriceList({ name: 'Builder Default', segment: 'builder', items: [{ item: 2, price: 6 }] });
        ERP.CRM.upsertCustomer({ id: 'pb', name: 'B', segment: 'builder' });
        assert.equal(ERP.CRM.priceFor('pb', 2, 1), 6);
        assert.equal(ERP.CRM.priceFor('pb', 77, 1), null);      // no rule -> null
    });

    test('leads advance, surface due follow-ups and convert to customers', () => {
        const lead = ERP.CRM.upsertLead({ name: 'Acme', phone: '99', segment: 'builder', stage: 'new', nextFollowUp: new Date(Date.now() - 86400000).toISOString() });
        assert.ok(ERP.CRM.dueFollowups().some(l => l.id === lead.id));
        ERP.CRM.advanceLeadStage(lead.id, 'qualified');
        const cu = ERP.CRM.convertLeadToCustomer(lead.id);
        assert.equal(cu.name, 'Acme');
        assert.equal(cu.segment, 'builder');
        assert.equal(ERP.CRM.listLeads('won').some(l => l.id === lead.id), true);
    });
});

describe('ERP Calculators — configurable brick-trade math', () => {
    beforeEach(() => {
        loadERP();
        ERP.Calculators.setProduct(500, { pcsPerTrolley: 2000, unitWeightKg: 3, lengthMm: 230, widthMm: 110, heightMm: 70 });
        ERP.Calculators.setVehicle('t1', { payloadKg: 10000, bedL: 4, bedW: 2, bedH: 1 });
        ERP.Calculators.configure({ freight: { baseRatePerKm: 0, perTonKm: 5, minCharge: 500, zoneRates: { north: 1200 } } });
    });

    test('quantity conversion uses the PER-PRODUCT trolley size', () => {
        const r = ERP.Calculators.convertQty(2, 'trolley', 'piece', 500);
        assert.equal(r.pieces, 4000);      // 2 * 2000 (not a universal 4000/1000)
        const back = ERP.Calculators.convertQty(4000, 'piece', 'trolley', 500);
        assert.equal(back.value, 2);
    });

    test('load estimate is capped by the declared per-product trolley capacity', () => {
        const r = ERP.Calculators.loadEstimate({ itemId: 500, vehicleId: 't1', totalPieces: 5000 });
        assert.equal(r.pcsPerTrip, 2000);
        assert.equal(r.limitingFactor, 'declared_capacity');
        assert.equal(r.tripsNeeded, 3);
        assert.match(r.warning, /Estimate/);
    });

    test('transport charge prefers negotiated, then zone, then per-ton-km with a minimum', () => {
        assert.equal(ERP.Calculators.transportCharge({ negotiatedRate: 999 }).basis, 'negotiated');
        assert.equal(ERP.Calculators.transportCharge({ zone: 'north' }).charge, 1200);
        const ttk = ERP.Calculators.transportCharge({ distanceKm: 100, tons: 5 });
        assert.equal(ttk.basis, 'per_ton_km');
        assert.equal(ttk.charge, 2500); // 5 * 5 * 100
        assert.equal(ERP.Calculators.transportCharge({ distanceKm: 1, tons: 0 }).charge, 500); // minCharge floor
    });

    test('breakage, margin and tier price reflect configured inputs', () => {
        const b = ERP.Calculators.breakage({ produced: 1000, good: 960 });
        assert.equal(b.broken, 40);
        assert.equal(b.acceptable, false); // 4% > default 2%
        const m = ERP.Calculators.orderMargin({ qty: 1000, unitPrice: 10, unitCost: 6, freightTotal: 1000 });
        assert.equal(m.grossProfit, 3000);
        assert.equal(m.marginPct, 30);
        assert.equal(m.costPerUnitLanded, 7);
        assert.equal(ERP.Calculators.tierPrice(6000, [{ minQty: 1000, unitPrice: 9 }, { minQty: 5000, unitPrice: 7 }]).unitPrice, 7);
    });
});

describe('ERP Logistics — vehicles, challans, POD, returns', () => {
    beforeEach(() => loadERP());

    test('vehicle capacity is never exceeded (payload guard)', () => {
        ERP.Logistics.upsertVehicle({ id: 't1', name: 'Tata', payloadKg: 10000, bedL: 4, bedW: 2, bedH: 1 });
        const over = ERP.Logistics.validateLoad('t1', { weightKg: 12000 });
        assert.equal(over.withinLimits, false);
        assert.equal(over.overPayload, true);
        const ok = ERP.Logistics.validateLoad('t1', { weightKg: 5000 });
        assert.equal(ok.withinLimits, true);
        assert.equal(ok.utilizationPct, 50);
    });

    test('challan consumes stock and is idempotent by external reference', () => {
        ERP.Inventory.upsertItem({ id: 100, name: 'Brick' });
        ERP.Inventory.receive({ item: 100, warehouse: 'main', qty: 5000 });
        const c1 = ERP.Logistics.createChallan({ customerId: 'cu1', warehouse: 'main', lines: [{ item: 100, qty: 1000, unit: 'piece' }], idem: 'DRIVER-1' });
        assert.equal(c1.status, 'scheduled');
        assert.equal(ERP.Inventory.onHand(100), 4000);
        const replay = ERP.Logistics.createChallan({ customerId: 'cu1', warehouse: 'main', lines: [{ item: 100, qty: 1000, unit: 'piece' }], idem: 'DRIVER-1' });
        assert.equal(replay.id, c1.id);                     // no second challan
        assert.equal(ERP.Inventory.onHand(100), 4000);      // stock moved once
    });

    test('POD marks delivered and retried POD is not duplicated', () => {
        ERP.Inventory.upsertItem({ id: 101, name: 'B' });
        ERP.Inventory.receive({ item: 101, warehouse: 'main', qty: 2000 });
        const ch = ERP.Logistics.createChallan({ warehouse: 'main', lines: [{ item: 101, qty: 500, unit: 'piece' }] });
        ERP.Logistics.dispatchChallan(ch.id, { driverId: 'd1' });
        const pod = ERP.Logistics.recordPOD(ch.id, { recipient: 'Site Eng', idem: 'POD-1' });
        assert.equal(pod.status, 'delivered');
        const podReplay = ERP.Logistics.recordPOD(ch.id, { recipient: 'Site Eng', idem: 'POD-1' });
        assert.equal(podReplay.id, pod.id);
        assert.equal(ERP.Logistics.deliveryCostReport().delivered, 1);
    });

    test('failed delivery returns stock to the warehouse', () => {
        ERP.Inventory.upsertItem({ id: 102, name: 'C' });
        ERP.Inventory.receive({ item: 102, warehouse: 'main', qty: 1000 });
        const ch = ERP.Logistics.createChallan({ warehouse: 'main', lines: [{ item: 102, qty: 1000, unit: 'piece' }] });
        ERP.Logistics.recordFailedDelivery(ch.id, { reason: 'customer unavailable' });
        assert.equal(ERP.Inventory.onHand(102), 0);
        ERP.Logistics.recordReturn(ch.id, {});
        assert.equal(ERP.Inventory.onHand(102), 1000);
        assert.equal(ERP.Logistics.getChallan(ch.id).status, 'returned');
    });
});

describe('ERP Notify — rules emit idempotent pending alerts', () => {
    beforeEach(() => loadERP());

    test('low-stock rule raises an alert and never duplicates within the period', () => {
        ERP.Inventory.upsertItem({ id: 3, name: 'Z', reorderLevel: 500 });
        ERP.Inventory.receive({ item: 3, warehouse: 'main', qty: 100 });
        const created = ERP.Notify.evaluate('low_stock');
        assert.equal(created.length, 1);
        assert.equal(created[0].rule, 'low_stock');
        const again = ERP.Notify.evaluate('low_stock');
        assert.equal(again.length, 0); // idempotent per day per entity
        assert.equal(ERP.Notify.pendingCount(), 1);
    });

    test('overdue-invoice rule fires and acknowledge clears pending state', () => {
        const inv = ERP.Documents.createDocument('invoice', { customerId: 'c1', lines: [{ item: 1, qty: 1000, unitPrice: 10, taxRate: 0, hsn: 'x' }], tax: {}, dueDate: new Date(Date.now() - 10 * 86400000).toISOString() });
        ERP.Documents.finalize(inv.id);
        const created = ERP.Notify.evaluate('overdue_invoice');
        assert.equal(created.length, 1);
        assert.equal(created[0].rule, 'overdue_invoice');
        ERP.Notify.acknowledge(created[0].id);
        assert.equal(ERP.Notify.pendingCount(), 0);
    });

    test('maintenance rule surfaces due vehicle service', () => {
        ERP.Logistics.upsertVehicle({ id: 'v1', name: 'Truck', payloadKg: 8000 });
        ERP.Logistics.scheduleMaintenance('v1', { type: 'brake', dueDate: new Date(Date.now() - 86400000).toISOString() });
        const created = ERP.Notify.evaluate('maintenance_due');
        assert.ok(created.some(a => a.rule === 'maintenance_due'));
    });
});

// ══════════════════════════════════════════════════════════════════
describe('ERP Invoices — company profile, amount-in-words, GST PDF model, idempotent delivery→invoice', () => {
    beforeEach(() => loadERP({ name: 'Owner', role: 'owner' }));

    test('company profile uses real published defaults and merges partial overrides', () => {
        const IV = ERP.Invoices;
        const d = IV.getCompanyProfile();
        assert.equal(d.legalName, 'Gurukripa Bricks Industry');
        assert.equal(d.registrations.gstin, '09AAACG7481M1Z2');
        assert.equal(d.address.stateCode, '09');
        // partial save keeps untouched nested fields
        IV.saveCompanyProfile({ legalName: 'GBI Pvt Ltd', address: { line1: 'New Yard' } });
        const p = IV.getCompanyProfile();
        assert.equal(p.legalName, 'GBI Pvt Ltd');
        assert.equal(p.address.line1, 'New Yard');
        assert.equal(p.address.state, 'Uttar Pradesh'); // default retained
        assert.equal(p.registrations.gstin, '09AAACG7481M1Z2'); // retained
        IV.resetCompanyProfile();
        assert.equal(ERP.Invoices.getCompanyProfile().legalName, 'Gurukripa Bricks Industry');
    });

    test('amount in words follows the Indian numbering system', () => {
        const IV = ERP.Invoices;
        assert.equal(IV.amountInWords(0), 'Zero Rupees Only');
        assert.equal(IV.amountInWords(123456789), 'Twelve Crore Thirty Four Lakh Fifty Six Thousand Seven Hundred Eighty Nine Rupees Only');
        assert.equal(IV.amountInWords(29610), 'Twenty Nine Thousand Six Hundred Ten Rupees Only');
        assert.equal(IV.amountInWords(10.55), 'Ten Rupees and Fifty Five Paise Only');
    });

    test('document title is TAX INVOICE with GST, BILL OF SUPPLY without', () => {
        const IV = ERP.Invoices, D = ERP.Documents;
        const taxed = D.createDocument('invoice', { lines: [{ item: 1, name: 'Awwal', qty: 1000, unitPrice: 7, taxRate: 5 }], tax: { place: 'intra' } });
        const exempt = D.createDocument('invoice', { lines: [{ item: 2, name: 'Sal', qty: 1000, unitPrice: 7, taxRate: 0 }], tax: { place: 'intra' } });
        assert.equal(IV.documentTitle(taxed, IV.getCompanyProfile(), {}), 'TAX INVOICE');
        assert.equal(IV.documentTitle(exempt, IV.getCompanyProfile(), {}), 'BILL OF SUPPLY');
    });

    test('delivery→invoice issues one real invoice and never double-bills on retry', () => {
        const IV = ERP.Invoices;
        const order = { id: 'GBI-1001', date: '2026-10-20', paymentMethod: 'UPI',
            customer: { name: 'Ravi Kumar', phone: '9999999999' },
            items: [{ id: 100, name: 'Awwal', qty: 4000, unit: 'piece', price: 7.05 }] };
        const r1 = IV.ensureInvoiceForDelivery(order);
        assert.equal(r1.ok, true);
        assert.equal(r1.created, true);
        assert.equal(r1.finalized, true);
        assert.match(r1.invoice.number, /^INV\//);
        // 4000 * 7.05 = 28200 taxable, +5% = 1410 tax (cgst 705 + sgst 705) => 29610
        assert.equal(r1.invoice.totals.grandTotal, 29610);
        assert.equal(r1.invoice.totals.place, 'intra');
        assert.equal(r1.invoice.status, 'paid'); // prepaid UPI mirrored idempotently
        const r2 = IV.ensureInvoiceForDelivery(order);
        assert.equal(r2.created, false);
        assert.equal(r2.duplicate, true);
        assert.equal(r2.invoice.number, r1.invoice.number); // no new number
    });

    test('inter-state delivery is billed as IGST using place of supply', () => {
        const IV = ERP.Invoices;
        const order = { id: 'GBI-2002', date: '2026-10-20', paymentMethod: 'COD',
            customer: { name: 'Mahesh', phone: '9888888888' },
            shipping: { stateCode: '27' },
            items: [{ id: 100, name: 'Awwal', qty: 1000, unit: 'piece', price: 10 }] };
        const r = IV.ensureInvoiceForDelivery(order);
        assert.equal(r.ok, true);
        assert.equal(r.invoice.totals.place, 'inter');
        assert.equal(r.invoice.totals.cgst, 0);
        assert.equal(r.invoice.totals.igst, 500); // 10000 * 5%
        assert.equal(r.invoice.status, 'finalized', 'credit/COD sale stays outstanding');
        assert.equal(r.invoice.balance, 10500);
    });

    test('rendered A4 invoice embeds real company, tax and amount-in-words', () => {
        const IV = ERP.Invoices;
        const order = { id: 'GBI-3003', date: '2026-10-20', paymentMethod: 'UPI',
            customer: { name: 'Anil', phone: '9777777777' },
            items: [{ id: 100, name: 'Awwal', qty: 4000, unit: 'piece', price: 7.05 }] };
        const inv = IV.ensureInvoiceForDelivery(order).invoice;
        const html = IV.renderInvoiceHTML(inv.number);
        assert.ok(html.indexOf('<!doctype html>') === 0);
        assert.ok(html.includes('Gurukripa Bricks Industry'));
        assert.ok(html.includes('09AAACG7481M1Z2'));
        assert.ok(html.includes('TAX INVOICE'));
        assert.ok(html.includes('CGST') && html.includes('SGST'));
        assert.ok(html.includes('Amount in words'));
        assert.ok(html.includes('Twenty Nine Thousand Six Hundred Ten Rupees Only'));
        assert.ok(html.includes(inv.number));
        assert.ok(html.includes('@page{size:A4'));
    });

    test('customers can only see their own invoices', () => {
        const IV = ERP.Invoices;
        IV.ensureInvoiceForDelivery({ id: 'GBI-A', customer: { name: 'A', phone: '9000000001' }, items: [{ id: 1, name: 'x', qty: 1, unitPrice: 100, taxRate: 0 }] });
        IV.ensureInvoiceForDelivery({ id: 'GBI-B', customer: { name: 'B', phone: '9000000002' }, items: [{ id: 1, name: 'x', qty: 1, unitPrice: 100, taxRate: 0 }] });
        const a = IV.invoicesForCustomer({ phone: '9000000001' });
        assert.equal(a.length, 1);
        assert.equal(a[0].number, IV.invoiceForOrder('GBI-A').number);
        const b = IV.invoicesForCustomer({ phone: '9000000002' });
        assert.equal(b.length, 1);
        assert.notEqual(a[0].id, b[0].id);
        assert.equal(IV.invoicesForCustomer({ phone: '9123456789' }).length, 0);
    });

    test('invoice report reconciles invoiced, tax, received and outstanding', () => {
        const IV = ERP.Invoices;
        IV.ensureInvoiceForDelivery({ id: 'GBI-R1', paymentMethod: 'UPI', customer: { name: 'R1', phone: '9111111111' }, items: [{ id: 1, name: 'x', qty: 1000, unitPrice: 10, taxRate: 5 }] });
        IV.ensureInvoiceForDelivery({ id: 'GBI-R2', paymentMethod: 'COD', customer: { name: 'R2', phone: '9222222222' }, items: [{ id: 1, name: 'x', qty: 1000, unitPrice: 10, taxRate: 5 }] });
        const rep = IV.invoiceReport();
        assert.equal(rep.count, 2);
        assert.equal(rep.invoiced, 21000); // 2 * (10000 + 500)
        assert.equal(rep.tax, 1000);
        assert.equal(rep.received, 10500); // only the prepaid one
        assert.equal(rep.outstanding, 10500);
        assert.equal(rep.paid, 1);
    });

    test('refuses to fabricate an invoice without real line items', () => {
        const IV = ERP.Invoices;
        const r = IV.ensureInvoiceForDelivery({ id: 'GBI-EMPTY', customer: { name: 'No Items', phone: '9333333333' } });
        assert.equal(r.ok, false);
        assert.equal(r.error, 'no_line_data');
        assert.equal(IV.invoiceForOrder('GBI-EMPTY'), null);
    });

    test('DOM-only actions degrade honestly and resend needs a backend', () => {
        const IV = ERP.Invoices;
        const inv = IV.ensureInvoiceForDelivery({ id: 'GBI-D', paymentMethod: 'UPI', customer: { name: 'D', phone: '9444444444' }, items: [{ id: 1, name: 'x', qty: 1, unitPrice: 100, taxRate: 0 }] }).invoice;
        assert.equal(IV.printInvoice(inv.number).ok, false); // no DOM in harness
        assert.equal(IV.downloadInvoice(inv.number).ok, false);
        assert.equal(IV.shareInvoice(inv.number).error, 'share_unsupported');
        const rs = IV.resendInvoice(inv.number, 'email');
        assert.equal(rs.sent, false);
        assert.equal(rs.reason, 'backend_required');
    });
});
