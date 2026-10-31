// ══════════════════════════════════════════
// 3-IN-1 ESTIMATOR STUDIO
// ══════════════════════════════════════════
let currentCalcTab = 'wall';
let lastCalculatedBricks = 1640;
let lastCalculatedTotalCost = 19680;
// Snapshot of the last run, reused by the WhatsApp order handoff.
let lastEstimateSpec = null;

function switchCalcTab(tab) {
    currentCalcTab = tab;
    document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.calc-tab-panel').forEach(p => p.classList.remove('active'));
    if (tab === 'wall') {
        document.getElementById('cTabWallBtn')?.classList.add('active');
        document.getElementById('calcTabWall')?.classList.add('active');
        calculateBricks();
    } else if (tab === 'house') {
        document.getElementById('cTabHouseBtn')?.classList.add('active');
        document.getElementById('calcTabHouse')?.classList.add('active');
        calculateHouseMaterial();
    } else if (tab === 'boundary') {
        document.getElementById('cTabBoundaryBtn')?.classList.add('active');
        document.getElementById('calcTabBoundary')?.classList.add('active');
        calculateBoundaryMaterial();
    }
}

function calculateBricks() {
    const len   = parseFloat(document.getElementById('calcLength')?.value || 20);
    const ht    = parseFloat(document.getElementById('calcHeight')?.value || 10);
    const thick = parseFloat(document.getElementById('calcThickness')?.value || 9);
    const price = parseFloat(document.getElementById('calcBrickType')?.value || 12);
    const resBody = document.getElementById('calcResultsBody');
    if (!resBody) return;

    const area       = len * ht;
    const bricks     = Math.ceil(area * 8.6 * (thick / 4.5));
    const trolleys   = (bricks / 4000).toFixed(1);
    const totalCost  = Math.ceil(bricks * price);
    const cementBags = Math.ceil(bricks * 0.007);
    const sandCuFt   = Math.ceil(bricks * 0.35);

    lastCalculatedBricks    = bricks;
    lastCalculatedTotalCost = totalCost;
    lastEstimateSpec = {
        tab: 'wall',
        project: `Wall (${len}ft × ${ht}ft, ${thick}" thick)`,
        bricks: bricks,
        trolleys: parseFloat(trolleys),
        cementBags: cementBags,
        sandCuFt: sandCuFt,
        cost: totalCost
    };
    scheduleEstimateSave({
        tab: 'wall',
        label: `Wall ${len}ft × ${ht}ft`,
        bricks: bricks,
        cost: totalCost,
        inputs: { len: len, ht: ht, thick: thick, price: price }
    });

    resBody.innerHTML = `
        <div class="estimator-results-grid">
            <div class="estimator-card"><div class="estimator-val">${formatNum(bricks)}</div><div class="estimator-label">Bricks Needed</div></div>
            <div class="estimator-card"><div class="estimator-val">${trolleys}</div><div class="estimator-label">Trolleys (4k/tr)</div></div>
            <div class="estimator-card"><div class="estimator-val">${cementBags}</div><div class="estimator-label">Cement Bags</div></div>
            <div class="estimator-card"><div class="estimator-val">${sandCuFt} cu.ft</div><div class="estimator-label">Sand Volume</div></div>
        </div>
        <div style="background:var(--brand-glow);border:1px solid var(--line-mid);border-radius:var(--r-md);padding:14px;margin-bottom:14px;text-align:center">
            <div style="font-size:.75rem;color:var(--ink-3);font-weight:700">ESTIMATED TOTAL BUDGET</div>
            <div style="font-size:1.6rem;font-weight:800;color:var(--brand)">${formatINR(totalCost)}</div>
            <div style="font-size:.72rem;color:var(--ink-2)">Includes 5% construction breakage margin</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary btn-full" style="background:#16a34a;flex:1" onclick="sendWhatsAppQuote('Wall (${len}x${ht}ft)', ${bricks}, ${totalCost})">💬 Instant WhatsApp Quote</button>
            <button class="btn btn-outline btn-full" style="flex:1" onclick="addCalcToCart('Wall Bricks', ${bricks}, ${price})">🛒 Add Bricks to Cart</button>
        </div>`;

    if (window.drawWallPreview) window.drawWallPreview(len, ht, thick);
    updateMobileStickySummary(`Wall (${len}x${ht}ft)`, bricks, totalCost);
    if (navigator.vibrate) navigator.vibrate(30);
}

