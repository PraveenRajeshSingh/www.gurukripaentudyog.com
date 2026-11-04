// ══════════════════════════════════════════
// WISHLIST — single source of truth for membership + UI sync
// The catalogue heart, the drawer, the nav badges and the profile hub all
// read from `wishlist` (state.js) and are repainted through syncWishlistUI(),
// so no surface can ever show a stale heart.
// ══════════════════════════════════════════

function isWishlisted(id) {
    return wishlist.indexOf(id) !== -1;
}

/** Add or remove an id, never allowing duplicates. Returns the new state. */
function setWishlistMembership(id, wanted) {
    if (wanted) {
        if (!isWishlisted(id)) wishlist.push(id);
    } else {
        wishlist = wishlist.filter(x => x !== id);
    }
    wishlist = wishlist.filter((x, i) => wishlist.indexOf(x) === i);
    persistWishlist();
    return isWishlisted(id);
}

function persistWishlist() {
    setSafeStorage('gb_wishlist', wishlist);
}

/** Paint one heart control to match the stored state. */
function paintWishButton(btn, id) {
    const on = isWishlisted(id);
    const product = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find(p => p.id === id) : null;
    // aria-label is plain text, so use the raw product name (never HTML-escaped).
    const name = product ? product.name : 'item';
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', (on ? 'Remove ' : 'Add ') + name + (on ? ' from wishlist' : ' to wishlist'));
    if (typeof _heartSVG === 'function') btn.innerHTML = _heartSVG(on);
}

/** Repaint every wishlist control and counter currently in the document. */
function syncWishlistUI() {
    document.querySelectorAll('.wishlist-btn[data-wish-id]').forEach(btn => {
        paintWishButton(btn, parseInt(btn.getAttribute('data-wish-id'), 10));
    });
    updateWishlistBadges();
    const drawer = document.getElementById('wishlistDrawer');
    if (drawer && drawer.classList.contains('open')) renderWishlistItems();
    // Profile hub: keep its grid and its counts honest while it is open.
    const hub = document.getElementById('profileModal');
    if (hub && hub.classList.contains('open')) {
        if (typeof renderWishlistInProfile === 'function') renderWishlistInProfile();
        if (typeof renderAccountHub === 'function') renderAccountHub();
    }
}

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
        if (empty) empty.hidden = false;
        if (list) list.hidden = true;
        if (footer) footer.hidden = true;
        return;
    }
    if (empty) empty.hidden = true;
    if (list) list.hidden = false;
    if (footer) footer.hidden = false;

    if (list) {
        const wishProducts = PRODUCTS.filter(p => wishlist.includes(p.id));
        list.innerHTML = wishProducts.map(item => `
            <div class="cart-item wishlist-item">
              <div class="cart-item-img">
                <img src="${item.img}" alt="${sanitizeHTML(item.name)}" loading="lazy" width="64" height="64">
              </div>
              <div class="cart-item-info">
                <div class="cart-item-name">${sanitizeHTML(item.name)}</div>
                <div class="cart-item-price">${formatINR(item.price)} <span class="wishlist-item-unit">/ ${item.unit || 'pc'}</span></div>
                <div class="wishlist-item-actions">
                  <button type="button" class="btn btn-primary btn-sm" onclick="addToCart(${item.id})">Add to Cart</button>
                  <button type="button" class="btn btn-outline btn-sm" onclick="openProductDetail(${item.id})">View</button>
                </div>
              </div>
              <button type="button" class="cart-item-remove" onclick="removeFromWishlistDrawer(${item.id})" title="Remove from wishlist" aria-label="Remove ${sanitizeHTML(item.name)} from wishlist">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
        `).join('');
    }
}

function removeFromWishlistDrawer(id) {
    setWishlistMembership(id, false);
    // syncWishlistUI() repaints the hearts, the badges, the drawer list and the
    // profile hub from one place - no re-render of the whole catalogue needed.
    syncWishlistUI();
    showToast(t('wishlist.removed'));
}

function moveAllWishlistToCart() {
    if (!wishlist.length) {
        showToast(t('wishlist.empty'));
        return;
    }
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
    const hubBadge = document.getElementById('hubWishlistBadge');
    if (hubBadge) hubBadge.textContent = count;
    const hubNav = document.getElementById('hubNavWishlist');
    if (hubNav) hubNav.textContent = count + ' items';
    // The drawer row carries a count pill only when there is something to open;
    // a permanent "0" would read as a broken counter.
    const drawerCount = document.getElementById('drawerWishCount');
    if (drawerCount) {
        drawerCount.textContent = count;
        drawerCount.hidden = count === 0;
    }
}
