'use strict';
// ══════════════════════════════════════════════════════════════════
// Gurukripa ERP — ANALYTICS (dashboards & exports from REAL records)
// ══════════════════════════════════════════════════════════════════
// Every figure is aggregated from finalized documents / stock ledger /
// CRM records at call time. When the underlying data does not exist the
// result is zero / available:false with a reason — the dashboard NEVER
// substitutes static or placeholder numbers. Gross/net profit are only
// reported when cost and expense data are actually present.
// ══════════════════════════════════════════════════════════════════

window.GurukripaERP = window.GurukripaERP || {};

(function(E) {
    var C = E.Core;

    function _docs(type) { return E.Documents ? E.Documents.listDocs(type) : []; }

    // Invoices that count as sales (finalized/paid/partial, not cancelled/draft)
    function _salesInvoices() {
        return _docs('invoice').filter(function(d) {
            return d.status === 'finalized' || d.status === 'paid' || d.status === 'partially_paid';
        });
    }
    // Period boundaries (local). unit: 'day'|'week'|'month'|'year'
    function periodRange(unit, anchor) {
        var d = anchor ? new Date(anchor) : new Date();
        var to, from;
        if (unit === 'day') {
            from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
            to = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        } else if (unit === 'week') {
            from = new Date(d); from.setHours(0, 0, 0, 0); from.setDate(d.getDate() - 6);
            to = new Date(d); to.setHours(23, 59, 59, 999);
        } else if (unit === 'month') {
            from = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
            to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (unit === 'year') {
            from = new Date(d.getFullYear(), 0, 1, 0, 0, 0);
            to = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else {
            from = new Date(0); to = new Date(8640000000000000);
        }
        return { from: from, to: to };
    }
    function previousRange(unit, range) {
        var spanMs = range.to.getTime() - range.from.getTime() + 1000;
        var prevTo = new Date(range.from.getTime() - 1);
        var prevFrom = new Date(prevTo.getTime() - spanMs + 1000);
        return { from: prevFrom, to: prevTo };
    }

    function _sumBetween(invoices, from, to) {
        var sales = 0, count = 0, collected = 0, outstanding = 0, overdue = 0;
        var now = new Date();
        for (var i = 0; i < invoices.length; i++) {
            var d = invoices[i];
            var dt = new Date(d.date);
            if (dt < from || dt > to) continue;
            sales += d.totals.grandTotal; count++;
            collected += (d.paidTotal || 0);
            var bal = d.balance != null ? d.balance : C.round2(d.totals.grandTotal - (d.paidTotal || 0));
            if (bal > 0) {
                outstanding += bal;
                if (d.dueDate && new Date(d.dueDate) < now) overdue += bal;
            }
        }
        return { sales: C.round2(sales), count: count, collected: C.round2(collected), outstanding: C.round2(outstanding), overdue: C.round2(overdue) };
    }

    function _pctChange(curr, prev) {
        if (!prev) return curr > 0 ? 100 : 0;
        return C.round2(((curr - prev) / prev) * 100);
    }

    function kpi(rangeUnit) {
        rangeUnit = rangeUnit || 'month';
        var inv = _salesInvoices();
        var cur = periodRange(rangeUnit);
        var prev = previousRange(rangeUnit, cur);
        var c = _sumBetween(inv, cur.from, cur.to);
        var p = _sumBetween(inv, prev.from, prev.to);
        var today = _sumBetween(inv, periodRange('day').from, periodRange('day').to);
        var week = _sumBetween(inv, periodRange('week').from, periodRange('week').to);
        var year = _sumBetween(inv, periodRange('year').from, periodRange('year').to);
        var allOut = _sumBetween(inv, new Date(0), new Date(8640000000000000));
        var aov = c.count ? C.round2(c.sales / c.count) : 0;
        return {
            range: rangeUnit,
            sales: { today: today.sales, week: week.sales, month: c.sales, year: year.sales, period: c.sales, prevPeriod: p.sales, changePct: _pctChange(c.sales, p.sales) },
            orders: { count: c.count, prevCount: p.count, changePct: _pctChange(c.count, p.count), aov: aov },
            receivables: { collected: c.collected, outstanding: allOut.outstanding, overdue: allOut.overdue },
            hasData: inv.length > 0
        };
    }

    function statusDistribution() {
        var inv = _docs('invoice');
        var dist = {};
        for (var i = 0; i < inv.length; i++) {
            var s = inv[i].status;
            dist[s] = (dist[s] || 0) + 1;
        }
        return dist;
    }

    function topProducts(limit) {
        var inv = _salesInvoices();
        var byItem = {};
        for (var i = 0; i < inv.length; i++) {
            var lines = inv[i].lines || [];
            for (var j = 0; j < lines.length; j++) {
                var l = lines[j];
                var key = String(l.item || l.name);
                var b = byItem[key] || (byItem[key] = { item: l.item, name: l.name, qty: 0, amount: 0 });
                b.qty += (l.qty || 0);
                b.amount += (l.taxableValue != null ? l.taxableValue : (l.qty * l.unitPrice));
            }
        }
        return Object.keys(byItem).map(function(k) { return byItem[k]; })
            .sort(function(a, b) { return b.amount - a.amount; })
            .slice(0, limit || 10)
            .map(function(x) { x.amount = C.round2(x.amount); return x; });
    }

    function topCustomers(limit) {
        var inv = _salesInvoices();
        var byCust = {};
        for (var i = 0; i < inv.length; i++) {
            var d = inv[i];
            if (!d.customerId) continue;
            var b = byCust[d.customerId] || (byCust[d.customerId] = { customer: d.customerId, orders: 0, amount: 0 });
            b.orders++; b.amount += d.totals.grandTotal;
        }
        var out = Object.keys(byCust).map(function(k) { byCust[k].amount = C.round2(byCust[k].amount); return byCust[k]; });
        out.sort(function(a, b) { return b.amount - a.amount; });
        return out.slice(0, limit || 10);
    }

    function _itemCategory(itemId) {
        if (!E.Inventory) return 'uncategorized';
        var it = E.Inventory.getItem(itemId);
        return it ? it.category : 'uncategorized';
    }
    function _custSegment(custId) {
        if (!E.CRM) return 'unknown';
        var cu = E.CRM.getCustomer(custId);
        return cu ? (cu.segment || 'unknown') : 'unknown';
    }
    function salesByCategory() {
        var inv = _salesInvoices(); var by = {};
        for (var i = 0; i < inv.length; i++) for (var j = 0; j < (inv[i].lines || []).length; j++) {
            var l = inv[i].lines[j]; var cat = _itemCategory(l.item);
            by[cat] = C.round2((by[cat] || 0) + (l.taxableValue != null ? l.taxableValue : l.qty * l.unitPrice));
        }
        return by;
    }
    function salesBySegment() {
        var inv = _salesInvoices(); var by = {};
        for (var i = 0; i < inv.length; i++) { var seg = _custSegment(inv[i].customerId); by[seg] = C.round2((by[seg] || 0) + inv[i].totals.grandTotal); }
        return by;
    }

    function lowStock() { return E.Inventory ? E.Inventory.lowStock() : []; }
    function pendingPurchaseOrders() {
        return _docs('purchase_order').filter(function(d) { return d.status === 'finalized'; });
    }
    function pendingDeliveries() {
        return _docs('challan').filter(function(d) { return d.status !== 'cancelled' && d.status !== 'delivered'; });
    }
    function deliveryPerformance() {
        var ch = _docs('challan');
        var total = ch.length, delivered = 0;
        for (var i = 0; i < ch.length; i++) if (ch[i].status === 'delivered') delivered++;
        return { total: total, delivered: delivered, pending: total - delivered, rate: total ? C.round2(delivered / total * 100) : 0 };
    }

    // Gross profit only when cost data exists on sold lines; net only when
    // expenses exist. Never fabricate.
    function grossProfit(range) {
        var inv = _salesInvoices();
        range = range || periodRange('year');
        var revenue = 0, cogs = 0, missingCost = 0, lines = 0;
        for (var i = 0; i < inv.length; i++) {
            var d = inv[i]; var dt = new Date(d.date);
            if (dt < range.from || dt > range.to) continue;
            revenue += d.totals.taxableValue;
            var ls = d.lines || [];
            for (var j = 0; j < ls.length; j++) {
                lines++;
                var l = ls[j];
                var it = E.Inventory ? E.Inventory.getItem(l.item) : null;
                var unitCost = it && it.hasCost ? it.unitCost : null;
                if (unitCost == null) { missingCost++; continue; }
                cogs += (l.qty || 0) * unitCost;
            }
        }
        if (lines === 0) return { available: false, reason: 'No sales records in range yet.', revenue: 0, cogs: 0, grossProfit: 0 };
        if (missingCost > 0 && cogs === 0) return { available: false, reason: 'Product cost data missing — cannot compute gross profit.', revenue: C.round2(revenue), cogs: 0, grossProfit: 0, linesMissingCost: missingCost };
        return {
            available: missingCost === 0, reason: missingCost ? (missingCost + ' line(s) had no cost data — figures are partial') : null,
            revenue: C.round2(revenue), cogs: C.round2(cogs), grossProfit: C.round2(revenue - cogs), linesMissingCost: missingCost
        };
    }
    function netProfit(range) {
        var gp = grossProfit(range);
        if (!gp.available && gp.cogs === 0) return { available: false, reason: gp.reason };
        var exp = E.CRM ? E.CRM.expenseSummary(range ? range.from : null, range ? range.to : null) : { hasData: false, total: 0 };
        if (!exp.hasData) return { available: false, reason: 'No expense records captured — net profit cannot be reported.', grossProfit: gp.grossProfit, expenses: 0, netProfit: null };
        return { available: true, grossProfit: gp.grossProfit, expenses: exp.total, netProfit: C.round2(gp.grossProfit - exp.total), revenue: gp.revenue, cogs: gp.cogs };
    }

    // Time series for charts. granularity: 'day'|'month'
    function series(granularity, from, to) {
        granularity = granularity || 'month';
        var inv = _salesInvoices();
        from = from ? new Date(from) : new Date(Math.min.apply(null, inv.map(function(d) { return new Date(d.date).getTime(); }).concat([Date.now()])));
        to = to ? new Date(to) : new Date();
        var buckets = {};
        var order = [];
        function key(d) {
            if (granularity === 'day') return d.getFullYear() + '-' + C.pad(d.getMonth() + 1, 2) + '-' + C.pad(d.getDate(), 2);
            return d.getFullYear() + '-' + C.pad(d.getMonth() + 1, 2);
        }
        for (var i = 0; i < inv.length; i++) {
            var d = inv[i]; var dt = new Date(d.date);
            if (dt < from || dt > to) continue;
            var k = key(dt);
            if (!(k in buckets)) { buckets[k] = { period: k, sales: 0, orders: 0 }; order.push(k); }
            buckets[k].sales = C.round2(buckets[k].sales + d.totals.grandTotal);
            buckets[k].orders++;
        }
        return order.sort().map(function(k) { return buckets[k]; });
    }

    // ── CSV export ───────────────────────────────────────────────
    function toCSV(rows, headers) {
        rows = rows || [];
        if (!rows.length) return (headers ? headers.join(',') : '') + '\n';
        var cols = headers || Object.keys(rows[0]);
        function esc(v) {
            if (v == null) return '';
            var s = String(v);
            if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
            return s;
        }
        var out = cols.join(',');
        for (var i = 0; i < rows.length; i++) {
            out += '\n' + cols.map(function(c) { return esc(rows[i][c]); }).join(',');
        }
        return out + '\n';
    }
    function exportInvoicesCSV() {
        var inv = _docs('invoice').map(function(d) {
            return { number: d.number, date: (d.date || '').slice(0, 10), customer: d.customerId || '', status: d.status, total: d.totals.grandTotal, paid: d.paidTotal || 0, balance: d.balance != null ? d.balance : C.round2(d.totals.grandTotal - (d.paidTotal || 0)) };
        });
        return toCSV(inv, ['number', 'date', 'customer', 'status', 'total', 'paid', 'balance']);
    }
    function exportSalesCSV() {
        return toCSV(series('month'), ['period', 'sales', 'orders']);
    }
    function exportAgingCSV() {
        var ag = E.CRM ? E.CRM.aging() : { rows: [] };
        return toCSV(ag.rows, ['number', 'customer', 'date', 'dueDate', 'daysOverdue', 'balance', 'bucket']);
    }
    // Browser download (guarded; no-op outside a DOM environment)
    function download(filename, csv) {
        if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return null;
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        return true;
    }

    E.Analytics = {
        periodRange: periodRange, previousRange: previousRange,
        kpi: kpi, statusDistribution: statusDistribution,
        topProducts: topProducts, topCustomers: topCustomers, salesByCategory: salesByCategory, salesBySegment: salesBySegment,
        lowStock: lowStock, pendingPurchaseOrders: pendingPurchaseOrders, pendingDeliveries: pendingDeliveries, deliveryPerformance: deliveryPerformance,
        grossProfit: grossProfit, netProfit: netProfit, series: series,
        toCSV: toCSV, exportInvoicesCSV: exportInvoicesCSV, exportSalesCSV: exportSalesCSV, exportAgingCSV: exportAgingCSV, download: download
    };

})(window.GurukripaERP);
