'use strict';
// ══════════════════════════════════════════════════════════════════
// YARD DISPATCH TRACKER
// Gurukripa Bricks Industry — kiln → loading → en-route → delivered
// ══════════════════════════════════════════════════════════════════
// The operations console needs a dispatch board that works in the yard, on a
// phone, with no signal and no backend. So the board is written by an
// operator, stored on this device, and used for two real jobs:
//
//   1. It moves the customer-facing order status forward, which raises the
//      matching order alert through PushNotifications (the customer's
//      "trolley has dispatched from the yard" notification is genuinely
//      triggered here, not simulated).
//   2. It records which driver / trolley a load went out on, taken from the
//      ERP vehicle master where one exists.
//
// HONESTY NOTES — nothing on this board is invented:
//   • There is no GPS feed in this project, so "En-Route" is an operator
//     statement, never a live position. No map, no ETA countdown.
//   • Kiln chamber status is a hand-written yard note; the board never claims
//     a chamber is firing on its own.
//   • Every metric is counted from real orders, real challans and the real
//     stock ledger. When a source is empty the card says so.
// ══════════════════════════════════════════════════════════════════

const DISPATCH_KEY = 'gb_dispatch';
const KILN_KEY = 'gb_kiln_status';

const DispatchOps = (function () {

    // Order of the pipeline. `push` maps onto PushNotifications.ORDER_STAGES,
    // `statusText` is what the customer sees in Track Orders.
    const STAGES = [
        { key: 'queued', label: 'Order Logged', push: 'token', tone: 'neutral', note: 'Logged at the Jalalpur yard; no slot booked yet.' },
        { key: 'firing', label: 'Kiln Firing', push: 'firing', tone: 'brand', note: 'Set against a chamber; awaiting burn completion.' },
        { key: 'loading', label: 'Loading', push: 'loading', tone: 'warn', note: 'Being loaded on the trolley at the yard.' },
        { key: 'enroute', label: 'En-Route', push: 'dispatched', tone: 'info', note: 'Left the yard — operator reported, not live GPS.' },
        { key: 'delivered', label: 'Delivered', push: 'delivered', tone: 'ok', note: 'Unloaded and accepted at site.' }
    ];

    // ── Storage ──────────────────────────────────────────────────
    function records() {
        const raw = getSafeStorage(DISPATCH_KEY, {});
        return (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
    }

    function saveRecs(map) {
        setSafeStorage(DISPATCH_KEY, map);
        try { if (window.OfflineStore) OfflineStore.setMeta('dispatch', map); } catch (_e) { /* ignore */ }
    }

    function blank(orderId) {
        return {
            orderId: orderId, stage: 'queued',
            driver: '', phone: '', vehicle: '', trolleyNo: '',
            history: [{ stage: 'queued', at: Date.now() }]
        };
    }

    function forOrder(orderId) {
        const rec = records()[String(orderId)];
        if (rec && rec.orderId) {
            rec.history = Array.isArray(rec.history) ? rec.history : [];
            return rec;
        }
        return blank(orderId);
    }

    function stageDef(key) {
        return STAGES.find((s) => s.key === key) || STAGES[0];
    }

    function stageIndex(key) {
        return Math.max(0, STAGES.findIndex((s) => s.key === key));
    }

    function nextStageKey(key) {
        const at = stageIndex(key);
        return at >= STAGES.length - 1 ? null : STAGES[at + 1].key;
    }

    // ── Status changes ───────────────────────────────────────────
    function setStage(orderId, stageKey, opts) {
        const o = opts || {};
        const def = STAGES.find((s) => s.key === stageKey);
        if (!def) return { error: 'Unknown dispatch stage.' };

        const current = forOrder(orderId);
        if (current.stage === def.key && !o.force) return { unchanged: true, record: current };

        const map = records();
        const rec = Object.assign(current, { stage: def.key });
        rec.history = (rec.history || []).filter((h) => h && h.stage !== def.key).concat([{ stage: def.key, at: Date.now() }]).slice(-8);
        if (def.key === 'enroute') rec.dispatchedAt = Date.now();
        if (def.key === 'delivered') rec.deliveredAt = Date.now();
        map[String(orderId)] = rec;
        saveRecs(map);

        // Keep the customer-facing ledger in step, then raise the real alert.
        const order = syncOrderStatus(orderId, def);
        if (window.PushNotifications && order) {
            PushNotifications.notifyOrderStatus(order, def.push);
        }
        return { record: rec, stage: def, order: order };
    }

    // Writes the stage label into the local order list so Track Orders, the
    // profile order history and the alert watcher all read one truth.
    function syncOrderStatus(orderId, def) {
        if (typeof orders === 'undefined' || !Array.isArray(orders)) return null;
        const order = orders.find((o) => String(o.id) === String(orderId));
        if (!order) return null;
        order.status = def.label;
        order.statusAt = new Date().toISOString();
        setSafeStorage('gb_orders', orders);
        return order;
    }

    function advance(orderId) {
        const rec = forOrder(orderId);
        const next = nextStageKey(rec.stage);
        if (!next) return { complete: true, record: rec };
        return setStage(orderId, next);
    }

    function assign(orderId, patch) {
        const map = records();
        const rec = Object.assign(forOrder(orderId), patch || {}, { assignedAt: Date.now() });
        rec.driver = String(rec.driver || '').trim().slice(0, 40);
        rec.phone = String(rec.phone || '').replace(/[^\d]/g, '').slice(0, 10);
        rec.vehicle = String(rec.vehicle || '').trim().slice(0, 20);
        rec.trolleyNo = String(rec.trolleyNo || '').trim().slice(0, 12);
        map[String(orderId)] = rec;
        saveRecs(map);
        return rec;
    }

    // ── Kiln note (operator-written, never automatic) ────────────
    function kiln() {
        const k = getSafeStorage(KILN_KEY, null);
        return (k && typeof k === 'object') ? k : { chamber: '', state: 'Not reported', note: '', setAt: 0 };
    }

    function setKiln(patch) {
        const next = Object.assign(kiln(), patch || {}, { setAt: Date.now() });
        next.chamber = String(next.chamber || '').trim().slice(0, 30);
        next.note = String(next.note || '').trim().slice(0, 80);
        setSafeStorage(KILN_KEY, next);
        return next;
    }

    // ── Fleet from the ERP vehicle master ────────────────────────
    function vehicles() {
        try {
            if (window.GurukripaERP && GurukripaERP.Logistics) return GurukripaERP.Logistics.listVehicles(false) || [];
        } catch (_e) { /* ERP not loaded */ }
        return [];
    }

    // ── Metrics: counted, never hardcoded ────────────────────────
    function metrics(orderList) {
        const list = Array.isArray(orderList) ? orderList : [];
        const recs = records();
        const today = new Date().toISOString().slice(0, 10);

        const piecesToday = list
            .filter((o) => isToday(o.date))
            .reduce((sum, o) => sum + (Number(o.pieces) || 0), 0);

        const countStage = (key) => list.filter((o) => (recs[String(o.id)] || {}).stage === key).length;

        const fleet = vehicles();
        const onTrip = fleet.filter((v) => v.status === 'on_trip').length;

        let stockPcs = null;
        try {
            if (window.GurukripaERP && GurukripaERP.Inventory) {
                stockPcs = (GurukripaERP.Inventory.allStock() || [])
                    .reduce((sum, s) => sum + (Number(s.available) || 0), 0);
            }
        } catch (_e) { stockPcs = null; }

        const invoicedCount = list.filter((o) => /deliver/i.test(o.status || '')).length;

        return {
            piecesToday: piecesToday,
            ordersToday: list.filter((o) => isToday(o.date)).length,
            firing: countStage('firing'),
            loading: countStage('loading'),
            enroute: countStage('enroute'),
            delivered: countStage('delivered'),
            fleetTotal: fleet.length,
            fleetOnTrip: onTrip,
            stockPcs: stockPcs,
            invoicedCount: invoicedCount,
            pendingFollowup: list.filter((o) => !/deliver|cancel/i.test(o.status || '')).length
        };
    }

    function isToday(dateStr) {
        if (!dateStr) return false;
        // Order dates are dd/mm/yyyy (checkout ledger) or an ISO stamp.
        const iso = new Date().toISOString().slice(0, 10).split('-').reverse().join('/');
        return String(dateStr).replace(/^0+/g, '') === iso.replace(/^0+/g, '')
            || String(dateStr).slice(0, 10) === new Date().toISOString().slice(0, 10);
    }

    // ── Board rendering (used by the operations console) ─────────
    function stepperHtml(rec) {
        const at = stageIndex(rec.stage);
        return `<div class="ops-stepper" role="list">` + STAGES.map((s, i) => {
            const cls = i < at ? 'is-done' : (i === at ? 'is-active' : 'is-todo');
            return `<button type="button" role="listitem" class="ops-step ${cls} ${'ops-step--' + s.tone}" ` +
                `onclick="setDispatchStage('${sanitizeHTML(rec.orderId)}','${s.key}')" ` +
                `title="${sanitizeHTML(s.note)}">${s.label}</button>`;
        }).join('') + `</div>`;
    }

    function allocationHtml(rec) {
        if (!rec.driver && !rec.vehicle && !rec.trolleyNo) {
            return `<button type="button" class="ops-link" onclick="assignDispatch('${sanitizeHTML(rec.orderId)}')">+ Allocate driver &amp; trolley</button>`;
        }
        const bits = [
            rec.driver ? `<strong>${sanitizeHTML(rec.driver)}</strong>` : '',
            rec.phone ? `<a class="ops-link" href="tel:+91${sanitizeHTML(rec.phone)}">${sanitizeHTML(rec.phone)}</a>` : '',
            rec.trolleyNo ? `<span class="ops-pill">Trolley ${sanitizeHTML(rec.trolleyNo)}</span>` : '',
            rec.vehicle ? `<span class="ops-pill ops-pill--plate">${sanitizeHTML(rec.vehicle)}</span>` : ''
        ].filter(Boolean);
        return `<span class="ops-alloc">${bits.join(' ')}</span> ` +
            `<button type="button" class="ops-link" onclick="assignDispatch('${sanitizeHTML(rec.orderId)}')">change</button>`;
    }

    // One dispatch row: order, site, load, status stepper, allocation.
    function rowHtml(order) {
        const rec = forOrder(order.id);
        const def = stageDef(rec.stage);
        const done = def.key === 'delivered';
        const cap = (typeof TROLLEY_CAPACITY_PCS === 'number' && TROLLEY_CAPACITY_PCS > 0) ? TROLLEY_CAPACITY_PCS : 4000;
        const pieces = Number(order.pieces) || 0;
        const trolleys = pieces ? (pieces / cap).toFixed(2).replace(/\.00$/, '') : '—';
        const site = order.site || order.address || '';

        return `
            <tr class="ops-row ops-row--${def.tone}">
                <td class="ops-cell ops-cell--id">
                    <span class="ops-id">${sanitizeHTML(order.id)}</span>
                    <span class="ops-date">${sanitizeHTML(order.date || '')}</span>
                </td>
                <td class="ops-cell">
                    <span class="ops-cust">${sanitizeHTML(order.customer || (user && user.name) || 'Walk-in')}</span>
                    <span class="ops-site">${sanitizeHTML(site || 'Site not recorded')}${order.pincode ? ' · ' + sanitizeHTML(String(order.pincode)) : ''}</span>
                </td>
                <td class="ops-cell ops-cell--num">
                    ${pieces ? `<strong>${formatNum(pieces)}</strong><span>pcs · ${trolleys} trolley</span>` : '<span class="ops-dim">Qty not recorded</span>'}
                </td>
                <td class="ops-cell ops-cell--stage">${stepperHtml(rec)}</td>
                <td class="ops-cell ops-cell--alloc">${allocationHtml(rec)}</td>
                <td class="ops-cell ops-cell--action">
                    ${done
                        ? `<button type="button" class="ops-link" onclick="switchAdminTab('orders')">Invoice</button>`
                        : `<button type="button" class="ops-advance" onclick="advanceDispatch('${sanitizeHTML(order.id)}')">Advance →</button>`}
                </td>
            </tr>`;
    }

    // Rows for the console table: newest first, delivered ones fall off after
    // a week so the board stays about the loads still moving.
    function activeOrders(orderList) {
        const list = Array.isArray(orderList) ? orderList : [];
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return list
            .filter((o) => o && o.id)
            .filter((o) => {
                const rec = forOrder(o.id);
                if (rec.stage !== 'delivered') return !/cancel/i.test(o.status || '');
                return (Number(rec.deliveredAt) || 0) > weekAgo;
            })
            .slice(0, 14);
    }

    function boardHtml(orderList) {
        const rows = activeOrders(orderList);
        if (!rows.length) {
            return `<tr><td colspan="6" class="ops-empty">Nothing is on the board. Orders placed at checkout land here automatically, and a walk-in load can be logged with “New Manual Order”.</td></tr>`;
        }
        return rows.map(rowHtml).join('');
    }

    // ── Console refresh watch ────────────────────────────────────
    let boardTimer = null;

    // Redraws the board once a minute while the console is open, so counters
    // stay true for an operator who leaves the screen up. Nothing is fetched
    // from a server — there is no server to fetch from yet.
    function startBoardWatch() {
        stopBoardWatch();
        boardTimer = setInterval(() => {
            const modal = document.getElementById('adminPortalModal');
            if (!modal || !modal.classList.contains('open')) { stopBoardWatch(); return; }
            // Only the two tabs that carry the board — redrawing 'invoices' would
            // throw away the filters the operator is typing into.
            if (typeof currentAdminTab !== 'undefined'
                && (currentAdminTab === 'dispatch' || currentAdminTab === 'overview')
                && typeof renderAdminTab === 'function') {
                renderAdminTab(currentAdminTab);
            }
        }, 60_000);
    }

    function stopBoardWatch() {
        if (boardTimer) { clearInterval(boardTimer); boardTimer = null; }
    }

    return { STAGES, records, forOrder, stageDef, stageIndex, nextStageKey, setStage, advance, assign, kiln, setKiln, vehicles, metrics, rowHtml, activeOrders, boardHtml, startBoardWatch, stopBoardWatch, isToday };
})();

window.DispatchOps = DispatchOps;

// ── Console handlers (called from inline onclick) ─────────────────
function setDispatchStage(orderId, stageKey) {
    const res = DispatchOps.setStage(orderId, stageKey);
    if (res.error) { showToast(res.error, 'error'); return; }
    if (res.unchanged) { showToast('Already at that stage.', 'info'); return; }
    const def = DispatchOps.stageDef(stageKey);
    showToast(def.label + ' — customer alerted.', 'success');
    if (typeof renderAdminTab === 'function') renderAdminTab('dispatch');
}

function advanceDispatch(orderId) {
    const res = DispatchOps.advance(orderId);
    if (res.complete) { showToast('This dispatch is already delivered.', 'info'); return; }
    if (res.error) { showToast(res.error, 'error'); return; }
    showToast(res.stage.label + ' — customer alerted.', 'success');
    if (typeof renderAdminTab === 'function') renderAdminTab('dispatch');
}

// Driver + trolley allocation. Existing ERP vehicles are offered first so the
// plate typed here matches the fleet master when one has been set up.
function assignDispatch(orderId) {
    const rec = DispatchOps.forOrder(orderId);
    const fleet = DispatchOps.vehicles();
    const hint = fleet.length
        ? 'Fleet on file: ' + fleet.map((v) => v.plate || v.name || v.id).slice(0, 5).join(', ') + '\n'
        : 'No vehicles in the ERP fleet master yet — add them under Dispatch & Drivers.\n';

    const driver = window.prompt(hint + 'Driver name for order ' + orderId + ':', rec.driver || '');
    if (driver === null) return;
    const phone = window.prompt('Driver phone (10 digits, optional):', rec.phone || '');
    if (phone === null) return;
    const trolley = window.prompt('Trolley / tractor number:', rec.trolleyNo || '');
    if (trolley === null) return;
    const plate = window.prompt('Vehicle registration plate (as on the fleet master):', rec.vehicle || '');
    if (plate === null) return;

    DispatchOps.assign(orderId, { driver: driver, phone: phone, trolleyNo: trolley, vehicle: plate });
    showToast('Driver and trolley recorded for ' + orderId + '.', 'success');
    if (typeof renderAdminTab === 'function') renderAdminTab('dispatch');
}

function updateKilnStatus() {
    const k = DispatchOps.kiln();
    const chamber = window.prompt('Which chamber is loaded? (e.g. "Chamber #3")', k.chamber || '');
    if (chamber === null) return;
    const state = window.prompt('State of the burn — e.g. "Firing", "Cooling", "Idle", "Drawn":', k.state === 'Not reported' ? '' : k.state);
    if (state === null) return;
    const note = window.prompt('Anything the yard should know? (optional)', k.note || '');
    if (note === null) return;
    DispatchOps.setKiln({ chamber: chamber, state: state, note: note });
    showToast('Yard note saved on this device.', 'success');
    if (typeof renderAdminTab === 'function') renderAdminTab('overview');
}

// Walk-in / phone orders: the yard logs the load itself, so the board and the
// customer's Track Orders screen agree even when nobody used checkout.
function logManualOrder() {
    const id = window.prompt('Order / challan reference:', typeof makeLocalOrderRef === 'function' ? makeLocalOrderRef() : '');
    if (id === null || !id.trim()) return;
    const customer = window.prompt('Customer name:', '') || '';
    if (customer === null) return;
    const piecesRaw = window.prompt('Bricks to dispatch (pieces, e.g. 4000):', '4000');
    if (piecesRaw === null) return;
    const pieces = Math.max(0, parseInt(String(piecesRaw).replace(/[^0-9]/g, ''), 10) || 0);
    const site = window.prompt('Delivery village / site:', '') || '';
    const pincode = window.prompt('Delivery pincode (6 digits, optional):', '') || '';
    const totalRaw = window.prompt('Order value (₹, optional — the yard bills after the weighbridge):', '');
    if (totalRaw === null) return;

    const now = new Date();
    const date = [
        String(now.getDate()).padStart(2, '0'),
        String(now.getMonth() + 1).padStart(2, '0'),
        now.getFullYear()
    ].join('/');

    const order = {
        id: id.trim(),
        date: date,
        itemsCount: 1,
        pieces: pieces,
        total: Math.max(0, Number(String(totalRaw).replace(/[^0-9.]/g, '')) || 0),
        status: 'Order Logged',
        customer: customer.trim(),
        site: site.trim(),
        pincode: pincode.trim(),
        manual: true
    };

    if (typeof orders === 'undefined' || !Array.isArray(orders)) { showToast('Order ledger unavailable.', 'error'); return; }
    if (orders.some((o) => String(o.id) === String(order.id))) { showToast('That reference is already logged.', 'error'); return; }

    orders.unshift(order);
    setSafeStorage('gb_orders', orders);
    DispatchOps.setStage(order.id, 'queued', { force: true });
    if (window.PushNotifications) PushNotifications.notifyOrderStatus(order, 'token');

    showToast('Manual order ' + order.id + ' logged for the yard.', 'success');
    if (typeof renderAdminTab === 'function') renderAdminTab('dispatch');
}
