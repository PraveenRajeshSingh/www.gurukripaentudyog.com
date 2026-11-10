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

/** Image pipeline: prefer optimized JPEG widths; warm backdrop is CSS-only. */
function catalogImgSources(imgPath) {
    const src = String(imgPath || '');
    const m = src.match(/optimized\/(product-\w+)-(\d+)\.jpg/i);
    if (m) {
        const base = 'src/assets/images/optimized/' + m[1];
        return {
            srcset: base + '-320.jpg 240w, ' + base + '-320.jpg 360w, ' + base + '-480.jpg 480w, ' + base + '-768.jpg 720w',
            src: base + '-480.jpg',
            fallback: src
        };
    }
    return { srcset: '', src: src, fallback: src };
}

function cartQtyFor(id) {
    try {
        if (typeof cart === 'undefined' || !Array.isArray(cart)) return 0;
        const row = cart.find((i) => i.id === id);
        return row ? Number(row.qty) || 0 : 0;
    } catch (_e) { return 0; }
}

// ── PRODUCT-CARD TEMPLATE (premium grid + list) ──
// CHANGE: <li> wrapper, warm media, overlays inside image, price+Add always visible
function renderProductCard(p, idx) {
    const isWish = typeof wishlist !== 'undefined' && wishlist.includes(p.id);
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
    const qty = cartQtyFor(p.id);
    const out = p.stock === 'out-of-stock';
    const imgs = catalogImgSources(p.img);
    const eager = typeof idx === 'number' ? idx < 2 : false;
    const badge = p.badge ? sanitizeHTML(p.badge) : '';
    const addLabel = typeof t === 'function' ? t('products.addToCart') : 'Add to Cart';
    const addShort = typeof t === 'function' ? t('product.add') : 'Add';

    return `
    <li class="product-card catalog-card industrial-card compact-card fade-in${qty > 0 ? ' has-qty' : ''}" data-category="${sanitizeHTML(p.category)}" data-product-id="${p.id}">
      <div class="catalog-card-media product-card-media">
        <picture>
          ${imgs.srcset ? `<source type="image/jpeg" srcset="${imgs.srcset}" sizes="(max-width:639px) 45vw, (max-width:1023px) 30vw, 220px">` : ''}
          <img class="catalog-card-img product-card-img" src="${sanitizeHTML(imgs.src)}" alt="${fullName}"
            width="480" height="360" loading="${eager ? 'eager' : 'lazy'}" decoding="async"
            ${eager ? 'fetchpriority="high"' : ''}
            style="background-color:#F3ECE4"
            onload="this.classList.add('is-loaded')"
            onerror="this.onerror=null;this.src=(window.GBI&&GBI.Reliability)?GBI.Reliability.IMG_PLACEHOLDER:'${sanitizeHTML(imgs.fallback)}';this.classList.add('is-loaded')">
        </picture>
        ${badge ? `<span class="catalog-card-badge">${badge}</span>` : ''}
        ${discountPct > 0 ? `<span class="catalog-card-discount" aria-label="${discountPct}% off">-${discountPct}%</span>` : ''}
        <button type="button" class="catalog-wish wishlist-btn ${isWish ? 'active' : ''}" data-wish-id="${p.id}" data-action="toggle-wishlist" data-id="${p.id}"
          aria-pressed="${isWish ? 'true' : 'false'}"
          aria-label="${isWish ? 'Remove ' + name + ' from wishlist' : 'Add ' + name + ' to wishlist'}">
          ${_heartSVG(isWish)}
        </button>
        <button type="button" class="catalog-quickview" data-action="open-product" data-id="${p.id}">Quick view</button>
      </div>

      <div class="catalog-card-body product-card-body">
        <div class="catalog-rating product-card-rating">
          <span class="product-card-stars" role="img" aria-label="${p.rating} out of 5 stars">${starHTML}</span>
          <span class="product-card-rating-num">(${p.reviews || 48})</span>
        </div>

        <h3 class="catalog-card-name product-card-name">
          <button type="button" class="catalog-card-name-btn product-card-name-btn" data-action="open-product" data-id="${p.id}">${name}</button>
        </h3>
        ${nameHi ? `<p class="catalog-card-name-hi product-card-name-hi" lang="hi">${nameHi}</p>` : ''}
        <p class="catalog-desc-one">${sanitizeHTML(p.desc || '')}</p>

        <div class="catalog-meta">
          <span class="catalog-stock product-stock-pill ${stockCls}" title="${sanitizeHTML(p.stockText || stockTxt)}">
            <span class="stock-status-dot" aria-hidden="true"></span>${stockTxt}
          </span>
          <span class="catalog-sameday" title="Same-day dispatch">${_truckSVG} Same-day</span>
        </div>

        <div class="catalog-price-block product-card-price-row">
          <span class="catalog-price-current product-price-current">₹${p.price}</span>
          <span class="catalog-price-unit product-price-unit">/${unitShort}</span>
          ${oldPrice != null ? `<span class="catalog-price-old product-price-old">₹${oldPrice}</span>` : ''}
          <div class="catalog-per1000 product-per1000">₹${per1000} / 1,000 pcs · Min 100 pcs</div>
        </div>

        <div class="catalog-trolley product-trolley-badge">${_truckSVG} Trolley (4k): ₹${trolleyPrice.toLocaleString('en-IN')}</div>

        <div class="catalog-actions product-card-actions">
          <button type="button" class="catalog-add product-add-btn" data-busy-guard data-action="add-to-cart" data-id="${p.id}"
            ${out ? 'disabled aria-disabled="true"' : ''}
            aria-label="${out ? 'Out of stock — notify on WhatsApp' : 'Add ' + name + ' to cart'}">
            ${out ? 'Notify me' : (_cartSVG + '<span class="pa-btn-full">' + addLabel + '</span><span class="pa-btn-short">' + addShort + '</span>')}
          </button>
          <div class="catalog-stepper" data-stepper-for="${p.id}" aria-label="Quantity in cart">
            <button type="button" data-action="change-qty" data-id="${p.id}" data-delta="-1" aria-label="Decrease quantity">−</button>
            <span data-qty-display="${p.id}">${qty || 1}</span>
            <button type="button" data-action="change-qty" data-id="${p.id}" data-delta="1" aria-label="Increase quantity">+</button>
          </div>
          <a class="catalog-wa product-wa-btn" href="${out ? waAskPriceURL(p.name) : waOrderURL(p.name, 1000)}" target="_blank" rel="noopener" aria-label="Order ${name} on WhatsApp" data-action="wa">${_waSVG}</a>
        </div>

      </div>
    </li>`;
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
    // CHANGE: sync premium chips + legacy .filter-btn
    const key = cat || 'all';
    document.querySelectorAll('.filter-btn, .catalog-chip').forEach((b) => {
        const bCat = b.getAttribute('data-cat');
        const on = bCat ? (bCat === key) : (b === btn);
        b.classList.toggle('active', on);
        b.classList.toggle('is-active', on);
        if (b.hasAttribute('aria-selected')) b.setAttribute('aria-selected', String(on));
    });
    const activeChip = document.querySelector('.catalog-chip.is-active, .catalog-chip.active');
    if (activeChip) {
        try { activeChip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } catch (_e) { /* ignore */ }
    }
    if (window.CatalogDiscovery) {
        CatalogDiscovery.setState({ category: cat || 'all' });
    } else {
        renderProducts(cat);
    }
    if (typeof renderActiveFilterChips === 'function') renderActiveFilterChips();
    if (typeof updateCatalogFilterBadge === 'function') updateCatalogFilterBadge();
    if (typeof persistCatalogFilters === 'function') persistCatalogFilters();
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
        grid.innerHTML = `<li class="products-empty catalog-empty" role="status"><p class="products-empty__title">No bricks match these filters</p><p>${emptyMsg}</p><div class="catalog-empty__actions"><button type="button" class="btn btn-outline btn-sm" onclick="filterProducts('all')">Clear filters</button><a class="btn btn-primary btn-sm" href="https://wa.me/919198923230" target="_blank" rel="noopener">Ask on WhatsApp</a></div></li>`;
        if (count) count.textContent = '0 products';
        return;
    }
    if (count) count.textContent = filtered.length + ' product' + (filtered.length !== 1 ? 's' : '');
    grid.innerHTML = filtered.map((p, i) => renderProductCard(p, i)).join('');
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
    grid.innerHTML = filtered.map((p, i) => renderProductCard(p, i)).join('');
    const count = document.getElementById('productsCount');
    if (count) count.textContent = filtered.length + ' product' + (filtered.length !== 1 ? 's' : '');
    syncCatalogSortLabel(sortBy || 'default');
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
    if (btn && btn.dataset.busy === '1') return;
    const p = PRODUCTS.find((x) => x.id === id);
    if (p && p.stock === 'out-of-stock') {
        try { window.open(waAskPriceURL(p.name), '_blank', 'noopener'); } catch (_e) { /* ignore */ }
        return;
    }
    if (btn) {
        btn.dataset.busy = '1';
        btn.setAttribute('aria-disabled', 'true');
        btn.classList.add('is-busy');
        triggerCartBounce(btn);
    }
    addToCart(id);
    if (navigator.vibrate) navigator.vibrate(30);
    // Morph card into qty stepper (presentation only; cart logic unchanged)
    const card = btn && btn.closest ? btn.closest('[data-product-id]') : document.querySelector('[data-product-id="' + id + '"]');
    if (card) {
        card.classList.add('has-qty');
        const disp = card.querySelector('[data-qty-display="' + id + '"]');
        if (disp) disp.textContent = String(cartQtyFor(id) || 1);
        const live = document.createElement('span');
        live.className = 'visually-hidden';
        live.setAttribute('aria-live', 'polite');
        live.textContent = 'Added to cart';
        card.appendChild(live);
        setTimeout(() => { try { live.remove(); } catch (_e) { /* ignore */ } }, 1200);
    }
    if (typeof updateCatalogMiniCart === 'function') updateCatalogMiniCart();
    if (typeof bounceCartBadges === 'function') bounceCartBadges();
    setTimeout(function () {
        if (!btn) return;
        btn.dataset.busy = '0';
        btn.removeAttribute('aria-disabled');
        btn.classList.remove('is-busy');
    }, 450);
}

