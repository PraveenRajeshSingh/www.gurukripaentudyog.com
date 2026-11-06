function handleCheckoutAddressCheck() {
    const city = document.getElementById('coCity')?.value || '';
    const pin = document.getElementById('coPincode')?.value || '';
    const badge = document.getElementById('serviceabilityBadge');
    if (!badge) return;

    if (window.GurukripaMaps && typeof window.GurukripaMaps.checkServiceability === 'function') {
        const res = window.GurukripaMaps.checkServiceability(`${city} ${pin}`);
        badge.style.display = 'block';
        if (res.serviceable) {
            badge.style.background = 'var(--success-bg)';
            badge.style.color = 'var(--success)';
            badge.textContent = `✓ Serviceable Delivery Zone: ${res.estimatedDays}`;
        } else {
            badge.style.background = 'var(--warning-bg)';
            badge.style.color = 'var(--warning)';
            badge.textContent = `⚠️ Extended Delivery Area: ${res.baseZone}`;
        }
    }
}

// ══════════════════════════════════════════
// TROLLEY LOAD MATH
// ══════════════════════════════════════════
// One tractor-trolley carries 4,000 pcs at these yards — the same figure the
// rate card quotes (₹25,000 / 4,000 pcs) and the wall estimator divides by.
// The checkout meter is built on it so a buyer can see how many loads the
// cart actually needs before the yard books them.
const TROLLEY_CAPACITY_PCS = 4000;

// Every catalog line is priced per piece, so pieces are the summed quantity.
// Anything not counted in pieces is skipped rather than guessed at.
function cartPieces() {
    return cart.reduce((sum, i) => {
        return (/piece|\bpcs\b/i.test(String(i.unit || '')) ? sum + (Number(i.qty) || 0) : sum);
    }, 0);
}

function trolleyLoad(pieces) {
    const pcs = Math.max(0, Number(pieces) || 0);
    const full = Math.floor(pcs / TROLLEY_CAPACITY_PCS);
    const remainder = pcs % TROLLEY_CAPACITY_PCS;
    return {
        pieces: pcs,
        capacity: TROLLEY_CAPACITY_PCS,
        pct: Math.min(100, Math.round((pcs / TROLLEY_CAPACITY_PCS) * 100)),
        full: full,
        remainder: remainder,
        // Loads the yard has to send — the partial counts as one trip.
        loads: full + (remainder > 0 ? 1 : 0),
        caption: full > 0
            ? (remainder ? full + ' full + ' + formatNum(remainder) + ' pcs of the next' : full + ' × full trolley')
            : formatNum(pcs) + ' of ' + formatNum(TROLLEY_CAPACITY_PCS) + ' pcs'
    };
}

// Progress bar + honest trip count. Hidden when the cart has no piece lines.
function renderTrolleyMeter() {
    const box = document.getElementById('coTrolleyMeter');
    if (!box) return;
    const load = trolleyLoad(cartPieces());
    if (!load.pieces) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    box.classList.remove('hidden');
    box.innerHTML = `
        <div class="trolley-meter__top">
            <span class="trolley-meter__label">Trolley Load</span>
            <span class="trolley-meter__val">${load.pct}% · ${formatNum(load.pieces)} / ${formatNum(load.capacity)} pcs</span>
        </div>
        <div class="trolley-meter__track" role="progressbar" aria-valuenow="${load.pct}" aria-valuemin="0" aria-valuemax="100"
             aria-label="Cart against one trolley capacity">
            <div class="trolley-meter__fill${load.remainder === 0 && load.full > 0 ? ' trolley-meter__fill--exact' : ''}" style="width:${Math.max(2, load.pct)}%"></div>
        </div>
        <div class="trolley-meter__foot">
            <span>${load.caption}</span>
            <span class="trolley-meter__loads">${load.loads} load${load.loads > 1 ? 's' : ''} to book</span>
        </div>`;
}

// ══════════════════════════════════════════
// CHECKOUT & PAYMENT WIZARD
// ══════════════════════════════════════════

// The sheet keeps one sticky action bar for every step, so the buyer always
// sees the payable total and the two ways to order. This tracks where they are.
let checkoutStep = 1;

function renderCheckoutFooter(n) {
    const foot = document.getElementById('coFoot');
    const primary = document.getElementById('coFootPrimary');
    if (!foot || !primary) return;

    // Step 3 brings its own confirmation actions, so the bar steps aside.
    foot.classList.toggle('hidden', n === 3);
    foot.classList.remove('is-busy');

    if (n === 1) {
        primary.innerHTML = 'Continue to Payment →';
        primary.setAttribute('aria-label', 'Continue to payment');
    } else {
        primary.innerHTML = 'Pay via UPI / Cash on Delivery';
        primary.setAttribute('aria-label', 'Confirm order and pay');
    }
}

// One handler for the sticky primary button; it means whatever the current
// step means, which is why the sheet never shows two primary actions.
function coFootPrimaryAction() {
    if (checkoutStep === 1) { goToPayment(); return; }
    if (checkoutStep === 2) { placeOrder(); return; }
    closeCheckout();
}

