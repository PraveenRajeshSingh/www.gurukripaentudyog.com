'use strict';
// ══════════════════════════════════════════════════════════════════
// Gurukripa ERP — INVENTORY (ledger-based stock)
// ══════════════════════════════════════════════════════════════════
// Source of truth is an immutable stock MOVEMENT ledger. On-hand and
// available balances are derived by folding the ledger, never stored as a
// mutable number — this is the same pattern a real ERP uses so balances
// always reconcile to the movements that produced them.
//
// Oversell prevention: a reducing movement (dispatch/adjust-down/transfer
// out/damage) recomputes availability synchronously and is rejected if it
// would go negative. Atomic within one tab (see erp-core.js honesty note).
// All quantities are normalised to the base unit (piece) via Core.toBase.
// ══════════════════════════════════════════════════════════════════

window.GurukripaERP = window.GurukripaERP || {};

(function(E) {
    var C = E.Core;

    var ITEMS = C.key('items');
    var WH    = C.key('warehouses');
    var LED   = C.key('ledger');

    // movement types that add / remove stock from a warehouse
    var PLUS  = { receipt: 1, return: 1, transfer_in: 1, release: 1 };
    var MINUS = { dispatch: 1, damage: 1, transfer_out: 1 };
    // reservations do not change on-hand but reduce "available"
    var RESERVE = { reserve: 1 };
    var UNRESERVE = { release: 1 };

    // ── Warehouses ───────────────────────────────────────────────
    function ensureWarehouse(id, name) {
        var list = C.read(WH, []);
        var found = list.filter(function(w) { return w.id === id; })[0];
        if (!found) {
            found = { id: id, name: name || id, createdAt: new Date().toISOString() };
            list.push(found);
            C.write(WH, list);
        }
        return found;
    }
    function listWarehouses() {
        var list = C.read(WH, []);
        if (!list.length) { ensureWarehouse('main', 'Jaunpur Yard — Main'); list = C.read(WH, []); }
        return list.slice();
    }

    // ── Items (SKUs) ─────────────────────────────────────────────
    function listItems() { return C.read(ITEMS, []).slice(); }
    function getItem(id) {
        return C.read(ITEMS, []).filter(function(i) { return String(i.id) === String(id); })[0] || null;
    }
    function upsertItem(item) {
        if (!item || !item.id) throw new Error('Item requires an id');
        var list = C.read(ITEMS, []);
        var idx = -1;
        for (var i = 0; i < list.length; i++) { if (String(list[i].id) === String(item.id)) { idx = i; break; } }
        var base = {
            id: item.id,
            sku: item.sku || ('SKU-' + C.pad(item.id, 4)),
            name: item.name || '',
            category: item.category || 'general',
            hsn: item.hsn || '69041000',       // bricks default HSN-SAC
            baseUnit: item.baseUnit || 'piece',
            sellingUnits: item.sellingUnits || ['piece', 'thousand', 'trolley'],
            unitPrice: C.round2(item.unitPrice != null ? item.unitPrice : (item.price || 0)),
            unitCost: C.round2(item.unitCost != null ? item.unitCost : (item.cost || 0)),
            reorderLevel: Number(item.reorderLevel || 0),
            hasCost: !!(item.hasCost || (Number(item.unitCost || item.cost || 0) > 0)),
            updatedAt: new Date().toISOString()
        };
        if (idx === -1) { base.createdAt = base.updatedAt; list.push(base); }
        else { list[idx] = Object.assign({}, list[idx], base); }
        C.write(ITEMS, list);
        C.logAudit('inventory.item.upsert', 'item', base.id, { after: base });
        return base;
    }

    // Seed item master from the storefront PRODUCTS catalogue without
    // overwriting cost/reorder data an operator may have already entered.
    function bootstrapFromProducts(products) {
        if (!Array.isArray(products)) return [];
        var created = [];
        for (var i = 0; i < products.length; i++) {
            var p = products[i];
            if (!p || p.id == null) continue;
            if (getItem(p.id)) continue; // never clobber existing master data
            created.push(upsertItem({
                id: p.id, name: p.name, category: p.category,
                unitPrice: p.price, baseUnit: 'piece', sellingUnits: ['piece', 'thousand', 'trolley']
            }));
        }
        return created;
    }

    // ── Ledger append (with oversell guard) ──────────────────────
    function _signed(type, qtyBase) {
        var q = Math.abs(C.round2(qtyBase));
        if (MINUS[type]) return -q;
        if (PLUS[type]) return q;
        return q; // adjust stores its own signed qty via qtyBase sign
    }
    function appendMovement(mv) {
        // mv: { item, warehouse, bin?, batch?, quality?, type, qty, unit, ref, cost, note, signed, idem? }
        var item = getItem(mv.item);
        if (!item) throw new Error('Unknown item: ' + mv.item);
        if (!mv.warehouse) throw new Error('Movement requires a warehouse');
        // Idempotent replay guard: a retried movement with the same idem key
        // (e.g. offline dispatch resent) is applied only once and returns the
        // original movement row instead of re-executing.
        if (mv.idem && C.seenKey('mv:' + mv.idem)) {
            var prev = C.read(C.key('idem'), {})['mv:' + mv.idem];
            return prev ? prev.result : null;
        }
        var base = C.toBase(mv.qty != null ? mv.qty : mv.qtyBase, mv.unit || item.baseUnit);
        var signed = mv.type === 'adjust' ? C.round2(mv.signed != null ? mv.signed : base) : _signed(mv.type, base);

        if (signed < 0) {
            var avail = available(mv.item, mv.warehouse);
            if (Math.abs(signed) > avail + 1e-9) {
                var err = new Error('Insufficient stock for item ' + mv.item + ' at ' + mv.warehouse +
                    ' (available ' + avail + ', requested ' + Math.abs(signed) + ')');
                err.code = 'INSUFFICIENT_STOCK';
                throw err;
            }
        }
        ensureWarehouse(mv.warehouse);
        var ledger = C.read(LED, []);
        var row = {
            id: C.uid('mv'),
            ts: new Date().toISOString(),
            item: String(mv.item),
            warehouse: mv.warehouse,
            bin: mv.bin || null,               // storage location within the yard
            batch: mv.batch || null,           // kiln batch for quality traceability
            quality: mv.quality || null,       // e.g. 'grade-a', 'rejected', 'damaged'
            type: mv.type,
            qtyBase: signed,                 // always stored in base units, signed
            unit: mv.unit || item.baseUnit,
            qtyRequested: mv.qty,
            ref: mv.ref || null,             // document number / PO / challan
            idem: mv.idem || null,
            unitCost: mv.cost != null ? C.round2(mv.cost) : (item.hasCost ? item.unitCost : null),
            note: mv.note || '',
            user: (C.currentActor() || {}).name || 'system'
        };
        ledger.push(row);
        C.write(LED, ledger);
        C.logAudit('inventory.movement', 'item', String(mv.item), { after: row });
        if (mv.idem) C.markOnce('mv:' + mv.idem, row); // record outcome for future replays
        return row;
    }

    function ledgerFor(itemId) {
        return C.read(LED, []).filter(function(r) { return itemId == null || r.item === String(itemId); });
    }

    // ── Derived balances ─────────────────────────────────────────
    function onHand(itemId, warehouse) {
        var q = 0;
        var rows = C.read(LED, []);
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            if (r.item !== String(itemId)) continue;
            if (warehouse && r.warehouse !== warehouse) continue;
            if (PLUS[r.type] || r.type === 'adjust') q += r.qtyBase;
            else if (MINUS[r.type]) q += r.qtyBase; // qtyBase already signed negative
        }
        return C.round2(q);
    }
    function reserved(itemId, warehouse) {
        var q = 0;
        var rows = C.read(LED, []);
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            if (r.item !== String(itemId)) continue;
            if (warehouse && r.warehouse !== warehouse) continue;
            if (RESERVE[r.type]) q += Math.abs(r.qtyBase);
            else if (UNRESERVE[r.type]) q -= Math.abs(r.qtyBase);
        }
        return C.round2(Math.max(0, q));
    }
    function available(itemId, warehouse) {
        return C.round2(onHand(itemId, warehouse) - reserved(itemId, warehouse));
    }

    function allStock() {
        var items = listItems();
        var out = [];
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            var oh = onHand(it.id);
            var rv = reserved(it.id);
            out.push({
                item: it.id, name: it.name, sku: it.sku, category: it.category,
                onHand: oh, reserved: rv, available: C.round2(oh - rv),
                reorderLevel: it.reorderLevel,
                belowReorder: oh <= it.reorderLevel,
                unit: it.baseUnit
            });
        }
        return out;
    }
    function lowStock() {
        return allStock().filter(function(s) { return s.belowReorder; });
    }

    // Filter balances by storage bin and/or batch (quality traceability).
    function stockBy(itemId, filter) {
        filter = filter || {};
        var rows = C.read(LED, []);
        var q = 0;
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            if (r.item !== String(itemId)) continue;
            if (filter.warehouse && r.warehouse !== filter.warehouse) continue;
            if (filter.bin && r.bin !== filter.bin) continue;
            if (filter.batch && r.batch !== filter.batch) continue;
            if (filter.quality && r.quality !== filter.quality) continue;
            if (PLUS[r.type] || r.type === 'adjust' || MINUS[r.type]) q += r.qtyBase; // qtyBase signed
        }
        return C.round2(q);
    }

    // Physical count reconciliation: posts a signed adjustment to match the
    // counted quantity, with a uniquely-referenced movement (idempotent).
    function reconcile(itemId, warehouse, countedQty, opts) {
        opts = opts || {};
        C.assertCan(C.currentActor(), 'stock.adjust');
        var sys = onHand(itemId, warehouse);
        var diff = C.round2((Number(countedQty) || 0) - sys);
        if (diff === 0) return { adjusted: false, system: sys, counted: countedQty, diff: 0 };
        var idem = opts.idem || ('recon:' + itemId + ':' + warehouse + ':' + (opts.ref || Date.now()));
        var mv = appendMovement({ item: itemId, warehouse: warehouse, type: 'adjust', signed: diff, unit: 'piece', ref: opts.ref || 'RECON', idem: idem, note: opts.note || ('Reconciliation counted ' + countedQty) });
        C.logAudit('inventory.reconcile', 'item', String(itemId), { before: sys, after: countedQty, note: mv.id });
        return { adjusted: true, system: sys, counted: countedQty, diff: diff, movement: mv };
    }

    // ── High-level operations ────────────────────────────────────
    function receive(o)    { return appendMovement(Object.assign({ type: 'receipt' }, o)); }
    function dispatch(o)   { return appendMovement(Object.assign({ type: 'dispatch' }, o)); }
    function reserve(o)    { return appendMovement(Object.assign({ type: 'reserve' }, o)); }
    function release(o)    { return appendMovement(Object.assign({ type: 'release' }, o)); }
    function damage(o)     { return appendMovement(Object.assign({ type: 'damage' }, o)); }
    function adjust(o)     { return appendMovement(Object.assign({ type: 'adjust', signed: o.signed != null ? o.signed : C.toBase(o.qty, o.unit) }, o)); }
    function transfer(o)   {
        var base = C.toBase(o.qty, o.unit || 'piece');
        ensureWarehouse(o.to);
        var out = appendMovement({ item: o.item, warehouse: o.from, type: 'transfer_out', qty: base, unit: 'piece', ref: o.ref, note: o.note });
        var inn = appendMovement({ item: o.item, warehouse: o.to, type: 'transfer_in', qty: base, unit: 'piece', ref: o.ref, note: o.note });
        return { out: out, in: inn };
    }

    // ── Valuation (weighted-average cost) ────────────────────────
    // Clearly-defined costing method: running weighted average across all
    // receipt/return movements that carry a unit cost. Returns
    // { available:bool, reason, lines:[{item,name,qty,value}], total }.
    function valuation() {
        var rows = C.read(LED, []);
        var byItem = {};
        var hasAnyCost = false;
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            if (!(PLUS[r.type]) || r.unitCost == null) continue;
            hasAnyCost = true;
            var b = byItem[r.item] || (byItem[r.item] = { qty: 0, value: 0 });
            b.qty += r.qtyBase;
            b.value += r.qtyBase * r.unitCost;
        }
        var items = listItems();
        var lines = [];
        var total = 0;
        for (var j = 0; j < items.length; j++) {
            var it = items[j];
            var qty = onHand(it.id);
            var wac = byItem[it.id] && byItem[it.id].qty > 0 ? byItem[it.id].value / byItem[it.id].qty : (it.hasCost ? it.unitCost : null);
            if (wac == null) continue;
            var val = C.round2(qty * wac);
            lines.push({ item: it.id, name: it.name, qty: qty, unitCost: C.round2(wac), value: val });
            total += val;
        }
        if (!hasAnyCost && !lines.length) {
            return { available: false, reason: 'No purchase/cost records yet — stock valuation is unavailable until goods-received costs are entered.', lines: [], total: 0 };
        }
        return { available: true, method: 'weighted-average', reason: null, lines: lines, total: C.round2(total) };
    }

    E.Inventory = {
        listWarehouses: listWarehouses, ensureWarehouse: ensureWarehouse,
        listItems: listItems, getItem: getItem, upsertItem: upsertItem, bootstrapFromProducts: bootstrapFromProducts,
        appendMovement: appendMovement, ledgerFor: ledgerFor,
        onHand: onHand, reserved: reserved, available: available, allStock: allStock, lowStock: lowStock,
        stockBy: stockBy, reconcile: reconcile,
        receive: receive, dispatch: dispatch, reserve: reserve, release: release, damage: damage, adjust: adjust, transfer: transfer,
        valuation: valuation
    };

})(window.GurukripaERP);
