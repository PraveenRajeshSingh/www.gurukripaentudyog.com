'use strict';
// ══════════════════════════════════════════
// UI SYSTEM
// ══════════════════════════════════════════

// ══════════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════════
function showToast(msg, type = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${msg}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut .3s var(--ease) forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// ══════════════════════════════════════════
// SCROLL PROGRESS & 60FPS RAF DISPATCHER
// ══════════════════════════════════════════
let _scrollTicking = false;
let _cachedSectionOffsets = null;

function _updateCachedOffsets() {
    const sections = document.querySelectorAll('section[id], header[id]');
    _cachedSectionOffsets = Array.from(sections).map(s => ({
        id: s.id,
        offsetTop: s.offsetTop
    }));
}

function _onScrollFrame() {
    const scrollY = window.scrollY;
    const bar = document.getElementById('spbar');
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (bar) {
        const dh = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (dh > 0 ? (scrollY / dh) * 100 : 0) + '%';
    }
    if (scrollTopBtn) {
        scrollTopBtn.classList.toggle('visible', scrollY > 300);
    }

    if (!_cachedSectionOffsets) _updateCachedOffsets();
    let current = '';
    if (_cachedSectionOffsets) {
        for (let i = 0; i < _cachedSectionOffsets.length; i++) {
            if (scrollY >= _cachedSectionOffsets[i].offsetTop - 120) {
                current = _cachedSectionOffsets[i].id;
            }
        }
    }
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === '#' + current);
    });

    _scrollTicking = false;
}

function _requestScrollTick() {
    if (!_scrollTicking) {
        window.requestAnimationFrame(_onScrollFrame);
        _scrollTicking = true;
    }
}

function initScrollProgress() {
    window.addEventListener('scroll', _requestScrollTick, { passive: true });
    window.addEventListener('resize', () => {
        _updateCachedOffsets();
        _requestScrollTick();
    }, { passive: true });
    _requestScrollTick();
}

function initNavHighlight() {
    _updateCachedOffsets();
    _requestScrollTick();
}

function setActiveNav(el) {
    document.querySelectorAll('.nav-link, .drawer-link').forEach(l => {
        l.classList.remove('active');
        l.removeAttribute('aria-current');
    });
    if (!el) return;
    el.classList.add('active');
    // Tell assistive tech which control is the current location, not just which
    // one happens to be painted in brand colour. This is a one-page site, so the
    // value is "true" (current item in a set) rather than "page".
    el.setAttribute('aria-current', 'true');
}

function initCounters() {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting && !e.target.dataset.done) {
                e.target.dataset.done = '1';
                const target = parseInt(e.target.dataset.target, 10);
                let current = 0;
                const step = target / 60;
                const t = setInterval(() => {
                    current = Math.min(current + step, target);
                    e.target.textContent = current >= 1000
                        ? Math.floor(current / 1000) + 'k'
                        : Math.floor(current);
                    if (current >= target) {
                        clearInterval(t);
                        e.target.textContent = target >= 1000 ? (target / 1000) + 'k' : target;
                    }
                }, 18);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(c => obs.observe(c));
}

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    // scroll-margin-top on `main section[id]` keeps the sticky bar from covering
    // the heading, so no manual offset arithmetic is needed here.
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    // Reflect the destination in the URL without pushing an entry per tap, so
    // browser Back still returns to where the reader came from.
    if (history.replaceState) history.replaceState(null, '', '#' + id);
}

/**
 * Back-to-top for the floating scroll button.
 * Same reduced-motion contract as scrollToSection(): readers who ask the
 * browser not to animate get an instant jump instead of a glide.
 */
function scrollDocumentTop() {
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    // Clear any section hash left by scrollToSection() so browser Back is not
    // an apparent no-op that just re-anchors to the same section.
    if (history.replaceState && location.hash) history.replaceState(null, '', location.pathname + location.search);
}

// One haptic pulse per bottom-nav tap. Platform.haptic() already falls back to
// navigator.vibrate() on the web, so calling both made every tap buzz twice.
function mnFeedback() {
    if (window.Platform) Platform.haptic('light');
}