// Processing state: the total stays visible, the buttons drop out so a tap
// cannot send the same order twice.
function setCheckoutBusy(on) {
    const foot = document.getElementById('coFoot');
    if (foot) foot.classList.toggle('is-busy', !!on);
}

function openCheckout() {
    if (!cart.length) { showToast(t('checkout.emptyCart')); return; }
    closeCart();
    resetCheckout();
    buildCheckoutSummary();
    if (window.SavedSites) SavedSites.renderAll();
    document.getElementById('checkoutModal')?.classList.add('open');
    overlayLock();
}

function closeCheckout() {
    document.getElementById('checkoutModal')?.classList.remove('open');
    overlayUnlock();
}

function handleCheckoutOverlayClick(e) {
    if (e.target.id === 'checkoutModal') closeCheckout();
}

function resetCheckout() {
    showCheckoutStep(1);
    ['1', '2', '3'].forEach(i => {
        const w = document.getElementById('cStepWrap' + i);
        if (w) w.className = i === '1' ? 'co-step-wrap active' : 'co-step-wrap';
    });
}

function showCheckoutStep(n) {
    checkoutStep = n;
    [1, 2, 3].forEach(i => {
        const p = document.getElementById('checkoutStep' + i);
        if (p) p.classList.toggle('active', i === n);

        const w = document.getElementById('cStepWrap' + i);
        if (w) {
            if (i < n) w.className = 'co-step-wrap done';
            else if (i === n) w.className = 'co-step-wrap active';
            else w.className = 'co-step-wrap';
        }
    });
    renderCheckoutFooter(n);
}

function buildCheckoutSummary() {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const total = Math.max(0, subtotal - couponDiscount);
    const html = `
        ${cart.map(i => `<div class="checkout-item-row" style="display:flex;justify-content:space-between;font-size:.84rem;padding:4px 0;color:var(--ink-2)"><span>${sanitizeHTML(i.name)} ×${i.qty}</span><span style="font-weight:600">${formatINR(i.price * i.qty)}</span></div>`).join('')}
        <div class="checkout-total-row" style="display:flex;justify-content:space-between;font-size:.95rem;font-weight:700;padding-top:8px;border-top:1px dashed var(--line-mid);color:var(--brand);margin-top:6px"><span>Grand Total</span><span>${formatINR(total)}</span></div>
    `;
    const s1 = document.getElementById('checkoutSummary');
    const s2 = document.getElementById('checkoutSummary2');
    if (s1) s1.innerHTML = html;
    if (s2) s2.innerHTML = html;

    renderTrolleyMeter();
    const payable = document.getElementById('coPayableTotal');
    if (payable) payable.textContent = formatINR(total);
}

// Called by the form submit and by the sticky footer button, so the event is
// optional — the checks are the same either way.
function goToPayment(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const name = document.getElementById('coName')?.value.trim();
    const phone = document.getElementById('coPhone')?.value.trim();
    const address = document.getElementById('coAddress')?.value.trim();

    if (!name || !phone || !address) {
        showToast(t('checkout.fillFields'), 'error');
        return;
    }

    showCheckoutStep(2);
    buildCheckoutSummary();
}

function backToDetails() {
    showCheckoutStep(1);
}

function selectPayMethod(el) {
    document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('selected'));
    el.classList.add('selected');
    selectedPayMethod = el.dataset.method;

    const pUpi = document.getElementById('panelUpi');
    const pCard = document.getElementById('panelCard');
    const pCod = document.getElementById('panelCod');

    if (pUpi) pUpi.classList.toggle('visible', selectedPayMethod === 'upi');
    if (pCard) pCard.classList.toggle('visible', selectedPayMethod === 'card');
    if (pCod) pCod.classList.toggle('visible', selectedPayMethod === 'cod');
}

function copyUpiId() {
    const input = document.getElementById('officialUpiId');
    if (!input) return;
    input.select();
    navigator.clipboard?.writeText(input.value);
    showToast(t('checkout.upiCopied'), 'success');
}

function syncCardVisual() {
    const input = document.getElementById('cardNumInput');
    if (!input) return;
    let raw = input.value.replace(/\D/g, '').substring(0, 16);
    let formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    input.value = formatted;

    const exp = document.getElementById('cardExpInput')?.value || 'MM/YY';
    const name = document.getElementById('coName')?.value || 'YOUR NAME';

    const numDisp = document.getElementById('cardNumDisp');
    const expDisp = document.getElementById('cardExpDisp');
    const nameDisp = document.getElementById('cardNameDisp');

    if (numDisp) numDisp.textContent = formatted || '•••• •••• •••• ••••';
    if (expDisp) expDisp.textContent = exp || 'MM/YY';
    if (nameDisp) nameDisp.textContent = name.toUpperCase();
}

