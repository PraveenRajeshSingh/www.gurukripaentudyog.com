// ══════════════════════════════════════════
// CART DRAWER & FREE DELIVERY BAR
// ══════════════════════════════════════════
function addToCart(id, qty = 1) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    const existing = cart.find(i => i.id === id);
    if (existing) { existing.qty += qty; }
    else { cart.push({ ...p, qty }); }
    saveCart();
    updateCartUI();
    showToast(`✅ ${sanitizeHTML(p.name)} added to cart!`, 'success');
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
    if (headCount) headCount.textContent = total + ' item' + (total !== 1 ? 's' : '');

    // Delivery Progress Bar Logic (Free delivery above ₹5,000)
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const freeThreshold = 5000;
    const pct = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
    const fill = document.getElementById('cartProgressFill');
    const label = document.getElementById('cartDeliveryLabel');
    if (fill) fill.style.width = pct + '%';
    if (label) {
        if (subtotal >= freeThreshold) {
            label.textContent = '🎉 You unlocked FREE Delivery!';
            label.className = 'free-label';
        } else {
            label.textContent = `Add ₹${(freeThreshold - subtotal).toLocaleString('en-IN')} more`;
            label.className = '';
        }
    }
}

function openCart() {
    document.getElementById('cartOverlay')?.classList.add('open');
    document.getElementById('cartDrawer')?.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCartItems();
}

function closeCart() {
    document.getElementById('cartOverlay')?.classList.remove('open');
    document.getElementById('cartDrawer')?.classList.remove('open');
    document.body.style.overflow = '';
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
                <div class="cart-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')} <span style="font-size:.72rem;color:var(--ink-3)">(₹${item.price}/${item.unit || 'pc'})</span></div>
                <div class="cart-item-qty">
                  <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
                  <span class="qty-val">${item.qty}</span>
                  <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
                </div>
              </div>
              <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Remove">🗑️</button>
            </div>
        `).join('');
    }

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const total = Math.max(0, subtotal - couponDiscount);
    const subtotalEl = document.getElementById('cartSubtotal');
    if (subtotalEl) subtotalEl.textContent = '₹' + subtotal.toLocaleString('en-IN');
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');

    const dRow = document.getElementById('discountRow');
    if (couponDiscount > 0 && dRow) {
        dRow.style.display = 'flex';
        const dAmt = document.getElementById('discountAmt');
        if (dAmt) dAmt.textContent = '-₹' + couponDiscount.toLocaleString('en-IN');
    } else if (dRow) { dRow.style.display = 'none'; }
}

function applyCoupon() {
    const val = (document.getElementById('couponInput')?.value || '').trim().toUpperCase();
    const msg = document.getElementById('couponMsg');
    const c = COUPONS[val];
    if (!c) {
        if (msg) {
            msg.className = 'cart-coupon-msg error';
            msg.textContent = '❌ Invalid coupon code. Try GURU10';
        }
        return;
    }
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    couponDiscount = c.pct ? Math.round(subtotal * c.pct / 100) : (c.flat || 0);
    appliedCoupon = val;
    if (msg) {
        msg.className = 'cart-coupon-msg success';
        msg.innerHTML = `<span class="coupon-tag">🏷️ ${val} applied <span class="coupon-tag-remove" onclick="removeCoupon()">✕</span></span>`;
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