// Mobile/app filter bottom sheet — the desktop sidebar becomes a slide-up sheet
// on small screens so phone users keep full filtering without a shrunk desktop.
function toggleFilterSheet(force) {
    const sb = document.getElementById('catalogSidebar');
    if (!sb) return;
    const bd = document.getElementById('filterSheetBackdrop');
    const btn = document.getElementById('catalogFiltersBtn') || document.querySelector('.mobile-filter-toggle');
    const isOpen = (typeof force === 'boolean') ? force : !sb.classList.contains('open');
    sb.classList.toggle('open', isOpen);
    if (isOpen) sb.removeAttribute('hidden');
    else if (window.matchMedia && window.matchMedia('(max-width: 1023.98px)').matches) sb.setAttribute('hidden', '');
    if (bd) bd.classList.toggle('open', isOpen);
    isOpen ? overlayLock() : overlayUnlock();
    if (btn) btn.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
        const closeBtn = sb.querySelector('.catalog-sheet-close, .filter-sheet-close');
        setTimeout(() => { try { (closeBtn || sb).focus(); } catch (_e) { /* ignore */ } }, 50);
    }
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

// Wishlist hearts: ONLY via data-action="toggle-wishlist" in action-delegate.js.
// A second document click listener here used to toggle twice (add then remove).

