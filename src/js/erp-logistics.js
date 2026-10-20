'use strict';
// ══════════════════════════════════════════════════════════════════
// Gurukripa ERP — LOGISTICS (vehicles, capacity, challans, POD, delivery)
// ══════════════════════════════════════════════════════════════════
// Fleet & delivery workflow that reuses the tested local-first core:
//   • Vehicle master with payload (kg) + bed-volume (m³) capacity, kept in
//     sync with E.Calculators so load estimation honours PER-VEHICLE limits —
//     never one universal truck.
//   • Delivery challans link an order/invoice + customer + warehouse, consume
//     stock through the immutable inventory ledger, and are IDEMPOTENT by an
//     external reference so retried offline actions cannot double-dispatch.
//   • Proof of delivery, failed-delivery and return handling.
//   • Transport charge estimated through E.Calculators (zone / per-ton-km /
//     negotiated), and delivery-cost + vehicle-utilization reports.
//
// HONESTY NOTES:
//   • Capacity, route and transport figures are ESTIMATES. They MUST be
//     validated against real operating / legal constraints before committing.
//   • Live GPS tracking needs a device telemetry feed + a backend; none exists
//     in this static project, so GPS is an honest empty state — never fabricated.
//   • The challan is a delivery document; it is NOT a statutory GST supply
//     document. Tax invoices live in erp-documents.js.
// ══════════════════════════════════════════════════════════════════

window.GurukripaERP = window.GurukripaERP || {};

