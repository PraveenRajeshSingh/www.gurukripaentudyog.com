// ══════════════════════════════════════════
// PRODUCTS & RENDER
// ══════════════════════════════════════════

// SVG helpers for product cards
const _starSVG = (filled) => filled
    ? `<svg width="13" height="13" fill="#F5A623" stroke="#F5A623" stroke-width="1" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
    : `<svg width="13" height="13" fill="none" stroke="#ccc" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

const _heartSVG = (filled) => filled
    ? `<svg width="16" height="16" fill="#e53e3e" stroke="#e53e3e" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
    : `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

const _cartSVG = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`;

const _eyeSVG = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

const _waSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.10.55 4.05 1.6 5.78L2 22l4.42-1.66a9.9 9.9 0 0 0 5.62 1.72h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.42 1.31-1.96 1.36-.54.05-1.04.24-3.5-.72-2.95-1.16-4.82-4.2-4.97-4.39-.15-.19-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.58-.37.78-.37.2 0 .4 0 .57.006.18.006.43-.07.67.51.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.08.17-.2.73-.85.92-1.14.19-.29.39-.24.65-.14.26.1 1.66.78 1.94.92.29.15.48.22.55.34.07.12.07.68-.17 1.36z"/></svg>`;

const _phoneSVG = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>`;

const _truckSVG = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;

const _chevRightSVG = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>`;