function toggleWishlist(id, btn) {
    let wasAdded;
    if (window.GBI && GBI.Commerce && typeof GBI.Commerce.toggle === 'function') {
        const res = GBI.Commerce.toggle(id);
        if (!res.ok) {
            if (typeof showToast === 'function') {
                showToast(res.reason === 'storage-full' ? 'Could not save, storage is full' : 'Could not update wishlist', 'error');
            }
            return res;
        }
        wasAdded = !!res.on;
        // Mirror into legacy wishlist array
        if (Array.isArray(wishlist)) {
            wishlist.length = 0;
            GBI.Commerce.getWishlist().forEach((x) => wishlist.push(x));
        }
    } else {
        wasAdded = !isWishlisted(id);
        setWishlistMembership(id, wasAdded);
    }
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

/* ═══════════════════════════════════════════════════════════════
   CATALOG PREMIUM UI — search, sort sheet, filter persistence,
   mini-cart, fab auto-hide on product scroll
   ═══════════════════════════════════════════════════════════════ */
const SORT_LABELS = {
    default: 'Best Selling',
    relevance: 'Relevance',
    'price-asc': 'Price ↑',
    'price-desc': 'Price ↓',
    popularity: 'Popularity',
    newest: 'Newest',
    'name-asc': 'Name A–Z',
    'rating-desc': 'Top Rated'
};

function syncCatalogSortLabel(value) {
    const label = document.getElementById('catalogSortLabel');
    if (label) label.textContent = SORT_LABELS[value] || 'Sort';
    const sel = document.getElementById('productsSort');
    if (sel && sel.value !== value) sel.value = value;
    document.querySelectorAll('input[name="catalogSort"]').forEach((r) => {
        r.checked = r.value === value;
    });
}

function updateCatalogFilterBadge() {
    const badge = document.getElementById('catalogFilterBadge');
    const st = (window.CatalogDiscovery && CatalogDiscovery.getState)
        ? CatalogDiscovery.getState()
        : { category: currentFilter || 'all', maxPrice: 15, stock: 'all', size: 'all' };
    let n = 0;
    if (st.category && st.category !== 'all') n++;
    if (st.stock && st.stock !== 'all') n++;
    if (st.size && st.size !== 'all') n++;
    if (Number(st.maxPrice) < 15) n++;
    if (!badge) return;
    if (n > 0) {
        badge.hidden = false;
        badge.textContent = String(n);
    } else {
        badge.hidden = true;
        badge.textContent = '0';
    }
}

function persistCatalogFilters() {
    try {
        const st = (window.CatalogDiscovery && CatalogDiscovery.getState)
            ? CatalogDiscovery.getState()
            : { category: currentFilter || 'all' };
        sessionStorage.setItem('gb_catalog_filters', JSON.stringify({
            category: st.category || 'all',
            maxPrice: st.maxPrice,
            stock: st.stock,
            size: st.size,
            sort: st.sort,
            query: st.query || ''
        }));
    } catch (_e) { /* ignore */ }
}

function restoreCatalogFilters() {
    let raw = null;
    try { raw = sessionStorage.getItem('gb_catalog_filters'); } catch (_e) { return; }
    if (!raw || !window.CatalogDiscovery) return;
    let data = null;
    try { data = JSON.parse(raw); } catch (_e2) { return; }
    if (!data || typeof data !== 'object') return;
    CatalogDiscovery.setState({
        category: data.category || 'all',
        maxPrice: data.maxPrice != null ? data.maxPrice : 15,
        stock: data.stock || 'all',
        size: data.size || 'all',
        sort: data.sort || 'default',
        query: data.query || ''
    });
    if (data.category) {
        document.querySelectorAll('.catalog-chip').forEach((b) => {
            const on = b.getAttribute('data-cat') === data.category;
            b.classList.toggle('is-active', on);
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', String(on));
        });
    }
    const price = document.getElementById('filterPriceRange');
    if (price && data.maxPrice != null) {
        price.value = data.maxPrice;
        handlePriceRangeFilter(data.maxPrice);
    }
    const stock = document.getElementById('filterStock');
    if (stock && data.stock) stock.value = data.stock;
    const size = document.getElementById('filterSize');
    if (size && data.size) size.value = data.size;
    if (data.sort) syncCatalogSortLabel(data.sort);
    const search = document.getElementById('catalogSearchInput');
    if (search && data.query) search.value = data.query;
    updateCatalogFilterBadge();
}

function updateCatalogMiniCart() {
    const bar = document.getElementById('catalogMiniCart');
    const text = document.getElementById('catalogMiniCartText');
    if (!bar) return;
    let totalQty = 0;
    let totalAmt = 0;
    try {
        if (Array.isArray(cart)) {
            cart.forEach((i) => {
                totalQty += Number(i.qty) || 0;
                totalAmt += (Number(i.price) || 0) * (Number(i.qty) || 0);
            });
        }
    } catch (_e) { /* ignore */ }
    if (totalQty <= 0) {
        bar.hidden = true;
        document.body.classList.remove('has-mini-cart');
        return;
    }
    bar.hidden = false;
    document.body.classList.add('has-mini-cart');
    if (text) {
        const amt = typeof formatINR === 'function' ? formatINR(totalAmt) : ('₹' + totalAmt.toLocaleString('en-IN'));
        text.textContent = totalQty + ' item' + (totalQty !== 1 ? 's' : '') + ' · ' + amt;
    }
}

function openCatalogSortSheet() {
    const sheet = document.getElementById('catalogSortSheet');
    const btn = document.getElementById('catalogSortBtn');
    if (!sheet) return;
    sheet.hidden = false;
    if (btn) btn.setAttribute('aria-expanded', 'true');
    if (typeof overlayLock === 'function') overlayLock();
}

function closeCatalogSortSheet() {
    const sheet = document.getElementById('catalogSortSheet');
    const btn = document.getElementById('catalogSortBtn');
    if (!sheet) return;
    sheet.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (typeof overlayUnlock === 'function') overlayUnlock();
}

function initCatalogPremiumUI() {
    const searchWrap = document.getElementById('catalogSearchWrap');
    const searchToggle = document.getElementById('catalogSearchToggle');
    const searchInput = document.getElementById('catalogSearchInput');
    if (searchToggle && searchWrap && searchInput) {
        searchToggle.addEventListener('click', () => {
            searchWrap.classList.add('is-open');
            searchToggle.setAttribute('aria-expanded', 'true');
            searchInput.focus();
        });
        searchInput.addEventListener('blur', () => {
            if (!searchInput.value) {
                searchWrap.classList.remove('is-open');
                searchToggle.setAttribute('aria-expanded', 'false');
            }
        });
        const runSearch = (typeof gbiDebounce === 'function')
            ? gbiDebounce(function () {
                if (window.CatalogDiscovery) CatalogDiscovery.setState({ query: searchInput.value || '' });
                persistCatalogFilters();
            }, 250)
            : function () {
                if (window.CatalogDiscovery) CatalogDiscovery.setState({ query: searchInput.value || '' });
            };
        searchInput.addEventListener('input', runSearch);
        searchInput.addEventListener('focus', () => document.body.classList.add('catalog-field-focus'));
        searchInput.addEventListener('blur', () => document.body.classList.remove('catalog-field-focus'));
    }

    const sortBtn = document.getElementById('catalogSortBtn');
    if (sortBtn) sortBtn.addEventListener('click', openCatalogSortSheet);
    const sortClose = document.getElementById('catalogSortClose');
    if (sortClose) sortClose.addEventListener('click', closeCatalogSortSheet);
    const sortSheet = document.getElementById('catalogSortSheet');
    if (sortSheet) {
        sortSheet.addEventListener('click', (e) => {
            if (e.target === sortSheet) closeCatalogSortSheet();
        });
        sortSheet.querySelectorAll('input[name="catalogSort"]').forEach((r) => {
            r.addEventListener('change', () => {
                sortProducts(r.value);
                syncCatalogSortLabel(r.value);
                persistCatalogFilters();
                closeCatalogSortSheet();
            });
        });
    }

    const priceMin = document.getElementById('filterPriceMin');
    const priceMax = document.getElementById('filterPriceMax');
    const priceRange = document.getElementById('filterPriceRange');
    if (priceMax && priceRange) {
        priceMax.addEventListener('change', () => {
            let v = parseFloat(priceMax.value);
            if (!isFinite(v)) return;
            v = Math.min(15, Math.max(5, v));
            priceRange.value = String(v);
            handlePriceRangeFilter(v);
            persistCatalogFilters();
        });
    }
    if (priceMin) {
        priceMin.addEventListener('change', () => {
            // Existing filter logic is max-only; min is UX aid (clamped display)
            let v = parseFloat(priceMin.value);
            if (!isFinite(v)) return;
            priceMin.value = String(Math.min(15, Math.max(5, v)));
        });
    }

    // Escape closes sheets
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        closeCatalogSortSheet();
        const sb = document.getElementById('catalogSidebar');
        if (sb && sb.classList.contains('open')) toggleFilterSheet(false);
    });

    // FAB auto-hide while scrolling product list down
    let lastY = window.scrollY;
    let hideTimer = null;
    const onScroll = (typeof gbiThrottleRAF === 'function')
        ? gbiThrottleRAF(function () {
            const sec = document.getElementById('products');
            if (!sec) return;
            const rect = sec.getBoundingClientRect();
            const inView = rect.top < window.innerHeight && rect.bottom > 80;
            const y = window.scrollY;
            const down = y > lastY + 4;
            const up = y < lastY - 4;
            lastY = y;
            if (inView && down && y > 120) document.body.classList.add('catalog-scroll-hide');
            if (up || !inView) document.body.classList.remove('catalog-scroll-hide');
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => document.body.classList.remove('catalog-scroll-hide'), 900);
        })
        : function () { /* no-op fallback */ };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Sync qty steppers after cart changes
    const _origUpdate = typeof updateCartUI === 'function' ? updateCartUI : null;
    if (_origUpdate && !updateCartUI._catalogPatched) {
        window.updateCartUI = function () {
            _origUpdate.apply(this, arguments);
            document.querySelectorAll('[data-product-id]').forEach((card) => {
                const id = parseInt(card.getAttribute('data-product-id'), 10);
                const q = cartQtyFor(id);
                card.classList.toggle('has-qty', q > 0);
                const disp = card.querySelector('[data-qty-display="' + id + '"]');
                if (disp && q > 0) disp.textContent = String(q);
            });
            updateCatalogMiniCart();
        };
        window.updateCartUI._catalogPatched = true;
    }

    updateCatalogMiniCart();
    updateCatalogFilterBadge();
}

document.addEventListener('DOMContentLoaded', function () {
    restoreProductsView();
    renderActiveFilterChips();
    initCatalogPremiumUI();
    restoreCatalogFilters();
    // Desktop: keep filter rail visible
    const sb = document.getElementById('catalogSidebar');
    if (sb && window.matchMedia && window.matchMedia('(min-width: 1024px)').matches) {
        sb.removeAttribute('hidden');
    }
});