function calculateHouseMaterial() {
    const sqft   = parseFloat(document.getElementById('houseArea')?.value || 1000);
    const floors = parseInt(document.getElementById('houseFloors')?.value || 2);
    const price  = parseFloat(document.getElementById('houseBrickRate')?.value || 7.05);
    const resBody = document.getElementById('calcResultsBody');
    if (!resBody) return;

    const bricks     = Math.ceil(sqft * floors * 19);
    const trolleys   = (bricks / 4000).toFixed(1);
    const totalCost  = Math.ceil(bricks * price);
    const cementBags = Math.ceil(sqft * floors * 0.4);
    const sandCuFt   = Math.ceil(sqft * floors * 1.8);

    lastCalculatedBricks    = bricks;
    lastCalculatedTotalCost = totalCost;
    lastEstimateSpec = {
        tab: 'house',
        project: `Full house (${sqft} sq.ft × ${floors} floor${floors > 1 ? 's' : ''})`,
        bricks: bricks,
        trolleys: parseFloat(trolleys),
        cementBags: cementBags,
        sandCuFt: sandCuFt,
        cost: totalCost
    };
    scheduleEstimateSave({
        tab: 'house',
        label: `House ${sqft} sq.ft`,
        bricks: bricks,
        cost: totalCost,
        inputs: { sqft: sqft, floors: floors, price: price }
    });

    resBody.innerHTML = `
        <div class="estimator-results-grid">
            <div class="estimator-card"><div class="estimator-val">${formatNum(bricks)}</div><div class="estimator-label">Total Bricks</div></div>
            <div class="estimator-card"><div class="estimator-val">${trolleys}</div><div class="estimator-label">Trolley Load</div></div>
            <div class="estimator-card"><div class="estimator-val">${cementBags} bags</div><div class="estimator-label">Cement Est.</div></div>
            <div class="estimator-card"><div class="estimator-val">${sandCuFt} cu.ft</div><div class="estimator-label">Sand Volume</div></div>
        </div>
        <div style="background:var(--brand-glow);border:1px solid var(--line-mid);border-radius:var(--r-md);padding:14px;margin-bottom:14px;text-align:center">
            <div style="font-size:.75rem;color:var(--ink-3);font-weight:700">TOTAL HOUSE BRICK BUDGET</div>
            <div style="font-size:1.6rem;font-weight:800;color:var(--brand)">${formatINR(totalCost)}</div>
            <div style="font-size:.72rem;color:var(--ink-2)">Built-up: ${sqft} sq.ft × ${floors} floors</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary btn-full" style="background:#16a34a;flex:1" onclick="sendWhatsAppQuote('Full House (${sqft}sqft, ${floors} floors)', ${bricks}, ${totalCost})">💬 Instant WhatsApp Quote</button>
            <button class="btn btn-outline btn-full" style="flex:1" onclick="addCalcToCart('House Construction Bricks', ${bricks}, ${price})">🛒 Add Bricks to Cart</button>
        </div>`;

    updateMobileStickySummary(`House (${sqft}sqft, ${floors}fl)`, bricks, totalCost);
    if (navigator.vibrate) navigator.vibrate(30);
}

function calculateBoundaryMaterial() {
    const len   = parseFloat(document.getElementById('boundaryLength')?.value || 150);
    const ht    = parseFloat(document.getElementById('boundaryHeight')?.value || 6);
    const resBody = document.getElementById('calcResultsBody');
    if (!resBody) return;

    const price     = 7.05;
    const bricks    = Math.ceil(len * ht * 9.5);
    const trolleys  = (bricks / 4000).toFixed(1);
    const totalCost = Math.ceil(bricks * price);

    lastCalculatedBricks    = bricks;
    lastCalculatedTotalCost = totalCost;
    lastEstimateSpec = {
        tab: 'boundary',
        project: `Boundary wall (${len}ft × ${ht}ft)`,
        bricks: bricks,
        trolleys: parseFloat(trolleys),
        cost: totalCost
    };
    scheduleEstimateSave({
        tab: 'boundary',
        label: `Boundary ${len}ft × ${ht}ft`,
        bricks: bricks,
        cost: totalCost,
        inputs: { len: len, ht: ht }
    });

    resBody.innerHTML = `
        <div class="estimator-results-grid">
            <div class="estimator-card"><div class="estimator-val">${formatNum(bricks)}</div><div class="estimator-label">Bricks Needed</div></div>
            <div class="estimator-card"><div class="estimator-val">${trolleys}</div><div class="estimator-label">Trolley Count</div></div>
        </div>
        <div style="background:var(--brand-glow);border:1px solid var(--line-mid);border-radius:var(--r-md);padding:14px;margin-bottom:14px;text-align:center">
            <div style="font-size:.75rem;color:var(--ink-3);font-weight:700">BOUNDARY WALL ESTIMATED COST</div>
            <div style="font-size:1.6rem;font-weight:800;color:var(--brand)">${formatINR(totalCost)}</div>
            <div style="font-size:.72rem;color:var(--ink-2)">Perimeter: ${len}ft × ${ht}ft height</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary btn-full" style="background:#16a34a;flex:1" onclick="sendWhatsAppQuote('Boundary Wall (${len}ft)', ${bricks}, ${totalCost})">💬 Instant WhatsApp Quote</button>
            <button class="btn btn-outline btn-full" style="flex:1" onclick="addCalcToCart('Boundary Wall Bricks', ${bricks}, ${price})">🛒 Add Bricks to Cart</button>
        </div>`;

    if (window.drawWallPreview) window.drawWallPreview(len, ht, 9);
    updateMobileStickySummary(`Boundary (${len}ft)`, bricks, totalCost);
    if (navigator.vibrate) navigator.vibrate(30);
}