const WA_NUMBER = '919198923230';
function waOrderURL(name, qty) {
    const msg = `Namaste! I'd like to order ${name}` + (qty ? ` — ${qty} pieces` : '') + `. Please share the best price and delivery time. (Gurukripa Bricks)`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// Trolley price data keyed by category
const TROLLEY_PRICES = { 'awwal': 28200, 'laal-peti': 25000 };

// Category display labels
const CAT_LABELS = {
    'shiv-eent': 'Shiv Eent',
    'awwal': 'Awwal ईंट',
    'laal-peti': 'Laal Peti',
    'premium': 'Premium',
    'standard': 'Standard',
    'machine-made': 'Machine Made'
};

function renderProductCard(p) {
    const isWish = wishlist.includes(p.id);
    const name = sanitizeHTML(p.name);
    const desc = sanitizeHTML(p.desc);
    const catLabel = CAT_LABELS[p.category] || sanitizeHTML(p.category);
    const fullStars = Math.floor(p.rating);
    const starHTML = Array.from({length:5}, (_,i) => _starSVG(i < fullStars)).join('');
    const trolleyPrice = TROLLEY_PRICES[p.category] || Math.round(p.price * 4000);
    const discountPct = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 14;
    const unitLabel = (p.unit || 'per piece').replace(/^per\s+/i, '').trim() || 'piece';
    const per1000 = Math.round(p.price * 1000).toLocaleString('en-IN');
    const stockCls = p.stock === 'low-stock' ? 'low' : (p.stock === 'out-of-stock' ? 'out' : 'in');
    const stockTxt = sanitizeHTML(p.stockText || (p.stock === 'in-stock' ? 'In Stock (10k+) · Chamber #3 Live' : 'Limited Stock'));

    return `
    <article class="product-card industrial-card fade-in" data-category="${sanitizeHTML(p.category)}" data-product-id="${p.id}">
      <div class="product-card-media">
        <img class="product-card-img" src="${p.img}" alt="${name}" loading="lazy" decoding="async" width="320" height="240">
        <!-- Badges and the wishlist control share one flow row, so the heart
             can never land on top of a badge, the image caption or the price. -->
        <div class="card-media-bar">
            <div class="card-pill-tags">
                ${p.badge ? `<span class="product-pill-badge best-seller">${sanitizeHTML(p.badge)}</span>` : '<span class="product-pill-badge best-seller">Grade-A</span>'}
                <span class="product-pill-badge discount">-${discountPct}%</span>
            </div>
            <button type="button" class="wishlist-btn ${isWish ? 'active' : ''}" data-wish-id="${p.id}"
                aria-pressed="${isWish ? 'true' : 'false'}"
                aria-label="${isWish ? 'Remove ' + name + ' from wishlist' : 'Add ' + name + ' to wishlist'}">
                ${_heartSVG(isWish)}
            </button>
        </div>
      </div>

      <div class="product-card-body">
        <div class="product-card-rating">
          <span class="product-card-stars" role="img" aria-label="${p.rating} out of 5 stars">${starHTML}</span>
          <span class="product-card-rating-num">(${p.reviews || 48})</span>
        </div>

        <h3 class="product-card-name">
          <button type="button" class="product-card-name-btn" onclick="openProductDetail(${p.id})">${name}</button>
        </h3>

        <p class="product-card-desc">${desc}</p>

        <div class="product-card-price-row">
          <div class="price-val-group">
            <span class="product-price-current">₹${p.price}</span>
            ${p.oldPrice ? `<span class="product-price-old">₹${p.oldPrice}</span>` : `<span class="product-price-old">₹${(p.price * 1.15).toFixed(1)}</span>`}
          </div>
          <span class="product-price-unit">/ ${unitLabel}</span>
        </div>

        <div class="product-per1000">≈ ₹${per1000} per 1,000 pcs · Min 100 pcs</div>
        <div class="product-stock-status ${stockCls}">
          <span class="stock-status-dot" aria-hidden="true"></span>
          <span>${stockTxt}</span>
        </div>

        <div class="product-trolley-badge">Trolley Rate: <strong>₹${trolleyPrice.toLocaleString('en-IN')}</strong> (4k pcs)</div>

        <div class="product-delivery-meta">
            <span class="product-delivery-meta__label">${_truckSVG} Same-day dispatch</span>
            <button type="button" class="link-btn" onclick="openPincodeModal('${name}')">Check Delivery ${_chevRightSVG}</button>
        </div>

        <div class="product-card-actions">
          <button type="button" class="product-add-btn btn-full" aria-label="Add ${name} to cart" onclick="handleAddToCart(this, ${p.id})">
            ${_cartSVG}<span class="pa-btn-full">${typeof t === 'function' ? t('products.addToCart') : 'Add to Cart'}</span><span class="pa-btn-short">${typeof t === 'function' ? t('product.add') : 'Add'}</span>
          </button>
          <a class="product-wa-btn" href="${waOrderURL(p.name, 1000)}" target="_blank" rel="noopener" aria-label="Order ${name} on WhatsApp" title="Order on WhatsApp">${_waSVG}</a>
        </div>
      </div>
    </article>`;
}

function handlePriceRangeFilter(val) {
    const label = document.getElementById('currentMaxPriceLabel');
    if (label) label.textContent = `Up to ₹${parseFloat(val).toFixed(2)}`;
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    const max = parseFloat(val);
    const filtered = PRODUCTS.filter(p => p.price <= max && (currentFilter === 'all' || p.category === currentFilter));
    grid.innerHTML = filtered.map(p => renderProductCard(p)).join('');
    const countEl = document.getElementById('productsCount');
    if (countEl) countEl.textContent = `Showing ${filtered.length} products (under ₹${max.toFixed(2)})`;
}

function toggleCategoryFilter(cat, checkbox) {
    if (cat === 'all') {
        filterProducts('all');
    } else {
        filterProducts(cat);
    }
}

function filterProducts(cat, btn) {
    currentFilter = cat;
    if (btn) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    // Reset sort dropdown when filter changes
    const sortEl = document.getElementById('productsSort');
    if (sortEl) sortEl.value = 'default';
    renderProducts(cat);
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderProducts(filter) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    const filtered = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);
    const count = document.getElementById('productsCount');
    if (!filtered.length) {
        const emptyMsg = typeof t === 'function' ? t('products.empty') : 'No products found in this category.';
        grid.innerHTML = `<div class="products-empty" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ink-3)">${emptyMsg}</div>`;
        if (count) count.textContent = '0 products';
        return;
    }
    if (count) count.textContent = filtered.length + ' product' + (filtered.length !== 1 ? 's' : '');
    grid.innerHTML = filtered.map(p => renderProductCard(p)).join('');
}

