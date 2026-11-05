// ══════════════════════════════════════════
// 3-IN-1 ESTIMATOR STUDIO — Smart Construction Studio
// UI + calculation for the #calculator section.
// The three verified formulas below are the yard's existing rules and
// are preserved exactly; only the presentation/validation were reworked.
//   • Wall     : bricks = ceil(L·H · 8.6 · (thickness/4.5))
//   • Building : bricks = ceil(areaSqft · floors · 19);  cement = area·floors·0.4 bags;  sand = area·floors·1.8 cu.ft
//   • Boundary : bricks = ceil(L·H · 9.5)   (fixed Awwal rate ₹7.05)
// Costs are priced for bricks only (the one rate we actually have). Cement
// and sand are shown as quantities and clearly marked "rate set by yard" —
// we never invent a price for them.
// ══════════════════════════════════════════
let currentCalcTab = 'wall';
let lastEstimateSpec = null;      // consumed by saved-sites.js (.project/.bricks/.trolleys)
let lastEstimateResult = null;    // used by print / share / WhatsApp / add-to-cart

const FT_PER_M = 3.28084;
const SQFT_PER_SQM = 10.7639;
const BOUNDARY_RATE = 7.05;
const $ = (id) => document.getElementById(id);

function getUnit() { return $('calcUnit') ? $('calcUnit').value : 'ft'; }

// ── Unit label sync (does NOT recalculate — the user presses Calculate) ──
function onCalcUnitChange() {
    const u = getUnit();
    const linear = u === 'm' ? 'm' : 'ft';
    const area = u === 'm' ? 'sq m' : 'sq ft';
    document.querySelectorAll('[data-unit-suffix]').forEach(el => { el.textContent = linear; });
    document.querySelectorAll('[data-unit-area]').forEach(el => { el.textContent = area; });
}

// Fill the editable rate from a grade selection (rate stays user-editable after).
function onBrickGradeChange(selId, rateId) {
    const sel = $(selId), rate = $(rateId);
    if (sel && rate) rate.value = sel.value;
}

function showErr(id, msg) { const el = $(id); if (el) el.textContent = msg || ''; }
function clearErrs() { document.querySelectorAll('.studio-err').forEach(e => { e.textContent = ''; }); }

// Read + validate one positive decimal field.
function readPositive(id, errId, label) {
    const el = $(id);
    const raw = el ? el.value.trim() : '';
    const n = parseFloat(raw);
    if (raw === '' || !isFinite(n) || n <= 0) {
        showErr(errId, t('studio.errPositive').replace('{x}', label));
        return null;
    }
    showErr(errId, '');
    return n;
}

// ── Mode 1 — Wall / Brick ──
function computeWall() {
    const u = getUnit();
    const len = readPositive('calcLength', 'calcLengthErr', t('calculator.length'));
    const ht = readPositive('calcHeight', 'calcHeightErr', t('calculator.height'));
    if (len === null || ht === null) return null;
    const rateEl = $('calcRate');
    const price = parseFloat(rateEl ? rateEl.value : '0');
    if (!isFinite(price) || price <= 0) { showErr('calcRateErr', t('studio.errPositive').replace('{x}', t('calculator.rate'))); return null; }
    showErr('calcRateErr', '');
    const thick = parseFloat(($('calcThickness') || {}).value || 9);
    const openingsRaw = parseFloat(($('calcOpenings') || {}).value || '0');
    const openings = (isFinite(openingsRaw) && openingsRaw > 0) ? openingsRaw : 0;

    const k = u === 'm' ? FT_PER_M : 1, ka = u === 'm' ? SQFT_PER_SQM : 1;
    const lenFt = len * k, htFt = ht * k, openingsFt2 = openings * ka;
    const gross = lenFt * htFt;
    if (openingsFt2 >= gross) { showErr('calcOpeningsErr', t('studio.errOpenings')); return null; }
    showErr('calcOpeningsErr', '');
    const net = Math.max(0, gross - openingsFt2);

    const bricks = Math.ceil(net * 8.6 * (thick / 4.5));
    const cement = Math.ceil(bricks * 0.007);
    const sand = Math.ceil(bricks * 0.35);
    const trolleys = bricks / 4000;
    const cost = Math.ceil(bricks * price);

    return {
        spec: { tab: 'wall', project: `Wall (${len}${u} × ${ht}${u}, ${thick}" thick)`, bricks, trolleys: +trolleys.toFixed(1), cementBags: cement, sandCuFt: sand, cost },
        payload: { tab: 'wall', label: `Wall ${len}${u} × ${ht}${u}`, bricks, cost, inputs: { len, ht, thick, price, openings, unit: u } },
        preview: { len: lenFt, ht: htFt, thick },
        result: { tab: 'wall', bricks, trolleys, cement, sand, cost, price, unit: u, hasCement: true,
            dims: `${len} ${u} L × ${ht} ${u} H`, netLabel: `${Math.round(net)} sq ft`, grossLabel: `${Math.round(gross)} sq ft`, thickLabel: `${thick}"`,
            deducted: openingsFt2 > 0 ? `${Math.round(openingsFt2)} sq ft` : null }
    };
}