function setMNActive(el, markCurrent) {
    document.querySelectorAll('.mn-item').forEach(i => {
        i.classList.remove('active');
        i.removeAttribute('aria-current');
    });
    if (!el) return;
    el.classList.add('active');
    // Cart and Track open overlays, not destinations, so they get the painted
    // active state without claiming to be the current location.
    if (markCurrent !== false) el.setAttribute('aria-current', 'true');
}

// Bottom-nav shortcuts that open in-page sections or overlays rather than
// navigating to a hash. Kept next to setMNActive so the active state always
// follows the tapped item.
function openMobileEstimator(el) {
    // The estimator is a real section on this page, so it does become the
    // current location - unlike Cart and Track, which open overlays.
    setMNActive(el);
    scrollToSection('calculator');
    mnFeedback();
}

function openMobileTrack(el) {
    setMNActive(el, false);
    const latest = (typeof orders !== 'undefined' && orders.length) ? orders[0].id : undefined;
    if (typeof openTrackerModal === 'function') openTrackerModal(latest);
    mnFeedback();
}

// ══════════════════════════════════════════
// ORDER & RATE ALERT CENTER
// ══════════════════════════════════════════
function openNotificationCenter() {
    const modal = document.getElementById('notificationCenterModal');
    if (!modal) return;
    if (!openOverlay(modal)) return;
    if (typeof PushNotifications !== 'undefined') {
        PushNotifications.renderCenter();
        PushNotifications.renderSettings();
    }
}

function closeNotificationCenter() {
    closeOverlay('notificationCenterModal');
    // Alerts are considered seen once the panel is dismissed, so the bell
    // badge clears while the unread highlight stays visible during reading.
    if (typeof PushNotifications !== 'undefined') PushNotifications.markAllRead();
}

// ══════════════════════════════════════════
// MOBILE DRAWER
// ══════════════════════════════════════════
function toggleDrawer() {
    const d = document.getElementById('mobileDrawer');
    const o = document.getElementById('drawerOverlay');
    const t = document.getElementById('navToggle');
    if (!d || !o || !t) return;
    const isOpen = d.classList.toggle('open');
    o.classList.toggle('open', isOpen);
    t.classList.toggle('open', isOpen);
    t.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    t.setAttribute('aria-label', isOpen ? 'Close Navigation Menu' : 'Open Navigation Menu');
    // aria-hidden keeps the off-screen panel out of the accessibility tree while
    // it is closed; visibility:hidden alone does not remove it from the tree.
    d.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    if (isOpen) {
        // Land the first Tab press inside the menu instead of behind it.
        setTimeout(() => d.querySelector('.drawer-close')?.focus({ preventScroll: true }), 120);
    }
    isOpen ? overlayLock() : overlayUnlock();
}

// ══════════════════════════════════════════
// USER DROPDOWN (portaled fixed popup — avoids sticky-nav clipping)
// ══════════════════════════════════════════
function isAccountSheetMode() {
    // Match mobile-fixes: #navUserMenu hidden ≤1024px — use bottom sheet there.
    return typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 1024px)').matches;
}

function ensureAccountPopupPortaled() {
    const dd = document.getElementById('userDropdown');
    const backdrop = document.getElementById('accountPopupBackdrop');
    if (backdrop && backdrop.parentElement !== document.body) {
        document.body.appendChild(backdrop);
    }
    if (dd && dd.parentElement !== document.body) {
        document.body.appendChild(dd);
    }
}

function clearAccountPopupPosition(dd) {
    if (!dd) return;
    dd.style.top = '';
    dd.style.left = '';
    dd.style.right = '';
    dd.style.bottom = '';
    dd.style.width = '';
    dd.style.maxHeight = '';
    dd.style.setProperty('--account-popup-max-h', '');
}

