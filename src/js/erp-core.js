'use strict';
// ══════════════════════════════════════════════════════════════════
// Gurukripa ERP — CORE (foundation layer, dependency-free)
// ══════════════════════════════════════════════════════════════════
// Local-first business engine that runs entirely in the browser on the
// existing static/PWA architecture. There is NO backend or database in
// this project, so "persistence" is the hardened localStorage adapter
// already used across the site (getSafeStorage / setSafeStorage).
//
// HONESTY NOTES (do not misrepresent these elsewhere):
//   • Sequencing / oversell guards are atomic WITHIN a single browser tab
//     (synchronous read-modify-write). They are NOT multi-device /
//     multi-user safe — that requires a server + real DB transactions.
//   • The RBAC matrix below is a CLIENT-SIDE convenience gate only. It is
//     not authoritative; a real deployment MUST enforce the same actions
//     on the backend. Never treat `can()` as a security boundary.
//   • Nothing here contacts a payment gateway or verifies a payment
//     signature. Recording a payment is an explicit, auditable ledger
//     entry — never an automatic "mark paid from a frontend response".
//
// Everything exposed lives under window.GurukripaERP (see sibling files
// erp-inventory.js, erp-documents.js, erp-crm.js, erp-analytics.js).
// ══════════════════════════════════════════════════════════════════

window.GurukripaERP = window.GurukripaERP || {};