(function(E) {
    var C = E.Core;
    var VEHICLES = C.key('vehicles');
    var MAINT = C.key('maintenance');
    var CHALLANS = C.key('challans');

    function _readAll(key, def) { return C.read(key, def || []); }
    function _writeAll(key, list) { C.write(key, list); }
    function _find(list, id) {
        for (var i = 0; i < list.length; i++) { if (String(list[i].id) === String(id)) return list[i]; }
        return null;
    }
    function _replaceIn(key, rec) {
        var list = _readAll(key);
        for (var i = 0; i < list.length; i++) { if (String(list[i].id) === String(rec.id)) { list[i] = rec; break; } }
        _writeAll(key, list);
        return rec;
    }
    function _index(key, rec) { var l = _readAll(key); l.push(rec); _writeAll(key, l); return rec; }

    // ── Vehicle master ───────────────────────────────────────────
    // spec: { id, name, type, plate, payloadKg, bedL, bedW, bedH (metres),
    //         maxTripsPerDay, active }
    function upsertVehicle(spec) {
        if (!spec || !spec.id) { var e = new Error('vehicle id required'); e.code = 'BAD_INPUT'; throw e; }
        var list = _readAll(VEHICLES);
        var existing = _find(list, spec.id);
        var v = existing || { id: String(spec.id), maintenance: [], createdAt: new Date().toISOString() };
        v.name = spec.name != null ? spec.name : v.name;
        v.type = spec.type != null ? spec.type : (v.type || 'truck');
        v.plate = spec.plate != null ? spec.plate : (v.plate || null);
        v.payloadKg = Number(spec.payloadKg != null ? spec.payloadKg : v.payloadKg) || 0;
        v.bedL = Number(spec.bedL != null ? spec.bedL : v.bedL) || 0;
        v.bedW = Number(spec.bedW != null ? spec.bedW : v.bedW) || 0;
        v.bedH = Number(spec.bedH != null ? spec.bedH : v.bedH) || 0;
        v.bedVolumeM3 = C.round2((v.bedL * v.bedW * v.bedH) || 0);
        v.maxTripsPerDay = Number(spec.maxTripsPerDay != null ? spec.maxTripsPerDay : v.maxTripsPerDay) || 1;
        v.active = spec.active != null ? !!spec.active : (v.active !== false);
        v.status = spec.status || v.status || 'available'; // available | on_trip | maintenance
        // Sync capacity into the calculator profiles so load math is per-vehicle.
        if (E.Calculators) {
            E.Calculators.setVehicle(v.id, { payloadKg: v.payloadKg, bedL: v.bedL, bedW: v.bedW, bedH: v.bedH });
        }
        if (existing) { _replaceIn(VEHICLES, v); C.logAudit('vehicle.update', 'vehicle', v.id, { after: v }); }
        else { _index(VEHICLES, v); C.logAudit('vehicle.create', 'vehicle', v.id, { after: v }); }
        return v;
    }
    function listVehicles(onlyActive) {
        var l = _readAll(VEHICLES);
        return onlyActive ? l.filter(function (v) { return v.active; }) : l;
    }
    function getVehicle(id) { return _find(_readAll(VEHICLES), id); }

    // ── Capacity validation — NEVER exceed configured payload/volume ─
    // load: { weightKg, volumeM3, pieces, itemId }
    function validateLoad(vehicleId, load) {
        load = load || {};
        var v = getVehicle(vehicleId);
        if (!v) return { ok: false, error: 'vehicle_not_found' };
        var weightKg = Number(load.weightKg) || 0;
        var volumeM3 = Number(load.volumeM3) || 0;
        var pcs = Number(load.pieces) || 0;
        // Derive weight/volume from product profile + pieces when not given.
        if ((!weightKg || !volumeM3) && load.itemId && E.Calculators) {
            var p = E.Calculators.product(load.itemId);
            if (p) {
                if (!weightKg && p.unitWeightKg) weightKg = C.round2(pcs * p.unitWeightKg);
                if (!volumeM3 && p.lengthMm && p.widthMm && p.heightMm) {
                    volumeM3 = C.round2(pcs * (p.lengthMm / 1000) * (p.widthMm / 1000) * (p.heightMm / 1000));
                }
            }
        }
        var overPayload = v.payloadKg > 0 && weightKg > v.payloadKg;
        var overVolume = v.bedVolumeM3 > 0 && volumeM3 > C.round2(v.bedVolumeM3 * 1.0001); // tiny float slack
        var withinLimits = !overPayload && !overVolume;
        return {
            ok: true, withinLimits: withinLimits,
            vehicleId: String(vehicleId),
            weightKg: weightKg, payloadKg: v.payloadKg, overPayload: overPayload,
            volumeM3: volumeM3, bedVolumeM3: v.bedVolumeM3, overVolume: overVolume,
            utilizationPct: v.payloadKg ? C.round2(Math.min(weightKg / v.payloadKg, 1) * 100) : 0,
            warning: withinLimits ? 'Estimate — verify against actual legal payload & road limits' : 'Load exceeds vehicle capacity — split load or use a larger vehicle'
        };
    }

    // ── Maintenance schedule ─────────────────────────────────────
    // entry: { type, dueDate, dueKm, cost }
    function scheduleMaintenance(vehicleId, entry) {
        var v = getVehicle(vehicleId);
        if (!v) { var e = new Error('vehicle_not_found'); e.code = 'NOT_FOUND'; throw e; }
        var rec = {
            id: C.uid('mnt'), vehicleId: String(vehicleId),
            type: (entry && entry.type) || 'service',
            dueDate: (entry && entry.dueDate) || null,
            dueKm: (entry && entry.dueKm) || null,
            cost: Number(entry && entry.cost) || 0,
            completed: false, createdAt: new Date().toISOString()
        };
        _index(MAINT, rec);
        C.logAudit('maintenance.schedule', 'vehicle', String(vehicleId), { after: rec });
        return rec;
    }
    function completeMaintenance(maintenanceId) {
        var list = _readAll(MAINT);
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].id) === String(maintenanceId)) {
                list[i].completed = true; list[i].completedAt = new Date().toISOString();
                _writeAll(MAINT, list);
                C.logAudit('maintenance.complete', 'vehicle', list[i].vehicleId, { after: list[i] });
                return list[i];
            }
        }
        return null;
    }
    function dueMaintenance(asOf) {
        asOf = asOf ? new Date(asOf).getTime() : Date.now();
        return _readAll(MAINT).filter(function (m) {
            if (m.completed) return false;
            if (m.dueDate && new Date(m.dueDate).getTime() <= asOf) return true;
            return false;
        });
    }

    // ── Delivery challan ─────────────────────────────────────────
    // payload: { orderId, invoiceId, customerId, warehouse, vehicleId, driverId,
    //            lines:[{item, qty, unit}], distanceKm, zone, negotiatedRate, tons, idem }
    // Consumes stock through the inventory ledger and is idempotent by `idem`
    // so a retried offline dispatch does NOT move stock twice.
    function createChallan(payload) {
        payload = payload || {};
        if (!payload.warehouse) { var e = new Error('warehouse required for challan'); e.code = 'BAD_INPUT'; throw e; }
        // Idempotent replay: return the original challan without re-dispatching.
        if (payload.idem && C.seenKey('challan:' + payload.idem)) {
            var prev = C.read(C.key('idem'), {})['challan:' + payload.idem];
            return prev ? prev.result : null;
        }
        C.assertCan(C.currentActor(), 'stock.dispatch');
        var number = C.nextNumber('challan', { date: payload.date });
        var lines = (payload.lines || []).map(function (ln) {
            var pieces = C.toBase(ln.qty, ln.unit || 'piece');
            return { item: ln.item, qty: Number(ln.qty) || 0, unit: ln.unit || 'piece', pieces: pieces };
        });
        var totalPieces = C.sum(lines, function (l) { return l.pieces; });
        // Transport charge estimate (config-driven, flagged as estimate).
        var charge = null;
        if (E.Calculators) {
            var tons = Number(payload.tons) || 0;
            if (!tons && payload.itemId && E.Calculators.product(payload.itemId)) {
                var p = E.Calculators.product(payload.itemId);
                if (p.unitWeightKg) tons = C.round2(totalPieces * p.unitWeightKg / 1000);
            }
            var tc = E.Calculators.transportCharge({ distanceKm: payload.distanceKm, tons: tons, zone: payload.zone, negotiatedRate: payload.negotiatedRate });
            if (tc.ok) charge = tc;
        }
        // Consume stock (dispatch) for each line — throws if insufficient.
        var movements = [];
        for (var i = 0; i < lines.length; i++) {
            var mv = E.Inventory.dispatch({ item: lines[i].item, warehouse: payload.warehouse, qty: lines[i].qty, unit: lines[i].unit || 'piece', ref: number, batch: lines[i].batch, quality: 'good' });
            movements.push(mv);
        }
        var challan = {
            id: C.uid('challan'),
            number: number,
            date: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString(),
            orderId: payload.orderId || null,
            invoiceId: payload.invoiceId || null,
            customerId: payload.customerId || null,
            warehouse: payload.warehouse,
            vehicleId: payload.vehicleId ? String(payload.vehicleId) : null,
            driverId: payload.driverId || null,
            lines: lines,
            totalPieces: totalPieces,
            distanceKm: Number(payload.distanceKm) || 0,
            transportCharge: charge,
            status: 'scheduled', // scheduled | dispatched | delivered | failed | returned
            pod: null,
            failureReason: null,
            createdAt: new Date().toISOString(),
            createdBy: (C.currentActor() || {}).name || 'system'
        };
        _index(CHALLANS, challan);
        C.logAudit('challan.create', 'challan', number, { after: challan });
        if (payload.idem) C.markOnce('challan:' + payload.idem, challan);
        return challan;
    }
    function getChallan(idOrNumber) {
        var list = _readAll(CHALLANS);
        for (var i = 0; i < list.length; i++) { if (list[i].id === idOrNumber || list[i].number === idOrNumber) return list[i]; }
        return null;
    }
    function listChallans(status) {
        var l = _readAll(CHALLANS);
        return status ? l.filter(function (c) { return c.status === status; }) : l;
    }
    function dispatchChallan(challanId, opts) {
        opts = opts || {};
        var ch = getChallan(challanId);
        if (!ch) { var e = new Error('challan_not_found'); e.code = 'NOT_FOUND'; throw e; }
        if (opts.vehicleId) ch.vehicleId = String(opts.vehicleId);
        if (opts.driverId) ch.driverId = opts.driverId;
        // Stock was already consumed at creation; dispatch flips status + trip.
        ch.status = 'dispatched';
        ch.dispatchedAt = new Date(opts.at || Date.now()).toISOString();
        if (ch.vehicleId) { var v = getVehicle(ch.vehicleId); if (v) { v.status = 'on_trip'; _replaceIn(VEHICLES, v); } }
        _replaceIn(CHALLANS, ch);
        C.logAudit('challan.dispatch', 'challan', ch.number, { after: ch });
        return ch;
    }
    // Proof of delivery — idempotent by opts.idem (retried offline POD won't duplicate).
    function recordPOD(challanId, opts) {
        opts = opts || {};
        if (opts.idem && C.seenKey('pod:' + opts.idem)) {
            var prev = C.read(C.key('idem'), {})['pod:' + opts.idem];
            return prev ? prev.result : null;
        }
        var ch = getChallan(challanId);
        if (!ch) { var e = new Error('challan_not_found'); e.code = 'NOT_FOUND'; throw e; }
        ch.status = 'delivered';
        ch.pod = {
            recipient: opts.recipient || null,
            photoRef: opts.photoRef || null,
            geo: opts.geo || null,     // only if a real authorized capture exists
            signatureRef: opts.signatureRef || null,
            at: new Date(opts.at || Date.now()).toISOString()
        };
        ch.deliveredAt = ch.pod.at;
        if (ch.vehicleId) { var v = getVehicle(ch.vehicleId); if (v) { v.status = 'available'; _replaceIn(VEHICLES, v); } }
        _replaceIn(CHALLANS, ch);
        C.logAudit('challan.delivered', 'challan', ch.number, { after: ch });
        if (opts.idem) C.markOnce('pod:' + opts.idem, ch);
        return ch;
    }
    // Failed delivery: no stock change yet — a return records it back.
    function recordFailedDelivery(challanId, opts) {
        opts = opts || {};
        var ch = getChallan(challanId);
        if (!ch) { var e = new Error('challan_not_found'); e.code = 'NOT_FOUND'; throw e; }
        ch.status = 'failed';
        ch.failureReason = opts.reason || 'unspecified';
        ch.failedAt = new Date(opts.at || Date.now()).toISOString();
        if (ch.vehicleId) { var v = getVehicle(ch.vehicleId); if (v) { v.status = 'available'; _replaceIn(VEHICLES, v); } }
        _replaceIn(CHALLANS, ch);
        C.logAudit('challan.failed', 'challan', ch.number, { after: ch });
        return ch;
    }
    // Return / failed-delivery stock back to warehouse (idempotent by idem).
    function recordReturn(challanId, opts) {
        opts = opts || {};
        if (opts.idem && C.seenKey('ret:' + opts.idem)) {
            var prev = C.read(C.key('idem'), {})['ret:' + opts.idem];
            return prev ? prev.result : null;
        }
        var ch = getChallan(challanId);
        if (!ch) { var e = new Error('challan_not_found'); e.code = 'NOT_FOUND'; throw e; }
        var returned = ch.lines.map(function (ln) {
            var mv = E.Inventory.receive({ item: ln.item, warehouse: ch.warehouse, qty: ln.qty, unit: ln.unit, ref: ch.number + ':return', quality: 'return' });
            return mv;
        });
        ch.status = 'returned';
        ch.returnedAt = new Date(opts.at || Date.now()).toISOString();
        ch.returnMovements = returned;
        _replaceIn(CHALLANS, ch);
        C.logAudit('challan.returned', 'challan', ch.number, { after: ch });
        if (opts.idem) C.markOnce('ret:' + opts.idem, ch);
        return ch;
    }

    // ── Route planning (nearest-neighbour ESTIMATE, not optimised truth) ─
    // stops: [{ id, ... }], distanceFn(a,b) or matrix { 'a|b': km }
    function planRoute(stops, distanceFn) {
        if (!Array.isArray(stops) || stops.length <= 1) {
            return { ok: true, ordered: (stops || []).slice(), totalKm: 0, estimate: true, note: 'Single/empty stop set' };
        }
        var dist = typeof distanceFn === 'function' ? distanceFn
            : (distanceFn && typeof distanceFn === 'object'
                ? function (a, b) { return Number(distanceFn[a.id + '|' + b.id] || distanceFn[b.id + '|' + a.id] || 0); }
                : function () { return 1; });
        var remaining = stops.slice(), ordered = [remaining.shift()], total = 0;
        while (remaining.length) {
            var from = ordered[ordered.length - 1], best = 0, bestD = Infinity;
            for (var i = 0; i < remaining.length; i++) {
                var d = Number(dist(from, remaining[i])) || 0;
                if (d < bestD) { bestD = d; best = i; }
            }
            total += bestD;
            ordered.push(remaining.splice(best, 1)[0]);
        }
        return { ok: true, ordered: ordered, totalKm: C.round2(total), estimate: true, method: 'nearest_neighbour', note: 'Estimate only — not validated against live traffic, vehicle turns or delivery windows' };
    }

    // ── Reports: delivery cost + vehicle utilization ─────────────
    function deliveryCostReport(from, to) {
        from = from ? new Date(from).getTime() : 0;
        to = to ? new Date(to).getTime() : Infinity;
        var rows = listChallans().filter(function (c) {
            var t = new Date(c.date).getTime(); return t >= from && t <= to;
        });
        var totalCharge = 0, delivered = 0, failed = 0, returned = 0;
        rows.forEach(function (c) {
            if (c.transportCharge && c.transportCharge.ok) totalCharge += c.transportCharge.charge;
            if (c.status === 'delivered') delivered++;
            else if (c.status === 'failed') failed++;
            else if (c.status === 'returned') returned++;
        });
        return {
            period: { from: from || null, to: to === Infinity ? null : to },
            challans: rows.length, totalPieces: C.sum(rows, function (c) { return c.totalPieces; }),
            totalTransportCharge: C.round2(totalCharge),
            delivered: delivered, failed: failed, returned: returned,
            avgChargePerChallan: rows.length ? C.round2(totalCharge / rows.length) : 0
        };
    }
    function vehicleUtilization(from, to) {
        from = from ? new Date(from).getTime() : 0;
        to = to ? new Date(to).getTime() : Infinity;
        var challans = listChallans().filter(function (c) {
            var t = new Date(c.date).getTime(); return t >= from && t <= to;
        });
        var byVehicle = {};
        challans.forEach(function (c) {
            var id = c.vehicleId || 'unassigned';
            if (!byVehicle[id]) byVehicle[id] = { trips: 0, pieces: 0, charge: 0, delivered: 0 };
            byVehicle[id].trips++;
            byVehicle[id].pieces += c.totalPieces;
            if (c.transportCharge && c.transportCharge.ok) byVehicle[id].charge += c.transportCharge.charge;
            if (c.status === 'delivered') byVehicle[id].delivered++;
        });
        return Object.keys(byVehicle).map(function (id) {
            var b = byVehicle[id], v = getVehicle(id);
            return {
                vehicleId: id, name: v ? v.name : null, payloadKg: v ? v.payloadKg : null,
                trips: b.trips, pieces: b.pieces, charge: C.round2(b.charge),
                delivered: b.delivered, utilizationPct: v && v.payloadKg ? C.round2(b.delivered / b.trips * 100) : null
            };
        });
    }

    E.Logistics = {
        upsertVehicle: upsertVehicle, listVehicles: listVehicles, getVehicle: getVehicle,
        validateLoad: validateLoad,
        scheduleMaintenance: scheduleMaintenance, completeMaintenance: completeMaintenance, dueMaintenance: dueMaintenance,
        createChallan: createChallan, getChallan: getChallan, listChallans: listChallans,
        dispatchChallan: dispatchChallan, recordPOD: recordPOD, recordFailedDelivery: recordFailedDelivery, recordReturn: recordReturn,
        planRoute: planRoute, deliveryCostReport: deliveryCostReport, vehicleUtilization: vehicleUtilization
    };

})(window.GurukripaERP);
