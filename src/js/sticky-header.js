/**
 * COMPONENT: Sticky / floating header (Batch 3 · Phase 1)
 * Presentation only — preserves initHeaderNavFit / scroll-spy.
 * - Floating pill after ~24px (IntersectionObserver sentinel)
 * - Hide on scroll-down past ~200px (transform); reveal on up / focus / menus
 * - --header-h via ResizeObserver
 * - Active nav sliding pill + scroll progress scaleX
 */
(function (global) {
  'use strict';

  var FLOAT_Y = 24;
  var HIDE_Y = 200;
  var nav = null;
  var pill = null;
  var progressFill = null;
  var lastY = 0;
  var floating = false;
  var hidden = false;
  var pinned = false;
  var reduced = false;
  var saveData = false;
  var rafPending = false;
  var destroyFns = [];
  var api = null;
  var initialized = false;

  function qs(sel, root) {
    try { return (root || document).querySelector(sel); } catch (_e) { return null; }
  }

  function reduceMotion() {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
      if (navigator.connection && navigator.connection.saveData) return true;
    } catch (_e) { /* ignore */ }
    return false;
  }

  function overlayOrMenuOpen() {
    if (document.body.classList.contains('overlay-open')) return true;
    if (qs('.modal-overlay.open')) return true;
    if (qs('#mobileDrawer.open')) return true;
    if (qs('#userDropdown.open')) return true;
    if (qs('.search-suggest:not([hidden])')) return true;
    return false;
  }

  function userTyping() {
    var a = document.activeElement;
    if (!a) return false;
    var tag = (a.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || a.isContentEditable) return true;
    return false;
  }

  function setHeaderHeight() {
    if (!nav) return;
    var h = Math.ceil(nav.getBoundingClientRect().height) || 64;
    // When floating, include the top inset so anchors clear the pill + gap
    var inset = floating ? 8 : 0;
    try {
      document.documentElement.style.setProperty('--header-h', (h + inset) + 'px');
    } catch (_e) { /* ignore */ }
  }

  function setFloating(on) {
    if (!nav || floating === on) return;
    floating = on;
    nav.classList.toggle('is-floating', on);
    nav.classList.toggle('is-scrolled', on);
    setHeaderHeight();
  }

  function setHidden(on) {
    if (!nav || reduced) {
      if (nav) nav.classList.remove('is-hidden');
      hidden = false;
      return;
    }
    if (hidden === on) return;
    // Never hide while menus/popups open, typing, or focus inside header
    if (on && (overlayOrMenuOpen() || userTyping() || pinned || (nav && nav.contains(document.activeElement)))) {
      on = false;
    }
    hidden = on;
    nav.classList.toggle('is-hidden', on);
  }

  function updateProgress(scrollY) {
    var dh = document.documentElement.scrollHeight - window.innerHeight;
    var p = dh > 0 ? Math.min(1, Math.max(0, scrollY / dh)) : 0;
    try {
      document.documentElement.style.setProperty('--nav-progress', String(p));
    } catch (_e) { /* ignore */ }
    // Keep legacy #spbar in sync (existing ui.js also sets width)
    var bar = document.getElementById('spbar');
    if (bar && progressFill) {
      // Prefer transform on header fill; leave #spbar to ui.js width updates
    }
  }

  function updateActivePill() {
    if (!nav || !pill) return;
    var links = nav.querySelector('.nav-links-premium');
    if (!links || links.offsetParent === null) {
      pill.classList.remove('is-on');
      return;
    }
    var active = links.querySelector('.nav-link.active, .nav-link-btn.active');
    if (!active) {
      pill.classList.remove('is-on');
      return;
    }
    var lr = links.getBoundingClientRect();
    var ar = active.getBoundingClientRect();
    var x = ar.left - lr.left + links.scrollLeft;
    var w = ar.width;
    links.style.setProperty('--pill-x', x + 'px');
    links.style.setProperty('--pill-w', w + 'px');
    pill.classList.add('is-on');
  }

  function onFrame() {
    rafPending = false;
    var y = window.scrollY || window.pageYOffset || 0;
    var narrow = false;
    try { narrow = window.matchMedia('(max-width: 767.98px)').matches; } catch (_e) { /* ignore */ }
    // Mobile: keep header visible (hide/show transform feels laggy on low-end phones)
    setFloating(!narrow && y > FLOAT_Y);
    updateProgress(y);

    if (!reduced && !narrow) {
      if (overlayOrMenuOpen() || userTyping()) {
        setHidden(false);
      } else if (y < HIDE_Y) {
        setHidden(false);
      } else if (y > lastY + 2) {
        setHidden(true);
      } else if (y < lastY - 2) {
        setHidden(false);
      }
    } else {
      setHidden(false);
    }

    lastY = y;
    updateActivePill();
  }

  function requestFrame() {
    if (rafPending) return;
    rafPending = true;
    window.requestAnimationFrame(onFrame);
  }

  function onFocusIn(e) {
    if (nav && e.target && nav.contains(e.target)) {
      pinned = true;
      nav.classList.add('is-pinned');
      setHidden(false);
    }
  }

  function onFocusOut(e) {
    if (!nav) return;
    // defer to allow focus to move within header
    window.setTimeout(function () {
      if (!nav.contains(document.activeElement)) {
        pinned = false;
        nav.classList.remove('is-pinned');
      }
    }, 0);
  }

  function ensurePill() {
    var links = nav && nav.querySelector('.nav-links-premium');
    if (!links) return;
    pill = links.querySelector('.nav-active-pill');
    if (!pill) {
      pill = document.createElement('span');
      pill.className = 'nav-active-pill';
      pill.setAttribute('aria-hidden', 'true');
      links.insertBefore(pill, links.firstChild);
    }
  }

  function ensureProgress() {
    if (!nav) return;
    var el = nav.querySelector('.nav-progress');
    if (!el) {
      el = document.createElement('div');
      el.className = 'nav-progress';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<span class="nav-progress__fill"></span>';
      nav.appendChild(el);
    }
    progressFill = el.querySelector('.nav-progress__fill');
  }

  function ensureSentinel() {
    var existing = document.getElementById('navSentinel');
    if (existing) return existing;
    var s = document.createElement('div');
    s.id = 'navSentinel';
    s.className = 'nav-sentinel';
    s.setAttribute('aria-hidden', 'true');
    if (nav && nav.parentNode) nav.parentNode.insertBefore(s, nav);
    return s;
  }

  function patchApplyActiveNav() {
    if (typeof global._applyActiveNav !== 'function' && typeof global.setActiveNav === 'function') {
      // hook after setActiveNav via MutationObserver on active class
    }
    var links = nav && nav.querySelector('.nav-links-premium');
    if (!links || !window.MutationObserver) return;
    var mo = new MutationObserver(function () { updateActivePill(); });
    mo.observe(links, { attributes: true, subtree: true, attributeFilter: ['class', 'aria-current'] });
    destroyFns.push(function () { mo.disconnect(); });
  }

  function onResize() {
    setHeaderHeight();
    updateActivePill();
    requestFrame();
  }

  function onDocClick() {
    if (overlayOrMenuOpen()) setHidden(false);
  }

  function initStickyHeader() {
    if (initialized && api) {
      setHeaderHeight();
      updateActivePill();
      requestFrame();
      return api;
    }
    nav = qs('.nav-premium');
    if (!nav) return null;
    reduced = reduceMotion();
    saveData = !!(navigator.connection && navigator.connection.saveData);
    lastY = window.scrollY || 0;

    ensureSentinel();
    ensureProgress();
    ensurePill();
    setHeaderHeight();
    patchApplyActiveNav();

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        setHeaderHeight();
        updateActivePill();
      });
      ro.observe(nav);
      destroyFns.push(function () { ro.disconnect(); });
    }

    var sentinel = document.getElementById('navSentinel');
    if (sentinel && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          // When sentinel is not intersecting, we've scrolled past the top.
          setFloating(!e.isIntersecting || (window.scrollY || 0) > FLOAT_Y);
        });
      }, { root: null, threshold: 0, rootMargin: '-' + FLOAT_Y + 'px 0px 0px 0px' });
      io.observe(sentinel);
      destroyFns.push(function () { io.disconnect(); });
    }

    window.addEventListener('scroll', requestFrame, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    destroyFns.push(function () {
      window.removeEventListener('scroll', requestFrame);
      window.removeEventListener('resize', onResize);
    });

    nav.addEventListener('focusin', onFocusIn);
    nav.addEventListener('focusout', onFocusOut);

    // Reveal when any overlay closes
    document.addEventListener('click', onDocClick, true);
    destroyFns.push(function () {
      document.removeEventListener('click', onDocClick, true);
    });

    requestFrame();
    window.setTimeout(updateActivePill, 80);
    initialized = true;

    api = {
      refreshPill: updateActivePill,
      destroy: function () {
        destroyFns.forEach(function (fn) { try { fn(); } catch (_e) { /* ignore */ } });
        destroyFns = [];
        initialized = false;
        api = null;
      }
    };
    global.GBStickyHeader = {
      init: initStickyHeader,
      refreshPill: updateActivePill,
      destroy: api.destroy
    };
    return api;
  }

  global.initStickyHeader = initStickyHeader;
  global.GBStickyHeader = { init: initStickyHeader, refreshPill: function () { updateActivePill(); } };

  // Bounce cart badge when count text changes
  function watchCartBadge() {
    var badge = document.getElementById('cartBadgeNav');
    if (!badge || !window.MutationObserver) return;
    var mo = new MutationObserver(function () {
      if (reduced) return;
      badge.classList.remove('is-bounce');
      void badge.offsetWidth;
      badge.classList.add('is-bounce');
    });
    mo.observe(badge, { characterData: true, childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initStickyHeader();
      watchCartBadge();
    });
  } else {
    initStickyHeader();
    watchCartBadge();
  }
})(typeof window !== 'undefined' ? window : this);
