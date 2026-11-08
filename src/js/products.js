// ══════════════════════════════════════════
// PRODUCTS & RENDER
// ══════════════════════════════════════════

// SVG helpers for product cards
const _starSVG = (filled) => filled
    ? `<svg width="11" height="11" fill="#F5A623" stroke="#F5A623" stroke-width="1" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
    : `<svg width="11" height="11" fill="none" stroke="#ccc" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

const _heartSVG = (filled) => filled
    ? `<svg width="14" height="14" fill="#e53e3e" stroke="#e53e3e" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
    : `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

const _cartSVG = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`;

const _eyeSVG = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

const _waSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.10.55 4.05 1.6 5.78L2 22l4.42-1.66a9.9 9.9 0 0 0 5.62 1.72h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.42 1.31-1.96 1.36-.54.05-1.04.24-3.5-.72-2.95-1.16-4.82-4.2-4.97-4.39-.15-.19-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.58-.37.78-.37.2 0 .4 0 .57.006.18.006.43-.07.67.51.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.08.17-.2.73-.85.92-1.14.19-.29.39-.24.65-.14.26.1 1.66.78 1.94.92.29.15.48.22.55.34.07.12.07.68-.17 1.36z"/></svg>`;

const _phoneSVG = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>`;

const _truckSVG = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;

const _chevRightSVG = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>`;

const WA_NUMBER = '919198923230';
function waOrderURL(name, qty) {
    const msg = `Namaste! I'd like to order ${name}` + (qty ? ` — ${qty} pieces` : '') + `. Please share the best price and delivery time. (Gurukripa Bricks)`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}