// ── Mode 2 — Full Building Materials ──
function computeHouse() {
    const u = getUnit();
    const area = readPositive('houseArea', 'houseAreaErr', t('calculator.area'));
    if (area === null) return null;
    const rateEl = $('houseRate');
    const price = parseFloat(rateEl ? rateEl.value : '0');
    if (!isFinite(price) || price <= 0) { showErr('houseRateErr', t('studio.errPositive').replace('{x}', t('calculator.rate'))); return null; }
    showErr('houseRateErr', '');
    const floors = parseInt(($('houseFloors') || {}).value || '2', 10);
    const ka = u === 'm' ? SQFT_PER_SQM : 1;
    const areaSqft = area * ka;

    const bricks = Math.ceil(areaSqft * floors * 19);
    const cement = Math.ceil(areaSqft * floors * 0.4);
    const sand = Math.ceil(areaSqft * floors * 1.8);
    const trolleys = bricks / 4000;
    const cost = Math.ceil(bricks * price);

    return {
        spec: { tab: 'house', project: `Building (${area}${u}² × ${floors} floors)`, bricks, trolleys: +trolleys.toFixed(1), cementBags: cement, sandCuFt: sand, cost },
        payload: { tab: 'house', label: `Building ${area}${u}² × ${floors}F`, bricks, cost, inputs: { sqft: area, floors, price, unit: u } },
        preview: null,
        result: { tab: 'house', bricks, trolleys, cement, sand, cost, price, unit: u, hasCement: true,
            dims: `${area} ${u}² × ${floors} floor${floors > 1 ? 's' : ''}`, netLabel: null, grossLabel: null, thickLabel: null, deducted: null }
    };
}

// ── Mode 3 — Boundary Wall ──
function computeBoundary() {
    const u = getUnit();
    const len = readPositive('boundaryLength', 'boundaryLengthErr', t('calculator.perimeter'));
    const ht = readPositive('boundaryHeight', 'boundaryHeightErr', t('calculator.height'));
    if (len === null || ht === null) return null;
    const k = u === 'm' ? FT_PER_M : 1;
    const lenFt = len * k, htFt = ht * k;
    const price = BOUNDARY_RATE;
    const bricks = Math.ceil(lenFt * htFt * 9.5);
    const trolleys = bricks / 4000;
    const cost = Math.ceil(bricks * price);

    return {
        spec: { tab: 'boundary', project: `Boundary wall (${len}${u} × ${ht}${u})`, bricks, trolleys: +trolleys.toFixed(1), cost },
        payload: { tab: 'boundary', label: `Boundary ${len}${u} × ${ht}${u}`, bricks, cost, inputs: { len, ht, price, unit: u } },
        preview: { len: lenFt, ht: htFt, thick: 9 },
        result: { tab: 'boundary', bricks, trolleys, cement: null, sand: null, cost, price, unit: u, hasCement: false,
            dims: `${len} ${u} perimeter × ${ht} ${u} H`, netLabel: null, grossLabel: `${Math.round(lenFt * htFt)} sq ft`, thickLabel: '9"', deducted: null }
    };
}

// ── Calculate (guarded against duplicate taps) ──
function runEstimate() {
    const btn = $('studioCalculate');
    if (btn && btn.dataset.busy === '1') return;
    let out = currentCalcTab === 'wall' ? computeWall() : (currentCalcTab === 'house' ? computeHouse() : computeBoundary());
    if (!out) return;

    if (btn) {
        btn.dataset.busy = '1'; btn.classList.add('is-busy');
        setTimeout(() => { btn.dataset.busy = '0'; btn.classList.remove('is-busy'); }, 450);
    }
    lastEstimateSpec = out.spec;
    window.lastCalcEstimate = out.spec;
    lastEstimateResult = out.result;
    scheduleEstimateSave(out.payload);

    renderEstimate(out.result);

    const pv = $('wallPreviewWrap');
    if (out.preview && pv) {
        pv.hidden = false;
        if (window.drawWallPreview) window.drawWallPreview(out.preview.len, out.preview.ht, out.preview.thick);
    } else if (pv) { pv.hidden = true; }

    if (navigator.vibrate) navigator.vibrate(30);
}

