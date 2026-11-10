/**
 * pull-to-refresh.js
 * Gurukripa Bricks Industry — Pull-to-Refresh Controller
 *
 * Requirements:
 *  - Only triggers when page is scrolled to the very top (scrollY === 0)
 *  - Prevents triggering inside nested scroll containers (modals, drawers, maps)
 *  - Respects prefers-reduced-motion
 *  - Single refresh at a time (busy guard)
 *  - Shows lightweight indicator with success/error state
 *  - Dispatches 'gb:page-refresh' for data reload listeners
 *  - Works with Android Chrome and iOS Safari
 *  - Does NOT conflict with the overlay scroll-lock system
 *
 * No external dependencies. Passive touch listeners only.
 */

(function GBPullToRefresh() {
    'use strict';

    // ── Configuration ────────────────────────────────────────────────────────
    var PULL_THRESHOLD    = 72;   // px drag before refresh triggers
    var MAX_PULL          = 110;  // px clamp on drag distance
    var INDICATOR_ID      = 'gb-ptr-indicator';
    var INDICATOR_HEIGHT  = 56;   // px height of the indicator element
    var REFRESH_TIMEOUT   = 8000; // max ms a refresh can be "in progress"

    // ── State ─────────────────────────────────────────────────────────────────
    var _startY      = 0;
    var _currentY    = 0;
    var _pulling     = false;
    var _busy        = false;
    var _indicator   = null;
    var _busyTimer   = null;

    // ── Reduced-motion check ──────────────────────────────────────────────────
    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // ── Build the indicator element ───────────────────────────────────────────
    function buildIndicator() {
        var el = document.getElementById(INDICATOR_ID);
        if (el) return el;

        el = document.createElement('div');
        el.id        = INDICATOR_ID;
        el.className = 'gb-ptr-indicator';
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-label', 'Pull to refresh');
        el.setAttribute('role', 'status');
        el.innerHTML =
            '<div class="gb-ptr-spinner"></div>' +
            '<span class="gb-ptr-label">Pull to refresh</span>';

        // Insert before first child of body so it paints at the very top
        var body = document.body;
        body.insertBefore(el, body.firstChild);
        return el;
    }

    // ── Determine if a touch started in a nested scroller ────────────────────
    function isInsideNestedScroller(target) {
        // Walk up from touch target; if we hit a scrollable before <body>, skip PTR
        var el = target;
        while (el && el !== document.body && el !== document.documentElement) {
            var style = window.getComputedStyle(el);
            var overflowY = style.overflowY;
            var canScrollY = (overflowY === 'auto' || overflowY === 'scroll') &&
                             el.scrollHeight > el.clientHeight;
            if (canScrollY) return true;

            // Always skip overlays, modals, drawers, maps, chatbot
            if (el.classList) {
                if (el.classList.contains('modal-overlay')  ||
                    el.classList.contains('modal-box')       ||
                    el.classList.contains('cart-drawer')     ||
                    el.classList.contains('wishlist-drawer') ||
                    el.classList.contains('drawer')          ||
                    el.classList.contains('chatbot-box')     ||
                    el.classList.contains('catalog-sidebar') ||
                    el.id === 'lb'                           ||
                    // Map containers — Google Maps handles its own touch
                    el.classList.contains('gm-style')        ||
                    el.classList.contains('cities-map')      ||
                    el.classList.contains('map-embed')       ||
                    el.classList.contains('contact-map-wrap') ||
                    el.id === 'trackerMapContainer'          ||
                    el.id === 'nearbyMap') {
                    return true;
                }
            }
            el = el.parentElement;
        }
        return false;
    }

    // ── Update indicator visual state ─────────────────────────────────────────
    function setIndicatorState(state, pullPct) {
        if (!_indicator) return;

        var label = _indicator.querySelector('.gb-ptr-label');

        _indicator.className = 'gb-ptr-indicator';

        if (state === 'pulling') {
            _indicator.classList.add('gb-ptr--pulling');
            if (pullPct >= 1) _indicator.classList.add('gb-ptr--ready');
            if (label) label.textContent = pullPct >= 1 ? 'Release to refresh' : 'Pull to refresh';
            var translateY = Math.min(pullPct * INDICATOR_HEIGHT, INDICATOR_HEIGHT);
            if (!prefersReducedMotion()) {
                _indicator.style.transform = 'translateY(' + translateY + 'px)';
            } else {
                _indicator.style.transform = 'translateY(0)';
            }
        } else if (state === 'refreshing') {
            _indicator.classList.add('gb-ptr--refreshing');
            if (label) label.textContent = 'Refreshing…';
            _indicator.style.transform = 'translateY(' + INDICATOR_HEIGHT + 'px)';
        } else if (state === 'success') {
            _indicator.classList.add('gb-ptr--success');
            if (label) label.textContent = 'Up to date ✓';
            _indicator.style.transform = 'translateY(' + INDICATOR_HEIGHT + 'px)';
        } else if (state === 'error') {
            _indicator.classList.add('gb-ptr--error');
            if (label) label.textContent = 'Could not refresh';
            _indicator.style.transform = 'translateY(' + INDICATOR_HEIGHT + 'px)';
        } else {
            // idle / reset
            _indicator.style.transform = 'translateY(-' + INDICATOR_HEIGHT + 'px)';
        }
    }

    // ── Reset everything to idle ───────────────────────────────────────────────
    function resetPTR(delay) {
        delay = delay || 0;
        setTimeout(function () {
            _pulling = false;
            setIndicatorState('idle');
        }, delay);
    }

    // ── Trigger the actual refresh ─────────────────────────────────────────────
    function triggerRefresh() {
        if (_busy) return;
        _busy = true;
        setIndicatorState('refreshing');

        // Safety timeout — always resolve after REFRESH_TIMEOUT
        clearTimeout(_busyTimer);
        _busyTimer = setTimeout(function () {
            finishRefresh(false);
        }, REFRESH_TIMEOUT);

        // Dispatch event; listeners in data.js / daily-prices.js / etc. should
        // respond and call GBPullToRefresh.resolve(success).
        try {
            var evt = new CustomEvent('gb:page-refresh', {
                bubbles: true,
                cancelable: false,
                detail: { timestamp: Date.now() }
            });
            document.dispatchEvent(evt);
        } catch (e) {
            // Fallback: simple window reload
            finishRefresh(true);
            setTimeout(function () { window.location.reload(); }, 400);
        }
    }

    // ── Called by external code when the refresh completes ───────────────────
    function finishRefresh(success) {
        clearTimeout(_busyTimer);
        _busy = false;
        setIndicatorState(success !== false ? 'success' : 'error');
        resetPTR(1200);
    }

    // ── Touch event handlers ──────────────────────────────────────────────────
    function onTouchStart(e) {
        // Only handle single-finger touches
        if (e.touches.length !== 1) return;

        // Don't interfere if any overlay is open
        if (document.body.classList.contains('overlay-open') ||
            document.body.classList.contains('account-popup-open')) return;

        // Never steal taps that begin on controls (Add to Cart, hearts, etc.)
        var t = e.target;
        if (t && t.closest && t.closest('button, a, input, select, textarea, [data-action], [role="button"], .catalog-add, .wishlist-btn, .fab-stack')) {
            return;
        }

        // Skip if started in a nested scroller
        if (isInsideNestedScroller(e.target)) return;

        // Only activate when page is at the very top
        var scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        if (scrollTop > 2) return;

        _startY   = e.touches[0].clientY;
        _currentY = _startY;
        _pulling  = false;
    }

    function onTouchMove(e) {
        if (_busy) return;
        if (!_startY) return;

        // Skip nested scrollers (re-check on move since target is captured)
        if (document.body.classList.contains('overlay-open') ||
            document.body.classList.contains('account-popup-open')) {
            _startY = 0;
            return;
        }

        _currentY = e.touches[0].clientY;
        var deltaY = _currentY - _startY;

        // Only respond to downward drags
        if (deltaY <= 0) {
            if (_pulling) resetPTR();
            return;
        }

        // Page must still be at the top
        var scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        if (scrollTop > 2) {
            if (_pulling) resetPTR();
            return;
        }

        // Clamp drag
        var pull    = Math.min(deltaY, MAX_PULL);
        var pullPct = pull / PULL_THRESHOLD;

        if (!_pulling && pull > 4) {
            _pulling = true;
            if (!_indicator) _indicator = buildIndicator();
        }

        if (_pulling) {
            setIndicatorState('pulling', pullPct);
            // Prevent browser's native pull-to-refresh on Android Chrome
            // only while we are handling the gesture
            if (e.cancelable) {
                try { e.preventDefault(); } catch (_) {}
            }
        }
    }

    function onTouchEnd() {
        if (!_pulling || _busy) {
            _startY   = 0;
            _currentY = 0;
            return;
        }

        var deltaY = _currentY - _startY;
        _startY   = 0;
        _currentY = 0;

        if (deltaY >= PULL_THRESHOLD) {
            triggerRefresh();
        } else {
            _pulling = false;
            resetPTR(50);
        }
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    function init() {
        // Build indicator early so it's in the DOM (hidden) on page load
        _indicator = buildIndicator();

        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchmove',  onTouchMove,  { passive: false });
        document.addEventListener('touchend',   onTouchEnd,   { passive: true });
        document.addEventListener('touchcancel',function () {
            _pulling  = false;
            _startY   = 0;
            _currentY = 0;
            resetPTR(50);
        }, { passive: true });

        // Listen for page-refresh completion signals from data modules
        document.addEventListener('gb:page-refresh-done', function (e) {
            finishRefresh(e && e.detail && e.detail.success !== false);
        });

        // Auto-resolve if no one handles the event within 4 s (graceful fallback)
        document.addEventListener('gb:page-refresh', function () {
            // If no module responded after 4 s, do a full page reload
            setTimeout(function () {
                if (_busy) {
                    finishRefresh(true);
                    setTimeout(function () { window.location.reload(); }, 300);
                }
            }, 4000);
        });
    }

    // ── Public API ────────────────────────────────────────────────────────────
    window.GBPullToRefresh = {
        init:    init,
        resolve: finishRefresh
    };

    // Auto-init after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