function sortProducts(sortBy) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    let filtered = currentFilter === 'all' ? [...PRODUCTS] : PRODUCTS.filter(p => p.category === currentFilter);
    switch(sortBy) {
        case 'price-asc':    filtered.sort((a,b) => a.price - b.price); break;
        case 'price-desc':   filtered.sort((a,b) => b.price - a.price); break;
        case 'name-asc':     filtered.sort((a,b) => a.name.localeCompare(b.name)); break;
        case 'rating-desc':  filtered.sort((a,b) => b.rating - a.rating); break;
    }
    grid.innerHTML = filtered.map(p => renderProductCard(p)).join('');
    const count = document.getElementById('productsCount');
    if (count) count.textContent = filtered.length + ' product' + (filtered.length !== 1 ? 's' : '');
}

function triggerCartBounce(btn) {
    btn.classList.add('cart-bounce');
    setTimeout(() => btn.classList.remove('cart-bounce'), 500);
}

// Single entry point for the card "Add to Cart" tap. Guards against rapid
// duplicate taps (which would silently add extra pieces), keeps the cart-count
// update immediate (addToCart -> updateCartUI) and gives haptic + bounce feedback.
function handleAddToCart(btn, id) {
    if (btn.dataset.busy === '1') return;
    btn.dataset.busy = '1';
    btn.setAttribute('aria-disabled', 'true');
    triggerCartBounce(btn);
    addToCart(id);
    if (navigator.vibrate) navigator.vibrate(30);
    setTimeout(function () {
        btn.dataset.busy = '0';
        btn.removeAttribute('aria-disabled');
    }, 450);
}

// Mobile/app filter bottom sheet — the desktop sidebar becomes a slide-up sheet
// on small screens so phone users keep full filtering without a shrunk desktop.
function toggleFilterSheet(force) {
    const sb = document.getElementById('catalogSidebar');
    if (!sb) return;
    const bd = document.getElementById('filterSheetBackdrop');
    const btn = document.querySelector('.mobile-filter-toggle');
    const isOpen = (typeof force === 'boolean') ? force : !sb.classList.contains('open');
    sb.classList.toggle('open', isOpen);
    if (bd) bd.classList.toggle('open', isOpen);
    isOpen ? overlayLock() : overlayUnlock();
    if (btn) btn.setAttribute('aria-expanded', String(isOpen));
}

