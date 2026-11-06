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
    modal.classList.add('open');
    overlayLock();
    if (typeof PushNotifications !== 'undefined') {
        PushNotifications.renderCenter();
        PushNotifications.renderSettings();
    }
}

function closeNotificationCenter() {
    document.getElementById('notificationCenterModal')?.classList.remove('open');
    overlayUnlock();
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
// USER DROPDOWN
// ══════════════════════════════════════════
function toggleUserDropdown() {
    const dd = document.getElementById('userDropdown');
    if (!dd) return;
    const open = dd.classList.toggle('open');
    document.getElementById('userMenuBtn')?.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function closeUserDropdown() {
    document.getElementById('userDropdown')?.classList.remove('open');
    document.getElementById('userMenuBtn')?.setAttribute('aria-expanded', 'false');
}

document.addEventListener('click', e => {
    const um = document.getElementById('navUserMenu');
    if (um && !um.contains(e.target)) closeUserDropdown();
});

// Close the account menu on scroll or hash/navigation change so it can never
// float over (or be clipped by) moving content.
window.addEventListener('scroll', () => closeUserDropdown(), { passive: true });
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

    // Update language toggle button active states
    const langEn = document.getElementById('langEn');
    const langHi = document.getElementById('langHi');
    langEn?.classList.toggle('active', lang === 'en');
    langHi?.classList.toggle('active', lang === 'hi');
    langEn?.setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
    langHi?.setAttribute('aria-pressed', lang === 'hi' ? 'true' : 'false');

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
function overlayLock() {
    __overlayFocus.push(document.activeElement);
    if (__overlayCount === 0) document.body.classList.add('overlay-open');
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
        // Return focus to the element that opened the overlay (§6 a11y).
        if (prev && document.contains(prev) && typeof prev.focus === 'function') {
            try { prev.focus(); } catch (_e) {}
        }
    }
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
    ['profileModal',     () => typeof closeProfile        === 'function' && closeProfile()],
    ['authModal',        () => typeof closeAuth           === 'function' && closeAuth()],
    ['trackerModal',     () => typeof closeTrackerModal   === 'function' && closeTrackerModal()],
    ['notificationCenterModal', () => typeof closeNotificationCenter === 'function' && closeNotificationCenter()],
    ['wishlistDrawer',   () => typeof closeWishlistDrawer === 'function' && closeWishlistDrawer()],
    ['cartDrawer',       () => typeof closeCart           === 'function' && closeCart()],
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
            document.getElementById('userMenuBtn')?.focus();
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
    const modal = document.getElementById('legalModal');
    if (modal) {
        modal.classList.add('open');
        overlayLock();
    }
}

function closeLegalModal() {
    const modal = document.getElementById('legalModal');
    if (modal) {
        modal.classList.remove('open');
        overlayUnlock();
    }
}

function switchLegalTab(tab) {
    const tabs = ['privacy', 'terms', 'shipping', 'quality'];
    tabs.forEach(t => {
        const cap = t.charAt(0).toUpperCase() + t.slice(1);
        const tabBtn = document.getElementById('legalTab' + cap);
        const content = document.getElementById('legalContent' + cap);
        if (tabBtn) tabBtn.classList.toggle('active', t === tab);
        if (content) content.classList.toggle('active', t === tab);
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
    lb.classList.add('open');
    overlayLock();
}

function lbClose(e) {
    if (!e || e.target.id === 'lb' || e.target.classList.contains('lb-close')) {
        document.getElementById('lb')?.classList.remove('open');
        overlayUnlock();
    }
}

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