function placeOrder() {
    const btnsRow = document.getElementById('checkoutPayBtns');
    const procState = document.getElementById('paymentProcessingState');

    if (btnsRow) btnsRow.style.display = 'none';
    if (procState) procState.style.display = 'block';
    setCheckoutBusy(true);

    setTimeout(() => {
        const orderId = makeLocalOrderRef();
        const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const total = Math.max(0, subtotal - couponDiscount);
        const order = recordOrder(orderId, total, navigator.onLine ? 'Processing' : 'Queued (offline)');

        // Snapshot the order for the offline outbox before the cart is cleared.
        const offlinePayload = !navigator.onLine && window.WhatsAppOrder
            ? WhatsAppOrder.buildCheckoutOrder(orderId)
            : null;

        const orderIdDisp = document.getElementById('orderIdDisplay');
        if (orderIdDisp) orderIdDisp.textContent = orderId;
        const waBtn = document.getElementById('orderWaBtn');
        if (waBtn) {
            waBtn.href = `https://wa.me/919198923230?text=${encodeURIComponent(`Namaste! My Order ID is ${orderId}. Please confirm delivery.`)}`;
        }

        cart = [];
        saveCart();
        updateCartUI();
        couponDiscount = 0;
        appliedCoupon = '';

        if (offlinePayload) WhatsAppOrder.queueOffline(offlinePayload);
        if (window.PushNotifications) PushNotifications.notifyOrderStatus(order, 'token');

        if (procState) procState.style.display = 'none';
        if (btnsRow) btnsRow.style.display = 'flex';
        setCheckoutBusy(false);

        showCheckoutStep(3);
        triggerConfetti();
        showToast(navigator.onLine ? t('checkout.orderPlaced') : 'Order saved offline and queued for WhatsApp.', 'success');
    }, 1800);
}

function makeLocalOrderRef() {
    if (window.WhatsAppOrder) return WhatsAppOrder.makeOrderRef();
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    return `GBI-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Single place that appends an order to the local ledger, so checkout, the
// WhatsApp handoff and the offline outbox all agree on the same reference.
// The piece count and delivery site ride along — the profile hub totals them
// and the yard board shows where the load is going without another lookup.
function recordOrder(orderId, total, status) {
    const now = new Date();
    const date = [
        String(now.getDate()).padStart(2, '0'),
        String(now.getMonth() + 1).padStart(2, '0'),
        now.getFullYear()
    ].join('/');
    const val = (id) => ((document.getElementById(id) || {}).value || '').trim();
    // B2B identity travels with the order, so the invoice the yard issues after
    // delivery is billed to the firm and not to a walk-in cash sale.
    const gstin = window.cartGstNumber || (user && user.gstin) || '';
    orders.unshift({
        id: orderId,
        date: date,
        itemsCount: cart.length,
        pieces: cartPieces(),
        total: total,
        status: status || 'Processing',
        customer: val('coName') || (user && user.name) || '',
        customerPhone: val('coPhone') || (user && user.mobile) || '',
        site: val('coAddress'),
        city: val('coCity') || '',
        pincode: val('coPincode'),
        gstin: gstin,
        businessName: gstin ? ((user && user.businessName) || '') : ''
    });
    setSafeStorage('gb_orders', orders);
    return orders[0];
}

// WhatsApp-first confirmation: the yard receives the full order (items,
// estimator specs, pincode, payment preference) as one formatted message.
function confirmOrderOnWhatsApp() {
    if (!window.WhatsAppOrder) {
        showToast('WhatsApp handoff is unavailable right now.', 'error');
        return;
    }
    const payload = WhatsAppOrder.buildCheckoutOrder();
    if (!payload) return;

    const order = recordOrder(payload.ref, payload.total, navigator.onLine ? 'Sent on WhatsApp' : 'Queued (offline)');
    WhatsAppOrder.open(payload);
    if (!navigator.onLine) WhatsAppOrder.queueOffline(payload);

    const orderIdDisp = document.getElementById('orderIdDisplay');
    if (orderIdDisp) orderIdDisp.textContent = payload.ref;
    const waBtn = document.getElementById('orderWaBtn');
    if (waBtn) waBtn.href = WhatsAppOrder.buildLink(`Namaste! My Order ID is ${payload.ref}. Please confirm dispatch.`);

    cart = [];
    saveCart();
    updateCartUI();
    couponDiscount = 0;
    appliedCoupon = '';

    if (window.PushNotifications) PushNotifications.notifyOrderStatus(order, 'token');
    showCheckoutStep(3);
    triggerConfetti();
    showToast(navigator.onLine
        ? 'Order handed off to WhatsApp for confirmation.'
        : 'Order saved offline — send it when signal returns.', 'success');
}

function triggerConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#A83226', '#D66A45', '#198754', '#3b82f6', '#ec4899'];
    for (let i = 0; i < 40; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 0.4 + 's';
        container.appendChild(piece);
    }
}

function prefillUserInCheckout() {
    if (!user) return;
    const n = document.getElementById('coName');
    const p = document.getElementById('coPhone');
    const a = document.getElementById('coAddress');
    if (n && !n.value) n.value = user.name || '';
    if (p && !p.value) p.value = user.mobile || '';
    if (a && !a.value) a.value = user.address || '';
}
