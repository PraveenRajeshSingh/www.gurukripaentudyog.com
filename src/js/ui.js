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
// SCROLL PROGRESS BAR
// ══════════════════════════════════════════
function initScrollProgress() {
    const bar = document.getElementById('spbar');
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (!bar) return;
    window.addEventListener('scroll', () => {
        const dh = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (dh > 0 ? (window.scrollY / dh) * 100 : 0) + '%';
        if (scrollTopBtn) {
            scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
        }
    }, { passive: true });
}

// ══════════════════════════════════════════
// COUNTER ANIMATION
// ══════════════════════════════════════════
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

// ══════════════════════════════════════════
// NAV HIGHLIGHTING
// ══════════════════════════════════════════
function setActiveNav(el) {
    document.querySelectorAll('.nav-link, .drawer-link').forEach(l => l.classList.remove('active'));
    el.classList.add('active');
}

function initNavHighlight() {
    const sections = document.querySelectorAll('section[id], header[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
        navLinks.forEach(l => { l.classList.toggle('active', l.getAttribute('href') === '#' + current); });
    }, { passive: true });
}

function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function setMNActive(el) {
    document.querySelectorAll('.mn-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
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
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

// ══════════════════════════════════════════
// USER DROPDOWN
// ══════════════════════════════════════════
function toggleUserDropdown() {
    document.getElementById('userDropdown')?.classList.toggle('open');
}

function closeUserDropdown() {
    document.getElementById('userDropdown')?.classList.remove('open');
}

document.addEventListener('click', e => {
    const um = document.getElementById('navUserMenu');
    if (um && !um.contains(e.target)) closeUserDropdown();
});

// ══════════════════════════════════════════
// FAB (Floating Action Button)
// ══════════════════════════════════════════
function toggleFab() {
    const btn = document.getElementById('fabMainBtn');
    const actions = document.getElementById('fabActions');
    if (!btn || !actions) return;
    const isOpen = btn.classList.toggle('open');
    actions.classList.toggle('open', isOpen);
    btn.textContent = isOpen ? '✕' : '❓';
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

function setLang(lang) {
    // Guard: only 'en' or 'hi'
    if (lang !== 'en' && lang !== 'hi') lang = 'en';
    currentLang = lang;
    localStorage.setItem('gb_lang', lang);

    // Update language toggle button active states
    document.getElementById('langEn')?.classList.toggle('active', lang === 'en');
    document.getElementById('langHi')?.classList.toggle('active', lang === 'hi');

    // Update html lang attribute for accessibility
    document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');

    // Localize document title (used by browser tab, Android TWA & iOS home-screen context)
    const docTitle = (TRANSLATIONS[lang] || {})['doc.title'] || (TRANSLATIONS.en || {})['doc.title'];
    if (docTitle) document.title = docTitle;

    const dict = TRANSLATIONS[lang] || {};

    // Apply translations to all [data-i18n] elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = dict[key];
        if (!val) return;

        const tag = el.tagName.toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA') {
            if (el.type !== 'submit' && el.type !== 'button') {
                el.placeholder = val;
            }
        } else if (tag === 'BUTTON' && el.type === 'submit') {
            el.innerHTML = val;
        } else {
            el.innerHTML = val;
        }
    });

    // Re-render dynamic vendors section if present
    if (typeof renderVendors === 'function') renderVendors();

    // Refresh dynamic cart labels (item count, delivery progress) in new language
    if (typeof updateCartUI === 'function') updateCartUI();

    // Toast language notification
    showToast(lang === 'hi' ? '🇮🇳 हिंदी भाषा चुनी गई' : '🇬🇧 English selected');
}

// ══════════════════════════════════════════
// OVERLAY KEYBOARD SYSTEM — ESC closes topmost;
// Tab keeps focus inside the active modal/drawer.
// ══════════════════════════════════════════
const OVERLAY_STACK = [
    // [element-id, closer] — checked top-most first (reverse paint order)
    ['checkoutModal',   () => typeof closeCheckout   === 'function' && closeCheckout()],
    ['productModal',    () => typeof closeProductModal === 'function' && closeProductModal()],
    ['profileModal',    () => typeof closeProfile    === 'function' && closeProfile()],
    ['authModal',       () => typeof closeAuth       === 'function' && closeAuth()],
    ['trackerModal',    () => typeof closeTrackerModal === 'function' && closeTrackerModal()],
    ['gstInvoiceModal', () => typeof closeGstInvoice === 'function' && closeGstInvoice()],
    ['cartDrawer',      () => typeof closeCart       === 'function' && closeCart()],
    ['mobileDrawer',    () => typeof toggleDrawer    === 'function' && toggleDrawer()]
];

function activeOverlay() {
    for (const pair of OVERLAY_STACK) {
        const el = document.getElementById(pair[0]);
        if (el && el.classList.contains('open')) return pair;
    }
    return null;
}

document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const pair = activeOverlay();
    if (pair) { pair[1](); return; }
    // Lightbox fallback (uses its own visibility mechanism)
    if (typeof lbClose === 'function') lbClose();
});

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
    document.body.style.overflow = 'hidden';
}

function lbClose(e) {
    if (!e || e.target.id === 'lb' || e.target.classList.contains('lb-close')) {
        document.getElementById('lb')?.classList.remove('open');
        document.body.style.overflow = '';
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
