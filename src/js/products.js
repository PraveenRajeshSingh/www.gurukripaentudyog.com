// ══════════════════════════════════════════
// PRODUCTS & RENDER
// ══════════════════════════════════════════
function filterProducts(cat, btn) {
    currentFilter = cat;
    if (btn) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    renderProducts(cat);
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderProducts(filter) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    const filtered = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);
    if (!filtered.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ink-3)">No products found in this category.</div>';
        return;
    }
    grid.innerHTML = filtered.map(p => {
        const isWish = wishlist.includes(p.id);
        return `
        <div class="product-card fade-in">
          <div class="product-card-img-wrap">
            <img class="product-card-img" src="${p.img}" alt="${sanitizeHTML(p.name)}" loading="lazy">
            ${p.badge ? `<span class="product-card-badge ${p.badgeClass || ''}">${sanitizeHTML(p.badge)}</span>` : ''}
            <span class="stock-badge ${p.stock || 'in-stock'}">${sanitizeHTML(p.stockText || 'In Stock')}</span>
            <div class="quick-view-overlay"><button class="quick-view-btn" onclick="openProductDetail(${p.id})">🔍 Quick View</button></div>
            <button class="wishlist-btn ${isWish ? 'active' : ''}" onclick="toggleWishlist(${p.id},this)" aria-label="Wishlist">${isWish ? '❤️' : '🤍'}</button>
          </div>
          <div class="product-card-body">
            <div class="product-card-name">${sanitizeHTML(p.name)}</div>
            <div class="product-card-desc line-clamp-2">${sanitizeHTML(p.desc)}</div>
            <div class="product-card-rating">
              <span class="product-card-stars">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}</span>
              <span class="product-card-rating-num">${p.rating} (${p.reviews})</span>
            </div>
            <div class="product-card-price">
              <span class="product-price-current">₹${p.price}</span>
              <span class="product-price-unit">${sanitizeHTML(p.unit)}</span>
              ${p.oldPrice ? `<span class="product-price-old">₹${p.oldPrice}</span>` : ''}
            </div>
            <div class="product-card-actions">
              <button class="btn btn-outline btn-sm" onclick="openProductDetail(${p.id})">Details</button>
              <button class="product-add-btn" onclick="triggerCartBounce(this);addToCart(${p.id})">🛒 Add to Cart</button>
            </div>
          </div>
        </div>`;
    }).join('');
}

function triggerCartBounce(btn) {
    btn.classList.add('cart-bounce');
    setTimeout(() => btn.classList.remove('cart-bounce'), 500);
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
    if (wishlist.includes(id)) {
        wishlist = wishlist.filter(x => x !== id);
        if (btn) { btn.innerHTML = '🤍'; btn.classList.remove('active'); }
    } else {
        wishlist.push(id);
        if (btn) { btn.innerHTML = '❤️'; btn.classList.add('active'); }
        showToast('❤️ Added to wishlist!');
    }
    setSafeStorage('gb_wishlist', wishlist);
    const stat = document.getElementById('profileStatWishlist');
    if (stat) stat.textContent = wishlist.length;
}
