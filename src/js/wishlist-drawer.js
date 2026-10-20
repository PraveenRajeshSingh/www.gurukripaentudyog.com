// ══════════════════════════════════════════
// WISHLIST DRAWER
// ══════════════════════════════════════════
function openWishlistDrawer() {
    document.getElementById('wishlistOverlay')?.classList.add('open');
    document.getElementById('wishlistDrawer')?.classList.add('open');
    overlayLock();
    renderWishlistItems();
}

function closeWishlistDrawer() {
    document.getElementById('wishlistOverlay')?.classList.remove('open');
    document.getElementById('wishlistDrawer')?.classList.remove('open');
    overlayUnlock();
}

function renderWishlistItems() {
    const empty = document.getElementById('wishlistEmpty');
    const list = document.getElementById('wishlistItemsList');
    const footer = document.getElementById('wishlistFooter');
    const headCount = document.getElementById('wishlistHeadCount');

    if (headCount) headCount.textContent = wishlist.length + ' item' + (wishlist.length !== 1 ? 's' : '');

    if (!wishlist.length) {
        if (empty) empty.style.display = 'block';
        if (list) list.style.display = 'none';
        if (footer) footer.style.display = 'none';
        return;
    }
    if (empty) empty.style.display = 'none';
    if (list) list.style.display = 'block';
    if (footer) footer.style.display = 'block';

    if (list) {
        const wishProducts = PRODUCTS.filter(p => wishlist.includes(p.id));
        list.innerHTML = wishProducts.map(item => `
            <div class="cart-item wishlist-item">
              <div class="cart-item-img">
                <img src="${item.img}" alt="${sanitizeHTML(item.name)}">
              </div>
              <div class="cart-item-info">
                <div class="cart-item-name">${sanitizeHTML(item.name)}</div>
                <div class="cart-item-price">${formatINR(item.price)} <span style="font-size:.72rem;color:var(--ink-3)">/ ${item.unit || 'pc'}</span></div>
                <div style="display:flex;gap:8px;margin-top:8px">
                  <button class="btn btn-primary btn-sm" style="font-size:.76rem;padding:6px 12px" onclick="addToCart(${item.id});showToast('Added to cart')">Add to Cart</button>
                  <button class="btn btn-outline btn-sm" style="font-size:.76rem;padding:6px 12px" onclick="openProductDetail(${item.id})">View</button>
                </div>
              </div>
              <button class="cart-item-remove" onclick="removeFromWishlistDrawer(${item.id})" title="Remove from wishlist" aria-label="Remove ${sanitizeHTML(item.name)} from wishlist">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
        `).join('');
    }
}

function removeFromWishlistDrawer(id) {
    wishlist = wishlist.filter(x => x !== id);
    setSafeStorage('gb_wishlist', wishlist);
    updateWishlistBadges();
    renderWishlistItems();
    // Re-render products to update heart state
    renderProducts(currentFilter || 'all');
}

function moveAllWishlistToCart() {
    wishlist.forEach(id => addToCart(id));
    showToast('All wishlist items added to cart!', 'success');
    closeWishlistDrawer();
}

function updateWishlistBadges() {
    const count = wishlist.length;
    ['wishlistBadgeNav', 'mobileWishlistBadge'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = count;
    });
    const headCount = document.getElementById('wishlistHeadCount');
    if (headCount) headCount.textContent = count + ' item' + (count !== 1 ? 's' : '');
    const profileStat = document.getElementById('profileStatWishlist');
    if (profileStat) profileStat.textContent = count;
}