function renderEstimate(r) {
    const box = $('calcResultsBody');
    if (!box) return;
    const tiles = [];
    tiles.push(`<div class="studio-tile"><span class="studio-tile__val">${formatNum(r.bricks)}</span><span class="studio-tile__lab">${t('studio.bricks')}</span></div>`);
    tiles.push(`<div class="studio-tile"><span class="studio-tile__val">${r.trolleys.toFixed(1)}</span><span class="studio-tile__lab">${t('studio.trolleys')}</span></div>`);
    if (r.cement != null) tiles.push(`<div class="studio-tile"><span class="studio-tile__val">${formatNum(r.cement)}</span><span class="studio-tile__lab">${t('studio.cement')}</span></div>`);
    if (r.sand != null) tiles.push(`<div class="studio-tile"><span class="studio-tile__val">${formatNum(r.sand)}</span><span class="studio-tile__lab">${t('studio.sand')}</span></div>`);

    let rows = `<tr><td>${t('studio.bricks')}</td><td>${formatNum(r.bricks)} × ₹${r.price}</td><td class="studio-amt">${formatINR(Math.ceil(r.bricks * r.price))}</td></tr>`;
    if (r.cement != null) rows += `<tr><td>${t('studio.cement')}</td><td>${formatNum(r.cement)} ${t('studio.bags')}</td><td class="studio-ppa">${t('studio.yardRate')}</td></tr>`;
    if (r.sand != null) rows += `<tr><td>${t('studio.sand')}</td><td>${formatNum(r.sand)} cu.ft</td><td class="studio-ppa">${t('studio.yardRate')}</td></tr>`;

    let notes = `<li>${t('calculator.dims')}: ${r.dims}</li>`;
    if (r.thickLabel) notes += `<li>${t('studio.thickness')}: ${r.thickLabel}</li>`;
    if (r.grossLabel && r.netLabel && r.netLabel !== r.grossLabel) {
        notes += `<li>${t('studio.netArea')}: ${r.netLabel} <span class="studio-note-sub">(${t('studio.grossArea')} ${r.grossLabel}${r.deducted ? ' · ' + t('studio.deducted') + ' ' + r.deducted : ''})</span></li>`;
    }
    notes += `<li>${t('studio.disclaimer')}</li>`;

    box.innerHTML = `
        <div class="studio-grid-tiles">${tiles.join('')}</div>
        <div class="studio-cost">
            <div class="studio-cost__head">${t('studio.costTitle')}</div>
            <table class="studio-ctable"><tbody>${rows}</tbody></table>
            <div class="studio-total">
                <div><div class="studio-total__lab">${t('studio.totalLabel')}</div><div class="studio-total__sub">${t('studio.totalSub')}</div></div>
                <div class="studio-total__val">${formatINR(r.cost)}</div>
            </div>
        </div>
        <details class="studio-notes"><summary>${t('studio.assumptionsTitle')}</summary><ul>${notes}</ul></details>
        <div class="studio-act">
            <button type="button" class="studio-act__wa" onclick="sendEstimateWhatsApp()">${t('studio.whatsapp')}</button>
            <button type="button" class="studio-act__btn" onclick="addCalcToCart('${estimateCartName(r)}', ${r.bricks}, ${r.price})">${t('studio.addCart')}</button>
            <button type="button" class="studio-act__btn" onclick="printEstimate()">${t('studio.print')}</button>
            <button type="button" class="studio-act__btn" onclick="shareEstimate()">${t('studio.share')}</button>
        </div>`;
}

function estimateCartName(r) {
    return r.tab === 'house' ? 'Building Bricks' : (r.tab === 'boundary' ? 'Boundary Wall Bricks' : 'Wall Bricks');
}

