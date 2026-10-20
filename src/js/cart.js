// ══════════════════════════════════════════
// CART DRAWER & FREE DELIVERY BAR
// ══════════════════════════════════════════
const _trashSVG = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
const _tagSVG = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;

function addToCart(id, qty = 1) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    const existing = cart.find(i => i.id === id);
    if (existing) { existing.qty += qty; }
    else { cart.push({ ...p, qty }); }
    saveCart();
    updateCartUI();
    bounceCartBadges();
    showToast(t('toast.addedToCart', { name: sanitizeHTML(p.name) }), 'success');
}

// Bounce animation on cart badges (nav + bottom nav) after adding items
function bounceCartBadges() {
    ['cartBadgeNav', 'mobileCartBadge'].forEach(id => {
        const badge = document.getElementById(id);
        if (!badge) return;
        badge.classList.remove('bounce');
        void badge.offsetWidth; // restart animation
        badge.classList.add('bounce');
    });
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
    renderCartItems();
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    saveCart();
    updateCartUI();
    renderCartItems();
}

function updateCartUI() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    const navBadge = document.getElementById('cartBadgeNav');
    if (navBadge) navBadge.textContent = total;
    const mb = document.getElementById('mobileCartBadge');
    if (mb) mb.textContent = total;
    const headCount = document.getElementById('cartHeadCount');
    if (headCount) headCount.textContent = total + ' ' + (total !== 1 ? t('cart.itemPlural') : t('cart.itemSingular'));

    // Delivery Progress Bar Logic (Free delivery above ₹5,000)
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const freeThreshold = 5000;
    const pct = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
    const fill = document.getElementById('cartProgressFill');
    const label = document.getElementById('cartDeliveryLabel');
    if (fill) fill.style.width = pct + '%';
    if (label) {
        if (subtotal >= freeThreshold) {
            label.textContent = t('cart.unlocked');
            label.className = 'free-label';
        } else {
            label.textContent = t('cart.addMore', { amt: formatNum(freeThreshold - subtotal) });
            label.className = '';
        }
    }
}

function openCart() {
    document.getElementById('cartOverlay')?.classList.add('open');
    document.getElementById('cartDrawer')?.classList.add('open');
    overlayLock();
    renderCartItems();
}

function closeCart() {
    document.getElementById('cartOverlay')?.classList.remove('open');
    document.getElementById('cartDrawer')?.classList.remove('open');
    overlayUnlock();
}

function renderCartItems() {
    const empty = document.getElementById('cartEmpty');
    const list = document.getElementById('cartItemsList');
    const bill = document.getElementById('cartBill');
    const footer = document.getElementById('cartFooter');
    const couponSection = document.getElementById('cartCouponSection');

    if (!cart.length) {
        if (empty) empty.style.display = 'block';
        if (list) list.style.display = 'none';
        if (bill) bill.classList.add('hidden');
        if (footer) footer.style.display = 'none';
        if (couponSection) couponSection.style.display = 'none';
        return;
    }
    if (empty) empty.style.display = 'none';
    if (list) list.style.display = 'block';
    if (bill) bill.classList.remove('hidden');
    if (footer) footer.style.display = 'block';
    if (couponSection) couponSection.style.display = 'block';

    if (list) {
        list.innerHTML = cart.map(item => `
            <div class="cart-item">
              <div class="cart-item-img"><img src="${item.img}" alt="${sanitizeHTML(item.name)}"></div>
              <div class="cart-item-info">
                <div class="cart-item-name">${sanitizeHTML(item.name)}</div>
                <div class="cart-item-price">${formatINR(item.price * item.qty)} <span style="font-size:.72rem;color:var(--ink-3)">(₹${item.price}/${item.unit || 'pc'})</span></div>
                <div class="cart-item-qty">
                  <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
                  <span class="qty-val">${item.qty}</span>
                  <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
                </div>
              </div>
              <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="${t('cart.remove')}" aria-label="${t('cart.remove')}">${_trashSVG}</button>
            </div>
        `).join('');
    }

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const total = Math.max(0, subtotal - couponDiscount);
    const subtotalEl = document.getElementById('cartSubtotal');
    if (subtotalEl) subtotalEl.textContent = formatINR(subtotal);
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = formatINR(total);

    const dRow = document.getElementById('discountRow');
    if (couponDiscount > 0 && dRow) {
        dRow.style.display = 'flex';
        const dAmt = document.getElementById('discountAmt');
        if (dAmt) dAmt.textContent = '-' + formatINR(couponDiscount);
    } else if (dRow) { dRow.style.display = 'none'; }
}

function applyCoupon() {
    const val = (document.getElementById('couponInput')?.value || '').trim().toUpperCase();
    const msg = document.getElementById('couponMsg');
    const c = COUPONS[val];
    if (!c) {
        if (msg) {
            msg.className = 'cart-coupon-msg error';
            msg.textContent = t('cart.couponInvalid');
        }
        return;
    }
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    couponDiscount = c.pct ? Math.round(subtotal * c.pct / 100) : (c.flat || 0);
    appliedCoupon = val;
    if (msg) {
        msg.className = 'cart-coupon-msg success';
        msg.innerHTML = `<span class="coupon-tag">${_tagSVG} ${val} applied <span class="coupon-tag-remove" onclick="removeCoupon()" role="button" tabindex="0" aria-label="Remove coupon"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span></span>`;
    }
    renderCartItems();
}

function removeCoupon() {
    couponDiscount = 0;
    appliedCoupon = '';
    const msg = document.getElementById('couponMsg');
    if (msg) msg.textContent = '';
    const input = document.getElementById('couponInput');
    if (input) input.value = '';
    renderCartItems();
}

// Touch swipe dismiss
function initTouchSwipe() {
    const drawer = document.getElementById('cartDrawer');
    if (!drawer) return;
    let startX = 0;
    let startY = 0;
    drawer.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    drawer.addEventListener('touchend', e => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - startX;
        const diffY = Math.abs(endY - startY);
        if (diffX > 70 && diffY < 100) {
            closeCart();
        }
    }, { passive: true });
}