function waAskPriceURL(name) {
    const msg = `Namaste! Please share the best current rate for ${name}. (Gurukripa Bricks)`;
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

/** Split English title + Hindi subtitle from names like "Awwal Bricks (आव्वल ईंट)". */
function splitProductName(raw) {
    const full = String(raw || '');
    const m = full.match(/^(.*?)\s*\(([\u0900-\u097F][\u0900-\u097F\s]*)\)\s*$/);
    if (m) return { en: m[1].trim(), hi: m[2].trim() };
    return { en: full, hi: '' };
}

function stockPillLabel(p) {
    if (p.stock === 'out-of-stock') return 'Out of Stock';
    if (p.stock === 'low-stock') return 'Low Stock';
    return 'In Stock';
}

// ── PRODUCT-CARD TEMPLATE (compact catalog card) ──
function renderProductCard(p) {
    const isWish = wishlist.includes(p.id);
    const parts = splitProductName(p.name);
    const name = sanitizeHTML(parts.en);
    const nameHi = parts.hi ? sanitizeHTML(parts.hi) : '';
    const fullName = sanitizeHTML(p.name);
    const fullStars = Math.floor(p.rating);
    const starHTML = Array.from({ length: 5 }, (_, i) => _starSVG(i < fullStars)).join('');
    const trolleyPrice = TROLLEY_PRICES[p.category] || Math.round(p.price * 4000);
    const discountPct = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
    const unitLabel = (p.unit || 'per piece').replace(/^per\s+/i, '').trim() || 'pc';
    const unitShort = /piece|pc/i.test(unitLabel) ? 'pc' : unitLabel;
    const per1000 = Math.round(p.price * 1000).toLocaleString('en-IN');
    const stockCls = p.stock === 'low-stock' ? 'low' : (p.stock === 'out-of-stock' ? 'out' : 'in');
    const stockTxt = stockPillLabel(p);
    const oldPrice = p.oldPrice != null ? p.oldPrice : null;

    return `
    <article class="product-card industrial-card compact-card fade-in" data-category="${sanitizeHTML(p.category)}" data-product-id="${p.id}">
      <div class="product-card-media">
        <img class="product-card-img" src="${p.img}" alt="${fullName}" loading="lazy" decoding="async" width="230" height="172">
        <div class="card-media-bar">
            <div class="card-pill-tags">
                ${discountPct > 0 ? `<span class="product-pill-badge discount" aria-label="${discountPct}% off">-${discountPct}%</span>` : ''}
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
          <span class="product-stock-pill ${stockCls}" title="${sanitizeHTML(p.stockText || stockTxt)}">
            <span class="stock-status-dot" aria-hidden="true"></span>${stockTxt}
            <span class="product-dispatch-tip" title="Same-day dispatch" aria-label="Same-day dispatch">${_truckSVG}</span>
          </span>
        </div>

        <h3 class="product-card-name">
          <button type="button" class="product-card-name-btn" onclick="openProductDetail(${p.id})">${name}</button>
        </h3>
        ${nameHi ? `<p class="product-card-name-hi" lang="hi">${nameHi}</p>` : ''}

        <div class="product-card-price-row">
          <div class="price-val-group">
            <span class="product-price-current">₹${p.price}</span>
            <span class="product-price-unit">/${unitShort}</span>
            ${oldPrice != null ? `<span class="product-price-old">₹${oldPrice}</span>` : ''}
          </div>
        </div>

        <div class="product-per1000">₹${per1000} / 1000 pcs · Min 100</div>

        <div class="product-trolley-badge">${_truckSVG} Trolley 4k pcs: ₹${trolleyPrice.toLocaleString('en-IN')}</div>
        <div class="gbi-rate-stamp product-rate-stamp" aria-label="Cached rate note">Confirm with yard</div>

        <div class="product-card-actions">
          <button type="button" class="product-add-btn btn-full" aria-label="Add ${name} to cart" onclick="handleAddToCart(this, ${p.id})">
            ${_cartSVG}<span class="pa-btn-full">${typeof t === 'function' ? t('products.addToCart') : 'Add to Cart'}</span><span class="pa-btn-short">${typeof t === 'function' ? t('product.add') : 'Add'}</span>
          </button>
          <a class="product-wa-btn" href="${waOrderURL(p.name, 1000)}" target="_blank" rel="noopener" aria-label="Order ${name} on WhatsApp" title="Order on WhatsApp">${_waSVG}</a>
        </div>
        <div class="product-card-actions product-card-actions--secondary">
          <button type="button" class="product-details-link" onclick="openProductDetail(${p.id})">${typeof t === 'function' ? t('products.viewDetails') : 'View Details'}</button>
        </div>
      </div>
    </article>`;
}

function handlePriceRangeFilter(val) {
    const label = document.getElementById('currentMaxPriceLabel');
    const live = document.getElementById('priceRangeLive');
    const max = parseFloat(val);
    if (label) label.textContent = `Up to ₹${max.toFixed(2)}`;
    if (live) live.textContent = `₹${max.toFixed(2)}`;
    if (window.CatalogDiscovery) CatalogDiscovery.setState({ maxPrice: max });
    else renderProducts(currentFilter);
    if (typeof renderActiveFilterChips === 'function') renderActiveFilterChips();
}

function handleStockFilter(val) {
    if (window.CatalogDiscovery) CatalogDiscovery.setState({ stock: val || 'all' });
    if (typeof renderActiveFilterChips === 'function') renderActiveFilterChips();
}

function handleSizeFilter(val) {
    if (window.CatalogDiscovery) CatalogDiscovery.setState({ size: val || 'all' });
    if (typeof renderActiveFilterChips === 'function') renderActiveFilterChips();
}

function toggleCategoryFilter(cat, checkbox) {
    if (cat === 'all') {
        filterProducts('all');
    } else {
        filterProducts(cat);
    }
    if (typeof renderActiveFilterChips === 'function') renderActiveFilterChips();
}

function filterProducts(cat, btn) {
    currentFilter = cat;
    if (btn) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    if (window.CatalogDiscovery) {
        CatalogDiscovery.setState({ category: cat || 'all' });
    } else {
        renderProducts(cat);
    }
    if (typeof renderActiveFilterChips === 'function') renderActiveFilterChips();
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderProducts(filter) {
    if (window.CatalogDiscovery) {
        if (filter) currentFilter = filter;
        CatalogDiscovery.setState({ category: filter || currentFilter || 'all' });
        return;
    }
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    const filtered = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);
    const count = document.getElementById('productsCount');
    if (!filtered.length) {
        const emptyMsg = typeof t === 'function' ? t('products.empty') : 'No products found in this category.';
        grid.innerHTML = `<div class="products-empty" role="status">${emptyMsg}<button type="button" class="btn btn-outline btn-sm" onclick="filterProducts('all')">Clear filters</button></div>`;
        if (count) count.textContent = '0 products';
        return;
    }
    if (count) count.textContent = filtered.length + ' product' + (filtered.length !== 1 ? 's' : '');
    grid.innerHTML = filtered.map(p => renderProductCard(p)).join('');
}

function sortProducts(sortBy) {
    if (window.CatalogDiscovery) {
        CatalogDiscovery.setState({ sort: sortBy || 'default' });
        return;
    }
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    let filtered = currentFilter === 'all' ? [...PRODUCTS] : PRODUCTS.filter(p => p.category === currentFilter);
    switch (sortBy) {
        case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
        case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
        case 'name-asc': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'rating-desc': filtered.sort((a, b) => b.rating - a.rating); break;
    }
    grid.innerHTML = filtered.map(p => renderProductCard(p)).join('');
    const count = document.getElementById('productsCount');
    if (count) count.textContent = filtered.length + ' product' + (filtered.length !== 1 ? 's' : '');
}

function setProductsView(mode) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    const isList = mode === 'list';
    grid.classList.toggle('is-list', isList);
    grid.classList.toggle('is-grid', !isList);
    document.querySelectorAll('[data-view-mode]').forEach((btn) => {
        const on = btn.getAttribute('data-view-mode') === mode;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', String(on));
    });
    try { localStorage.setItem('gb_products_view', isList ? 'list' : 'grid'); } catch (_e) { /* ignore */ }
}

