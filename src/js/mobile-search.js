/* Phase 4: mobile / compact full-screen search overlay
   CHANGE: do NOT use [aria-modal="true"] for popup detection — closed modals
   keep that attribute and were forcing html.popup-open + a body-wide MutationObserver
   that froze scroll and clicks. */
(function () {
  'use strict';

  var overlay, input, clearBtn, suggest, emptyEl, lastTrigger = null, prevFocus = null;

  function $(id) { return document.getElementById(id); }

  function isCompact() {
    try {
      if (window.matchMedia('(max-width: 900px)').matches) return true;
      var nav = document.querySelector('.nav-premium');
      if (nav && (nav.classList.contains('nav-force-compact') || nav.classList.contains('is-compact'))) return true;
    } catch (e) { /* ignore */ }
    return window.innerWidth <= 900;
  }

  function setVvPad() {
    try {
      var vv = window.visualViewport;
      if (!vv || !overlay) return;
      var pad = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      overlay.style.setProperty('--msearch-vv-pad', pad + 'px');
    } catch (e) { /* ignore */ }
  }

  function anyPopupOpen() {
    try {
      if (document.body.classList.contains('overlay-open')) return true;
      if (document.querySelector('.modal-overlay.open')) return true;
      if (document.querySelector('.cart-drawer.open, .wishlist-drawer.open')) return true;
      if (document.querySelector('#mobileDrawer.open, .drawer.open')) return true;
      if (overlay && !overlay.hidden) return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  function syncPopupClass() {
    document.documentElement.classList.toggle('popup-open', anyPopupOpen());
  }

  function renderSuggest(q) {
    if (!suggest) return;
    var query = String(q || '').trim().toLowerCase();
    suggest.innerHTML = '';
    if (emptyEl) emptyEl.hidden = true;
    if (!query) return;
    var list = (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) ? PRODUCTS : [];
    var lang = (typeof currentLang !== 'undefined' && currentLang === 'hi') ? 'hi' : 'en';
    var hits = list.filter(function (p) {
      var name = (lang === 'hi' ? (p.nameHi || p.name) : p.name) || '';
      var grade = p.grade || '';
      return String(name).toLowerCase().indexOf(query) >= 0 || String(grade).toLowerCase().indexOf(query) >= 0;
    }).slice(0, 12);
    if (!hits.length) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    hits.forEach(function (p) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'msearch-item';
      btn.setAttribute('role', 'option');
      var title = (lang === 'hi' ? (p.nameHi || p.name) : p.name) || ('#' + p.id);
      btn.innerHTML = '<span class="msearch-item__title"></span><span class="msearch-item__meta"></span>';
      btn.querySelector('.msearch-item__title').textContent = title;
      btn.querySelector('.msearch-item__meta').textContent = (p.grade || '') + (p.price != null ? ' · ₹' + p.price : '');
      btn.addEventListener('click', function () {
        closeSiteSearch();
        if (typeof openProductDetail === 'function') openProductDetail(p.id);
        else location.hash = '#products';
      });
      suggest.appendChild(btn);
    });
  }

  function openSiteSearch(trigger) {
    overlay = overlay || $('mobileSearchOverlay');
    input = input || $('mobileSearchInput');
    clearBtn = clearBtn || $('mobileSearchClear');
    suggest = suggest || $('mobileSearchSuggest');
    emptyEl = emptyEl || $('mobileSearchEmpty');
    if (!overlay || !input) {
      var nav = $('navSearch');
      if (nav) nav.focus();
      return;
    }
    if (!isCompact()) {
      var navIn = $('navSearch');
      if (navIn) { navIn.focus(); return; }
    }
    lastTrigger = trigger || document.activeElement;
    prevFocus = document.activeElement;
    overlay.hidden = false;
    document.documentElement.classList.add('msearch-open');
    syncPopupClass();
    setVvPad();
    setTimeout(function () { try { input.focus(); } catch (e2) {} }, 30);
    var seed = '';
    try { seed = ($('navSearch') && $('navSearch').value) || ''; } catch (e3) {}
    input.value = seed;
    if (clearBtn) clearBtn.hidden = !seed;
    renderSuggest(seed);
  }

  function closeSiteSearch() {
    overlay = overlay || $('mobileSearchOverlay');
    if (overlay) overlay.hidden = true;
    document.documentElement.classList.remove('msearch-open');
    syncPopupClass();
    var t = lastTrigger || prevFocus;
    lastTrigger = null;
    if (t && typeof t.focus === 'function') {
      try { t.focus(); } catch (e2) {}
    }
  }

  function onInput() {
    if (!input) return;
    if (clearBtn) clearBtn.hidden = !input.value;
    try {
      var nav = $('navSearch');
      if (nav) {
        nav.value = input.value;
        nav.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (e) { /* ignore */ }
    renderSuggest(input.value);
  }

  function bindKbChrome() {
    document.addEventListener('focusin', function (e) {
      var tag = e.target && e.target.tagName;
      if ((tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) && isCompact()) {
        document.documentElement.classList.add('kb-up');
      }
    });
    document.addEventListener('focusout', function () {
      setTimeout(function () {
        var a = document.activeElement;
        var tag = a && a.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          document.documentElement.classList.remove('kb-up');
        }
      }, 80);
    });
    // Lightweight sync — only when open class toggles on known overlays (no body-wide observer)
    document.addEventListener('click', function () { setTimeout(syncPopupClass, 0); }, true);
    window.addEventListener('gbi:overlay', syncPopupClass);
  }

  /** Boot recovery: unlock page if a previous session left lock classes */
  function forceUnlockPage() {
    try {
      document.documentElement.classList.remove('msearch-open', 'popup-open', 'kb-up', 'overlay-open');
      document.body.classList.remove('overlay-open', 'account-popup-open', 'gb-chat-open');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('left');
      document.body.style.removeProperty('right');
      document.body.style.removeProperty('width');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('overflow');
      if (typeof __overlayCount !== 'undefined') __overlayCount = 0;
      var ms = $('mobileSearchOverlay');
      if (ms) ms.hidden = true;
      document.querySelectorAll('[inert]').forEach(function (el) {
        el.removeAttribute('inert');
      });
    } catch (e) { /* ignore */ }
  }

  function init() {
    forceUnlockPage();
    overlay = $('mobileSearchOverlay');
    input = $('mobileSearchInput');
    clearBtn = $('mobileSearchClear');
    suggest = $('mobileSearchSuggest');
    emptyEl = $('mobileSearchEmpty');
    if (input) {
      input.addEventListener('input', onInput);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeSiteSearch();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay && !overlay.hidden) closeSiteSearch();
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        openSiteSearch(document.activeElement);
      }
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setVvPad);
      window.visualViewport.addEventListener('scroll', setVvPad);
    }
    window.addEventListener('orientationchange', function () {
      if (overlay && !overlay.hidden) setVvPad();
      else closeSiteSearch();
    });
    bindKbChrome();
    syncPopupClass();
  }

  window.openSiteSearch = openSiteSearch;
  window.closeSiteSearch = closeSiteSearch;
  window.clearSiteSearch = function () {
    if (input) { input.value = ''; onInput(); input.focus(); }
  };
  window.forceUnlockPage = forceUnlockPage;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