function positionAccountPopup() {
    const dd = document.getElementById('userDropdown');
    if (!dd) return;
    ensureAccountPopupPortaled();

    const sheet = isAccountSheetMode();
    dd.classList.toggle('is-sheet', sheet);

    if (sheet) {
        clearAccountPopupPosition(dd);
        return;
    }

    const btn = document.getElementById('userMenuBtn');
    const margin = 12;
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(340, vw - margin * 2);
    const wasOpen = dd.classList.contains('open');

    // Keep layout measurable without flashing when already open.
    if (!wasOpen) {
        dd.style.visibility = 'hidden';
        dd.style.opacity = '0';
        dd.style.pointerEvents = 'none';
    }
    dd.style.width = width + 'px';
    dd.style.left = '0';
    dd.style.top = '0';
    const panelH = Math.min(dd.scrollHeight || 480, vh - margin * 2);
    dd.style.maxHeight = panelH + 'px';
    dd.style.setProperty('--account-popup-max-h', panelH + 'px');

    let top;
    let left;
    if (btn) {
        const r = btn.getBoundingClientRect();
        const spaceBelow = vh - r.bottom - gap - margin;
        const spaceAbove = r.top - gap - margin;
        const openUp = spaceBelow < Math.min(panelH, 320) && spaceAbove > spaceBelow;
        top = openUp
            ? Math.max(margin, r.top - gap - panelH)
            : Math.min(r.bottom + gap, vh - margin - Math.min(panelH, spaceBelow + gap));
        left = Math.min(Math.max(margin, r.right - width), vw - width - margin);
    } else {
        top = margin;
        left = vw - width - margin;
    }

    dd.style.top = Math.round(top) + 'px';
    dd.style.left = Math.round(left) + 'px';
    dd.style.right = 'auto';
    dd.style.bottom = 'auto';
    if (wasOpen) {
        dd.style.visibility = '';
        dd.style.opacity = '';
        dd.style.pointerEvents = '';
    }
}

function syncAccountPopupChrome(open) {
    const backdrop = document.getElementById('accountPopupBackdrop');
    const sheet = isAccountSheetMode();
    if (backdrop) {
        // Desktop also gets a light dismiss layer so clicks outside never miss.
        backdrop.classList.toggle('is-open', !!open);
        backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
        backdrop.style.background = sheet ? '' : 'transparent';
    }
    const wantSheetLock = !!open && sheet;
    const wasSheetLock = document.body.classList.contains('account-popup-open');
    document.body.classList.toggle('account-popup-open', wantSheetLock);
    // Sheet mode needs the same body pin as overlays (unless an overlay already owns it).
    if (wantSheetLock && !wasSheetLock && !document.body.classList.contains('overlay-open')) {
        __overlayScrollY = window.scrollY || window.pageYOffset || 0;
        document.body.style.top = '-' + __overlayScrollY + 'px';
    } else if (!wantSheetLock && wasSheetLock && !document.body.classList.contains('overlay-open')) {
        document.body.style.top = '';
        window.scrollTo(0, __overlayScrollY || 0);
    }
}

function openUserDropdown() {
    const dd = document.getElementById('userDropdown');
    if (!dd || dd.classList.contains('open')) return;
    ensureAccountPopupPortaled();
    if (typeof refreshAccountPopupStats === 'function') refreshAccountPopupStats();
    if (typeof fillAccountPopupIdentity === 'function' && typeof user !== 'undefined' && user) {
        fillAccountPopupIdentity(user);
    }
    positionAccountPopup();
    dd.classList.add('open');
    // Reposition after paint so max-height matches real content.
    requestAnimationFrame(() => {
        positionAccountPopup();
        if (dd.classList.contains('open')) {
            dd.style.visibility = '';
            dd.style.opacity = '';
            dd.style.pointerEvents = '';
        }
    });
    document.getElementById('userMenuBtn')?.setAttribute('aria-expanded', 'true');
    syncAccountPopupChrome(true);
    const first = dd.querySelector('.account-popup__close, .ud-item');
    if (first && typeof first.focus === 'function') {
        setTimeout(() => first.focus({ preventScroll: true }), 40);
    }
}

function toggleUserDropdown() {
    const dd = document.getElementById('userDropdown');
    if (!dd) return;
    if (dd.classList.contains('open')) closeUserDropdown();
    else openUserDropdown();
}

function closeUserDropdown() {
    const dd = document.getElementById('userDropdown');
    if (dd) {
        dd.classList.remove('open');
        dd.classList.remove('is-sheet');
        clearAccountPopupPosition(dd);
        dd.style.visibility = '';
        dd.style.opacity = '';
        dd.style.pointerEvents = '';
        dd.style.width = '';
    }
    document.getElementById('userMenuBtn')?.setAttribute('aria-expanded', 'false');
    syncAccountPopupChrome(false);
}

