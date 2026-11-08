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
let lastEstimatePayload = null;   // localStorage draft + explicit Save
let calcLiveTimer = null;
let calcDraftTimer = null;
let calcPreviewObserver = null;
let calcPreviewPending = null;

const FT_PER_M = 3.28084;
const SQFT_PER_SQM = 10.7639;
const BOUNDARY_RATE = 7.05;
const CALC_DRAFT_KEY = 'gb_calc_draft_v1';
const CALC_TAB_KEY = 'gb_calc_tab';
const RATE_STALE_MS = 7 * 24 * 60 * 60 * 1000;
const $ = (id) => document.getElementById(id);

function getUnit() { return $('calcUnit') ? $('calcUnit').value : 'ft'; }

// ── Unit label sync (does NOT recalculate — the user presses Calculate) ──
function onCalcUnitChange() {
    const u = getUnit();
    const linear = u === 'm' ? 'm' : 'ft';
    const area = u === 'm' ? 'sq m' : 'sq ft';
    document.querySelectorAll('[data-unit-suffix]').forEach(el => { el.textContent = linear; });
    document.querySelectorAll('[data-unit-area]').forEach(el => { el.textContent = area; });
    syncUnitSegUI();
}

function syncUnitSegUI() {
    const u = getUnit();
    document.querySelectorAll('#calculator .studio-seg__btn[data-unit]').forEach((btn) => {
        const on = btn.getAttribute('data-unit') === u;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
}

function setCalcUnit(u) {
    const sel = $('calcUnit');
    if (sel) sel.value = (u === 'm') ? 'm' : 'ft';
    onCalcUnitChange();
    scheduleLiveEstimate();
    persistCalcDraft();
}

function setWallThickness(v) {
    const sel = $('calcThickness');
    if (sel) sel.value = String(v);
    document.querySelectorAll('#calculator .studio-thick__btn').forEach((btn) => {
        const on = btn.getAttribute('data-thick') === String(v);
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    scheduleLiveEstimate();
    persistCalcDraft();
}

function syncThicknessUI() {
    const v = ($('calcThickness') || {}).value || '9';
    document.querySelectorAll('#calculator .studio-thick__btn').forEach((btn) => {
        const on = btn.getAttribute('data-thick') === String(v);
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
}

// Fill the editable rate from a grade selection (rate stays user-editable after).
function onBrickGradeChange(selId, rateId) {
    const sel = $(selId), rate = $(rateId);
    if (sel && rate) rate.value = sel.value;
    scheduleLiveEstimate();
    persistCalcDraft();
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

function computeCurrent(silent) {
    if (silent) {
        // Soft validation for live calc: skip error paint when fields incomplete
        try {
            return currentCalcTab === 'wall' ? computeWall() : (currentCalcTab === 'house' ? computeHouse() : computeBoundary());
        } catch (_e) { return null; }
    }
    return currentCalcTab === 'wall' ? computeWall() : (currentCalcTab === 'house' ? computeHouse() : computeBoundary());
}

// ── Calculate (button shows brief busy state; calculation always runs) ──
function runEstimate() {
    const btn = $('studioCalculate');
    const out = computeCurrent(false);
    if (!out) return;
    applyEstimate(out, { manual: true });
    if (btn && btn.dataset.busy !== '1') {
        btn.dataset.busy = '1'; btn.classList.add('is-busy');
        setTimeout(() => { btn.dataset.busy = '0'; btn.classList.remove('is-busy'); }, 450);
    }
    if (navigator.vibrate) navigator.vibrate(30);
}

function applyEstimate(out, opts) {
    lastEstimateSpec = out.spec;
    window.lastCalcEstimate = out.spec;
    lastEstimateResult = out.result;
    lastEstimatePayload = out.payload;
    if (!opts || opts.manual || opts.save !== false) scheduleEstimateSave(out.payload);
    renderEstimate(out.result);
    queueWallPreview(out.preview);
    updateMobileResultBar(out.result);
    persistCalcDraft();
}

function scheduleLiveEstimate() {
    clearTimeout(calcLiveTimer);
    calcLiveTimer = setTimeout(() => {
        clearErrs();
        const out = computeCurrent(false);
        if (!out) {
            // Keep previous result if live typing is mid-edit and invalid
            return;
        }
        applyEstimate(out, { save: false });
    }, 250);
}

function queueWallPreview(preview) {
    const pv = $('wallPreviewWrap');
    if (!preview || !pv) {
        if (pv) pv.hidden = true;
        calcPreviewPending = null;
        return;
    }
    calcPreviewPending = preview;
    pv.hidden = false;
    const svg = $('wallPreviewSvg');
    if (svg) {
        svg.setAttribute('aria-label',
            `Wall preview ${preview.len.toFixed(1)} ft long by ${preview.ht.toFixed(1)} ft high, ${preview.thick}\" thick`);
    }
    // Lazy draw when section is visible
    if (!calcPreviewObserver) {
        if (window.drawWallPreview) window.drawWallPreview(preview.len, preview.ht, preview.thick);
        return;
    }
    const section = $('calculator');
    if (!section) {
        if (window.drawWallPreview) window.drawWallPreview(preview.len, preview.ht, preview.thick);
        return;
    }
    // If already intersecting, draw now; observer handles first intersection otherwise
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
        if (window.drawWallPreview) window.drawWallPreview(preview.len, preview.ht, preview.thick);
    }
}

function renderEstimate(r) {
    const box = $('calcResultsBody');
    if (!box) return;

    const trolleyLabel = `${r.trolleys.toFixed(1)} trolley${r.trolleys === 1 ? '' : 's'} · 4,000 pcs each`;
    const tiles = [];
    tiles.push(`<div class="studio-tile"><span class="studio-tile__val">${formatNum(r.bricks)}</span><span class="studio-tile__lab">${t('studio.bricks')} + wastage basis</span></div>`);
    tiles.push(`<div class="studio-tile"><span class="studio-tile__val">${formatINR(r.cost)}</span><span class="studio-tile__lab">${t('studio.totalLabel')}</span></div>`);
    tiles.push(`<div class="studio-tile"><span class="studio-tile__val">₹${Number(r.price).toLocaleString('en-IN')}</span><span class="studio-tile__lab">${t('calculator.rate')} used</span></div>`);
    if (r.netLabel) {
        tiles.push(`<div class="studio-tile"><span class="studio-tile__val">${r.netLabel}</span><span class="studio-tile__lab">${t('studio.netArea') || 'Area after deductions'}</span></div>`);
    } else if (r.grossLabel) {
        tiles.push(`<div class="studio-tile"><span class="studio-tile__val">${r.grossLabel}</span><span class="studio-tile__lab">${r.tab === 'boundary' ? 'Wall area' : (t('studio.grossArea') || 'Area')}</span></div>`);
    } else {
        tiles.push(`<div class="studio-tile"><span class="studio-tile__val">${r.trolleys.toFixed(1)}</span><span class="studio-tile__lab">${t('studio.trolleys')}</span></div>`);
    }
    if (r.tab === 'house' || (r.hasCement && r.cement != null)) {
        if (r.cement != null) tiles.push(`<div class="studio-tile"><span class="studio-tile__val">${formatNum(r.cement)}</span><span class="studio-tile__lab">${t('studio.cement')}</span></div>`);
        if (r.sand != null) tiles.push(`<div class="studio-tile"><span class="studio-tile__val">${formatNum(r.sand)}</span><span class="studio-tile__lab">${t('studio.sand')}</span></div>`);
    }

    let rows = `<tr><td>${t('studio.bricks')}</td><td>${formatNum(r.bricks)} × ₹${r.price}</td><td class="studio-amt">${formatINR(Math.ceil(r.bricks * r.price))}</td></tr>`;
    if (r.cement != null) rows += `<tr><td>${t('studio.cement')}</td><td>${formatNum(r.cement)} ${t('studio.bags')}</td><td class="studio-ppa">${t('studio.yardRate')}</td></tr>`;
    if (r.sand != null) rows += `<tr><td>${t('studio.sand')}</td><td>${formatNum(r.sand)} cu.ft</td><td class="studio-ppa">${t('studio.yardRate')}</td></tr>`;

    let notes = `<li>${t('calculator.dims')}: ${r.dims}</li>`;
    if (r.thickLabel) notes += `<li>${t('studio.thickness')}: ${r.thickLabel}</li>`;
    if (r.grossLabel && r.netLabel && r.netLabel !== r.grossLabel) {
        notes += `<li>${t('studio.netArea')}: ${r.netLabel} <span class="studio-note-sub">(${t('studio.grossArea')} ${r.grossLabel}${r.deducted ? ' · ' + t('studio.deducted') + ' ' + r.deducted : ''})</span></li>`;
    }
    if (r.tab === 'boundary' && r.grossLabel) {
        notes += `<li>Perimeter wall area: ${r.grossLabel}</li>`;
    }
    notes += `<li>${t('studio.disclaimer')}</li>`;

    const rateSource = getRateSourceHtml();

    box.innerHTML = `
        <div class="studio-hero">
            <div class="studio-hero__lab">${t('studio.bricks')}</div>
            <div class="studio-hero__val">${formatNum(r.bricks)}</div>
            <div class="studio-hero__sub">${trolleyLabel}</div>
        </div>
        <div class="studio-grid-tiles">${tiles.join('')}</div>
        <div class="studio-cost">
            <div class="studio-cost__head">${t('studio.costTitle')}</div>
            <table class="studio-ctable"><tbody>${rows}</tbody></table>
            <div class="studio-total">
                <div><div class="studio-total__lab">${t('studio.totalLabel')}</div><div class="studio-total__sub">${t('studio.totalSub')}</div></div>
                <div class="studio-total__val">${formatINR(r.cost)}</div>
            </div>
        </div>
        <details class="studio-notes"><summary>How this was calculated</summary><ul>${notes}</ul></details>
        <p class="studio-disclaimer">Estimate only. Confirm final rates and quantity with the yard.</p>
        ${rateSource}
        <div class="studio-act">
            <button type="button" class="studio-act__btn" onclick="addCalcToCart('${estimateCartName(r)}', ${r.bricks}, ${r.price})">${t('studio.addCart')}</button>
            <button type="button" class="studio-act__btn" onclick="openQuoteFromEstimate()">Get Quote</button>
            <button type="button" class="studio-act__wa" onclick="sendEstimateWhatsApp()">${t('studio.whatsapp')}</button>
            <button type="button" class="studio-act__btn" onclick="saveEstimateNow()">Save Estimate</button>
            <button type="button" class="studio-act__btn" onclick="printEstimate()">${t('studio.print')}</button>
            <button type="button" class="studio-act__btn" onclick="shareEstimate()">${t('studio.share')}</button>
        </div>`;
}

function getRateSourceHtml() {
    const strip = $('calcOfflineStrip');
    const state = strip ? strip.getAttribute('data-state') : 'ready';
    if (state === 'stale') {
        return `<p class="studio-rate-source is-stale">Rate source: saved offline card (older than 7 days). Refresh when online.</p>`;
    }
    if (state === 'offline') {
        return `<p class="studio-rate-source">Rate source: saved offline card · calculator works without network.</p>`;
    }
    return `<p class="studio-rate-source">Rate source: device rate card (or default grade rates).</p>`;
}

function estimateCartName(r) {
    return r.tab === 'house' ? 'Building Bricks' : (r.tab === 'boundary' ? 'Boundary Wall Bricks' : 'Wall Bricks');
}

let calcSectionVisible = true;
function updateMobileResultBar(r) {
    const bar = $('studioMobileBar');
    const bricksEl = $('studioMobileBricks');
    const costEl = $('studioMobileCost');
    if (!bar) return;
    const mobile = window.matchMedia('(max-width: 639px)').matches;
    if (!r || !mobile || !calcSectionVisible) { bar.hidden = true; return; }
    if (bricksEl) bricksEl.textContent = formatNum(r.bricks) + ' bricks';
    if (costEl) costEl.textContent = formatINR(r.cost);
    bar.hidden = false;
}

function scrollToCalcResult() {
    const panel = $('calcResult');
    if (panel) panel.scrollIntoView({ behavior: (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'), block: 'start' });
}

function openQuoteFromEstimate() {
    const r = lastEstimateResult;
    if (!r) { showToast(t('studio.needCalc'), 'error'); return; }
    const qty = $('rfqQty');
    if (qty) qty.value = String(r.bricks);
    const prod = $('rfqProduct');
    if (prod) {
        const want = estimateCartName(r);
        const opts = Array.from(prod.options || []);
        const match = opts.find(o => (o.textContent || '').toLowerCase().includes('brick')) || opts[0];
        if (match) prod.value = match.value;
    }
    if (typeof openBulkQuoteModal === 'function') openBulkQuoteModal();
    else showToast('Open the quotation form from Contact / RFQ.', 'info');
}

function saveEstimateNow() {
    if (!lastEstimatePayload) {
        const out = computeCurrent(false);
        if (!out) { showToast(t('studio.needCalc'), 'error'); return; }
        lastEstimatePayload = out.payload;
        lastEstimateSpec = out.spec;
        window.lastCalcEstimate = out.spec;
    }
    if (!window.OfflineStore) {
        showToast('Offline storage unavailable on this device.', 'error');
        return;
    }
    OfflineStore.saveEstimate(lastEstimatePayload).then(() => {
        renderSavedEstimates();
        try { document.dispatchEvent(new CustomEvent('gb:estimate-saved')); } catch (_e) { /* ignore */ }
        if (window.GbiPwa) GbiPwa.requestPersist();
        showToast('Estimate saved on this device.', 'success');
    });
}

// ── Empty state (shown on load and when switching modes) ──
function renderEmpty() {
    const box = $('calcResultsBody');
    if (!box) return;
    box.innerHTML = `
        <div class="studio-empty">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 21V8l6-4 6 4v13"/><path d="M15 21V11l6 3v7"/><line x1="3" y1="21" x2="21" y2="21"/></svg>
            <div class="studio-empty__t">${t('studio.emptyTitle')}</div>
            <div class="studio-empty__s">${t('studio.emptySub')}</div>
        </div>`;
    lastEstimateResult = null;
    updateMobileResultBar(null);
    const pv = $('wallPreviewWrap'); if (pv) pv.hidden = true;
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
            syncThicknessUI();
        } else if (currentCalcTab === 'house') {
            setVal('houseArea', 1000);
            if ($('houseFloors')) $('houseFloors').value = '2';
            if ($('houseBrickRate')) $('houseBrickRate').value = '7.05';
            setVal('houseRate', 7.05);
        } else {
            setVal('boundaryLength', 150); setVal('boundaryHeight', 6);
        }
        clearCalcDraft();
        const pv = $('wallPreviewWrap'); if (pv) pv.hidden = true;
        renderEmpty();
        // Restore defaults into live panel after reset
        scheduleLiveEstimate();
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
        .p-row b{font-weight:700} .tot{margin-top:12px;font-size:16px;color:#A83226}
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
    const pin = ($('pincodeInput') || {}).value || '';
    const grade = currentCalcTab === 'wall'
        ? (($('calcBrickType') || {}).selectedOptions && $('calcBrickType').selectedOptions[0]
            ? $('calcBrickType').selectedOptions[0].textContent.trim()
            : '')
        : (currentCalcTab === 'house'
            ? (($('houseBrickRate') || {}).selectedOptions && $('houseBrickRate').selectedOptions[0]
                ? $('houseBrickRate').selectedOptions[0].textContent.trim()
                : '')
            : 'Awwal ₹7.05');
    if (window.WhatsAppOrder && typeof WhatsAppOrder.sendEstimate === 'function') {
        WhatsAppOrder.sendEstimate({
            project: r.dims,
            bricks: r.bricks,
            cost: r.cost,
            grade: grade,
            pincode: pin
        });
        return;
    }
    const pinLine = pin ? `\n• Pincode: ${pin}` : '';
    const gradeLine = grade ? `\n• Grade: ${grade}` : '';
    const text = encodeURIComponent(`Namaste Gurukripa Ent Udyog!\nI used your online estimator:\n• Project: ${r.dims}${gradeLine}\n• Bricks estimate: ${formatNum(r.bricks)} pcs\n• Estimated brick cost: ${formatINR(r.cost)} (indicative)${pinLine}\n\nPlease confirm availability and delivery.`);
    window.open(`https://wa.me/919198923230?text=${text}`, '_blank', 'noopener');
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
// TABS — keyboard + remember last tab
// ══════════════════════════════════════════
function switchCalcTab(tab, opts) {
    const tabs = ['wall', 'house', 'boundary'];
    if (!tabs.includes(tab)) tab = 'wall';
    currentCalcTab = tab;
    document.querySelectorAll('#studioTablist .studio-tab, .studio-tabs .studio-tab').forEach(btn => {
        const on = btn.getAttribute('data-calc-tab') === tab || btn.id === ({ wall: 'cTabWallBtn', house: 'cTabHouseBtn', boundary: 'cTabBoundaryBtn' }[tab]);
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
        btn.tabIndex = on ? 0 : -1;
        if (on && opts && opts.scrollTab) {
            try { btn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } catch (_e) { /* ignore */ }
        }
    });
    document.querySelectorAll('.studio-pane').forEach(p => {
        p.classList.remove('active');
        p.hidden = true;
        p.setAttribute('aria-hidden', 'true');
    });
    const paneMap = { wall: 'calcTabWall', house: 'calcTabHouse', boundary: 'calcTabBoundary' };
    const p = $(paneMap[tab]);
    if (p) {
        p.classList.add('active');
        p.hidden = false;
        p.setAttribute('aria-hidden', 'false');
    }
    try { localStorage.setItem(CALC_TAB_KEY, tab); } catch (_e) { /* ignore */ }
    const pv = $('wallPreviewWrap'); if (pv) pv.hidden = true;
    clearErrs();
    if (!(opts && opts.keepResult)) renderEmpty();
    if (!(opts && opts.skipLive)) scheduleLiveEstimate();
}

function bindCalcTabs() {
    const list = $('studioTablist') || document.querySelector('#calculator .studio-tabs');
    if (!list || list.dataset.bound === '1') return;
    list.dataset.bound = '1';
    const tabs = () => Array.from(list.querySelectorAll('[role="tab"]'));
    list.addEventListener('click', (e) => {
        const btn = e.target.closest('[role="tab"]');
        if (!btn || !list.contains(btn)) return;
        const tab = btn.getAttribute('data-calc-tab');
        if (tab) switchCalcTab(tab, { scrollTab: true });
    });
    list.addEventListener('keydown', (e) => {
        const items = tabs();
        const i = items.indexOf(document.activeElement);
        if (i < 0) return;
        let next = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % items.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + items.length) % items.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = items.length - 1;
        else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const tab = items[i].getAttribute('data-calc-tab');
            if (tab) switchCalcTab(tab, { scrollTab: true });
            return;
        }
        if (next >= 0) {
            e.preventDefault();
            items[next].focus();
            const tab = items[next].getAttribute('data-calc-tab');
            if (tab) switchCalcTab(tab, { scrollTab: true });
        }
    });
}

// ══════════════════════════════════════════
// OFFLINE ESTIMATE HISTORY (IndexedDB)
// ══════════════════════════════════════════
const CALC_SAVED_LIMIT = 5;
let savedEstimatesCache = [];
let estimateSaveTimer = null;

function calcTimeLabel(ts) {
    if (!ts) return '';
    try {
        const lang = (typeof currentLang !== 'undefined' && currentLang === 'hi') ? 'hi-IN' : 'en-IN';
        return new Date(ts).toLocaleString(lang, {
            day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true
        });
    } catch (_e) {
        return '';
    }
}

function setOfflineStripState(state, text) {
    const strip = $('calcOfflineStrip');
    const el = $('calcOfflineState');
    if (strip) strip.setAttribute('data-state', state || 'ready');
    if (el && text) el.textContent = text;
}

function updateCalcOfflineState() {
    const el = $('calcOfflineState');
    if (!el) return;
    if (!window.OfflineStore) {
        setOfflineStripState('offline', 'Offline storage unavailable — estimates stay in this tab only.');
        return;
    }
    OfflineStore.status().then((s) => {
        const online = navigator.onLine;
        const age = s.savedAt ? (Date.now() - s.savedAt) : null;
        const stale = age != null && age > RATE_STALE_MS;
        const when = s.savedAt ? calcTimeLabel(s.savedAt) : '';
        const count = s.cachedRates || 0;
        if (!online) {
            setOfflineStripState('offline',
                count
                    ? `${count} brick rates saved offline · using saved rates · ${when}`
                    : 'Offline — using default grade rates until the card is saved.');
            return;
        }
        if (stale) {
            setOfflineStripState('stale',
                `${count} brick rates saved offline · updated ${when} (stale — refresh recommended)`);
            return;
        }
        setOfflineStripState('ready',
            s.savedAt
                ? `${count} brick rates saved offline · updated ${when}${s.queuedOrders ? ` · ${s.queuedOrders} order(s) queued` : ''}`
                : 'Estimator runs offline — download the rate card once for site work.');
    });
}

function refreshCalcRates() {
    const strip = $('calcOfflineStrip');
    setOfflineStripState('updating', 'Updating rates…');
    if (window.GbiPwa && typeof GbiPwa.updateRatesNow === 'function') {
        Promise.resolve(GbiPwa.updateRatesNow()).finally(() => updateCalcOfflineState());
        return;
    }
    if (!window.OfflineStore || typeof PRODUCTS === 'undefined') {
        updateCalcOfflineState();
        showToast('Catalogue unavailable.', 'error');
        return;
    }
    if (!navigator.onLine) {
        updateCalcOfflineState();
        showToast('Connect to update rates from the yard.', 'warning');
        return;
    }
    OfflineStore.cacheCatalog(PRODUCTS).then((res) => {
        updateCalcOfflineState();
        showToast((res.count || 0) + ' rates refreshed on this device.', 'success');
    }).catch(() => updateCalcOfflineState());
}

function scheduleEstimateSave(payload) {
    window.lastCalcEstimate = (lastEstimateSpec) ? lastEstimateSpec : payload;
    if (!window.OfflineStore) return;
    clearTimeout(estimateSaveTimer);
    estimateSaveTimer = setTimeout(() => {
        const last = savedEstimatesCache[0];
        const duplicate = last && last.tab === payload.tab && last.bricks === payload.bricks
            && last.cost === payload.cost && (Date.now() - (last.createdAt || 0)) < 10 * 60 * 1000;
        if (duplicate) { updateCalcOfflineState(); return; }
        OfflineStore.saveEstimate(payload).then(() => {
            renderSavedEstimates();
            try { document.dispatchEvent(new CustomEvent('gb:estimate-saved')); } catch (_e) { /* ignore */ }
            if (window.GbiPwa) GbiPwa.requestPersist();
        });
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
            <article class="calc-saved-card">
                <div class="calc-saved-main">
                    <strong>${sanitizeHTML(r.label || 'Estimate')}</strong>
                    <span>${formatNum(r.bricks)} bricks · ${formatINR(r.cost)}</span>
                    <span class="calc-saved-meta">${calcTimeLabel(r.createdAt)} · ${sanitizeHTML(r.tab || 'wall')}</span>
                </div>
                <div class="calc-saved-actions">
                    <button type="button" onclick="reuseEstimate(${i})">Open</button>
                    <button type="button" onclick="reorderEstimate(${i})">Re-order</button>
                    <button type="button" onclick="deleteSavedEstimate(${i})">Delete</button>
                </div>
            </article>`).join('');
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
    switchCalcTab(row.tab || 'wall', { keepResult: true, skipLive: true });
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
        syncThicknessUI();
    }
    onCalcUnitChange();
    runEstimate();
    showToast('Saved estimate loaded — adjust dimensions to recalculate.', 'success');
}

function reorderEstimate(index) {
    reuseEstimate(index);
    setTimeout(() => {
        if (lastEstimateResult) sendEstimateWhatsApp();
    }, 80);
}

function deleteSavedEstimate(index) {
    const row = savedEstimatesCache[index];
    if (!row || !window.OfflineStore) return;
    const done = () => {
        savedEstimatesCache.splice(index, 1);
        renderSavedEstimates();
        showToast('Saved estimate deleted.', 'success');
    };
    if (typeof OfflineStore.deleteEstimate === 'function' && row.id != null) {
        OfflineStore.deleteEstimate(row.id).then(done);
        return;
    }
    // Fallback: clear + re-save remaining
    const keep = savedEstimatesCache.filter((_, i) => i !== index);
    OfflineStore.clearEstimates().then(() => {
        return Promise.all(keep.reverse().map((r) => OfflineStore.saveEstimate(r)));
    }).then(done);
}

function clearSavedEstimates() {
    if (!window.OfflineStore) return;
    OfflineStore.clearEstimates().then(() => {
        savedEstimatesCache = [];
        renderSavedEstimates();
        showToast('Saved estimates cleared from this device.', 'success');
    });
}

// ── localStorage restore (in-progress inputs) ──
function collectCalcDraft() {
    return {
        tab: currentCalcTab,
        unit: getUnit(),
        wall: {
            len: ($('calcLength') || {}).value,
            ht: ($('calcHeight') || {}).value,
            thick: ($('calcThickness') || {}).value,
            openings: ($('calcOpenings') || {}).value,
            brickType: ($('calcBrickType') || {}).value,
            rate: ($('calcRate') || {}).value
        },
        house: {
            area: ($('houseArea') || {}).value,
            floors: ($('houseFloors') || {}).value,
            brickRate: ($('houseBrickRate') || {}).value,
            rate: ($('houseRate') || {}).value
        },
        boundary: {
            len: ($('boundaryLength') || {}).value,
            ht: ($('boundaryHeight') || {}).value
        },
        pin: ($('pincodeInput') || {}).value || ''
    };
}

function persistCalcDraft() {
    clearTimeout(calcDraftTimer);
    calcDraftTimer = setTimeout(() => {
        try {
            localStorage.setItem(CALC_DRAFT_KEY, JSON.stringify(collectCalcDraft()));
        } catch (_e) { /* quota / private mode */ }
    }, 200);
}

function clearCalcDraft() {
    try { localStorage.removeItem(CALC_DRAFT_KEY); } catch (_e) { /* ignore */ }
}

function restoreCalcDraft() {
    let raw = null;
    try { raw = localStorage.getItem(CALC_DRAFT_KEY); } catch (_e) { return false; }
    if (!raw) return false;
    let data;
    try { data = JSON.parse(raw); } catch (_e) { return false; }
    if (!data || typeof data !== 'object') return false;
    if (data.unit) setCalcInput('calcUnit', data.unit);
    if (data.wall) {
        setCalcInput('calcLength', data.wall.len);
        setCalcInput('calcHeight', data.wall.ht);
        setCalcInput('calcThickness', data.wall.thick);
        setCalcInput('calcOpenings', data.wall.openings);
        setCalcInput('calcBrickType', data.wall.brickType);
        setCalcInput('calcRate', data.wall.rate);
    }
    if (data.house) {
        setCalcInput('houseArea', data.house.area);
        setCalcInput('houseFloors', data.house.floors);
        setCalcInput('houseBrickRate', data.house.brickRate);
        setCalcInput('houseRate', data.house.rate);
    }
    if (data.boundary) {
        setCalcInput('boundaryLength', data.boundary.len);
        setCalcInput('boundaryHeight', data.boundary.ht);
    }
    if (data.pin) setCalcInput('pincodeInput', data.pin);
    onCalcUnitChange();
    syncThicknessUI();
    return true;
}

function bindCalcFormDelegation() {
    const form = $('studioForm');
    if (!form || form.dataset.bound === '1') return;
    form.dataset.bound = '1';
    form.addEventListener('input', (e) => {
        const tEl = e.target;
        if (!tEl) return;
        if (tEl.matches('input, select')) {
            scheduleLiveEstimate();
            persistCalcDraft();
        }
    });
    form.addEventListener('change', (e) => {
        const tEl = e.target;
        if (!tEl) return;
        if (tEl.id === 'calcUnit') onCalcUnitChange();
        if (tEl.id === 'calcThickness') syncThicknessUI();
        scheduleLiveEstimate();
        persistCalcDraft();
    });
    form.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-stepper]');
        if (!btn || !form.contains(btn)) return;
        const id = btn.getAttribute('data-target');
        const step = parseFloat(btn.getAttribute('data-stepper'));
        const el = $(id);
        if (!el || !isFinite(step)) return;
        const cur = parseFloat(el.value) || 0;
        const min = parseFloat(el.min);
        let next = cur + step;
        if (isFinite(min)) next = Math.max(min, next);
        const stepAttr = parseFloat(el.step);
        if (isFinite(stepAttr) && stepAttr > 0) {
            const decimals = String(stepAttr).includes('.') ? String(stepAttr).split('.')[1].length : 0;
            next = Number(next.toFixed(decimals));
        }
        el.value = next;
        scheduleLiveEstimate();
        persistCalcDraft();
    });
}

function setupPreviewObserver() {
    const section = $('calculator');
    if (!section || typeof IntersectionObserver === 'undefined') return;
    calcPreviewObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            calcSectionVisible = entry.isIntersecting;
            if (entry.isIntersecting && calcPreviewPending && window.drawWallPreview) {
                window.drawWallPreview(calcPreviewPending.len, calcPreviewPending.ht, calcPreviewPending.thick);
            }
            updateMobileResultBar(lastEstimateResult);
        });
    }, { rootMargin: '80px', threshold: 0 });
    calcPreviewObserver.observe(section);
}

function syncOpeningsAccordion() {
    const acc = $('calcOpeningsAccordion');
    if (!acc) return;
    const wide = window.matchMedia('(min-width: 640px)').matches;
    acc.open = wide;
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

// ── Auto-initialize the estimator panel ──
(function initCalculator() {
    const run = () => {
        if (!$('calcLength')) return;
        // Measure sticky header for scroll-margin / sticky panel
        try {
            const nav = document.querySelector('.navbar, #navbar, header.site-header, .site-nav');
            if (nav) {
                const h = Math.ceil(nav.getBoundingClientRect().height) || 64;
                document.documentElement.style.setProperty('--header-h', h + 'px');
                document.documentElement.style.setProperty('--nav-h', h + 'px');
            }
        } catch (_e) { /* ignore */ }

        bindCalcTabs();
        bindCalcFormDelegation();
        setupPreviewObserver();
        syncOpeningsAccordion();
        window.addEventListener('resize', () => {
            syncOpeningsAccordion();
        }, { passive: true });
        window.addEventListener('online', updateCalcOfflineState);
        window.addEventListener('offline', updateCalcOfflineState);
        document.addEventListener('gb:lang-changed', () => {
            updateCalcOfflineState();
            renderSavedEstimates();
            if (lastEstimateResult) renderEstimate(lastEstimateResult);
        });

        restoreCalcDraft();
        let savedTab = null;
        try { savedTab = localStorage.getItem(CALC_TAB_KEY); } catch (_e) { /* ignore */ }
        onCalcUnitChange();
        syncThicknessUI();
        if (savedTab && ['wall', 'house', 'boundary'].includes(savedTab)) {
            switchCalcTab(savedTab, { skipLive: true, keepResult: true });
        }
        renderSavedEstimates();
        updateCalcOfflineState();
        // Live calc with defaults so the panel is never empty after load
        scheduleLiveEstimate();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
})();
