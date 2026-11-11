'use strict';

function renderDailyPrices() {
    const grid = document.getElementById('dailyPricesGrid');
    const note = document.getElementById('dailyPricesNote');
    if (!grid) return;
    if (window.GurukripaCatalogPricing) GurukripaCatalogPricing.applyToProducts();
    const rows = window.GurukripaCatalogPricing
        ? GurukripaCatalogPricing.snapshot()
        : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : (window.PRODUCTS || []));
    if (!rows || !rows.length) {
        // [FIX #5] Compact inline notice instead of 470px empty block with developer wording
        grid.innerHTML = '<div class="daily-prices-error" role="alert">' +
            '<p>Rates could not be loaded at this time.</p>' +
            '<div class="daily-prices-error__actions">' +
                '<button type="button" onclick="renderDailyPrices()" class="btn btn-sm btn-outline">Retry</button>' +
                '<a href="tel:+919198923230" class="btn btn-sm btn-outline">Call the yard</a>' +
                '<a href="https://wa.me/919198923230" class="btn btn-sm btn-primary">Order on WhatsApp</a>' +
            '</div>' +
        '</div>';
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
    if (rows[0] && rows[0].priceUpdatedAt) {
        if (note) {
            // [FIX #5] Customer-friendly wording matching checkout logic
            note.textContent = 'Rates as of ' + rows[0].priceUpdatedAt + '. Prices are GST-inclusive kiln rates. Confirm stock and freight before dispatch.';
        }
        var updatedLabel = document.getElementById('dailyPricesUpdatedLabel');
        var updatedTime = document.getElementById('dailyPricesUpdatedTime');
        if (updatedLabel && updatedTime) {
            updatedTime.textContent = rows[0].priceUpdatedAt;
            updatedLabel.hidden = false;
        }
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
