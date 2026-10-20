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
    var PLST = C.key('pricelists');
    var LEAD = C.key('leads');

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

    // ── Price lists (dealer / contractor / negotiated + bulk tiers) ──
    // Resolution priority in priceFor(): customer deal price → customer's
    // assigned list (by item, else qty tier) → segment default list → null.
    function upsertPriceList(pl) {
        if (!pl || !pl.name) throw new Error('Price list requires a name');
        var list = C.read(PLST, []);
        if (!pl.id) pl.id = C.uid('pl');
        var idx = -1;
        for (var i = 0; i < list.length; i++) { if (String(list[i].id) === String(pl.id)) { idx = i; break; } }
        var rec = Object.assign({ items: [], tiers: [], customerIds: [], segment: null, validFrom: null, validTo: null }, pl);
        if (idx === -1) list.push(rec); else list[idx] = Object.assign({}, list[idx], rec);
        C.write(PLST, list);
        C.logAudit('pricelist.upsert', 'pricelist', rec.id, { after: rec });
        return rec;
    }
    function listPriceLists() { return C.read(PLST, []).slice(); }
    function _tierPrice(tiers, qty) {
        if (!tiers || !tiers.length) return null;
        var best = null;
        for (var i = 0; i < tiers.length; i++) {
            var t = tiers[i];
            if ((Number(qty) || 0) >= (Number(t.minQty) || 0)) { if (best === null || (Number(t.minQty) || 0) >= (Number(best.minQty) || 0)) best = t; }
        }
        return best ? Number(best.unitPrice != null ? best.unitPrice : best.price) : null;
    }
    function _listItemPrice(list, itemId) {
        for (var i = 0; i < (list.items || []).length; i++) { if (String(list.items[i].item) === String(itemId)) return Number(list.items[i].price); }
        return null;
    }
    function _listValid(list) {
        var now = Date.now();
        if (list.validFrom && new Date(list.validFrom).getTime() > now) return false;
        if (list.validTo && new Date(list.validTo).getTime() < now) return false;
        return true;
    }
    function priceFor(customerId, itemId, qty) {
        var cu = getCustomer(customerId);
        if (!cu) return null;
        // 1) authorized negotiated deal price
        var deals = cu.dealPrices || [];
        for (var d = 0; d < deals.length; d++) { if (String(deals[d].item) === String(itemId)) return Number(deals[d].price); }
        // 2) assigned price list (item, else bulk tier)
        var lists = C.read(PLST, []);
        var assigned = cu.priceList ? lists.filter(function (l) { return String(l.id) === String(cu.priceList) && _listValid(l); })[0] : null;
        if (assigned) {
            var ip = _listItemPrice(assigned, itemId);
            if (ip != null) return ip;
            var tp = _tierPrice(assigned.tiers, qty);
            if (tp != null) return tp;
        }
        // 3) segment default list
        if (cu.segment) {
            var seg = lists.filter(function (l) { return l.segment === cu.segment && _listValid(l); })[0];
            if (seg) { var sp = _listItemPrice(seg, itemId); if (sp != null) return sp; var stp = _tierPrice(seg.tiers, qty); if (stp != null) return stp; }
        }
        return null;
    }
    function setDealPrice(customerId, itemId, price) {
        var cu = getCustomer(customerId);
        if (!cu) throw new Error('Customer not found');
        cu.dealPrices = cu.dealPrices || [];
        var found = false;
        for (var i = 0; i < cu.dealPrices.length; i++) { if (String(cu.dealPrices[i].item) === String(itemId)) { cu.dealPrices[i].price = Number(price); found = true; } }
        if (!found) cu.dealPrices.push({ item: itemId, price: Number(price) });
        return _upsert(CUST, 'customer', cu);
    }

    // ── Sales leads & follow-up tasks ────────────────────────────
    var LEAD_STAGES = ['new', 'contacted', 'qualified', 'quoted', 'won', 'lost'];
    function upsertLead(lead) {
        lead = lead || {};
        var list = C.read(LEAD, []);
        if (!lead.id) lead.id = C.uid('lead');
        var idx = -1;
        for (var i = 0; i < list.length; i++) { if (String(list[i].id) === String(lead.id)) { idx = i; break; } }
        var rec = Object.assign({ name: '', phone: '', company: '', source: 'website', segment: 'retail', stage: 'new', owner: null, nextFollowUp: null, notes: '', quotationId: null }, lead);
        rec.updatedAt = new Date().toISOString();
        if (idx === -1) { rec.createdAt = rec.updatedAt; list.push(rec); } else { list[idx] = Object.assign({}, list[idx], rec); }
        C.write(LEAD, list);
        C.logAudit('lead.upsert', 'lead', rec.id, { after: rec });
        return rec;
    }
    function listLeads(stage) {
        var list = C.read(LEAD, []);
        return stage ? list.filter(function (l) { return l.stage === stage; }) : list;
    }
    function advanceLeadStage(leadId, stage) {
        if (LEAD_STAGES.indexOf(stage) === -1) throw new Error('Invalid lead stage: ' + stage);
        var list = C.read(LEAD, []);
        for (var i = 0; i < list.length; i++) { if (String(list[i].id) === String(leadId)) { list[i].stage = stage; list[i].updatedAt = new Date().toISOString(); C.write(LEAD, list); C.logAudit('lead.stage', 'lead', leadId, { after: list[i] }); return list[i]; } }
        throw new Error('Lead not found');
    }
    function dueFollowups(asOf) {
        var now = asOf ? new Date(asOf).getTime() : Date.now();
        return listLeads().filter(function (l) { return l.nextFollowUp && new Date(l.nextFollowUp).getTime() <= now && l.stage !== 'won' && l.stage !== 'lost'; });
    }
    function convertLeadToCustomer(leadId) {
        var list = C.read(LEAD, []);
        var lead = list.filter(function (l) { return String(l.id) === String(leadId); })[0];
        if (!lead) throw new Error('Lead not found');
        var cu = upsertCustomer({ name: lead.name, phone: lead.phone, segment: lead.segment, salesperson: lead.owner });
        lead.stage = 'won'; lead.customerId = cu.id; lead.updatedAt = new Date().toISOString();
        C.write(LEAD, list); C.logAudit('lead.convert', 'lead', leadId, { after: lead });
        return cu;
    }

    E.CRM = {
        SEGMENTS: SEGMENTS, EXPENSE_CATEGORIES: EXPENSE_CATEGORIES,
        upsertCustomer: upsertCustomer, getCustomer: getCustomer, listCustomers: listCustomers, addAddress: addAddress,
        customerBalance: customerBalance, withinCreditLimit: withinCreditLimit, approveCreditSale: approveCreditSale,
        aging: aging, statement: statement,
        upsertSupplier: upsertSupplier, getSupplier: getSupplier, listSuppliers: listSuppliers, supplierPayables: supplierPayables,
        addExpense: addExpense, listExpenses: listExpenses, expenseSummary: expenseSummary,
        upsertPriceList: upsertPriceList, listPriceLists: listPriceLists, priceFor: priceFor, setDealPrice: setDealPrice,
        LEAD_STAGES: LEAD_STAGES, upsertLead: upsertLead, listLeads: listLeads, advanceLeadStage: advanceLeadStage, dueFollowups: dueFollowups, convertLeadToCustomer: convertLeadToCustomer
    };

})(window.GurukripaERP);
