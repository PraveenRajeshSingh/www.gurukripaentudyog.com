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
// CHECKOUT & PAYMENT WIZARD
// ══════════════════════════════════════════
function openCheckout() {
    if (!cart.length) { showToast(t('checkout.emptyCart')); return; }
    closeCart();
    resetCheckout();
    buildCheckoutSummary();
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
}

function goToPayment(e) {
    e.preventDefault();
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
function recordOrder(orderId, total, status) {
    const now = new Date();
    const date = [
        String(now.getDate()).padStart(2, '0'),
        String(now.getMonth() + 1).padStart(2, '0'),
        now.getFullYear()
    ].join('/');
    orders.unshift({
        id: orderId,
        date: date,
        itemsCount: cart.length,
        total: total,
        status: status || 'Processing'
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
    const colors = ['#C8460A', '#F5A623', '#16a34a', '#3b82f6', '#ec4899'];
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
