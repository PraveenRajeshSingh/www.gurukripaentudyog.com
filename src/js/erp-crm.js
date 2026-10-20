'use strict';
// ══════════════════════════════════════════════════════════════════
// Gurukripa ERP — CRM (customers, suppliers, credit, aging, statements)
//                    + EXPENSES (financial module seed)
// ══════════════════════════════════════════════════════════════════
// Customer/supplier balances are COMPUTED from finalized documents, never
// stored as an independent mutable number — so the ledger, documents and
// CRM always reconcile. Credit-limit checks gate the action behind RBAC.
// ══════════════════════════════════════════════════════════════════

window.GurukripaERP = window.GurukripaERP || {};

(function(E) {
    var C = E.Core;
    var CUST = C.key('customers');
    var SUPP = C.key('suppliers');
    var EXP  = C.key('expenses');

    var SEGMENTS = ['retail', 'dealer', 'builder', 'contractor'];
    var EXPENSE_CATEGORIES = ['fuel', 'transport', 'wages', 'rent', 'utilities', 'maintenance', 'raw_material', 'kiln', 'admin', 'other'];

    function _upsert(storeKey, entityKey, rec) {
        if (!rec || !(rec.id || rec.name)) throw new Error(entityKey + ' requires id/name');
        var list = C.read(storeKey, []);
        if (!rec.id) rec.id = C.uid(entityKey);
        var idx = -1;
        for (var i = 0; i < list.length; i++) { if (String(list[i].id) === String(rec.id)) { idx = i; break; } }
        rec.updatedAt = new Date().toISOString();
        if (idx === -1) { rec.createdAt = rec.updatedAt; list.push(rec); }
        else { list[idx] = Object.assign({}, list[idx], rec); }
        C.write(storeKey, list);
        C.logAudit(entityKey + '.upsert', entityKey, rec.id, { after: rec });
        return rec;
    }
    function _get(storeKey, id) {
        return C.read(storeKey, []).filter(function(x) { return String(x.id) === String(id); })[0] || null;
    }

    // ── Customers ────────────────────────────────────────────────
    function upsertCustomer(c) {
        var rec = Object.assign({
            name: '', phone: '', email: '', gstin: '',
            segment: 'retail', addresses: [], salesperson: null,
            creditLimit: 0, creditTermsDays: 0, priceList: null
        }, c || {});
        if (rec.segment && SEGMENTS.indexOf(rec.segment) === -1) rec.segment = 'retail';
        return _upsert(CUST, 'customer', rec);
    }
    function getCustomer(id) { return _get(CUST, id); }
    function listCustomers() { return C.read(CUST, []).slice(); }
    function addAddress(customerId, addr) {
        var cu = getCustomer(customerId);
        if (!cu) throw new Error('Customer not found');
        cu.addresses = cu.addresses || [];
        cu.addresses.push(Object.assign({ label: 'site', line1: '', city: '', state: 'Uttar Pradesh', pin: '' }, addr || {}));
        return _upsert(CUST, 'customer', cu);
    }

    // Balance = finalized unpaid invoices net of credit notes (computed)
    function customerBalance(customerId) {
        if (!E.Documents) return { total: 0, overdue: 0 };
        return E.Documents.customerOutstanding(customerId);
    }
    // Credit exposure = current balance + proposed order value
    function withinCreditLimit(customerId, additionalAmount) {
        var cu = getCustomer(customerId);
        if (!cu) return { ok: true, reason: 'no_customer' };
        if (!cu.creditLimit) return { ok: true, reason: 'no_limit_set' };
        var bal = customerBalance(customerId).total;
        var projected = C.round2(bal + (Number(additionalAmount) || 0));
        return { ok: projected <= cu.creditLimit, balance: bal, additional: Number(additionalAmount) || 0, projected: projected, creditLimit: cu.creditLimit };
    }
    // Approving a credit sale beyond limit requires the credit.sale.approve role
    function approveCreditSale(customerId, orderValue, actor) {
        actor = actor || C.currentActor();
        C.assertCan(actor, 'credit.sale.approve');
        var chk = withinCreditLimit(customerId, orderValue);
        C.logAudit('credit.sale.approve', 'customer', customerId, { note: JSON.stringify(chk) });
        return chk;
    }

    // ── Aging buckets (all or one customer) ──────────────────────
    function aging(customerId) {
        var buckets = { b0_30: 0, b31_60: 0, b61_90: 0, b90plus: 0 };
        var now = new Date();
        var invoices = E.Documents ? E.Documents.listDocs('invoice') : [];
        var rows = [];
        for (var i = 0; i < invoices.length; i++) {
            var d = invoices[i];
            if (customerId && String(d.customerId) !== String(customerId)) continue;
            if (d.status === 'cancelled' || d.status === 'draft') continue;
            if (!(d.balance > 0)) continue;
            var ref = d.dueDate ? new Date(d.dueDate) : new Date(d.date);
            var days = Math.floor((now - ref) / 86400000);
            var key = days <= 30 ? 'b0_30' : days <= 60 ? 'b31_60' : days <= 90 ? 'b61_90' : 'b90plus';
            buckets[key] = C.round2(buckets[key] + d.balance);
            rows.push({ number: d.number, customer: d.customerId, date: d.date, dueDate: d.dueDate, daysOverdue: days, balance: d.balance, bucket: key });
        }
        buckets.total = C.round2(buckets.b0_30 + buckets.b31_60 + buckets.b61_90 + buckets.b90plus);
        return { buckets: buckets, rows: rows };
    }

    // ── Customer statement (running balance) ─────────────────────
    function statement(customerId, from, to) {
        var docs = E.Documents ? E.Documents.listDocs() : [];
        var items = [];
        for (var i = 0; i < docs.length; i++) {
            var d = docs[i];
            if (String(d.customerId) !== String(customerId)) continue;
            if (d.status === 'draft' || d.status === 'cancelled') continue;
            var amt = 0, label = '';
            if (d.type === 'invoice') { amt = d.totals.grandTotal; label = 'Invoice ' + d.number; }
            else if (d.type === 'credit_note') { amt = -d.totals.grandTotal; label = 'Credit note ' + d.number; }
            else if (d.type === 'receipt') { amt = -d.totals.grandTotal; label = 'Receipt ' + d.number; }
            else continue;
            var dt = new Date(d.date);
            if (from && dt < new Date(from)) continue;
            if (to && dt > new Date(to)) continue;
            items.push({ date: d.date, label: label, amount: C.round2(amt) });
        }
        items.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
        var run = 0;
        for (var j = 0; j < items.length; j++) { run = C.round2(run + items[j].amount); items[j].running = run; }
        return { customerId: customerId, lines: items, closingBalance: run };
    }

    // ── Suppliers + payables ─────────────────────────────────────
    function upsertSupplier(s) {
        var rec = Object.assign({ name: '', phone: '', email: '', gstin: '', category: 'supplier', paymentTermsDays: 0 }, s || {});
        return _upsert(SUPP, 'supplier', rec);
    }
    function getSupplier(id) { return _get(SUPP, id); }
    function listSuppliers() { return C.read(SUPP, []).slice(); }
    function supplierPayables(supplierId) {
        var bills = E.Documents ? E.Documents.listDocs('supplier_bill') : [];
        var total = 0, out = [];
        for (var i = 0; i < bills.length; i++) {
            var b = bills[i];
            if (supplierId && String(b.supplierId) !== String(supplierId)) continue;
            if (b.status === 'cancelled' || b.status === 'draft') continue;
            var bal = C.round2((b.totals && b.totals.grandTotal || 0) - (b.paidTotal || 0));
            if (bal > 0) { total += bal; out.push({ number: b.number, balance: bal, dueDate: b.dueDate }); }
        }
        return { total: C.round2(total), bills: out };
    }

    // ── Expenses (cash book seed) ────────────────────────────────
    function addExpense(e) {
        e = e || {};
        C.assertCan(C.currentActor(), 'expense.create');
        var list = C.read(EXP, []);
        var rec = {
            id: C.uid('exp'), date: e.date ? new Date(e.date).toISOString() : new Date().toISOString(),
            category: EXPENSE_CATEGORIES.indexOf(e.category) !== -1 ? e.category : 'other',
            amount: C.round2(e.amount), vendor: e.vendor || '', note: e.note || '', ref: e.ref || null,
            createdBy: (C.currentActor() || {}).name || 'system'
        };
        if (!(rec.amount > 0)) throw new Error('Expense amount must be positive');
        list.push(rec); C.write(EXP, list);
        C.logAudit('expense.create', 'expense', rec.id, { after: rec });
        return rec;
    }
    function listExpenses() { return C.read(EXP, []).slice(); }
    function expenseSummary(from, to) {
        var all = listExpenses();
        var byCat = {}, total = 0;
        for (var i = 0; i < all.length; i++) {
            var x = all[i];
            if (from && new Date(x.date) < new Date(from)) continue;
            if (to && new Date(x.date) > new Date(to)) continue;
            byCat[x.category] = C.round2((byCat[x.category] || 0) + x.amount);
            total += x.amount;
        }
        return { byCategory: byCat, total: C.round2(total), hasData: all.length > 0 };
    }

    E.CRM = {
        SEGMENTS: SEGMENTS, EXPENSE_CATEGORIES: EXPENSE_CATEGORIES,
        upsertCustomer: upsertCustomer, getCustomer: getCustomer, listCustomers: listCustomers, addAddress: addAddress,
        customerBalance: customerBalance, withinCreditLimit: withinCreditLimit, approveCreditSale: approveCreditSale,
        aging: aging, statement: statement,
        upsertSupplier: upsertSupplier, getSupplier: getSupplier, listSuppliers: listSuppliers, supplierPayables: supplierPayables,
        addExpense: addExpense, listExpenses: listExpenses, expenseSummary: expenseSummary
    };

})(window.GurukripaERP);
