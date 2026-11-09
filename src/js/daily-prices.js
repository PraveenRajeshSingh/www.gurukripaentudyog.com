'use strict';

function renderDailyPrices() {
    const grid = document.getElementById('dailyPricesGrid');
    const note = document.getElementById('dailyPricesNote');
    if (!grid) return;
    if (window.GurukripaCatalogPricing) GurukripaCatalogPricing.applyToProducts();
    const rows = window.GurukripaCatalogPricing
        ? GurukripaCatalogPricing.snapshot()
        : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
    if (!rows.length) {
        grid.innerHTML = '<p class="sec-sub">Catalogue unavailable.</p>';
        return;
    }
    grid.innerHTML = rows.map(function (p) {
        const esc = typeof sanitizeHTML === 'function' ? sanitizeHTML : function (s) { return String(s || ''); };
        const changed = p.oldPrice != null && Number(p.oldPrice) !== Number(p.price);
        return '<article class="daily-price-card">' +
            '<div class="daily-price-card__img"><img src="' + esc(p.img || '') + '" alt="" loading="lazy" width="72" height="72"></div>' +
            '<div><strong>' + esc(p.name) + '</strong>' +
            '<div class="daily-price-card__rate">₹' + esc(String(p.price)) +
            ' <span>/ ' + esc(p.unit || 'pc') + '</span></div>' +
            (changed ? '<div class="daily-price-card__was">Previous ₹' + esc(String(p.oldPrice)) + '</div>' : '') +
            '</div></article>';
    }).join('');
    if (note && rows[0] && rows[0].priceUpdatedAt) {
        note.textContent = 'Last catalogue touch: ' + rows[0].priceUpdatedAt +
            '. Cart lines reprice automatically when prices change.';
    }
}

(function bootDailyPrices() {
    function run() {
        renderDailyPrices();
        if (window.GurukripaCatalogPricing) {
            GurukripaCatalogPricing.onChange(renderDailyPrices);
            GurukripaCatalogPricing.syncFromApi();
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
})();