document.addEventListener('click', e => {
    const dd = document.getElementById('userDropdown');
    if (!dd || !dd.classList.contains('open')) return;
    const btn = document.getElementById('userMenuBtn');
    const backdrop = document.getElementById('accountPopupBackdrop');
    if (backdrop && (e.target === backdrop || backdrop.contains(e.target))) return;
    if (dd.contains(e.target)) return;
    if (btn && btn.contains(e.target)) return;
    closeUserDropdown();
});

window.addEventListener('resize', () => {
    const dd = document.getElementById('userDropdown');
    if (dd && dd.classList.contains('open')) positionAccountPopup();
}, { passive: true });

// Desktop: close on scroll so the menu never floats over moving content.
// Mobile sheet stays open while the page behind is locked.
window.addEventListener('scroll', () => {
    if (!isAccountSheetMode()) closeUserDropdown();
}, { passive: true });
window.addEventListener('hashchange', () => closeUserDropdown());

// ══════════════════════════════════════════
// FAB (Floating Action Button)
// ══════════════════════════════════════════
function toggleFab() {
    const btn = document.getElementById('fabMainBtn');
    const actions = document.getElementById('fabActions');
    if (!btn || !actions) return;
    const isOpen = btn.classList.toggle('open');
    actions.classList.toggle('open', isOpen);
    // The glyph swap lives in CSS (.fab-main-btn.open .fab-icon-close), so the
    // button keeps a stable accessible name instead of being read as "question
    // mark" / "cross mark" emoji.
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    btn.setAttribute('aria-label', isOpen ? 'Close support menu' : 'Support options');
}

// ══════════════════════════════════════════
// LANGUAGE TRANSLATION SYSTEM (Comprehensive)
// ══════════════════════════════════════════
// Translation helper — use for all dynamic strings (toasts, buttons, errors).
// Falls back to English when a key is missing in the active language.
function t(key, vars) {
    let val = ((typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang]) || {})[key];
    if (val === undefined) val = ((typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS.en) || {})[key];
    if (val === undefined) return key;
    if (vars) {
        Object.keys(vars).forEach(k => {
            val = val.split('{' + k + '}').join(vars[k]);
        });
    }
    return val;
}

/**
 * Translate every [data-i18n] node inside `root` (defaults to the document).
 * Scoped so dynamically built surfaces - the profile hub, cart drawer, product
 * modal - can re-localise themselves after they are re-rendered without paying
 * for a full-document pass.
 */
function applyTranslations(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const dict = TRANSLATIONS[currentLang] || {};
    scope.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = dict[key];
        if (!val) return;

        const tag = el.tagName.toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA') {
            if (el.type !== 'submit' && el.type !== 'button') {
                el.placeholder = val;
            }
        } else if (tag === 'OPTION') {
            el.textContent = val;
        } else if (tag === 'BUTTON' && el.type === 'submit') {
            el.innerHTML = val;
        } else {
            el.innerHTML = val;
        }
    });
}