function restoreProductsView() {
    let mode = 'grid';
    try { mode = localStorage.getItem('gb_products_view') || 'grid'; } catch (_e) { /* ignore */ }
    setProductsView(mode === 'list' ? 'list' : 'grid');
}

/** Removable chips for active category / stock / size / price filters. */
function renderActiveFilterChips() {
    const host = document.getElementById('activeFilterChips');
    if (!host) return;
    const chips = [];
    const st = (window.CatalogDiscovery && CatalogDiscovery.getState)
        ? CatalogDiscovery.getState()
        : { category: currentFilter || 'all', maxPrice: 15, stock: 'all', size: 'all' };

    if (st.category && st.category !== 'all') {
        chips.push({ key: 'category', label: CAT_LABELS[st.category] || st.category, clear: "CatalogDiscovery.setState({category:'all'});document.querySelectorAll('.filter-btn').forEach(function(b,i){b.classList.toggle('active',i===0)});renderActiveFilterChips();" });
    }
    if (st.stock && st.stock !== 'all') {
        const stockLabels = { available: 'Available', 'in-stock': 'In stock', 'low-stock': 'Limited stock' };
        chips.push({ key: 'stock', label: stockLabels[st.stock] || st.stock, clear: "CatalogDiscovery.setState({stock:'all'});var s=document.getElementById('filterStock');if(s)s.value='all';renderActiveFilterChips();" });
    }
    if (st.size && st.size !== 'all') {
        chips.push({ key: 'size', label: 'Size: ' + st.size, clear: "CatalogDiscovery.setState({size:'all'});var s=document.getElementById('filterSize');if(s)s.value='all';renderActiveFilterChips();" });
    }
    if (Number(st.maxPrice) < 15) {
        chips.push({ key: 'price', label: 'Up to ₹' + Number(st.maxPrice).toFixed(2), clear: "CatalogDiscovery.setState({maxPrice:15});var p=document.getElementById('filterPriceRange');if(p)p.value='15';handlePriceRangeFilter(15);" });
    }

    if (!chips.length) {
        host.hidden = true;
        host.innerHTML = '';
        return;
    }
    host.hidden = false;
    host.innerHTML = chips.map((c) =>
        `<button type="button" class="filter-chip" data-chip="${sanitizeHTML(c.key)}" onclick="${c.clear}" aria-label="Remove filter ${sanitizeHTML(c.label)}">${sanitizeHTML(c.label)} <span aria-hidden="true">×</span></button>`
    ).join('') + `<button type="button" class="filter-chip filter-chip--clear" onclick="CatalogDiscovery.resetFilters();renderActiveFilterChips()">Clear all</button>`;
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
    if (window.CatalogDiscovery) CatalogDiscovery.recordView(p.id);
    const related = window.CatalogDiscovery ? CatalogDiscovery.relatedFor(p.id, 3) : [];
    const content = document.getElementById('pdContent');
    if (!content) return;
    const parts = splitProductName(p.name);
    content.innerHTML = `
        <div class="pd-img"><img src="${p.img}" alt="${sanitizeHTML(p.name)}"></div>
        <div>
          <span class="sec-tag" style="margin-bottom:10px">${sanitizeHTML(p.category.replace('-', ' '))}</span>
          <div style="font-family:var(--display);font-size:1.3rem;font-weight:700;color:var(--ink);margin-bottom:6px">${sanitizeHTML(parts.en)}</div>
          ${parts.hi ? `<div class="product-card-name-hi" lang="hi" style="margin-bottom:8px">${sanitizeHTML(parts.hi)}</div>` : ''}
          <div style="display:flex;gap:2px;align-items:center;margin-bottom:10px">
            ${Array.from({ length: 5 }, (_, i) => _starSVG(i < Math.floor(p.rating))).join('')}
            <span style="font-size:.8rem;color:var(--ink-3);margin-left:6px">${p.rating} · ${p.reviews} verified reviews</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:14px">
            <div style="font-family:var(--display);font-size:1.5rem;font-weight:700;color:var(--brand)">₹${p.price} <span style="font-size:.8rem;color:var(--ink-3);font-family:var(--body);font-weight:400">/ ${(p.unit || 'piece').replace(/^per\s+/i, '')}</span></div>
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
              <button type="button" class="qty-btn" onclick="changePdQty(-1)">−</button>
              <input type="number" id="pdQty" class="qty-val" value="1000" min="100" step="100" style="width:70px;text-align:center;padding:6px;border:1.5px solid var(--line);border-radius:var(--r-sm)">
              <button type="button" class="qty-btn" onclick="changePdQty(1)">+</button>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px;padding:8px 12px;background:var(--bg-subtle);border-radius:var(--r-sm)">
            <span style="font-size:0.78rem;color:var(--ink-2)">${_truckSVG} Same-day dispatch · Need delivery estimate?</span>
            <button type="button" class="btn btn-outline btn-sm" onclick="openPincodeModal('${sanitizeHTML(p.name)}')" style="font-size:0.75rem;padding:4px 10px;min-height:30px">Check Delivery ${_chevRightSVG}</button>
          </div>
          <div class="pd-actions" style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn btn-primary" style="flex:2 1 130px;display:inline-flex;align-items:center;justify-content:center;gap:7px" onclick="addToCart(${p.id},parseInt(document.getElementById('pdQty').value)||1000);closeProductModal();if(navigator.vibrate)navigator.vibrate(30)">${_cartSVG} ${typeof t === 'function' ? t('products.addToCart') : 'Add to Cart'}</button>
            <a href="${waAskPriceURL(p.name)}" target="_blank" rel="noopener" class="btn btn-outline" style="flex:1 1 110px;display:inline-flex;align-items:center;justify-content:center;gap:6px" aria-label="Ask price for ${sanitizeHTML(parts.en)}">${typeof t === 'function' ? t('products.getPrice') : 'Ask Price'}</a>
            <button type="button" class="btn btn-outline" style="flex:1 1 110px" onclick="toggleWishlist(${p.id})">${typeof t === 'function' ? t('wishlist.add') : 'Wishlist'}</button>
            <a href="${waOrderURL(p.name, 1000)}" target="_blank" rel="noopener" class="btn pd-wa-btn" style="flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;padding:0 14px" aria-label="Order on WhatsApp">${_waSVG}</a>
            <a href="tel:+919198923230" class="btn btn-outline" style="flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 14px">${_phoneSVG} Call</a>
          </div>
          <button type="button" class="btn btn-outline btn-full" style="margin-top:8px;min-height:42px" onclick="CatalogDiscovery.toggleCompare(${p.id})">${window.CatalogDiscovery && CatalogDiscovery.isCompared(p.id) ? 'Remove from Compare' : 'Add to Compare'}</button>
          <button type="button" class="btn btn-primary btn-full" style="margin-top:10px;min-height:46px" onclick="closeProductModal();openBulkQuoteModal()">${typeof t === 'function' ? t('products.requestQuote') : 'Request Quotation'}</button>
          ${related.length ? `<div class="pd-related"><div class="pd-related__title">Related products</div><div class="pd-related__row">${related.map(r => `<button type="button" class="pd-related__chip" onclick="openProductDetail(${r.id})"><img src="${sanitizeHTML(r.img)}" alt="" width="36" height="36" loading="lazy"><span>${sanitizeHTML(r.name)}</span><strong>₹${r.price}</strong></button>`).join('')}</div></div>` : ''}
        </div>`;
    if (typeof openOverlay === 'function') openOverlay('productModal');
    else {
        document.getElementById('productModal').classList.add('open');
        overlayLock();
    }
}

function changePdQty(d) {
    const i = document.getElementById('pdQty');
    if (i) i.value = Math.max(100, parseInt(i.value || 100) + d * 100);
}

function closeProductModal() {
    if (typeof closeOverlay === 'function') closeOverlay('productModal');
    else {
        document.getElementById('productModal')?.classList.remove('open');
        overlayUnlock();
    }
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

document.addEventListener('DOMContentLoaded', function () {
    restoreProductsView();
    renderActiveFilterChips();
});