function openProductDetail(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    const content = document.getElementById('pdContent');
    if (!content) return;
    content.innerHTML = `
        <div class="pd-img"><img src="${p.img}" alt="${sanitizeHTML(p.name)}"></div>
        <div>
          <span class="sec-tag" style="margin-bottom:10px">${sanitizeHTML(p.category.replace('-', ' '))}</span>
          <div style="font-family:var(--display);font-size:1.3rem;font-weight:700;color:var(--ink);margin-bottom:6px">${sanitizeHTML(p.name)}</div>
          <div style="display:flex;gap:2px;align-items:center;margin-bottom:10px">
            ${Array.from({length:5},(_,i)=>_starSVG(i < Math.floor(p.rating))).join('')}
            <span style="font-size:.8rem;color:var(--ink-3);margin-left:6px">${p.rating} · ${p.reviews} verified reviews</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:14px">
            <div style="font-family:var(--display);font-size:1.5rem;font-weight:700;color:var(--brand)">₹${p.price} <span style="font-size:.8rem;color:var(--ink-3);font-family:var(--body);font-weight:400">/ ${(p.unit||'piece').replace(/^per\s+/i,'')}</span></div>
            ${p.oldPrice ? `<span style="font-size:.85rem;color:var(--ink-3);text-decoration:line-through">₹${p.oldPrice}</span>` : ''}
          </div>
          <div class="pd-meta-row">
            <span class="product-stock-status ${p.stock === 'low-stock' ? 'low' : (p.stock === 'out-of-stock' ? 'out' : 'in')}" style="margin:0"><span class="stock-status-dot"></span> ${sanitizeHTML(p.stockText || 'In Stock')}</span>
            <span class="pd-per1000">≈ ₹${Math.round(p.price * 1000).toLocaleString('en-IN')} / 1,000 pcs</span>
          </div>
          <div style="font-size:.86rem;color:var(--ink-2);line-height:1.6;margin-bottom:14px">${sanitizeHTML(p.desc)}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px">${p.features.map(f => `<div style="font-size:.78rem;color:var(--ink-2)"><span style="color:var(--success);font-weight:700">✓</span> ${sanitizeHTML(f)}</div>`).join('')}</div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
            <span style="font-size:.84rem;font-weight:600">Quantity:</span>
            <div style="display:flex;align-items:center;gap:4px">
              <button class="qty-btn" onclick="changePdQty(-1)">−</button>
              <input type="number" id="pdQty" class="qty-val" value="1000" min="100" step="100" style="width:70px;text-align:center;padding:6px;border:1.5px solid var(--line);border-radius:var(--r-sm)">
              <button class="qty-btn" onclick="changePdQty(1)">+</button>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px;padding:8px 12px;background:var(--bg-subtle);border-radius:var(--r-sm)">
            <span style="font-size:0.78rem;color:var(--ink-2)">🚚 Need delivery estimate?</span>
            <button type="button" class="btn btn-outline btn-sm" onclick="openPincodeModal('${sanitizeHTML(p.name)}')" style="font-size:0.75rem;padding:4px 10px;min-height:30px">Check Pincode →</button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary" style="flex:2 1 130px;display:inline-flex;align-items:center;justify-content:center;gap:7px" onclick="addToCart(${p.id},parseInt(document.getElementById('pdQty').value)||1000);closeProductModal();if(navigator.vibrate)navigator.vibrate(30)">${_cartSVG} Add to Cart</button>
            <a href="${waOrderURL(p.name, 1000)}" target="_blank" rel="noopener" class="btn pd-wa-btn" style="flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;padding:0 14px" aria-label="Order on WhatsApp">${_waSVG}</a>
            <a href="tel:+919198923230" class="btn btn-outline" style="flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 14px">${_phoneSVG} Call</a>
          </div>
        </div>`;
    document.getElementById('productModal').classList.add('open');
    overlayLock();
}

function changePdQty(d) {
    const i = document.getElementById('pdQty');
    if (i) i.value = Math.max(100, parseInt(i.value || 100) + d * 100);
}

function closeProductModal() {
    document.getElementById('productModal')?.classList.remove('open');
    overlayUnlock();
}

function handleProductModalClick(e) {
    if (e.target.id === 'productModal') closeProductModal();
}

// Wishlist hearts are event-delegated: cards are re-rendered on every
// filter/sort, so binding per-button would leak handlers.
document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.wishlist-btn[data-wish-id]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(parseInt(btn.getAttribute('data-wish-id'), 10), btn);
});

function toggleWishlist(id, btn) {
    const wasAdded = !isWishlisted(id);
    setWishlistMembership(id, wasAdded);
    // Repaint every control for this product (catalogue card, wishlist
    // drawer, profile hub) so state can never disagree between surfaces.
    syncWishlistUI();
    if (btn && btn.classList.contains('wishlist-btn')) {
        btn.classList.add('pop');
        setTimeout(() => btn.classList.remove('pop'), 400);
    }
    if (window.Platform) Platform.haptic('light');
    showToast(wasAdded ? t('wishlist.added') : t('wishlist.removed'), wasAdded ? 'success' : '');
}