function setLang(lang) {
    // Guard: only 'en' or 'hi'
    if (lang !== 'en' && lang !== 'hi') lang = 'en';
    currentLang = lang;
    localStorage.setItem('gb_lang', lang);

    // Sync every language control: topbar, nav compact, drawer
    const syncPair = (enId, hiId) => {
        const en = document.getElementById(enId);
        const hi = document.getElementById(hiId);
        en?.classList.toggle('active', lang === 'en');
        hi?.classList.toggle('active', lang === 'hi');
        en?.setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
        hi?.setAttribute('aria-pressed', lang === 'hi' ? 'true' : 'false');
    };
    syncPair('langEn', 'langHi');
    syncPair('navLangEn', 'navLangHi');

    // Mobile drawer language label stays in sync with desktop
    const drawerLang = document.getElementById('drawerLangLabel');
    if (drawerLang) {
        drawerLang.textContent = lang === 'hi' ? 'English / हिंदी' : 'हिंदी / EN';
    }

    // Update html lang attribute for accessibility
    document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');

    // Localize document title (used by browser tab, Android TWA & iOS home-screen context)
    const docTitle = (TRANSLATIONS[lang] || {})['doc.title'] || (TRANSLATIONS.en || {})['doc.title'];
    if (docTitle) document.title = docTitle;

    // Apply translations to all [data-i18n] elements
    applyTranslations(document);

    // Re-render dynamic vendors section if present
    if (typeof renderVendors === 'function') renderVendors();

    // Refresh dynamic cart labels (item count, delivery progress) in new language
    if (typeof updateCartUI === 'function') updateCartUI();

    // Re-paint estimator results / product grid / profile hub so dynamic copy switches too
    if (typeof lastEstimateResult !== 'undefined' && lastEstimateResult && typeof renderEstimate === 'function') {
        try { renderEstimate(lastEstimateResult); } catch (_e) { /* ignore */ }
    }
    if (typeof renderProducts === 'function' && typeof currentFilter !== 'undefined') {
        try { renderProducts(currentFilter); } catch (_e) { /* ignore */ }
    }
    if (typeof renderAccountHub === 'function' && document.getElementById('profileModal')?.classList.contains('open')) {
        try { renderAccountHub(); } catch (_e) { /* ignore */ }
    }

    // Toast language notification
    showToast(lang === 'hi' ? t('toast.langChangedHi') : t('toast.langChanged'));
}

// ══════════════════════════════════════════
// OVERLAY MANAGER — ref-counted scroll lock +
// focus return, ESC closes the topmost layer,
// Tab keeps focus trapped inside it.
// ══════════════════════════════════════════
var __overlayCount = 0;
var __overlayFocus = [];
var __overlayScrollY = 0;
function overlayLock() {
    __overlayFocus.push(document.activeElement);
    if (__overlayCount === 0) {
        // iOS/Android: overflow:hidden alone still rubber-bands the page under
        // a sheet. Pin the body and restore scrollY on unlock.
        __overlayScrollY = window.scrollY || window.pageYOffset || 0;
        document.body.style.top = '-' + __overlayScrollY + 'px';
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.classList.add('overlay-open');
        document.documentElement.classList.add('overlay-open');
    }
    __overlayCount++;
    // Move keyboard / screen-reader focus into the dialog that just opened.
    // Fields that want the caret (pincode, search) focus themselves after.
    setTimeout(function () {
        const ov = activeOverlayEl();
        if (!ov || ov.contains(document.activeElement)) return;
        const target = ov.querySelector('[data-autofocus]') || ov.querySelector('.modal-box') || ov;
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        try { target.focus({ preventScroll: true }); } catch (_e) {}
    }, 40);
}
function overlayUnlock() {
    const prev = __overlayFocus.pop();
    __overlayCount = Math.max(0, __overlayCount - 1);
    if (__overlayCount === 0) {
        document.body.classList.remove('overlay-open');
        document.documentElement.classList.remove('overlay-open');
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, __overlayScrollY || 0);
        // Return focus to the element that opened the overlay (§6 a11y).
        if (prev && document.contains(prev) && typeof prev.focus === 'function') {
            try { prev.focus(); } catch (_e) {}
        }
    }
}

function _notifyOverlayLayout(el) {
    try {
        window.dispatchEvent(new CustomEvent('gb:overlay-layout', {
            detail: { id: el && el.id ? el.id : '', open: !!(el && el.classList.contains('open')) }
        }));
    } catch (_e) { /* ignore */ }
    // Maps painted inside sheets need a reflow after open animation.
    setTimeout(function () {
        if (window.GurukripaMaps && typeof GurukripaMaps.invalidateMapIn === 'function') {
            GurukripaMaps.invalidateMapIn('trackerMapContainer');
        }
    }, 280);
}

/** Idempotent open — never double-lock if the overlay is already visible. */
function openOverlay(elOrId) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el || el.classList.contains('open')) return false;
    el.classList.add('open');
    overlayLock();
    // Stack newly opened layers above any already-open sheets (same token band).
    el.style.setProperty('z-index', String(1100 + __overlayCount), 'important');
    _notifyOverlayLayout(el);
    return true;
}

