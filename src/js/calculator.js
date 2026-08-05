// ══════════════════════════════════════════
// 3-IN-1 ESTIMATOR STUDIO
// ══════════════════════════════════════════
let currentCalcTab = 'wall';
let lastCalculatedBricks = 1640;
let lastCalculatedTotalCost = 19680;

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

    resBody.innerHTML = `
        <div class="estimator-results-grid">
            <div class="estimator-card"><div class="estimator-val">${bricks.toLocaleString('en-IN')}</div><div class="estimator-label">Bricks Needed</div></div>
            <div class="estimator-card"><div class="estimator-val">${trolleys}</div><div class="estimator-label">Trolleys (4k/tr)</div></div>
            <div class="estimator-card"><div class="estimator-val">${cementBags}</div><div class="estimator-label">Cement Bags</div></div>
            <div class="estimator-card"><div class="estimator-val">${sandCuFt} cu.ft</div><div class="estimator-label">Sand Volume</div></div>
        </div>
        <div style="background:var(--brand-glow);border:1px solid var(--line-mid);border-radius:var(--r-md);padding:14px;margin-bottom:14px;text-align:center">
            <div style="font-size:.75rem;color:var(--ink-3);font-weight:700">ESTIMATED TOTAL BUDGET</div>
            <div style="font-size:1.6rem;font-weight:800;color:var(--brand)">₹${totalCost.toLocaleString('en-IN')}</div>
            <div style="font-size:.72rem;color:var(--ink-2)">Includes 5% construction breakage margin</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary btn-full" style="background:#16a34a;flex:1" onclick="sendWhatsAppQuote('Wall (${len}x${ht}ft)', ${bricks}, ${totalCost})">💬 Instant WhatsApp Quote</button>
            <button class="btn btn-outline btn-full" style="flex:1" onclick="addCalcToCart('Wall Bricks', ${bricks}, ${price})">🛒 Add Bricks to Cart</button>
        </div>`;
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

    resBody.innerHTML = `
        <div class="estimator-results-grid">
            <div class="estimator-card"><div class="estimator-val">${bricks.toLocaleString('en-IN')}</div><div class="estimator-label">Total Bricks</div></div>
            <div class="estimator-card"><div class="estimator-val">${trolleys}</div><div class="estimator-label">Trolley Load</div></div>
            <div class="estimator-card"><div class="estimator-val">${cementBags} bags</div><div class="estimator-label">Cement Est.</div></div>
            <div class="estimator-card"><div class="estimator-val">${sandCuFt} cu.ft</div><div class="estimator-label">Sand Volume</div></div>
        </div>
        <div style="background:var(--brand-glow);border:1px solid var(--line-mid);border-radius:var(--r-md);padding:14px;margin-bottom:14px;text-align:center">
            <div style="font-size:.75rem;color:var(--ink-3);font-weight:700">TOTAL HOUSE BRICK BUDGET</div>
            <div style="font-size:1.6rem;font-weight:800;color:var(--brand)">₹${totalCost.toLocaleString('en-IN')}</div>
            <div style="font-size:.72rem;color:var(--ink-2)">Built-up: ${sqft} sq.ft × ${floors} floors</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary btn-full" style="background:#16a34a;flex:1" onclick="sendWhatsAppQuote('Full House (${sqft}sqft, ${floors} floors)', ${bricks}, ${totalCost})">💬 Instant WhatsApp Quote</button>
            <button class="btn btn-outline btn-full" style="flex:1" onclick="addCalcToCart('House Construction Bricks', ${bricks}, ${price})">🛒 Add Bricks to Cart</button>
        </div>`;
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

    resBody.innerHTML = `
        <div class="estimator-results-grid">
            <div class="estimator-card"><div class="estimator-val">${bricks.toLocaleString('en-IN')}</div><div class="estimator-label">Bricks Needed</div></div>
            <div class="estimator-card"><div class="estimator-val">${trolleys}</div><div class="estimator-label">Trolley Count</div></div>
        </div>
        <div style="background:var(--brand-glow);border:1px solid var(--line-mid);border-radius:var(--r-md);padding:14px;margin-bottom:14px;text-align:center">
            <div style="font-size:.75rem;color:var(--ink-3);font-weight:700">BOUNDARY WALL ESTIMATED COST</div>
            <div style="font-size:1.6rem;font-weight:800;color:var(--brand)">₹${totalCost.toLocaleString('en-IN')}</div>
            <div style="font-size:.72rem;color:var(--ink-2)">Perimeter: ${len}ft × ${ht}ft height</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary btn-full" style="background:#16a34a;flex:1" onclick="sendWhatsAppQuote('Boundary Wall (${len}ft)', ${bricks}, ${totalCost})">💬 Instant WhatsApp Quote</button>
            <button class="btn btn-outline btn-full" style="flex:1" onclick="addCalcToCart('Boundary Wall Bricks', ${bricks}, ${price})">🛒 Add Bricks to Cart</button>
        </div>`;
}

function sendWhatsAppQuote(projName, brickCount, totalCost) {
    const text = encodeURIComponent(`Namaste Gurukripa Bricks Industry!\nI need a quotation for my project:\n• Project: ${projName}\n• Bricks Estimate: ${brickCount.toLocaleString('en-IN')} units\n• Estimated Budget: ₹${totalCost.toLocaleString('en-IN')}\n\nPlease confirm availability and delivery slot.`);
    window.open(`https://wa.me/919198923230?text=${text}`, '_blank');
}

function addCalcToCart(name, qty, unitPrice) {
    const existing = cart.find(c => c.name === name);
    if (existing) { existing.qty += qty; }
    else { cart.push({ id: Date.now(), name, price: unitPrice, unit: 'per piece', qty, img: 'src/assets/images/brick_product_1.png' }); }
    saveCart();
    updateCartUI();
    openCart();
    showToast(`🛒 Added ${qty.toLocaleString('en-IN')} ${name} to cart!`, 'success');
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
            showToast('🔔 Grade-A Metallic Ringing Sound (खनक)', 'success');
        } else if (type === 'laalPeti') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, now);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
            showToast('🔉 Clear Brick Ring', 'info');
        } else {
            osc.type = 'square';
            osc.frequency.setValueAtTime(180, now);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
            showToast('Dull Low-Grade Sound (Unbaked)', 'warning');
        }
    } catch (e) {
        console.warn('Web Audio error:', e);
        showToast('🔔 Brick sound test played!');
    }
}
