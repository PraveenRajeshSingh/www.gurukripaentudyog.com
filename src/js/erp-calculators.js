'use strict';
// ══════════════════════════════════════════════════════════════════
// Gurukripa ERP — CALCULATORS (configurable brick-trade math)
// ══════════════════════════════════════════════════════════════════
// Business estimation that is CONFIG-DRIVEN, never hardcoded to one brick
// size or one truck. Every product may declare its own dimensions/weight
// and every vehicle its own payload/volume, so load, freight, breakage,
// landed cost and margin reflect the real items being moved.
//
// These are ESTIMATES. They must be validated against actual operating
// constraints before being relied on for commitments — nothing here is a
// guaranteed delivery promise.
// ══════════════════════════════════════════════════════════════════════

window.GurukripaERP = window.GurukripaERP || {};

(function(E) {
    var C = E.Core;

    // Configurable profiles (seed with safe placeholders; operators override).
    var SETTINGS = {
        // Per-product physical profile: size mm, weight kg, pcs per trolley etc.
        products: {},   // { itemId: { lengthMm, widthMm, heightMm, unitWeightKg, pcsPerTrolley, mortarGapMm } }
        // Per-vehicle capacity: payload kg and load bed volume (m³).
        vehicles: {},   // { vehicleId: { payloadKg, bedL, bedW, bedH, maxPallets } }
        freight: { baseRatePerKm: 0, perTonKm: 0, minCharge: 0, zoneRates: {} }, // ₹
        defaults: { mortarGapMm: 10, breakagePct: 2, wastagePct: 1 }
    };
    function configure(patch) {
        if (!patch) return C.clone(SETTINGS);
        ['products', 'vehicles'].forEach(function (k) { if (patch[k]) SETTINGS[k] = Object.assign(SETTINGS[k], patch[k]); });
        if (patch.freight) SETTINGS.freight = Object.assign(SETTINGS.freight, patch.freight);
        if (patch.defaults) SETTINGS.defaults = Object.assign(SETTINGS.defaults, patch.defaults);
        return C.clone(SETTINGS);
    }
    function setProduct(itemId, profile) { SETTINGS.products[String(itemId)] = Object.assign({}, SETTINGS.products[String(itemId)], profile); return SETTINGS.products[String(itemId)]; }
    function setVehicle(id, spec) { SETTINGS.vehicles[String(id)] = Object.assign({}, SETTINGS.vehicles[String(id)], spec); return SETTINGS.vehicles[String(id)]; }
    function product(itemId) { return SETTINGS.products[String(itemId)] || null; }
    function vehicle(id) { return SETTINGS.vehicles[String(id)] || null; }

    // ── 1. Quantity conversion (piece / hundred / thousand / trolley / load)
    // Trolley size is PER PRODUCT (pcsPerTrolley), not one universal number.
    function convertQty(qty, fromUnit, toUnit, itemId) {
        var factor = function (u) {
            if (u === 'piece') return 1;
            if (u === 'hundred') return 100;
            if (u === 'thousand') return 1000;
            if (u === 'pallet') { var f = SETTINGS.units && SETTINGS.units.pallet; return f || 1000; }
            if (u === 'trolley' || u === 'load' || u === 'truck') {
                var p = product(itemId);
                if (p && p.pcsPerTrolley) return p.pcsPerTrolley;
                return C.unitFactor(u) || (u === 'trolley' ? 4000 : 1000);
            }
            var core = C.unitFactor(u);
            return core == null ? null : core;
        };
        var ff = factor(fromUnit), tf = factor(toUnit);
        if (ff == null || tf == null) return { ok: false, error: 'unknown_unit', basePieces: null };
        var pieces = (Number(qty) || 0) * ff;
        return { ok: true, pieces: C.round2(pieces), value: C.round2(pieces / tf), fromUnit: fromUnit, toUnit: toUnit, factors: { from: ff, to: tf } };
    }

    // ── 2. Wall / volume quantity estimate (from dimensions, per-product)
    function estimatePieces(o) {
        var p = product(o.itemId) || o.product || {};
        if (!p.lengthMm || !p.widthMm || !p.heightMm) return { ok: false, error: 'product_dimensions_required' };
        var gap = (o.mortarGapMm != null ? o.mortarGapMm : SETTINGS.defaults.mortarGapMm);
        var areaM2 = Number(o.areaM2) || ((Number(o.lengthM) || 0) * (Number(o.heightM) || 0));
        if (!areaM2) return { ok: false, error: 'area_required' };
        var withGapL = (p.lengthMm + gap) / 1000, withGapH = (p.heightMm + gap) / 1000;
        var perM2 = (withGapL && withGapH) ? (1 / (withGapL * withGapH)) : 0;
        var gross = Math.ceil(areaM2 * perM2 * (Number(o.thicknessCourses) || 1));
        var wastage = Math.ceil(gross * ((Number(o.wastagePct != null ? o.wastagePct : SETTINGS.defaults.wastagePct)) / 100));
        return { ok: true, areaM2: C.round2(areaM2), piecesPerM2: C.round2(perM2), gross: gross, wastage: wastage, recommended: gross + wastage, brick: p };
    }

    // ── 3. Vehicle load estimation (respects payload AND bed volume)
    // pcsPerTrolley for the product is capped by BOTH weight and volume limits.
    function loadEstimate(o) {
        var p = product(o.itemId);
        if (!p) return { ok: false, error: 'product_profile_required' };
        var v = vehicle(o.vehicleId);
        if (!v) return { ok: false, error: 'vehicle_profile_required' };
        if (!p.unitWeightKg) return { ok: false, error: 'product_weight_required' };
        var volumeKg = p.unitWeightKg;
        var byWeight = Math.floor((Number(v.payloadKg) || 0) / volumeKg);
        var byVolume;
        if (p.lengthMm && p.widthMm && p.heightMm && v.bedL && v.bedW && v.bedH) {
            var pcL = v.bedL / (p.lengthMm / 1000), pcW = v.bedW / (p.widthMm / 1000), pcH = v.bedH / (p.heightMm / 1000);
            byVolume = Math.floor(pcL * pcW * pcH);
        } else byVolume = Infinity;
        var declared = p.pcsPerTrolley || Infinity;
        var pcs = Math.max(0, Math.min(byWeight, byVolume === Infinity ? byWeight : byVolume, declared));
        var trolleysNeeded = o.totalPieces ? Math.ceil((Number(o.totalPieces)) / (pcs || 1)) : null;
        return {
            ok: true, pcsPerTrip: pcs, byWeight: byWeight, byVolume: byVolume,
            limitingFactor: (pcs === byWeight ? 'weight' : pcs === byVolume ? 'volume' : 'declared_capacity'),
            tripWeightKg: C.round2(pcs * volumeKg), totalPieces: Number(o.totalPieces) || 0,
            tripsNeeded: trolleysNeeded, warning: 'Estimate — validate against actual vehicle & road limits before dispatch'
        };
    }

    // ── 4. Transport charge (distance / load / zone / negotiated)
    function transportCharge(o) {
        var f = SETTINGS.freight;
        var km = Number(o.distanceKm) || 0;
        var tons = Number(o.tons) || 0;
        var negotiated = Number(o.negotiatedRate);
        var charge;
        var basis;
        if (!isNaN(negotiated) && negotiated > 0) { charge = negotiated; basis = 'negotiated'; }
        else if (o.zone && f.zoneRates && f.zoneRates[o.zone] != null) { charge = Number(f.zoneRates[o.zone]); basis = 'zone'; }
        else if (f.perTonKm) { charge = f.perTonKm * tons * km + (f.baseRatePerKm ? f.baseRatePerKm * km : 0); basis = 'per_ton_km'; }
        else if (f.baseRatePerKm) { charge = f.baseRatePerKm * km; basis = 'per_km'; }
        else return { ok: false, error: 'no_freight_configured' };
        if (f.minCharge) charge = Math.max(charge, f.minCharge);
        return { ok: true, charge: C.round2(charge), basis: basis, distanceKm: km, tons: tons, zone: o.zone || null };
    }

    // ── 5. Breakage / wastage tracking
    function breakage(o) {
        var produced = Number(o.produced) || 0;
        var good = Number(o.good) != null ? Number(o.good) : produced - (Number(o.broken) || 0);
        var broken = Math.max(0, produced - good);
        var pct = produced ? C.round2(broken / produced * 100) : 0;
        return { ok: true, produced: produced, good: good, broken: broken, breakagePct: pct, acceptable: pct <= (Number(o.maxPct != null ? o.maxPct : SETTINGS.defaults.breakagePct)) };
    }

    // ── 6. Landed cost per unit (delegates to the ERP-accurate allocator)
    function landedCostPerUnit(lines, charges, method) {
        if (!E.Documents || !E.Documents.computeLandedCost) return { ok: false, error: 'documents_module_required' };
        var r = E.Documents.computeLandedCost(lines, charges, { method: method });
        return { ok: true, method: r.method, totalCharges: r.totalCharges, landedValue: r.landedValue, lines: r.lines };
    }

    // ── 7. Order profitability / gross margin
    function orderMargin(o) {
        var qty = Number(o.qty) || 0;
        var sell = Number(o.unitPrice) || 0;
        var cost = Number(o.unitCost) || 0;
        var freight = Number(o.freightTotal) || 0;
        var revenue = C.round2(qty * sell);
        var cogs = C.round2(qty * cost);
        var landed = C.round2(cogs + freight);
        var gross = C.round2(revenue - landed);
        var marginPct = revenue ? C.round2(gross / revenue * 100) : 0;
        return { ok: true, revenue: revenue, cogs: cogs, freight: freight, landedCost: landed, grossProfit: gross, marginPct: marginPct, costPerUnitLanded: qty ? C.round2(landed / qty) : 0 };
    }

    // ── 8. Bulk-order price tiers (configurable ladder)
    function tierPrice(qty, tiers) {
        if (!Array.isArray(tiers) || !tiers.length) return { ok: false, error: 'tiers_required' };
        var best = null;
        for (var i = 0; i < tiers.length; i++) {
            var t = tiers[i];
            if ((Number(qty) || 0) >= (Number(t.minQty) || 0)) { if (best === null || (Number(t.minQty) || 0) >= (Number(best.minQty) || 0)) best = t; }
        }
        if (!best) return { ok: true, matched: null, unitPrice: null, note: 'below lowest tier' };
        var price = Number(best.unitPrice != null ? best.unitPrice : best.price);
        return { ok: true, matched: best, unitPrice: price, discountPct: Number(best.discountPct) || 0 };
    }

    E.Calculators = {
        configure: configure, setProduct: setProduct, setVehicle: setVehicle, product: product, vehicle: vehicle,
        convertQty: convertQty, estimatePieces: estimatePieces, loadEstimate: loadEstimate,
        transportCharge: transportCharge, breakage: breakage, landedCostPerUnit: landedCostPerUnit,
        orderMargin: orderMargin, tierPrice: tierPrice, SETTINGS: SETTINGS
    };

})(window.GurukripaERP);
