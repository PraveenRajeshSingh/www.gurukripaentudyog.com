const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Load the ERP modules into one isolated scope that shares a single
// mock window.GurukripaERP object and a Map-backed localStorage stub —
// the same harness style as tests/services.test.js.
const files = ['erp-core.js', 'erp-inventory.js', 'erp-documents.js', 'erp-crm.js', 'erp-analytics.js'];
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