// ── Empty state (shown on load and when switching modes) ──
function renderEmpty() {
    const box = $('calcResultsBody');
    if (!box) return;
    box.innerHTML = `
        <div class="studio-empty">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 21V8l6-4 6 4v13"/><path d="M15 21V11l6 3v7"/><line x1="3" y1="21" x2="21" y2="21"/></svg>
            <div class="studio-empty__t">${t('studio.emptyTitle')}</div>
            <div class="studio-empty__s">${t('studio.emptySub')}</div>
        </div>`;
    lastEstimateResult = null;
}

// ── Reset (confirmed) ──
function resetCalc() {
    const doReset = () => {
        clearErrs();
        if (currentCalcTab === 'wall') {
            setVal('calcLength', 20); setVal('calcHeight', 10); setVal('calcOpenings', 0);
            if ($('calcThickness')) $('calcThickness').value = '9';
            if ($('calcBrickType')) $('calcBrickType').value = '12';
            setVal('calcRate', 12);
        } else if (currentCalcTab === 'house') {
            setVal('houseArea', 1000);
            if ($('houseFloors')) $('houseFloors').value = '2';
            if ($('houseBrickRate')) $('houseBrickRate').value = '7.05';
            setVal('houseRate', 7.05);
        } else {
            setVal('boundaryLength', 150); setVal('boundaryHeight', 6);
        }
        const pv = $('wallPreviewWrap'); if (pv) pv.hidden = true;
        renderEmpty();
        showToast(t('studio.resetDone'), 'success');
    };
    if (window.GBDialogs && GBDialogs.confirm) {
        GBDialogs.confirm({ title: t('studio.resetConfirmTitle'), message: t('studio.resetConfirmMsg'), confirmLabel: t('calculator.reset'), onConfirm: doReset });
    } else { doReset(); }
}
function setVal(id, v) { const el = $(id); if (el) el.value = v; }