/** Idempotent close — never unlock if the overlay was already closed. */
function closeOverlay(elOrId) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el || !el.classList.contains('open')) return false;
    el.classList.remove('open');
    el.style.removeProperty('z-index');
    overlayUnlock();
    _notifyOverlayLayout(el);
    return true;
}

/** Close every open modal overlay (not cart/drawer) — used before primary opens. */
function closeAllModalOverlays() {
    document.querySelectorAll('.modal-overlay.open, .lb-overlay.open, #lb.open').forEach(function (el) {
        closeOverlay(el);
    });
}

/** Close the mobile nav drawer only if it is open (safe before opening a modal). */
function closeDrawerIfOpen() {
    const d = document.getElementById('mobileDrawer');
    if (d && d.classList.contains('open')) toggleDrawer();
}

/** Close drawer first, then run opener — prevents unlock-while-modal-open race. */
function openFromDrawer(fn) {
    closeDrawerIfOpen();
    if (typeof fn === 'function') fn();
}

function openAuthFromDrawer(tab) {
    openFromDrawer(function () { openAuth(tab || 'login'); });
}

function openProfileFromDrawer() {
    openFromDrawer(function () { openProfile(); });
}

// [element-id, closer] — checked top-most first (reverse paint order).
const OVERLAY_STACK = [
    ['pincodeModal',     () => typeof closePincodeModal   === 'function' && closePincodeModal()],
    ['lb',               () => typeof lbClose             === 'function' && lbClose()],
    ['catalogSidebar',   () => typeof toggleFilterSheet   === 'function' && toggleFilterSheet(false)],
    ['legalModal',       () => typeof closeLegalModal     === 'function' && closeLegalModal()],
    ['bulkQuoteModal',   () => typeof closeBulkQuoteModal === 'function' && closeBulkQuoteModal()],
    ['checkoutModal',    () => typeof closeCheckout       === 'function' && closeCheckout()],
    ['adminPortalModal', () => typeof closeAdminPortal    === 'function' && closeAdminPortal()],
    ['gstInvoiceModal',  () => typeof closeGstInvoice     === 'function' && closeGstInvoice()],
    ['invoicePdfModal',  () => typeof closeInvoicePdf     === 'function' && closeInvoicePdf()],
    ['companyProfileModal', () => typeof closeCompanyProfile === 'function' && closeCompanyProfile()],
    ['productModal',     () => typeof closeProductModal   === 'function' && closeProductModal()],
    ['compareModal',     () => window.CatalogDiscovery && CatalogDiscovery.closeCompareModal()],
    ['profileModal',     () => typeof closeProfile        === 'function' && closeProfile()],
    ['authModal',        () => typeof closeAuth           === 'function' && closeAuth()],
    ['trackerModal',     () => typeof closeTrackerModal   === 'function' && closeTrackerModal()],
    ['notificationCenterModal', () => typeof closeNotificationCenter === 'function' && closeNotificationCenter()],
    ['wishlistDrawer',   () => typeof closeWishlistDrawer === 'function' && closeWishlistDrawer()],
    ['cartDrawer',       () => typeof closeCart           === 'function' && closeCart()],
    ['chatbotBox',       () => typeof toggleChatbot       === 'function' && toggleChatbot(false)],
    ['mobileDrawer',     () => typeof toggleDrawer        === 'function' && toggleDrawer()]
];

function activeOverlay() {
    for (const pair of OVERLAY_STACK) {
        const el = document.getElementById(pair[0]);
        if (el && el.classList.contains('open')) return pair;
    }
    return null;
}
function activeOverlayEl() {
    const p = activeOverlay();
    return p ? document.getElementById(p[0]) : null;
}

