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
    const trolleyPrice = TROLLEY_PRICES[p.category];
    const discountPct = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : null;

    return `
    <div class="product-card fade-in industrial-card" data-category="${sanitizeHTML(p.category)}">
      <div class="product-card-img-wrap">
        <img class="product-card-img" src="${p.img}" alt="${name}" loading="lazy">
        <div class="card-pill-tags">
            ${p.badge ? `<span class="product-pill-badge best-seller">${sanitizeHTML(p.badge)}</span>` : ''}
            ${discountPct ? `<span class="product-pill-badge discount">-${discountPct}%</span>` : ''}
        </div>
        <button class="wishlist-btn ${isWish ? 'active' : ''}" onclick="toggleWishlist(${p.id},this)" aria-label="${isWish ? 'Remove from' : 'Add to'} wishlist">
          ${_heartSVG(isWish)}
        </button>
      </div>

      <div class="product-card-body">
        <div class="product-card-rating">
          <span class="product-card-stars" aria-label="${p.rating} out of 5 stars">${starHTML}</span>
          <span class="product-card-rating-num">(${p.reviews || 45})</span>
        </div>

        <h3 class="product-card-name" onclick="openProductDetail(${p.id})">${name}</h3>

        <div class="product-card-price-row">
          <div class="price-val-group">
            <span class="product-price-current">₹${p.price}</span>
            ${p.oldPrice ? `<span class="product-price-old">₹${p.oldPrice}</span>` : ''}
          </div>
          <span class="product-price-unit">/${sanitizeHTML(p.unit || 'piece')}</span>
        </div>

        <div class="product-stock-status">
          <span class="stock-status-dot"></span>
          <span>In Stock · Ready to Dispatch</span>
        </div>
        <div class="product-delivery-meta">Est. Delivery: Same-day / 24 hrs</div>

        ${trolleyPrice ? `<div class="product-trolley-badge">Trolley Rate: <strong>₹${trolleyPrice.toLocaleString('en-IN')}</strong> (4k pcs)</div>` : ''}

        <div class="product-card-actions">
          <button class="product-add-btn btn-full" onclick="triggerCartBounce(this);addToCart(${p.id})">
            ${_cartSVG} Add to Cart
          </button>
        </div>
      </div>
    </div>`;
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
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ink-3)">No products found in this category.</div>';
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
    document.body.style.overflow = isOpen ? 'hidden' : '';
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
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:10px">
            <span style="color:#F5A623">${'★'.repeat(Math.floor(p.rating))}</span>
            <span style="font-size:.8rem;color:var(--ink-3)">${p.rating} · ${p.reviews} verified reviews</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:14px">
            <div style="font-family:var(--display);font-size:1.5rem;font-weight:700;color:var(--brand)">₹${p.price} <span style="font-size:.8rem;color:var(--ink-3);font-family:var(--body);font-weight:400">/ ${sanitizeHTML(p.unit)}</span></div>
            ${p.oldPrice ? `<span style="font-size:.85rem;color:var(--ink-3);text-decoration:line-through">₹${p.oldPrice}</span>` : ''}
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
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary" style="flex:1" onclick="addToCart(${p.id},parseInt(document.getElementById('pdQty').value));closeProductModal()">🛒 Add to Cart</button>
            <a href="tel:+919198923230" class="btn btn-outline" style="flex:1">📞 Call to Order</a>
          </div>
        </div>`;
    document.getElementById('productModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function changePdQty(d) {
    const i = document.getElementById('pdQty');
    if (i) i.value = Math.max(100, parseInt(i.value || 100) + d * 100);
}

function closeProductModal() {
    document.getElementById('productModal')?.classList.remove('open');
    document.body.style.overflow = '';
}

function handleProductModalClick(e) {
    if (e.target.id === 'productModal') closeProductModal();
}

function toggleWishlist(id, btn) {
    let wasAdded = false;
    if (wishlist.includes(id)) {
        wishlist = wishlist.filter(x => x !== id);
        if (btn) {
            btn.classList.remove('active');
            btn.innerHTML = _heartSVG(false);
            btn.setAttribute('aria-label', 'Add to wishlist');
        }
    } else {
        wishlist.push(id);
        wasAdded = true;
        if (btn) {
            btn.classList.add('active');
            btn.innerHTML = _heartSVG(true);
            btn.setAttribute('aria-label', 'Remove from wishlist');
        }
        showToast(t('wishlist.added'));
    }
    setSafeStorage('gb_wishlist', wishlist);
    if (typeof updateWishlistBadges === 'function') {
        updateWishlistBadges();
    } else {
        const stat = document.getElementById('profileStatWishlist');
        if (stat) stat.textContent = wishlist.length;
        const navB = document.getElementById('wishlistBadgeNav');
        if (navB) navB.textContent = wishlist.length;
        const mobB = document.getElementById('mobileWishlistBadge');
        if (mobB) mobB.textContent = wishlist.length;
    }
}
