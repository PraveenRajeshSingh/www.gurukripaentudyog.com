'use strict';
/**
 * Phase 4 — reusable popup manager layered on ui.js overlay helpers.
 * - History Back closes the top overlay (does not leave the site)
 * - Boot + hashchange force-closed panels (D9)
 * - PTR / FAB helpers while overlays are open
 * - Optional swipe-down dismiss on mobile sheets (respects reduced-motion)
 */
(function (global) {
    var historyPushed = 0;
    var ignoringPop = false;
    var swipeBound = false;

    function prefersReducedMotion() {
        try {
            return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        } catch (_e) { return false; }
    }

    function topPair() {
        return (typeof activeOverlay === 'function') ? activeOverlay() : null;
    }

    function pushHistory(id) {
        if (ignoringPop) return;
        try {
            historyPushed += 1;
            history.pushState({ gbiOverlay: id || true, gbiN: historyPushed }, '');
        } catch (_e) { /* ignore private / file origins */ }
    }

    function consumeHistoryOnClose() {
        if (ignoringPop || historyPushed <= 0) return;
        historyPushed -= 1;
        ignoringPop = true;
        try { history.back(); } catch (_e) { /* ignore */ }
        setTimeout(function () { ignoringPop = false; }, 0);
    }

    function onPopState() {
        if (ignoringPop) return;
        var pair = topPair();
        if (!pair) {
            historyPushed = 0;
            return;
        }
        ignoringPop = true;
        if (historyPushed > 0) historyPushed -= 1;
        try { pair[1](); } catch (_e) { /* ignore */ }
        if (!topPair()) document.body.classList.remove('gb-popup-open');
        ignoringPop = false;
    }

    function closeEverything() {
        if (typeof ensureOverlaysClosedOnBoot === 'function') {
            ensureOverlaysClosedOnBoot();
        }
        // Extra surfaces not always covered by the boot closer
        [
            'checkoutModal', 'profileModal', 'compareModal', 'legalModal',
            'bulkQuoteModal', 'adminPortalModal', 'trackerModal',
            'orderDetailsModal', 'gstInvoiceModal', 'invoicePdfModal',
            'companyProfileModal', 'gbDialogModal', 'pincodeModal'
        ].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) {
                el.classList.remove('open');
                el.setAttribute('aria-hidden', 'true');
            }
        });
        document.querySelectorAll('.cart-overlay, .wishlist-overlay, #drawerOverlay, #filterSheetBackdrop, #accountPopupBackdrop')
            .forEach(function (el) { el.classList.remove('open', 'is-open'); });
        document.body.classList.remove('overlay-open', 'account-popup-open', 'gb-chat-open', 'checkout-open', 'has-mini-cart-lock');
        document.documentElement.classList.remove('overlay-open');
        historyPushed = 0;
    }

    function onOverlayOpened(detail) {
        var id = (detail && detail.id) || '';
        pushHistory(id);
        document.body.classList.add('gb-popup-open');
        if (typeof closeFabHelp === 'function') {
            try { closeFabHelp(); } catch (_e) { /* ignore */ }
        }
    }

    function onOverlayClosed() {
        if (!topPair()) {
            document.body.classList.remove('gb-popup-open');
            consumeHistoryOnClose();
        }
    }

    function bindSwipeDismiss(root) {
        if (!root || swipeBound || prefersReducedMotion()) return;
        var startY = 0;
        var tracking = false;
        var handle = root.querySelector('.modal-head, .cart-head, .catalog-sheet-head, .co-sheet__head, .filter-sheet-bar, [data-sheet-handle]');
        if (!handle) return;
        swipeBound = true;
        handle.addEventListener('touchstart', function (e) {
            if (!e.touches || !e.touches[0]) return;
            if (window.matchMedia && !window.matchMedia('(max-width: 1023.98px)').matches) return;
            startY = e.touches[0].clientY;
            tracking = true;
        }, { passive: true });
        handle.addEventListener('touchmove', function (e) {
            if (!tracking || !e.touches || !e.touches[0]) return;
            var dy = e.touches[0].clientY - startY;
            if (dy > 72) {
                tracking = false;
                var pair = topPair();
                if (pair) pair[1]();
            }
        }, { passive: true });
        handle.addEventListener('touchend', function () { tracking = false; }, { passive: true });
    }

    function onLayout(ev) {
        var d = (ev && ev.detail) || {};
        if (d.open) {
            onOverlayOpened(d);
            var el = d.id ? document.getElementById(d.id) : null;
            if (el) bindSwipeDismiss(el);
        } else if (d.id) {
            onOverlayClosed();
        }
        // Keep PTR aware: body.gb-popup-open is checked by pull-to-refresh
    }

    function init() {
        window.addEventListener('popstate', onPopState);
        window.addEventListener('gb:overlay-layout', onLayout);
        window.addEventListener('hashchange', function () {
            // Hash nav should never leave drawers/modals stranded open
            closeEverything();
        });
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () { closeEverything(); });
        } else {
            closeEverything();
        }
        // Late pass after other inits may have toggled classes
        window.addEventListener('load', function () {
            setTimeout(closeEverything, 0);
            setTimeout(closeEverything, 400);
        });
    }

    var api = {
        closeEverything: closeEverything,
        pushHistory: pushHistory,
        init: init
    };
    global.GBI = global.GBI || {};
    global.GBI.PopupManager = api;
    init();
})(typeof window !== 'undefined' ? window : globalThis);