function updateMobileStickySummary(projName, brickCount, totalCost) {
    const el = document.getElementById('estimatorMobileSticky');
    if (!el) return;
    el.innerHTML = `
        <div class="est-sticky-inner">
            <div class="est-sticky-left">
                <div class="est-sticky-label">Estimated Budget (${projName.split('(')[0].trim()})</div>
                <div class="est-sticky-val">${formatINR(totalCost)} <small>(${formatNum(brickCount)} bricks)</small></div>
            </div>
            <button class="btn btn-primary btn-sm est-sticky-btn" onclick="sendWhatsAppQuote('${projName}', ${brickCount}, ${totalCost})">
                💬 WhatsApp Quote
            </button>
        </div>`;
}

function sendWhatsAppQuote(projName, brickCount, totalCost) {
    if (window.WhatsAppOrder) {
        WhatsAppOrder.sendEstimate({ project: projName, bricks: brickCount, cost: totalCost });
        return;
    }
    const text = encodeURIComponent(`Namaste Gurukripa Bricks Industry!\nI need a quotation for my project:\n• Project: ${projName}\n• Bricks Estimate: ${formatNum(brickCount)} units\n• Estimated Budget: ${formatINR(totalCost)}\n\nPlease confirm availability and delivery slot.`);
    window.open(`https://wa.me/919198923230?text=${text}`, '_blank');
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
    const el = document.getElementById('calcOfflineState');
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
    window.lastCalcEstimate = (typeof lastEstimateSpec !== 'undefined' && lastEstimateSpec) ? lastEstimateSpec : payload;
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
    const box = document.getElementById('calcSavedEstimates');
    if (!box) return;
    if (!window.OfflineStore) {
        box.innerHTML = '<div class="calc-saved-empty">This browser is blocking device storage.</div>';
        return;
    }
    OfflineStore.listEstimates(CALC_SAVED_LIMIT).then((rows) => {
        savedEstimatesCache = rows;
        updateCalcOfflineState();
        if (!rows.length) {
            box.innerHTML = '<div class="calc-saved-empty">No saved estimates yet — every calculation is stored here for site visits.</div>';
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
    const el = document.getElementById(id);
    if (el && value != null && value !== '') el.value = value;
}

function reuseEstimate(index) {
    const row = savedEstimatesCache[index];
    if (!row || !row.inputs) return;
    const inputs = row.inputs;
    if (row.tab === 'house') {
        setCalcInput('houseArea', inputs.sqft);
        setCalcInput('houseFloors', inputs.floors);
        setCalcInput('houseBrickRate', inputs.price);
    } else if (row.tab === 'boundary') {
        setCalcInput('boundaryLength', inputs.len);
        setCalcInput('boundaryHeight', inputs.ht);
    } else {
        setCalcInput('calcLength', inputs.len);
        setCalcInput('calcHeight', inputs.ht);
        setCalcInput('calcThickness', inputs.thick);
        setCalcInput('calcBrickType', inputs.price);
    }
    switchCalcTab(row.tab || 'wall');
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

// ── Auto-initialize the estimator result panel when the section is present ──
(function initCalculator() {
    const run = () => {
        if (!document.getElementById('calcLength')) return;
        calculateBricks();
        renderSavedEstimates();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
})();
