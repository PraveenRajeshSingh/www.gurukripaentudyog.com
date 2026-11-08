/* ══════════════════════════════════════════════════════════════════
   Interaction guard — double-submit prevention, map resize on
   modal open, visualViewport keyboard/safe-area CSS vars.
   Load after ui.js + maps-service.js. Non-invasive: no redesign.
   ══════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    function setBusy(btn, on) {
        if (!btn) return;
        if (on) {
            btn.classList.add('is-busy');
            btn.setAttribute('aria-busy', 'true');
            btn.dataset.gbBusy = '1';
        } else {
            btn.classList.remove('is-busy');
            btn.removeAttribute('aria-busy');
            delete btn.dataset.gbBusy;
        }
    }

    // Capture-phase: block rapid re-clicks on submit/checkout only.
    // Never guard plain links (map Directions / Open in Maps) or navigation.
    document.addEventListener('click', function (e) {
        // CHANGE: also guard Add to Cart / Place Order / RFQ / Save Estimate (polish §1)
        var btn = e.target && e.target.closest && e.target.closest(
            'form button[type="submit"], form input[type="submit"],' +
            '#checkoutModal button.btn-primary, #authModal button.btn-primary,' +
            '#contactForm button[type="submit"], #contactForm button.btn-primary,' +
            'button[data-busy-guard], button.product-add-btn,' +
            '#calcSaveBtn, #calcSaveEstimate, button[data-action="add-to-cart"],' +
            '#bulkQuoteForm button.btn-primary, #placeOrderBtn, #checkoutPlaceBtn'
        );
        if (!btn || btn.tagName === 'A') return;
        if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;
        if (btn.dataset.gbBusy === '1') {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        setBusy(btn, true);
        window.setTimeout(function () { setBusy(btn, false); }, 2500);
    }, true);

    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (!form || form.tagName !== 'FORM') return;
        if (form.dataset.gbSubmitting === '1') {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        form.dataset.gbSubmitting = '1';
        window.setTimeout(function () { delete form.dataset.gbSubmitting; }, 4000);
    }, true);

    // When a modal that hosts a map opens, reflow Google Maps / embed height.
    function refreshOpenMaps() {
        if (window.GurukripaMaps && typeof GurukripaMaps.invalidateMapIn === 'function') {
            GurukripaMaps.invalidateMapIn('trackerMapContainer');
        }
        var frame = document.getElementById('contactMapFrame');
        var loading = document.getElementById('contactMapLoading');
        if (frame && loading && !loading.hidden && frame.contentWindow) {
            // Leave loading until iframe onload; no-op refresh.
        }
    }

    var mapObserver = null;
    function watchTrackerModal() {
        var modal = document.getElementById('trackerModal');
        if (!modal || mapObserver) return;
        mapObserver = new MutationObserver(function () {
            if (modal.classList.contains('open')) {
                window.setTimeout(refreshOpenMaps, 100);
                window.setTimeout(refreshOpenMaps, 350);
            }
        });
        mapObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }

    function syncViewportVars() {
        var vv = window.visualViewport;
        var h = vv ? vv.height : window.innerHeight;
        document.documentElement.style.setProperty('--vv-height', h + 'px');
        document.documentElement.style.setProperty('--app-height', h + 'px');
    }

    function onReady() {
        watchTrackerModal();
        syncViewportVars();
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', syncViewportVars, { passive: true });
            window.visualViewport.addEventListener('scroll', syncViewportVars, { passive: true });
        }
        window.addEventListener('orientationchange', function () {
            window.setTimeout(function () {
                syncViewportVars();
                refreshOpenMaps();
            }, 200);
        }, { passive: true });
        window.addEventListener('resize', function () {
            syncViewportVars();
            refreshOpenMaps();
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }
})();