// ── Print (offline-safe: builds a plain summary in a hidden iframe) ──
function printEstimate() {
    const r = lastEstimateResult;
    if (!r) { showToast(t('studio.needCalc'), 'error'); return; }
    const line = (label, value) => `<div class="p-row"><span>${label}</span><b>${value}</b></div>`;
    const rows = [
        line(t('studio.bricks'), formatNum(r.bricks)),
        line(t('studio.trolleys'), r.trolleys.toFixed(1)),
        r.cement != null ? line(t('studio.cement'), formatNum(r.cement) + ' ' + t('studio.bags')) : '',
        r.sand != null ? line(t('studio.sand'), formatNum(r.sand) + ' cu.ft') : '',
        line(t('studio.totalLabel'), formatINR(r.cost))
    ].join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${t('calculator.title')}</title><style>
        body{font-family:Arial,Helvetica,sans-serif;color:#1f1b16;margin:24px}
        h1{font-size:18px;margin:0 0 2px} .sub{font-size:12px;color:#7a7267;margin-bottom:14px}
        .p-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee;font-size:14px}
        .p-row b{font-weight:700} .tot{margin-top:12px;font-size:16px;color:#C8460A}
        .disc{margin-top:16px;font-size:11px;color:#7a7267}</style></head><body>
        <h1>${t('calculator.title')} — Gurukripa Ent Udyog</h1>
        <div class="sub">${r.dims}${r.thickLabel ? ' · ' + r.thickLabel : ''} · ${new Date().toLocaleDateString('en-IN')}</div>
        ${rows}
        <div class="tot">${t('studio.totalLabel')}: ${formatINR(r.cost)}</div>
        <div class="disc">${t('studio.disclaimer')}</div>
        <div class="disc">Gurukripa Ent Udyog · Newada, Jalalpur, Jaunpur (UP) · +91 91989 23230</div>
        </body></html>`;
    try {
        const f = document.createElement('iframe');
        f.style.position = 'fixed'; f.style.right = '0'; f.style.bottom = '0';
        f.style.width = '0'; f.style.height = '0'; f.style.border = '0';
        document.body.appendChild(f);
        const d = f.contentWindow.document;
        d.open(); d.write(html); d.close();
        f.contentWindow.focus();
        setTimeout(() => { f.contentWindow.print(); setTimeout(() => f.remove(), 800); }, 250);
    } catch (e) { showToast(t('studio.printFail'), 'error'); }
}

// ── Share (uses the native share sheet where the device provides one) ──
function shareEstimate() {
    const r = lastEstimateResult;
    if (!r) { showToast(t('studio.needCalc'), 'error'); return; }
    const text = `${t('calculator.title')}\n${r.dims}\n${t('studio.bricks')}: ${formatNum(r.bricks)} (${r.trolleys.toFixed(1)} ${t('studio.trolleys')})` +
        (r.cement != null ? `\n${t('studio.cement')}: ${formatNum(r.cement)}` : '') +
        (r.sand != null ? `\n${t('studio.sand')}: ${formatNum(r.sand)} cu.ft` : '') +
        `\n${t('studio.totalLabel')}: ${formatINR(r.cost)}\n${t('studio.disclaimer')}`;
    if (navigator.share) {
        navigator.share({ title: t('calculator.title'), text: text }).catch(() => { /* user dismissed */ });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast(t('studio.copied'), 'success'));
    } else {
        sendEstimateWhatsApp();
    }
}

// ── WhatsApp enquiry handoff with the estimate ──
function sendEstimateWhatsApp() {
    const r = lastEstimateResult;
    if (!r) { showToast(t('studio.needCalc'), 'error'); return; }
    sendWhatsAppQuote(r.dims, r.bricks, r.cost);
}

function sendWhatsAppQuote(projName, brickCount, totalCost) {
    if (window.WhatsAppOrder) {
        WhatsAppOrder.sendEstimate({ project: projName, bricks: brickCount, cost: totalCost });
        return;
    }
    const text = encodeURIComponent(`Namaste Gurukripa Ent Udyog!\nI used your online estimator:\n• Project: ${projName}\n• Bricks estimate: ${formatNum(brickCount)} pcs\n• Estimated brick cost: ${formatINR(totalCost)} (indicative)\n\nPlease confirm availability and delivery.`);
    window.open(`https://wa.me/919198923230?text=${text}`, '_blank', 'noopener');
}

function addCalcToCart(name, qty, unitPrice) {
    const existing = cart.find(c => c.name === name);
    if (existing) { existing.qty += qty; }
    else { cart.push({ id: Date.now(), name, price: unitPrice, unit: 'per piece', qty, img: 'src/assets/images/brick_product_1.png' }); }
    saveCart();
    updateCartUI();
    openCart();
    showToast(t('calc.addedToCart', { qty: formatNum(qty), name }), 'success');
}

// ══════════════════════════════════════════
// TABS
// ══════════════════════════════════════════
function switchCalcTab(tab) {
    currentCalcTab = tab;
    document.querySelectorAll('.studio-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    document.querySelectorAll('.studio-pane').forEach(p => p.classList.remove('active'));
    const btnMap = { wall: 'cTabWallBtn', house: 'cTabHouseBtn', boundary: 'cTabBoundaryBtn' };
    const paneMap = { wall: 'calcTabWall', house: 'calcTabHouse', boundary: 'calcTabBoundary' };
    const b = $(btnMap[tab]), p = $(paneMap[tab]);
    if (b) { b.classList.add('active'); b.setAttribute('aria-selected', 'true'); }
    if (p) p.classList.add('active');
    const pv = $('wallPreviewWrap'); if (pv) pv.hidden = true;
    clearErrs();
    renderEmpty();
}

// ══════════════════════════════════════════
// OFFLINE ESTIMATE HISTORY (IndexedDB)
// ══════════════════════════════════════════
// Builders often work at sites with no signal. Every estimate is stored on
// the device so dimensions, brick counts and budgets can be re-opened later
// without a network round-trip.
const CALC_SAVED_LIMIT = 5;
let savedEstimatesCache = [];
let estimateSaveTimer = null;

function calcTimeLabel(ts) {
    if (!ts) return '';
    try {
        return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (_e) {
        return '';
    }
}

function updateCalcOfflineState() {
    const el = $('calcOfflineState');
    if (!el) return;
    if (!window.OfflineStore) {
        el.textContent = 'Offline storage unavailable — estimates stay in this tab only.';
        return;
    }
    OfflineStore.status().then((s) => {
        el.textContent = s.savedAt
            ? `${s.cachedRates} brick rates saved offline · ${calcTimeLabel(s.savedAt)}${s.queuedOrders ? ` · ${s.queuedOrders} order(s) queued` : ''}`
            : 'Estimator runs offline — download the rate card once for site work.';
    });
}

function scheduleEstimateSave(payload) {
    // Expose the working estimate so "Save this site" can carry the brick count
    // into the address book even when IndexedDB is blocked.
    window.lastCalcEstimate = (lastEstimateSpec) ? lastEstimateSpec : payload;
    if (!window.OfflineStore) return;
    clearTimeout(estimateSaveTimer);
    estimateSaveTimer = setTimeout(() => {
        const last = savedEstimatesCache[0];
        const duplicate = last && last.tab === payload.tab && last.bricks === payload.bricks
            && last.cost === payload.cost && (Date.now() - (last.createdAt || 0)) < 10 * 60 * 1000;
        if (duplicate) { updateCalcOfflineState(); return; }
        OfflineStore.saveEstimate(payload).then(() => renderSavedEstimates());
    }, 1400);
}

function renderSavedEstimates() {
    const box = $('calcSavedEstimates');
    if (!box) return;
    if (!window.OfflineStore) {
        box.innerHTML = '<div class="calc-saved-empty">This browser is blocking device storage.</div>';
        return;
    }
    OfflineStore.listEstimates(CALC_SAVED_LIMIT).then((rows) => {
        savedEstimatesCache = rows;
        updateCalcOfflineState();
        if (!rows.length) {
            box.innerHTML = `<div class="calc-saved-empty">${t('calculator.savedEmpty')}</div>`;
            return;
        }
        box.innerHTML = rows.map((r, i) => `
            <button type="button" class="calc-saved-row" onclick="reuseEstimate(${i})">
                <span class="calc-saved-main">
                    <strong>${sanitizeHTML(r.label || 'Estimate')}</strong>
                    <span>${formatNum(r.bricks)} bricks · ${formatINR(r.cost)}</span>
                </span>
                <span class="calc-saved-meta">${calcTimeLabel(r.createdAt)}</span>
            </button>`).join('');
    });
}

function setCalcInput(id, value) {
    const el = $(id);
    if (el && value != null && value !== '') el.value = value;
}

function reuseEstimate(index) {
    const row = savedEstimatesCache[index];
    if (!row || !row.inputs) return;
    const inputs = row.inputs;
    if (inputs.unit) { setCalcInput('calcUnit', inputs.unit); }
    switchCalcTab(row.tab || 'wall');
    if (row.tab === 'house') {
        setCalcInput('houseArea', inputs.sqft);
        setCalcInput('houseFloors', inputs.floors);
        setCalcInput('houseBrickRate', inputs.price);
        setCalcInput('houseRate', inputs.price);
    } else if (row.tab === 'boundary') {
        setCalcInput('boundaryLength', inputs.len);
        setCalcInput('boundaryHeight', inputs.ht);
    } else {
        setCalcInput('calcLength', inputs.len);
        setCalcInput('calcHeight', inputs.ht);
        setCalcInput('calcThickness', inputs.thick);
        setCalcInput('calcBrickType', inputs.price);
        setCalcInput('calcRate', inputs.price);
        setCalcInput('calcOpenings', inputs.openings || 0);
    }
    onCalcUnitChange();
    runEstimate();
    showToast('Saved estimate loaded — adjust dimensions to recalculate.', 'success');
}

function clearSavedEstimates() {
    if (!window.OfflineStore) return;
    OfflineStore.clearEstimates().then(() => {
        savedEstimatesCache = [];
        renderSavedEstimates();
        showToast('Saved estimates cleared from this device.', 'success');
    });
}

// ══════════════════════════════════════════
// WEB AUDIO BRICK QUALITY SOUND TESTER
// (Used by the brick-quality specification panel, kept here as a global.)
// ══════════════════════════════════════════
let audioCtx = null;
function playBrickSound(type) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        if (type === 'gradeA' || type === 'awwal') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1480, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.8);
            gain.gain.setValueAtTime(0.6, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            osc.start(now); osc.stop(now + 0.8);
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2); gain2.connect(audioCtx.destination);
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(2960, now);
            gain2.gain.setValueAtTime(0.3, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc2.start(now); osc2.stop(now + 0.5);
            showToast(t('calc.soundGradeA'), 'success');
        } else if (type === 'laalPeti') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, now);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
            showToast(t('calc.soundClear'), 'info');
        } else {
            osc.type = 'square';
            osc.frequency.setValueAtTime(180, now);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
            showToast(t('calc.soundDull'), 'warning');
        }
    } catch (e) {
        console.warn('Web Audio error:', e);
        showToast(t('calc.soundPlayed'));
    }
}

// ── Auto-initialize the estimator panel (empty state, not a live calc) ──
(function initCalculator() {
    const run = () => {
        if (!$('calcLength')) return;
        onCalcUnitChange();
        renderEmpty();
        renderSavedEstimates();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
})();
