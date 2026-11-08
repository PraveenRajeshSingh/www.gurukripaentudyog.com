// ══════════════════════════════════════════
// CATALOG DISCOVERY — search, filters, sort,
// suggestions, history, recently viewed, compare.
// Uses real PRODUCTS catalogue only (data.js).
// Depends on: PRODUCTS, renderProductCard, sanitizeHTML,
//             getSafeStorage, setSafeStorage, showToast, t (optional).
// ══════════════════════════════════════════
const CatalogDiscovery = (() => {
    const HISTORY_KEY = 'gb_search_history';
    const RECENT_KEY = 'gb_recently_viewed';
    const COMPARE_KEY = 'gb_compare_ids';
    const MAX_HISTORY = 8;
    const MAX_RECENT = 8;
    const MAX_COMPARE = 3;

    const state = {
        query: '',
        category: 'all',
        maxPrice: 15,
        stock: 'all',
        sort: 'default',
        size: 'all'
    };

    function setState(patch) {
        Object.assign(state, patch || {});
        return apply();
    }

    function getState() {
        return Object.assign({}, state);
    }

    function haystack(p) {
        return [
            p.name, p.desc, p.category, p.badge, p.stockText,
            (p.features || []).join(' '),
            String(p.price)
        ].join(' ').toLowerCase();
    }

    function matchesSize(p, size) {
        if (!size || size === 'all') return true;
        const text = ((p.features || []).join(' ') + ' ' + (p.desc || '')).toLowerCase();
        if (size === 'standard') return /230|standard|110\s*[x×]\s*70|uniform/.test(text);
        if (size === 'wirecut') return /wirecut|machine|precision|zero size/.test(text);
        if (size === 'hollow') return /hollow|partition|lightweight/.test(text);
        return true;
    }

    function matchesStock(p, stock) {
        if (!stock || stock === 'all') return true;
        if (stock === 'available') return p.stock !== 'out-of-stock';
        if (stock === 'in-stock') return p.stock === 'in-stock';
        if (stock === 'low-stock') return p.stock === 'low-stock';
        return true;
    }

    function filterList() {
        const q = String(state.query || '').trim().toLowerCase();
        let list = Array.isArray(PRODUCTS) ? PRODUCTS.slice() : [];
        if (state.category && state.category !== 'all') {
            list = list.filter((p) => p.category === state.category);
        }
        const max = Number(state.maxPrice);
        if (!isNaN(max) && max > 0) {
            list = list.filter((p) => Number(p.price) <= max);
        }
        list = list.filter((p) => matchesStock(p, state.stock));
        list = list.filter((p) => matchesSize(p, state.size));
        if (q) {
            list = list.filter((p) => haystack(p).includes(q));
        }
        return sortList(list, state.sort, q);
    }

    function sortList(list, sortBy, q) {
        const rows = list.slice();
        switch (sortBy) {
            case 'price-asc':
                rows.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                rows.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                rows.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'rating-desc':
            case 'popularity':
                rows.sort((a, b) => (b.rating * (b.reviews || 1)) - (a.rating * (a.reviews || 1)));
                break;
            case 'newest':
                rows.sort((a, b) => b.id - a.id);
                break;
            case 'relevance':
                if (q) {
                    rows.sort((a, b) => scoreRelevance(b, q) - scoreRelevance(a, q));
                }
                break;
            default:
                // Best selling: badge + reviews
                rows.sort((a, b) => {
                    const ba = /best|popular|heavy/i.test(a.badge || '') ? 1 : 0;
                    const bb = /best|popular|heavy/i.test(b.badge || '') ? 1 : 0;
                    if (bb !== ba) return bb - ba;
                    return (b.reviews || 0) - (a.reviews || 0);
                });
        }
        return rows;
    }

    function scoreRelevance(p, q) {
        const name = String(p.name || '').toLowerCase();
        const cat = String(p.category || '').toLowerCase();
        let s = 0;
        if (name === q) s += 100;
        if (name.startsWith(q)) s += 40;
        if (name.includes(q)) s += 20;
        if (cat.includes(q)) s += 10;
        if (haystack(p).includes(q)) s += 5;
        s += (p.rating || 0) + Math.min(10, (p.reviews || 0) / 20);
        return s;
    }

    function apply() {
        const list = filterList();
        const grid = document.getElementById('productsGrid');
        const count = document.getElementById('productsCount');
        if (count) {
            const q = String(state.query || '').trim();
            count.textContent = list.length + ' product' + (list.length !== 1 ? 's' : '') +
                (q ? ' for “' + q + '”' : '');
        }
        if (!grid) return list;
        if (typeof renderActiveFilterChips === 'function') renderActiveFilterChips();
        if (!list.length) {
            const emptyMsg = typeof t === 'function' ? t('products.empty') : 'No products found.';
            grid.innerHTML =
                '<div class="products-empty catalog-empty" role="status">' +
                '<div class="products-empty__icon" aria-hidden="true">🧱</div>' +
                '<p class="products-empty__title">No matching bricks</p>' +
                '<p class="products-empty__text">' + emptyMsg + '</p>' +
                '<button type="button" class="btn btn-outline btn-sm" onclick="CatalogDiscovery.resetFilters();if(typeof renderActiveFilterChips===\'function\')renderActiveFilterChips()">Clear all filters</button>' +
                '</div>';
            return list;
        }
        if (typeof renderProductCard === 'function') {
            grid.innerHTML = list.map((p) => renderProductCard(p)).join('');
        }
        renderRecentStrip();
        renderCompareBar();
        return list;
    }

    function resetFilters() {
        state.query = '';
        state.category = 'all';
        state.maxPrice = 15;
        state.stock = 'all';
        state.sort = 'default';
        state.size = 'all';
        if (typeof currentFilter !== 'undefined') currentFilter = 'all';
        const search = document.getElementById('navSearch');
        if (search) search.value = '';
        const price = document.getElementById('filterPriceRange');
        if (price) price.value = '15';
        const priceLabel = document.getElementById('currentMaxPriceLabel');
        if (priceLabel) priceLabel.textContent = 'Up to ₹15.00';
        const sortEl = document.getElementById('productsSort');
        if (sortEl) sortEl.value = 'default';
        document.querySelectorAll('.filter-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
        const stockSel = document.getElementById('filterStock');
        if (stockSel) stockSel.value = 'all';
        const sizeSel = document.getElementById('filterSize');
        if (sizeSel) sizeSel.value = 'all';
        hideSuggestions();
        apply();
        if (typeof renderActiveFilterChips === 'function') renderActiveFilterChips();
    }

    // ── Suggestions & history ──────────────────────────────────
    function getHistory() {
        return getSafeStorage(HISTORY_KEY, []).filter(Boolean).slice(0, MAX_HISTORY);
    }

    function pushHistory(q) {
        const term = String(q || '').trim();
        if (term.length < 2) return;
        const next = [term].concat(getHistory().filter((h) => h.toLowerCase() !== term.toLowerCase()));
        setSafeStorage(HISTORY_KEY, next.slice(0, MAX_HISTORY));
    }

    function suggest(q) {
        const term = String(q || '').trim().toLowerCase();
        if (!term) {
            return getHistory().map((h) => ({ type: 'history', label: h, query: h }));
        }
        const out = [];
        const seen = {};
        (PRODUCTS || []).forEach((p) => {
            if (out.length >= 6) return;
            if (!haystack(p).includes(term)) return;
            if (seen[p.id]) return;
            seen[p.id] = true;
            out.push({ type: 'product', label: p.name, query: p.name, id: p.id, price: p.price });
        });
        Object.keys(CAT_LABELS || {}).forEach((cat) => {
            if (out.length >= 8) return;
            const label = CAT_LABELS[cat];
            if (String(label).toLowerCase().includes(term) || cat.includes(term)) {
                out.push({ type: 'category', label: label, query: cat, category: cat });
            }
        });
        return out;
    }

    function renderSuggestions(items) {
        const box = document.getElementById('searchSuggestPanel');
        if (!box) return;
        if (!items || !items.length) {
            box.hidden = true;
            box.innerHTML = '';
            return;
        }
        box.hidden = false;
        box.innerHTML = items.map((item) => {
            const icon = item.type === 'history' ? '🕒' : (item.type === 'category' ? '📂' : '🧱');
            const meta = item.type === 'product' && item.price != null
                ? '<span class="search-suggest__meta">₹' + item.price + '</span>'
                : (item.type === 'history' ? '<span class="search-suggest__meta">Recent</span>' : '');
            return '<button type="button" class="search-suggest__item" data-suggest-type="' +
                sanitizeHTML(item.type) + '" data-suggest-query="' + sanitizeHTML(item.query || '') + '"' +
                (item.id ? ' data-suggest-id="' + item.id + '"' : '') +
                (item.category ? ' data-suggest-cat="' + sanitizeHTML(item.category) + '"' : '') +
                '>' +
                '<span class="search-suggest__icon" aria-hidden="true">' + icon + '</span>' +
                '<span class="search-suggest__label">' + sanitizeHTML(item.label) + '</span>' +
                meta +
                '</button>';
        }).join('');
    }

    function hideSuggestions() {
        const box = document.getElementById('searchSuggestPanel');
        if (box) { box.hidden = true; box.innerHTML = ''; }
    }

    function runSearch(q, opts) {
        const term = String(q || '').trim();
        state.query = term;
        if (term) {
            state.sort = state.sort === 'default' ? 'relevance' : state.sort;
            const sortEl = document.getElementById('productsSort');
            if (sortEl && state.sort === 'relevance') sortEl.value = 'relevance';
            pushHistory(term);
        }
        apply();
        if (!(opts && opts.silentScroll)) {
            document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        hideSuggestions();
    }

    function bindSearch() {
        const input = document.getElementById('navSearch');
        const panel = document.getElementById('searchSuggestPanel');
        if (!input || input.dataset.catalogBound === '1') return;
        input.dataset.catalogBound = '1';

        let timer;
        input.addEventListener('input', function () {
            clearTimeout(timer);
            const q = this.value;
            timer = setTimeout(() => {
                renderSuggestions(suggest(q));
                runSearch(q, { silentScroll: true });
            }, 180);
        });
        input.addEventListener('focus', function () {
            renderSuggestions(suggest(this.value));
        });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                runSearch(this.value);
            }
            if (e.key === 'Escape') {
                hideSuggestions();
                this.blur();
            }
        });
        if (panel) {
            panel.addEventListener('click', function (e) {
                const btn = e.target.closest && e.target.closest('.search-suggest__item');
                if (!btn) return;
                const type = btn.getAttribute('data-suggest-type');
                const query = btn.getAttribute('data-suggest-query') || '';
                const id = parseInt(btn.getAttribute('data-suggest-id') || '', 10);
                const cat = btn.getAttribute('data-suggest-cat');
                if (type === 'product' && id && typeof openProductDetail === 'function') {
                    input.value = query;
                    state.query = query;
                    pushHistory(query);
                    apply();
                    openProductDetail(id);
                    hideSuggestions();
                    return;
                }
                if (type === 'category' && cat) {
                    input.value = '';
                    state.query = '';
                    if (typeof filterProducts === 'function') filterProducts(cat);
                    else setState({ category: cat });
                    hideSuggestions();
                    return;
                }
                input.value = query;
                runSearch(query);
            });
        }
        document.addEventListener('click', function (e) {
            if (e.target.closest && (e.target.closest('.nav-search') || e.target.closest('#searchSuggestPanel'))) return;
            hideSuggestions();
        });
    }

    // ── Recently viewed ────────────────────────────────────────
    function getRecentIds() {
        return getSafeStorage(RECENT_KEY, []).map(Number).filter(Boolean);
    }

    function recordView(id) {
        const pid = Number(id);
        if (!pid) return;
        const next = [pid].concat(getRecentIds().filter((x) => x !== pid)).slice(0, MAX_RECENT);
        setSafeStorage(RECENT_KEY, next);
        renderRecentStrip();
    }

    function renderRecentStrip() {
        const host = document.getElementById('recentlyViewedStrip');
        if (!host || typeof renderProductCard !== 'function') return;
        const ids = getRecentIds();
        const items = ids.map((id) => (PRODUCTS || []).find((p) => p.id === id)).filter(Boolean);
        if (!items.length) {
            host.hidden = true;
            host.innerHTML = '';
            return;
        }
        host.hidden = false;
        host.innerHTML =
            '<div class="recent-strip__head"><h3 class="recent-strip__title">Recently viewed</h3></div>' +
            '<div class="recent-strip__row">' +
            items.slice(0, 4).map((p) =>
                '<button type="button" class="recent-chip" onclick="openProductDetail(' + p.id + ')">' +
                '<img src="' + sanitizeHTML(p.img) + '" alt="" width="40" height="40" loading="lazy">' +
                '<span>' + sanitizeHTML(p.name) + '</span>' +
                '<strong>₹' + p.price + '</strong></button>'
            ).join('') +
            '</div>';
    }

    // ── Compare ────────────────────────────────────────────────
    function getCompareIds() {
        return getSafeStorage(COMPARE_KEY, []).map(Number).filter(Boolean).slice(0, MAX_COMPARE);
    }

    function saveCompare(ids) {
        setSafeStorage(COMPARE_KEY, ids.slice(0, MAX_COMPARE));
        renderCompareBar();
        syncCompareButtons();
    }

    function toggleCompare(id) {
        const pid = Number(id);
        if (!pid) return;
        let ids = getCompareIds();
        if (ids.indexOf(pid) >= 0) {
            ids = ids.filter((x) => x !== pid);
        } else {
            if (ids.length >= MAX_COMPARE) {
                if (typeof showToast === 'function') {
                    showToast('Compare up to ' + MAX_COMPARE + ' products. Remove one first.', 'info');
                }
                return;
            }
            ids.push(pid);
        }
        saveCompare(ids);
    }

    function clearCompare() {
        saveCompare([]);
        const modal = document.getElementById('compareModal');
        if (modal) modal.classList.remove('open');
    }

    function isCompared(id) {
        return getCompareIds().indexOf(Number(id)) >= 0;
    }

    function syncCompareButtons() {
        document.querySelectorAll('[data-compare-id]').forEach((el) => {
            const id = Number(el.getAttribute('data-compare-id'));
            const on = isCompared(id);
            el.classList.toggle('active', on);
            el.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    }

    function renderCompareBar() {
        const bar = document.getElementById('compareBar');
        if (!bar) return;
        const ids = getCompareIds();
        const items = ids.map((id) => (PRODUCTS || []).find((p) => p.id === id)).filter(Boolean);
        if (!items.length) {
            bar.hidden = true;
            bar.innerHTML = '';
            return;
        }
        bar.hidden = false;
        bar.innerHTML =
            '<div class="compare-bar__inner">' +
            '<span class="compare-bar__label">Compare (' + items.length + '/' + MAX_COMPARE + ')</span>' +
            '<div class="compare-bar__chips">' +
            items.map((p) => '<span class="compare-bar__chip">' + sanitizeHTML(p.name) +
                ' <button type="button" aria-label="Remove" onclick="CatalogDiscovery.toggleCompare(' + p.id + ')">×</button></span>').join('') +
            '</div>' +
            '<button type="button" class="btn btn-primary btn-sm" onclick="CatalogDiscovery.openCompare()" ' +
            (items.length < 2 ? 'disabled' : '') + '>Compare</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" onclick="CatalogDiscovery.clearCompare()">Clear</button>' +
            '</div>';
        syncCompareButtons();
    }

    function openCompare() {
        const ids = getCompareIds();
        const items = ids.map((id) => (PRODUCTS || []).find((p) => p.id === id)).filter(Boolean);
        if (items.length < 2) {
            if (typeof showToast === 'function') showToast('Select at least 2 products to compare.', 'info');
            return;
        }
        const modal = document.getElementById('compareModal');
        const body = document.getElementById('compareModalBody');
        if (!modal || !body) return;

        const rows = [
            { label: 'Image', render: (p) => '<img src="' + sanitizeHTML(p.img) + '" alt="" class="compare-img" loading="lazy">' },
            { label: 'Product', render: (p) => '<strong>' + sanitizeHTML(p.name) + '</strong>' },
            { label: 'Category', render: (p) => sanitizeHTML((CAT_LABELS && CAT_LABELS[p.category]) || p.category) },
            { label: 'Price / pc', render: (p) => '<span class="compare-price">₹' + p.price + '</span>' },
            { label: 'Per 1,000', render: (p) => '₹' + Math.round(p.price * 1000).toLocaleString('en-IN') },
            { label: 'Rating', render: (p) => p.rating + ' (' + (p.reviews || 0) + ')' },
            { label: 'Availability', render: (p) => sanitizeHTML(p.stockText || p.stock) },
            { label: 'Key specs', render: (p) => '<ul class="compare-specs">' + (p.features || []).map((f) => '<li>' + sanitizeHTML(f) + '</li>').join('') + '</ul>' }
        ];

        body.innerHTML =
            '<div class="compare-table-wrap"><table class="compare-table"><thead><tr><th scope="col">Spec</th>' +
            items.map((p) => '<th scope="col">' + sanitizeHTML(p.name) + '</th>').join('') +
            '</tr></thead><tbody>' +
            rows.map((row) => '<tr><th scope="row">' + row.label + '</th>' +
                items.map((p) => '<td>' + row.render(p) + '</td>').join('') +
                '</tr>').join('') +
            '</tbody></table></div>' +
            '<div class="compare-actions">' +
            items.map((p) =>
                '<button type="button" class="btn btn-primary btn-sm" onclick="closeCompareModal();addToCart(' + p.id + ')">Add ' +
                sanitizeHTML(p.name.split(' ')[0]) + ' to cart</button>'
            ).join('') +
            '</div>';

        modal.classList.add('open');
        if (typeof overlayLock === 'function') overlayLock();
    }

    function closeCompareModal() {
        document.getElementById('compareModal')?.classList.remove('open');
        if (typeof overlayUnlock === 'function') overlayUnlock();
    }

    function relatedFor(id, limit) {
        const p = (PRODUCTS || []).find((x) => x.id === Number(id));
        if (!p) return [];
        return (PRODUCTS || [])
            .filter((x) => x.id !== p.id)
            .sort((a, b) => {
                const ca = a.category === p.category ? 0 : 1;
                const cb = b.category === p.category ? 0 : 1;
                if (ca !== cb) return ca - cb;
                return Math.abs(a.price - p.price) - Math.abs(b.price - p.price);
            })
            .slice(0, limit || 3);
    }

    document.addEventListener('DOMContentLoaded', function () {
        bindSearch();
        renderRecentStrip();
        renderCompareBar();
    });

    return {
        state: getState,
        getState,
        setState,
        apply,
        resetFilters,
        filterList,
        runSearch,
        suggest,
        recordView,
        toggleCompare,
        clearCompare,
        openCompare,
        closeCompareModal,
        isCompared,
        relatedFor,
        getRecentIds,
        getHistory
    };
})();
window.CatalogDiscovery = CatalogDiscovery;
