'use strict';
// ══════════════════════════════════════════════════════════════════
// Gurukripa ERP — DOCUMENTS (quotations, orders, invoices, credit
// notes, receipts, challans, purchases) + Indian GST engine
// ══════════════════════════════════════════════════════════════════
// Financial history is immutable: finalized documents are never deleted
// or silently overwritten. Corrections go through cancellation (status
// change, record retained) or a linked credit note. Every mutation is
// audit-logged with the acting user.
//
// PAYMENT HONESTY: recordPayment() writes an explicit, idempotent ledger
// entry referencing a transaction id. It is NOT called automatically from
// any checkout/"success" callback. For real online capture this must be
// invoked only after server-side gateway webhook verification — which this
// static site cannot perform (see docs/ERP-ARCHITECTURE.md).
// ══════════════════════════════════════════════════════════════════

window.GurukripaERP = window.GurukripaERP || {};

(function(E) {
    var C = E.Core;
    var DOCS = C.key('docs');

    function _readAll() { return C.read(DOCS, []); }
    function _writeAll(list) { C.write(DOCS, list); }
    function _index(doc) {
        var list = _readAll();
        list.push(doc);
        _writeAll(list);
        return doc;
    }
    function _replace(doc) {
        var list = _readAll();
        for (var i = 0; i < list.length; i++) { if (list[i].id === doc.id) { list[i] = doc; break; } }
        _writeAll(list);
        return doc;
    }

    // ── GST / tax engine ─────────────────────────────────────────
    // scheme: 'exclusive' (tax added on top) | 'inclusive' (tax within price)
    // place:  'intra' (CGST+SGST)             | 'inter' (IGST)
    // Returns {lines, totals, errors, warnings} with paise-accurate rounding.
    function computeTotals(lines, opts) {
        opts = opts || {};
        var scheme = opts.scheme === 'inclusive' ? 'inclusive' : 'exclusive';
        var place = opts.place === 'inter' ? 'inter' : 'intra';
        var defaultRate = Number(opts.gstRate != null ? opts.gstRate : 5);
        var roundToRupee = opts.roundOff !== false;
        var errors = [], warnings = [];

        var taxableTotal = 0, discountTotal = 0, taxTotal = 0;
        var outLines = [];

        for (var i = 0; i < (lines || []).length; i++) {
            var ln = lines[i];
            var qty = Number(ln.qtyBase != null ? ln.qtyBase : ln.qty) || 0;
            var rate = Number(ln.unitPrice != null ? ln.unitPrice : ln.rate) || 0;
            var gstRate = Number(ln.taxRate != null ? ln.taxRate : defaultRate);
            var lineDiscPct = Number(ln.discountPct || 0);
            var lineDiscAmt = Number(ln.discountAmount || 0);

            var gross = C.round2(qty * rate);
            var disc = C.round2(gross * (lineDiscPct / 100) + lineDiscAmt);
            if (disc > gross) { disc = gross; warnings.push('Line ' + (i + 1) + ' discount capped at gross'); }
            var afterDisc = C.round2(gross - disc);

            var taxable, tax;
            if (scheme === 'inclusive') {
                taxable = C.round2(afterDisc / (1 + gstRate / 100));
                tax = C.round2(afterDisc - taxable);
            } else {
                taxable = afterDisc;
                tax = C.round2(afterDisc * (gstRate / 100));
            }

            var cgst = 0, sgst = 0, igst = 0;
            if (place === 'inter') { igst = C.round2(tax); }
            else { cgst = C.round2(tax / 2); sgst = C.round2(tax - cgst); }

            if (!ln.hsn && !ln.sac) warnings.push('Line ' + (i + 1) + ' missing HSN/SAC');

            taxableTotal = C.round2(taxableTotal + taxable);
            discountTotal = C.round2(discountTotal + disc);
            taxTotal = C.round2(taxTotal + tax);

            outLines.push({
                item: ln.item, productId: ln.productId, name: ln.name,
                hsn: ln.hsn || null, sac: ln.sac || null,
                qty: qty, unit: ln.unit || 'piece', unitPrice: rate,
                discountPct: lineDiscPct, discountAmount: disc,
                taxableValue: taxable, taxRate: gstRate,
                cgst: cgst, sgst: sgst, igst: igst, taxTotal: C.round2(cgst + sgst + igst),
                lineTotal: C.round2(taxable + (place === 'inter' ? igst : cgst + sgst))
            });
        }

        var sumTaxable = C.round2(taxableTotal);
        var rawGrand = C.round2(sumTaxable + taxTotal);
        var roundOff = roundToRupee ? C.round2(Math.round(rawGrand) - rawGrand) : 0;
        var grandTotal = C.round2(rawGrand + roundOff);

        var cgstTotal = 0, sgstTotal = 0, igstTotal = 0;
        for (var k = 0; k < outLines.length; k++) {
            cgstTotal += outLines[k].cgst; sgstTotal += outLines[k].sgst; igstTotal += outLines[k].igst;
        }

        if (place === 'inter' && opts.sellerState && opts.buyerState &&
            opts.sellerState === opts.buyerState) {
            warnings.push('Intra-state transaction modelled as IGST — verify place of supply');
        }

        return {
            lines: outLines,
            totals: {
                scheme: scheme, place: place,
                subTotal: C.round2(sum(outLines, function(l){ return l.qty * l.unitPrice; })),
                discountTotal: discountTotal,
                taxableValue: sumTaxable,
                cgst: C.round2(cgstTotal), sgst: C.round2(sgstTotal), igst: C.round2(igstTotal),
                taxTotal: C.round2(taxTotal),
                roundOff: roundOff,
                grandTotal: grandTotal
            },
            errors: errors, warnings: warnings
        };
    }
    function sum(list, f) { var a = 0; for (var i = 0; i < list.length; i++) a += Number(f(list[i])) || 0; return a; }

    // ── Create draft document ────────────────────────────────────
    // type: quotation | sales_order | invoice | credit_note | receipt |
    //       challan | purchase_order | supplier_bill
    function createDocument(type, payload) {
        payload = payload || {};
        var calc = computeTotals(payload.lines || [], payload.tax || {});
        var now = new Date().toISOString();
        var doc = {
            id: C.uid(type),
            number: payload.number || C.nextNumber(type, { date: payload.date }),
            type: type,
            date: payload.date ? new Date(payload.date).toISOString() : now,
            dueDate: payload.dueDate || null,
            customerId: payload.customerId || null,
            supplierId: payload.supplierId || null,
            warehouse: payload.warehouse || null,
            salesperson: payload.salesperson || null,
            branch: payload.branch || null,
            charges: payload.charges || null,   // landed-cost charges (purchase docs)
            currency: 'INR',
            lines: calc.lines,
            totals: calc.totals,
            status: 'draft',
            payments: [],
            paidTotal: 0,
            balance: calc.totals.grandTotal,
            refDocId: payload.refDocId || null,
            notes: payload.notes || '',
            createdBy: (C.currentActor() || {}).name || 'system',
            createdAt: now,
            finalizedAt: null, cancelledAt: null, cancelReason: null,
            validation: { errors: calc.errors, warnings: calc.warnings }
        };
        _index(doc);
        C.logAudit('doc.create', type, doc.number, { after: doc });
        return doc;
    }

    function getDoc(idOrNumber) {
        var list = _readAll();
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === idOrNumber || list[i].number === idOrNumber) return list[i];
        }
        return null;
    }
    function listDocs(type) {
        var list = _readAll();
        return type ? list.filter(function(d) { return d.type === type; }) : list.slice();
    }

    // ── Finalize (immutable from here on) ────────────────────────
    function finalize(idOrNumber, actor) {
        actor = actor || C.currentActor();
        C.assertCan(actor, docTypeAction(getDoc(idOrNumber)));
        var doc = getDoc(idOrNumber);
        if (!doc) throw new Error('Document not found');
        if (doc.status !== 'draft') throw new Error('Only draft documents can be finalized');
        if (doc.validation && doc.validation.errors && doc.validation.errors.length) {
            var e = new Error('Document has validation errors: ' + doc.validation.errors.join('; '));
            e.code = 'VALIDATION'; throw e;
        }
        doc.status = 'finalized';
        doc.finalizedAt = new Date().toISOString();
        // An invoice finalized from a sale consumes stock when a warehouse is set
        if (doc.type === 'invoice' && doc.warehouse) {
            _consumeStock(doc);
        }
        _replace(doc);
        C.logAudit('doc.finalize', doc.type, doc.number, { after: doc });
        return doc;
    }
    function docTypeAction(doc) {
        if (!doc) return 'invoice.finalize';
        if (doc.type === 'credit_note') return 'creditnote.issue';
        return 'invoice.finalize';
    }
    function _consumeStock(doc) {
        if (!E.Inventory) return;
        for (var i = 0; i < doc.lines.length; i++) {
            var l = doc.lines[i];
            E.Inventory.dispatch({ item: l.item, warehouse: doc.warehouse, qty: l.qty, unit: l.unit, ref: doc.number, note: 'invoice dispatch' });
        }
    }

    // ── Cancel (status change; record retained) ──────────────────
    function cancel(idOrNumber, reason, actor) {
        actor = actor || C.currentActor();
        C.assertCan(actor, 'invoice.cancel');
        var doc = getDoc(idOrNumber);
        if (!doc) throw new Error('Document not found');
        if (doc.status === 'cancelled') return doc;
        doc.status = 'cancelled';
        doc.cancelledAt = new Date().toISOString();
        doc.cancelReason = reason || 'no reason provided';
        _replace(doc);
        C.logAudit('doc.cancel', doc.type, doc.number, { note: doc.cancelReason, after: doc });
        return doc;
    }

    // ── Credit note against an invoice ───────────────────────────
    function issueCreditNote(invoiceIdOrNumber, opts) {
        opts = opts || {};
        var inv = getDoc(invoiceIdOrNumber);
        if (!inv) throw new Error('Invoice not found');
        if (inv.type !== 'invoice') throw new Error('Credit notes apply to invoices');
        var lines = opts.lines && opts.lines.length ? opts.lines : inv.lines.map(function(l) {
            return { item: l.item, name: l.name, hsn: l.hsn, qty: l.qty, unit: l.unit, unitPrice: l.unitPrice, taxRate: l.taxRate };
        });
        var cn = createDocument('credit_note', {
            customerId: inv.customerId, supplierId: inv.supplierId,
            lines: lines, tax: { scheme: inv.totals.scheme, place: inv.totals.place, gstRate: inv.lines[0] ? inv.lines[0].taxRate : 5 },
            refDocId: inv.id, notes: opts.reason || 'Credit note'
        });
        cn.status = 'finalized'; cn.finalizedAt = new Date().toISOString();
        _replace(cn);
        // Recompute the parent invoice balance/receivable (never mutate history)
        var credited = creditedAmount(inv);
        var debited = debitedAmount(inv);
        inv.balance = C.round2(Math.max(0, inv.totals.grandTotal - credited + debited - (inv.paidTotal || 0)));
        if (inv.balance <= 1e-9 && inv.status !== 'cancelled') inv.status = 'paid';
        _replace(inv);
        C.logAudit('doc.creditnote.issue', 'credit_note', cn.number, { after: cn });
        return cn;
    }

    // Debit note against an invoice (interest, under-billing, recoverable
    // charges). Increases what the customer owes; the invoice is retained.
    function issueDebitNote(invoiceIdOrNumber, opts) {
        opts = opts || {};
        var inv = getDoc(invoiceIdOrNumber);
        if (!inv) throw new Error('Invoice not found');
        if (inv.type !== 'invoice') throw new Error('Debit notes apply to invoices');
        var lines = (opts.lines && opts.lines.length) ? opts.lines : [{ item: 'adjustment', name: opts.reason || 'Debit note', qty: 1, unitPrice: Number(opts.amount) || 0, taxRate: opts.taxRate != null ? opts.taxRate : 0, hsn: opts.hsn || null }];
        var dn = createDocument('debit_note', {
            customerId: inv.customerId, supplierId: inv.supplierId,
            lines: lines, tax: { scheme: inv.totals.scheme, place: inv.totals.place, gstRate: opts.taxRate != null ? opts.taxRate : (inv.lines[0] ? inv.lines[0].taxRate : 0) },
            refDocId: inv.id, notes: opts.reason || 'Debit note'
        });
        dn.status = 'finalized'; dn.finalizedAt = new Date().toISOString();
        _replace(dn);
        var credited = creditedAmount(inv); var debited = debitedAmount(inv);
        inv.balance = C.round2(Math.max(0, inv.totals.grandTotal - credited + debited - (inv.paidTotal || 0)));
        if (inv.balance > 1e-9 && inv.status === 'paid') inv.status = 'partially_paid';
        _replace(inv);
        C.logAudit('doc.debitnote.issue', 'debit_note', dn.number, { after: dn });
        return dn;
    }

    // ── Quotation → Sales order → Invoice (no duplication) ───────
    function convertQuotationToOrder(quotationIdOrNumber) {
        var q = getDoc(quotationIdOrNumber);
        if (!q) throw new Error('Quotation not found');
        if (q.type !== 'quotation') throw new Error('Not a quotation');
        if (q.status === 'converted') throw new Error('Quotation already converted');
        var so = createDocument('sales_order', {
            customerId: q.customerId, warehouse: q.warehouse,
            lines: q.lines.map(function(l) { return { item: l.item, name: l.name, hsn: l.hsn, qty: l.qty, unit: l.unit, unitPrice: l.unitPrice, taxRate: l.taxRate }; }),
            tax: { scheme: q.totals.scheme, place: q.totals.place, gstRate: q.lines[0] ? q.lines[0].taxRate : 5 },
            refDocId: q.id, notes: 'Converted from ' + q.number
        });
        q.status = 'converted'; _replace(q);
        C.logAudit('doc.quotation.convert', 'sales_order', so.number, { after: so });
        return so;
    }
    function createInvoiceFromOrder(orderIdOrNumber) {
        var o = getDoc(orderIdOrNumber);
        if (!o) throw new Error('Order not found');
        if (o.type !== 'sales_order') throw new Error('Not a sales order');
        var inv = createDocument('invoice', {
            customerId: o.customerId, warehouse: o.warehouse,
            lines: o.lines.map(function(l) { return { item: l.item, name: l.name, hsn: l.hsn, qty: l.qty, unit: l.unit, unitPrice: l.unitPrice, taxRate: l.taxRate }; }),
            tax: { scheme: o.totals.scheme, place: o.totals.place, gstRate: o.lines[0] ? o.lines[0].taxRate : 5 },
            dueDate: o.dueDate, refDocId: o.id, notes: 'From order ' + o.number
        });
        C.logAudit('doc.invoice.from_order', 'invoice', inv.number, { after: inv });
        return inv;
    }

    // ── Idempotent payment recording ─────────────────────────────
    // NOTE: call ONLY after a payment is verified. Never wire to a raw
    // client success callback. txnId provides idempotency (duplicate
    // callbacks for the same txn are ignored).
    function recordPayment(invoiceIdOrNumber, payment) {
        payment = payment || {};
        C.assertCan(C.currentActor(), 'payment.record');
        var inv = getDoc(invoiceIdOrNumber);
        if (!inv) throw new Error('Invoice not found');
        var amt = C.round2(payment.amount);
        if (!(amt > 0)) throw new Error('Payment amount must be positive');
        var txnId = payment.txnId || null;
        if (txnId) {
            var dup = (inv.payments || []).filter(function(p) { return p.txnId === txnId; });
            if (dup.length) return { invoice: inv, duplicate: true }; // idempotent no-op
        }
        inv.payments = inv.payments || [];
        inv.payments.push({ amount: amt, method: payment.method || 'cash', txnId: txnId, ts: new Date().toISOString(), reference: payment.reference || null });
        inv.paidTotal = C.round2(sum(inv.payments, function(p) { return p.amount; }));
        // credit notes reduce what is owed; debit notes (interest/undercharge) increase it
        var credited = creditedAmount(inv);
        var debited = debitedAmount(inv);
        inv.balance = C.round2(Math.max(0, inv.totals.grandTotal - credited + debited - inv.paidTotal));
        if (inv.paidTotal + credited >= inv.totals.grandTotal + debited - 1e-9) inv.status = 'paid';
        else if (inv.paidTotal > 0) inv.status = 'partially_paid';
        // A receipt document mirrors the payment for printing
        var rcpt = createDocument('receipt', {
            customerId: inv.customerId, number: payment.receiptNumber,
            lines: [{ item: 'payment', name: 'Payment against ' + inv.number, qty: 1, unitPrice: amt, taxRate: 0 }],
            tax: { gstRate: 0 }, refDocId: inv.id, notes: payment.reference || ''
        });
        rcpt.status = 'finalized'; rcpt.finalizedAt = new Date().toISOString();
        rcpt.totals.grandTotal = amt; rcpt.balance = 0; rcpt.paidTotal = amt;
        _replace(rcpt);
        _replace(inv);
        C.logAudit('payment.record', 'invoice', inv.number, { after: { amount: amt, txnId: txnId, receipt: rcpt.number } });
        return { invoice: inv, receipt: rcpt, duplicate: false };
    }
    function creditedAmount(inv) {
        var notes = listDocs('credit_note');
        var total = 0;
        for (var i = 0; i < notes.length; i++) {
            if (notes[i].refDocId === inv.id && notes[i].status !== 'cancelled') total += notes[i].totals.grandTotal;
        }
        return C.round2(total);
    }
    function debitedAmount(inv) {
        var notes = listDocs('debit_note');
        var total = 0;
        for (var i = 0; i < notes.length; i++) {
            if (notes[i].refDocId === inv.id && notes[i].status !== 'cancelled') total += notes[i].totals.grandTotal;
        }
        return C.round2(total);
    }

    // ── Landed cost (purchase + allocable charges) ───────────────
    // Allocates freight/loading/unloading/handling/other charges across PO
    // lines so per-unit cost is true. Documented methods, no double-count:
    //   value    → pro-rata on line purchase value (default)
    //   quantity → pro-rata on line quantity
    //   equal    → even split across lines
    // Rounding residual is absorbed by the last line so allocated sum equals
    // total charges exactly.
    function computeLandedCost(lines, charges, opts) {
        opts = opts || {};
        lines = lines || [];
        charges = charges || [];
        var totalCharges = C.round2(C.sum(charges, function (c) { return c.amount; }));
        var totalValue = C.round2(C.sum(lines, function (l) { return (Number(l.qty) || 0) * (Number(l.unitCost != null ? l.unitCost : l.unitPrice) || 0); }));
        var totalQty = C.round2(C.sum(lines, function (l) { return Number(l.qty) || 0; }));
        var n = lines.length;
        var out = [], allocatedSum = 0;
        for (var i = 0; i < n; i++) {
            var l = lines[i];
            var basis = opts.method || (charges[0] && charges[0].basis) || 'value';
            var lineValue = C.round2((Number(l.qty) || 0) * (Number(l.unitCost != null ? l.unitCost : l.unitPrice) || 0));
            var share;
            if (basis === 'equal') share = n ? 1 / n : 0;
            else if (basis === 'quantity') share = totalQty ? (Number(l.qty) || 0) / totalQty : 0;
            else share = totalValue ? lineValue / totalValue : 0;
            var allocated;
            if (i === n - 1) allocated = C.round2(totalCharges - allocatedSum); // absorb residual
            else { allocated = C.round2(totalCharges * share); allocatedSum = C.round2(allocatedSum + allocated); }
            var landedTotal = C.round2(lineValue + allocated);
            out.push({
                item: l.item, qty: Number(l.qty) || 0, purchaseCost: lineValue, basis: basis,
                allocated: allocated, landedTotal: landedTotal,
                landedUnitCost: (Number(l.qty) || 0) ? C.round2(landedTotal / l.qty) : 0
            });
        }
        return { lines: out, totalPurchase: totalValue, totalCharges: totalCharges, landedValue: C.round2(totalValue + totalCharges), method: opts.method || (charges[0] && charges[0].basis) || 'value' };
    }

    // ── Purchasing: PO → goods-received (does not add stock until GRN) ─
    function receivePurchase(poIdOrNumber, grnLines, actor, opts) {
        actor = actor || C.currentActor();
        opts = opts || {};
        C.assertCan(actor, 'stock.receive');
        var po = getDoc(poIdOrNumber);
        if (!po) throw new Error('Purchase order not found');
        if (po.type !== 'purchase_order') throw new Error('Not a purchase order');
        var wh = po.warehouse || 'main';
        var lines = grnLines && grnLines.length ? grnLines : po.lines;
        var charges = opts.charges || po.charges || null;
        var landed = charges && charges.length ? computeLandedCost(lines, charges, { method: opts.method }) : null;
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i];
            var cost = l.unitCost != null ? l.unitCost : l.cost;
            if (landed) cost = landed.lines[i].landedUnitCost;
            if (E.Inventory) E.Inventory.receive({ item: l.item, warehouse: wh, qty: l.qty, unit: l.unit, ref: po.number, cost: cost, idem: (opts.idem ? opts.idem + ':' + i : null) });
        }
        po.status = 'received';
        if (landed) po.landedCost = landed;
        _replace(po);
        C.logAudit('po.receive', 'purchase_order', po.number, { after: po });
        return po;
    }

    // Outstanding receivables for a customer (finalized, unpaid invoices net of credit notes)
    function customerOutstanding(customerId) {
        var invs = listDocs('invoice');
        var total = 0, overdue = 0, now = new Date();
        var out = [];
        for (var i = 0; i < invs.length; i++) {
            var d = invs[i];
            if (String(d.customerId) !== String(customerId)) continue;
            if (d.status === 'cancelled' || d.status === 'draft') continue;
            if (d.balance > 0) {
                total += d.balance;
                var isOver = d.dueDate && new Date(d.dueDate) < now && d.status !== 'paid';
                if (isOver) overdue += d.balance;
                out.push(d);
            }
        }
        return { total: C.round2(total), overdue: C.round2(overdue), invoices: out };
    }

    // ── Tax summary (GST liability for a period) ─────────────────
    // Sums CGST/SGST/IGST on finalized invoices net of cancelled and of credit
    // notes (which reduce output tax). Debit notes increase it. For CA review
    // only — not a filed return.
    function taxSummary(from, to) {
        var docs = listDocs();
        var byRate = {}, cgst = 0, sgst = 0, igst = 0, taxable = 0;
        for (var i = 0; i < docs.length; i++) {
            var d = docs[i];
            if (d.type !== 'invoice' && d.type !== 'credit_note' && d.type !== 'debit_note') continue;
            if (d.status === 'cancelled' || d.status === 'draft') continue;
            var dt = new Date(d.date);
            if (from && dt < new Date(from)) continue;
            if (to && dt > new Date(to)) continue;
            var sign = d.type === 'credit_note' ? -1 : 1;
            cgst += sign * d.totals.cgst; sgst += sign * d.totals.sgst; igst += sign * d.totals.igst; taxable += sign * d.totals.taxableValue;
            for (var j = 0; j < d.lines.length; j++) {
                var l = d.lines[j]; var r = l.taxRate || 0;
                var b = byRate[r] || (byRate[r] = { rate: r, taxable: 0, tax: 0 });
                b.taxable += sign * l.taxableValue; b.tax += sign * l.taxTotal;
            }
        }
        return {
            taxableValue: C.round2(taxable), cgst: C.round2(cgst), sgst: C.round2(sgst), igst: C.round2(igst),
            taxTotal: C.round2(cgst + sgst + igst),
            byRate: Object.keys(byRate).map(function (k) { byRate[k].taxable = C.round2(byRate[k].taxable); byRate[k].tax = C.round2(byRate[k].tax); return byRate[k]; })
        };
    }

    // ── Cash / bank register (money in & out by tender) ──────────
    // Inflows: recorded invoice payments (receipts). Outflows: supplier-bill
    // payments + captured expenses. Grouped by tender method with a period net.
    function cashBankRegister(from, to) {
        var inflows = [], outflows = [], byMethod = {};
        function inRange(iso) { var dt = new Date(iso); return (!from || dt >= new Date(from)) && (!to || dt <= new Date(to)); }
        function bump(m, amt, dir) {
            var b = byMethod[m] || (byMethod[m] = { in: 0, out: 0 });
            b[dir] = C.round2(b[dir] + amt);
        }
        var invoices = listDocs('invoice');
        for (var i = 0; i < invoices.length; i++) {
            var ps = invoices[i].payments || [];
            for (var j = 0; j < ps.length; j++) {
                if (!inRange(ps[j].ts)) continue;
                var m = ps[j].method || 'cash';
                inflows.push({ date: ps[j].ts, method: m, amount: ps[j].amount, ref: invoices[i].number, txnId: ps[j].txnId });
                bump(m, ps[j].amount, 'in');
            }
        }
        var bills = listDocs('supplier_bill');
        for (var b1 = 0; b1 < bills.length; b1++) {
            var sp = bills[b1].payments || [];
            for (var b2 = 0; b2 < sp.length; b2++) {
                if (!inRange(sp[b2].ts)) continue;
                outflows.push({ date: sp[b2].ts, method: sp[b2].method || 'bank', amount: sp[b2].amount, ref: bills[b1].number });
                bump(sp[b2].method || 'bank', sp[b2].amount, 'out');
            }
        }
        if (E.CRM && E.CRM.listExpenses) {
            var exps = E.CRM.listExpenses();
            for (var e = 0; e < exps.length; e++) {
                if (!inRange(exps[e].date)) continue;
                outflows.push({ date: exps[e].date, method: exps[e].category, amount: exps[e].amount, ref: exps[e].vendor || 'expense' });
                bump(exps[e].category, exps[e].amount, 'out');
            }
        }
        inflows.sort(function (a, c) { return new Date(a.date) - new Date(c.date); });
        outflows.sort(function (a, c) { return new Date(a.date) - new Date(c.date); });
        var totalIn = C.round2(C.sum(inflows, function (x) { return x.amount; }));
        var totalOut = C.round2(C.sum(outflows, function (x) { return x.amount; }));
        return { inflows: inflows, outflows: outflows, byMethod: byMethod, totalIn: totalIn, totalOut: totalOut, net: C.round2(totalIn - totalOut) };
    }

    // Price lines through an optional CRM price list / customer deal price.
    // Purely additive — callers that already pass explicit unitPrice win.
    function pricedLines(customerId, lines) {
        if (!E.CRM || !E.CRM.priceFor || !customerId) return lines;
        return (lines || []).map(function (l) {
            var p = E.CRM.priceFor(customerId, l.item, l.qty);
            if (p != null) { var c = Object.assign({}, l); if (l.unitPrice == null) c.unitPrice = p; c.listPrice = p; return c; }
            return l;
        });
    }

    E.Documents = {
        computeTotals: computeTotals,
        createDocument: createDocument, getDoc: getDoc, listDocs: listDocs,
        finalize: finalize, cancel: cancel, issueCreditNote: issueCreditNote, issueDebitNote: issueDebitNote,
        convertQuotationToOrder: convertQuotationToOrder, createInvoiceFromOrder: createInvoiceFromOrder,
        recordPayment: recordPayment, receivePurchase: receivePurchase, computeLandedCost: computeLandedCost,
        customerOutstanding: customerOutstanding, creditedAmount: creditedAmount, debitedAmount: debitedAmount,
        taxSummary: taxSummary, cashBankRegister: cashBankRegister, pricedLines: pricedLines
    };

})(window.GurukripaERP);
