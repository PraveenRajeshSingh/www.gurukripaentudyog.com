'use strict';
// ══════════════════════════════════════════════════════════════════
// Gurukripa ERP — NOTIFY (configurable rules -> idempotent alerts)
// ══════════════════════════════════════════════════════════════════
// A rules engine that reads REAL records (inventory, documents, CRM,
// logistics) and emits pending alerts. It never fabricates a trigger.
//
// IDEMPOTENCY: every alert carries a stable key (rule + entity + period
// bucket) passed through Core.markOnce, so re-running the same evaluation
// — or a retried background job — CANNOT produce duplicate messages.
//
// HONESTY NOTE: this static project has no SMTP / push / SMS / queue worker.
// Alerts are recorded as `pending` with channel `backend_required`; actual
// delivery + scheduling of background jobs is a backend contract (see
// docs/ERP-ARCHITECTURE.md). Nothing is "sent" here.
// ══════════════════════════════════════════════════════════════════

window.GurukripaERP = window.GurukripaERP || {};

(function(E) {
    var C = E.Core;
    var ALERTS = C.key('alerts');

    // Tunable thresholds (operators override via configure()).
    var CONFIG = {
        overdue_grace_days: 0,
        quotation_followup_days: 3,
        delivery_delay_days: 1,
        maintenance_lead_days: 7,
        daily_bucket: true    // at most one alert per entity per day per rule
    };
    function configure(patch) {
        if (patch) Object.assign(CONFIG, patch);
        return C.clone(CONFIG);
    }

    function _readAlerts() { return C.read(ALERTS, []); }
    function _writeAlerts(l) { C.write(ALERTS, l); }

    function _bucket(ruleId, entityId) {
        // Period bucket: daily (one/day) unless disabled (then one-ever).
        var day = C.todayISO();
        return CONFIG.daily_bucket ? (ruleId + ':' + entityId + ':' + day) : (ruleId + ':' + entityId);
    }

    // Emit one alert if its idempotency key has not been seen this bucket.
    function _emit(rule, entityId, severity, title, message, context) {
        var key = _bucket(rule, entityId);
        if (C.seenKey('alert:' + key)) return null; // already raised this period
        var alert = {
            id: C.uid('al'), rule: rule, entityId: String(entityId),
            severity: severity || 'info', title: title, message: message,
            context: context || null, status: 'pending', channel: 'backend_required',
            key: key, createdAt: new Date().toISOString()
        };
        C.markOnce('alert:' + key, { id: alert.id });
        var list = _readAlerts(); list.push(alert); _writeAlerts(list);
        return alert;
    }

    // ── Rule: low stock ──────────────────────────────────────────
    function ruleLowStock() {
        if (!E.Inventory) return [];
        var out = [];
        E.Inventory.lowStock().forEach(function (s) {
            var id = s.item != null ? s.item : s.id;
            out.push(_emit('low_stock', id, 'warning',
                'Low stock: item ' + id,
                'On-hand ' + (s.onHand != null ? s.onHand : '?') + ' is at/below reorder level ' + (s.reorderLevel != null ? s.reorderLevel : '?'),
                { onHand: s.onHand, reorderLevel: s.reorderLevel, available: s.available }));
        });
        return out;
    }

    // ── Rule: reorder suggestion (pending PO already exists?) ────
    function ruleReorderSuggestion() {
        if (!E.Inventory || !E.Documents) return [];
        var openPoItems = {};
        E.Documents.listDocs('purchase_order').forEach(function (po) {
            if (po.status === 'draft' || po.status === 'finalized') {
                (po.lines || []).forEach(function (l) { openPoItems[String(l.item)] = true; });
            }
        });
        var out = [];
        E.Inventory.lowStock().forEach(function (s) {
            var id = s.item != null ? s.item : s.id;
            if (openPoItems[String(id)]) return; // already on order
            out.push(_emit('reorder_suggestion', id, 'info',
                'Reorder suggestion: item ' + id,
                'Below reorder level and no open purchase order — consider raising a PO',
                { onHand: s.onHand, reorderLevel: s.reorderLevel }));
        });
        return out;
    }

    // ── Rule: overdue invoices ───────────────────────────────────
    function ruleOverdue(asOf) {
        if (!E.Documents) return [];
        asOf = asOf ? new Date(asOf).getTime() : Date.now();
        var grace = (CONFIG.overdue_grace_days || 0) * 86400000;
        var out = [];
        E.Documents.listDocs('invoice').forEach(function (inv) {
            if (!(inv.balance > 0)) return;
            if (inv.status === 'cancelled' || inv.status === 'paid') return;
            if (!inv.dueDate) return;
            var due = new Date(inv.dueDate).getTime();
            if (due + grace >= asOf) return;
            var daysOver = Math.floor((asOf - due) / 86400000);
            out.push(_emit('overdue_invoice', inv.number, 'danger',
                'Overdue invoice ' + inv.number,
                'Balance ₹' + inv.balance + ' overdue by ' + daysOver + ' day(s)',
                { customerId: inv.customerId, balance: inv.balance, daysOverdue: daysOver }));
        });
        return out;
    }

    // ── Rule: quotation follow-up ────────────────────────────────
    function ruleQuotationFollowUp(asOf) {
        if (!E.Documents) return [];
        asOf = asOf ? new Date(asOf).getTime() : Date.now();
        var ageMs = (CONFIG.quotation_followup_days || 3) * 86400000;
        var out = [];
        E.Documents.listDocs('quotation').forEach(function (q) {
            if (q.status === 'converted' || q.status === 'cancelled' || q.status === 'lost') return;
            var created = new Date(q.date || q.createdAt).getTime();
            if (asOf - created < ageMs) return;
            out.push(_emit('quotation_followup', q.number, 'info',
                'Quotation follow-up ' + q.number,
                'Quotation open for ' + Math.floor((asOf - created) / 86400000) + ' day(s) — follow up for conversion',
                { customerId: q.customerId, total: q.totals && q.totals.grandTotal }));
        });
        return out;
    }

    // ── Rule: delivery delay (dispatched challans past schedule) ─
    function ruleDeliveryDelay(asOf) {
        if (!E.Logistics) return [];
        asOf = asOf ? new Date(asOf).getTime() : Date.now();
        var delayMs = (CONFIG.delivery_delay_days || 1) * 86400000;
        var out = [];
        E.Logistics.listChallans('dispatched').forEach(function (c) {
            var disp = c.dispatchedAt ? new Date(c.dispatchedAt).getTime() : new Date(c.date).getTime();
            if (asOf - disp < delayMs) return;
            out.push(_emit('delivery_delay', c.number, 'warning',
                'Delivery delay: challan ' + c.number,
                'Dispatched ' + Math.floor((asOf - disp) / 86400000) + ' day(s) ago and not yet delivered',
                { customerId: c.customerId, vehicleId: c.vehicleId }));
        });
        return out;
    }

    // ── Rule: vehicle maintenance due ────────────────────────────
    function ruleMaintenance(asOf) {
        if (!E.Logistics) return [];
        asOf = asOf ? new Date(asOf).getTime() : Date.now();
        var lead = (CONFIG.maintenance_lead_days || 7) * 86400000;
        var out = [];
        E.Logistics.dueMaintenance(new Date(asOf + lead).toISOString()).forEach(function (m) {
            out.push(_emit('maintenance_due', m.vehicleId, 'warning',
                'Vehicle maintenance due: ' + m.vehicleId,
                (m.type || 'service') + ' scheduled' + (m.dueDate ? ' by ' + m.dueDate : ''),
                { maintenanceId: m.id, dueDate: m.dueDate }));
        });
        return out;
    }

    var RULES = {
        low_stock: ruleLowStock,
        reorder_suggestion: ruleReorderSuggestion,
        overdue_invoice: ruleOverdue,
        quotation_followup: ruleQuotationFollowUp,
        delivery_delay: ruleDeliveryDelay,
        maintenance_due: ruleMaintenance
    };

    // Evaluate one or all rules; returns only NEWLY created alerts.
    function evaluate(ruleId, asOf) {
        var created = [];
        var names = ruleId ? [ruleId] : Object.keys(RULES);
        names.forEach(function (n) {
            var fn = RULES[n];
            if (!fn) return;
            try {
                var res = fn(asOf) || [];
                res.forEach(function (a) { if (a) created.push(a); });
            } catch (e) { /* a rule must not break the others */ }
        });
        if (created.length) C.logAudit('notify.evaluate', 'alerts', ruleId || 'all', { count: created.length });
        return created;
    }

    function listAlerts(filter) {
        var l = _readAlerts();
        if (!filter) return l.slice();
        return l.filter(function (a) {
            if (filter.status && a.status !== filter.status) return false;
            if (filter.rule && a.rule !== filter.rule) return false;
            if (filter.severity && a.severity !== filter.severity) return false;
            return true;
        });
    }
    function acknowledge(alertId, opts) {
        opts = opts || {};
        var l = _readAlerts();
        for (var i = 0; i < l.length; i++) {
            if (String(l[i].id) === String(alertId)) {
                l[i].status = 'acknowledged';
                l[i].acknowledgedAt = new Date().toISOString();
                l[i].acknowledgedBy = opts.by || ((C.currentActor() || {}).name || 'system');
                _writeAlerts(l);
                C.logAudit('notify.acknowledge', 'alert', l[i].key, { after: l[i] });
                return l[i];
            }
        }
        return null;
    }
    function pendingCount() {
        return _readAlerts().filter(function (a) { return a.status === 'pending'; }).length;
    }

    E.Notify = {
        CONFIG: CONFIG, configure: configure, RULES: RULES,
        evaluate: evaluate, listAlerts: listAlerts, acknowledge: acknowledge, pendingCount: pendingCount
    };

})(window.GurukripaERP);