(function(E) {

    // ── Storage adapter ──────────────────────────────────────────
    // Prefer the site's hardened helpers; fall back to an in-memory Map
    // so the engine is load-order independent and unit-testable without
    // a DOM/localStorage global.
    var _mem = Object.create(null);
    function read(key, fallback) {
        if (typeof getSafeStorage === 'function') {
            try { return getSafeStorage(key, fallback); }
            catch (e) { /* fall through to memory */ }
        }
        var v = _mem[key];
        return (v === undefined) ? fallback : JSON.parse(JSON.stringify(v));
    }
    function write(key, value) {
        _mem[key] = JSON.parse(JSON.stringify(value));
        if (typeof setSafeStorage === 'function') {
            try { setSafeStorage(key, value); } catch (e) { /* memory already set */ }
        }
    }
    var P = function(k) { return 'gb_erp_' + k; };

    // ── Money / number helpers ───────────────────────────────────
    function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
    function sum(list, f) {
        var acc = 0;
        for (var i = 0; i < list.length; i++) acc += (f ? Number(f(list[i], i)) : Number(list[i])) || 0;
        return acc;
    }
    function pad(n, width) {
        var s = String(Math.abs(n));
        while (s.length < (width || 4)) s = '0' + s;
        return s;
    }
    function uid(prefix) {
        return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    // ── Indian financial year (April → March) ────────────────────
    function finYear(dateLike) {
        var d = dateLike ? new Date(dateLike) : new Date();
        var y = d.getFullYear();
        var m = d.getMonth(); // 0-11
        var start = m >= 3 ? y : y - 1;   // Apr(3)..Mar(2)
        var end = (start + 1) % 100;
        return start + '-' + pad(end, 2);
    }

    // ── Sequential document numbering ────────────────────────────
    // Monotonic per document type, resettable per financial year. Kept in
    // a versioned record so concurrent async callers cannot reuse a number
    // inside this tab. Formats as <PREFIX>/<FY>/<SERIAL>.
    var DOC_TYPE_PREFIX = {
        quotation:    'QTN',
        sales_order:  'SO',
        invoice:      'INV',
        credit_note:  'CRN',
        debit_note:   'DBN',
        receipt:      'RCP',
        challan:      'CHL',
        purchase_order:'PO',
        supplier_bill:'PBIL'
    };
    function seqKey(type, resetScope) {
        return P('seq_' + type + (resetScope ? '_' + resetScope : ''));
    }
    function _peek(type, resetScope) {
        return read(seqKey(type, resetScope), { n: 0 });
    }
    function nextNumber(type, opts) {
        opts = opts || {};
        var prefix = opts.prefix || DOC_TYPE_PREFIX[type] || (type ? String(type).slice(0, 3).toUpperCase() : 'DOC');
        var scope = opts.resetByFinYear === false ? null : finYear(opts.date);
        var rec = _peek(type, scope);
        rec.n = (Number(rec.n) || 0) + 1;
        write(seqKey(type, scope), rec);
        var parts = [prefix];
        if (scope) parts.push(scope);
        parts.push(pad(rec.n, opts.serialWidth || 4));
        return parts.join('/');
    }
    function peekNumber(type, opts) {
        opts = opts || {};
        var prefix = opts.prefix || DOC_TYPE_PREFIX[type] || (type ? String(type).slice(0, 3).toUpperCase() : 'DOC');
        var scope = opts.resetByFinYear === false ? null : finYear(opts.date);
        var rec = _peek(type, scope);
        return { prefix: prefix, finYear: scope, next: (Number(rec.n) || 0) + 1 };
    }

    // ── Append-only audit log ────────────────────────────────────
    var AUDIT_CAP = 5000;
    var _actor = null;
    function setActor(u) { _actor = u || null; }
    function currentActor() {
        if (_actor) return _actor;
        var su = read('gb_user', null);
        return su || null;
    }
    function logAudit(action, entity, entityId, data) {
        data = data || {};
        var actor = currentActor();
        var entry = {
            id: uid('aud'),
            ts: new Date().toISOString(),
            user: actor ? (actor.name || actor.email || actor.phone || 'unknown') : 'anonymous',
            role: actor ? (actor.role || 'customer') : 'anonymous',
            action: action,
            entity: entity,
            entityId: entityId,
            before: data.before,
            after: data.after,
            note: data.note
        };
        var log = read(P('audit'), []);
        log.push(entry);
        if (log.length > AUDIT_CAP) log = log.slice(log.length - AUDIT_CAP);
        write(P('audit'), log);
        return entry;
    }
    function getAudit(filter) {
        var log = read(P('audit'), []);
        if (!filter) return log.slice();
        return log.filter(function(e) {
            if (filter.entity && e.entity !== filter.entity) return false;
            if (filter.entityId && e.entityId !== filter.entityId) return false;
            if (filter.action && e.action !== filter.action) return false;
            return true;
        });
    }

    // ── RBAC (client-side gate; NOT a security boundary) ─────────
    var ROLES = ['owner', 'admin', 'accountant', 'sales_manager', 'sales',
                 'inventory', 'warehouse', 'delivery', 'driver', 'customer'];
    var PERMISSIONS = {
        'report.view':            ['owner', 'admin', 'accountant', 'sales_manager'],
        'audit.view':             ['owner', 'admin'],
        'customer.manage':        ['owner', 'admin', 'sales_manager', 'sales'],
        'supplier.manage':        ['owner', 'admin', 'accountant'],
        'quotation.create':       ['owner', 'admin', 'sales_manager', 'sales'],
        'invoice.create':         ['owner', 'admin', 'accountant', 'sales_manager'],
        'invoice.finalize':       ['owner', 'admin', 'accountant'],
        'invoice.cancel':         ['owner', 'admin'],
        'creditnote.issue':       ['owner', 'admin', 'accountant'],
        'payment.record':         ['owner', 'admin', 'accountant'],
        'payment.refund.approve': ['owner', 'admin'],
        'discount.override':      ['owner', 'admin', 'sales_manager'],
        'credit.sale.approve':    ['owner', 'admin'],
        'stock.receive':          ['owner', 'admin', 'inventory', 'warehouse'],
        'stock.dispatch':         ['owner', 'admin', 'inventory', 'warehouse', 'delivery'],
        'stock.adjust':           ['owner', 'admin', 'inventory'],
        'po.create':              ['owner', 'admin', 'inventory'],
        'expense.create':         ['owner', 'admin', 'accountant']
    };
    function roleOf(actor) {
        if (!actor) return 'anonymous';
        if (typeof actor === 'string') return actor;
        return actor.role || 'customer';
    }
    function can(actor, action) {
        var roles = PERMISSIONS[action];
        if (!roles) return false;
        return roles.indexOf(roleOf(actor)) !== -1;
    }
    function assertCan(actor, action) {
        if (!can(actor, action)) {
            var err = new Error('Forbidden: role "' + roleOf(actor) + '" cannot perform "' + action + '"');
            err.code = 'FORBIDDEN';
            throw err;
        }
        return true;
    }
    function allowedActions(actor) {
        var out = [];
        for (var a in PERMISSIONS) { if (can(actor, a)) out.push(a); }
        return out;
    }

    // ── Unit conversions (brick trade) ───────────────────────────
    // Base unit is a single piece. Factors are configurable so business
    // rules (pallet size, trolley load) live in one place, not scattered.
    var UNITS = {
        piece:    1,
        hundred:  100,
        thousand: 1000,
        trolley:  4000,   // matches product data "per trolley of 4,000 bricks"
        pallet:   1000
    };
    function configureUnits(map) {
        if (map && typeof map === 'object') {
            for (var k in map) { if (typeof map[k] === 'number') UNITS[k] = map[k]; }
        }
        return clone(UNITS);
    }
    function unitFactor(unit) {
        var f = UNITS[unit || 'piece'];
        return (typeof f === 'number') ? f : null;
    }
    function toBase(qty, unit) {
        var f = unitFactor(unit);
        if (f === null) throw new Error('Unknown unit: ' + unit);
        return round2((Number(qty) || 0) * f);
    }
    function fromBase(baseQty, unit) {
        var f = unitFactor(unit);
        if (f === null) throw new Error('Unknown unit: ' + unit);
        return round2((Number(baseQty) || 0) / f);
    }

    // ── Misc ─────────────────────────────────────────────────────
    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    function todayISO() { return new Date().toISOString().slice(0, 10); }

    // ── Idempotency ledger (safe offline/retried operations) ─────
    // markOnce(key) returns true the first time and false on every replay,
    // so retried payments / stock movements / delivery events cannot be
    // applied twice. The stored value records the outcome reference so a
    // replay can return the original result instead of re-executing.
    function markOnce(key, resultRef) {
        if (!key) return { applied: true, replayed: false };  // no key → allow
        var ledger = read(P('idem'), {});
        if (Object.prototype.hasOwnProperty.call(ledger, key)) {
            return { applied: false, replayed: true, result: ledger[key] };
        }
        ledger[key] = { at: new Date().toISOString(), result: resultRef === undefined ? true : resultRef };
        write(P('idem'), ledger);
        return { applied: true, replayed: false, result: resultRef };
    }
    function seenKey(key) {
        var ledger = read(P('idem'), {});
        return Object.prototype.hasOwnProperty.call(ledger, key);
    }

    // ── Approval limits (financial governance) ───────────────────
    // Roles may self-approve up to a limit; beyond it a higher role is
    // required. CLIENT-SIDE GATE ONLY — a backend must enforce identically.
    var APPROVAL_LIMITS = {
        refund:            { owner: Infinity, admin: 100000, accountant: 25000 },
        discount_override: { owner: Infinity, admin: 50000, sales_manager: 10000 },
        credit_sale:       { owner: Infinity, admin: 200000, sales_manager: 50000 },
        stock_adjust:      { owner: Infinity, admin: 100000, inventory: 20000 }
    };
    function setApprovalLimits(map) { if (map) APPROVAL_LIMITS = map; return APPROVAL_LIMITS; }
    function needsApproval(kind, amount, actor) {
        var rule = APPROVAL_LIMITS[kind];
        if (!rule) return { required: false, reason: 'no_rule' };
        var role = roleOf(actor);
        var limit = rule[role];
        if (limit === undefined) return { required: true, reason: 'role_not_authorized', authorizedRoles: Object.keys(rule) };
        var amt = Number(amount) || 0;
        return amt > limit
            ? { required: true, reason: 'over_limit', limit: limit, amount: amt, authorizedRoles: Object.keys(rule) }
            : { required: false, limit: limit, amount: amt };
    }
    function assertApproval(kind, amount, actor) {
        var r = needsApproval(kind, amount, actor);
        if (r.required) { var e = new Error('Approval required for "' + kind + '" (' + r.reason + ')'); e.code = 'APPROVAL_REQUIRED'; e.detail = r; throw e; }
        return true;
    }

    // ── Document / record version trail (audit + versioning) ─────
    function recordVersion(entity, entityId, snapshot, note) {
        var key = P('versions_' + entity);
        var list = read(key, []);
        var v = {
            version: list.length + 1,
            ts: new Date().toISOString(),
            user: (currentActor() || {}).name || 'system',
            role: (currentActor() || {}).role || 'anonymous',
            entityId: entityId, note: note || '',
            snapshot: snapshot
        };
        list.push(v);
        write(key, list);
        return v;
    }
    function getVersions(entity, entityId) {
        var list = read(P('versions_' + entity), []);
        return entityId == null ? list : list.filter(function (v) { return String(v.entityId) === String(entityId); });
    }

    E.Core = {
        read: read, write: write, key: P,
        round2: round2, sum: sum, pad: pad, uid: uid, clone: clone,
        finYear: finYear, todayISO: todayISO,
        nextNumber: nextNumber, peekNumber: peekNumber, DOC_TYPE_PREFIX: DOC_TYPE_PREFIX,
        setActor: setActor, currentActor: currentActor, logAudit: logAudit, getAudit: getAudit,
        ROLES: ROLES, PERMISSIONS: PERMISSIONS, can: can, assertCan: assertCan,
        allowedActions: allowedActions, roleOf: roleOf,
        UNITS: UNITS, configureUnits: configureUnits, unitFactor: unitFactor,
        toBase: toBase, fromBase: fromBase,
        markOnce: markOnce, seenKey: seenKey,
        APPROVAL_LIMITS: APPROVAL_LIMITS, setApprovalLimits: setApprovalLimits,
        needsApproval: needsApproval, assertApproval: assertApproval,
        recordVersion: recordVersion, getVersions: getVersions
    };

})(window.GurukripaERP);