const OVERLAY_FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Global keyboard: ESC closes topmost, Tab traps focus inside it, Ctrl/Cmd+K search.
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        // Topmost dismissible: the account dropdown (not a locked overlay).
        const dd = document.getElementById('userDropdown');
        if (dd && dd.classList.contains('open')) {
            closeUserDropdown();
            const btn = document.getElementById('userMenuBtn');
            // Prefer navbar trigger; on ≤1024 it is hidden — return focus to mobile profile tab.
            if (btn && btn.offsetParent !== null) btn.focus();
            else document.querySelector('.mn-item[onclick*="handleMobileProfile"]')?.focus();
            e.preventDefault();
            return;
        }
        const pair = activeOverlay();
        if (pair) {
            // Unsaved form text? Ask before discarding (GBDialogs, dialogs.js).
            if (window.GBDialogs && pair[0] !== 'gbDialogModal' &&
                GBDialogs.isDirty(document.getElementById(pair[0]))) {
                GBDialogs.requestDismiss(document.getElementById(pair[0]), pair);
                e.preventDefault();
                return;
            }
            pair[1]();
            e.preventDefault();
        }
    } else if (e.key === 'Tab') {
        const ov = activeOverlayEl();
        if (!ov) return;
        const items = Array.prototype.slice.call(ov.querySelectorAll(OVERLAY_FOCUSABLE));
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (!ov.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const searchInput = document.getElementById('navSearch');
        if (searchInput) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    }
});

// ══════════════════════════════════════════
// LEGAL & POLICIES MODAL SYSTEM
// ══════════════════════════════════════════
function openLegalModal(tab = 'privacy') {
    switchLegalTab(tab);
    openOverlay('legalModal');
}

function closeLegalModal() {
    closeOverlay('legalModal');
}

function switchLegalTab(tab) {
    const tabs = ['privacy', 'terms', 'shipping', 'quality'];
    tabs.forEach(t => {
        const cap = t.charAt(0).toUpperCase() + t.slice(1);
        const tabBtn = document.getElementById('legalTab' + cap);
        const content = document.getElementById('legalContent' + cap);
        const on = t === tab;
        if (tabBtn) {
            tabBtn.classList.toggle('active', on);
            tabBtn.setAttribute('aria-selected', on ? 'true' : 'false');
        }
        if (content) {
            content.classList.toggle('active', on);
            content.hidden = !on;
            content.setAttribute('aria-hidden', on ? 'false' : 'true');
        }
    });
}

// ══════════════════════════════════════════
// LIGHTBOX
// ══════════════════════════════════════════
function lbOpen(src, caption) {
    const lb = document.getElementById('lb');
    const img = document.getElementById('lbImg');
    const cap = document.getElementById('lbCap');
    if (!lb || !img) return;
    img.src = src;
    img.alt = caption || '';
    if (cap) cap.textContent = caption || '';
    openOverlay(lb);
}

function lbClose(e) {
    if (!e || e.target.id === 'lb' || e.target.classList.contains('lb-close')) {
        closeOverlay('lb');
    }
}

// Visual viewport → CSS vars for keyboard / sheet height on mobile
(function initVisualViewportVars() {
    function sync() {
        const vv = window.visualViewport;
        const h = vv ? vv.height : window.innerHeight;
        const offsetTop = vv ? vv.offsetTop : 0;
        document.documentElement.style.setProperty('--vv-height', h + 'px');
        document.documentElement.style.setProperty('--vv-offset-top', offsetTop + 'px');
        document.documentElement.style.setProperty('--gb-chat-vh', h + 'px');
    }
    sync();
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', sync, { passive: true });
        window.visualViewport.addEventListener('scroll', sync, { passive: true });
    }
    window.addEventListener('orientationchange', function () {
        setTimeout(sync, 120);
        setTimeout(function () {
            if (window.GurukripaMaps && GurukripaMaps.invalidateMapIn) {
                GurukripaMaps.invalidateMapIn('trackerMapContainer');
            }
        }, 320);
    }, { passive: true });
})();

// ══════════════════════════════════════════
// SCROLL REVEAL (Intersection Observer)
// ══════════════════════════════════════════
function initScrollReveal() {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.12 });

    document.querySelectorAll('.sec, .cat-card, .product-card, .quality-card, .brick-detail-card, .vendor-card')
        .forEach(el => revealObserver.observe(el));
}

// ══════════════════════════════════════════
// TOUCH SWIPE (for mobile carousels etc.)
// ══════════════════════════════════════════
function initTouchSwipe() {
    // Reserved for future carousel/swipe gestures
}
