// ══════════════════════════════════════════
// XSS SANITIZATION & SECURITY UTILITIES
// ══════════════════════════════════════════
function sanitizeHTML(str) {
    if (typeof str !== 'string') return String(str);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Generate deterministic gradient background for user avatar
function getAvatarBg(name) {
    if (!name) return 'linear-gradient(135deg, #A83226, #7F241C)';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash) % 360;
    return `linear-gradient(135deg, hsl(${h}, 70%, 45%), hsl(${(h + 40) % 360}, 80%, 35%))`;
}

// Derived customer reference. The local-first store has no server-assigned
// customer id yet, so we show a stable short handle built from the
// registered mobile (last 7 digits), falling back to email / name.
function getAccountRef(u) {
    if (!u) return '\u2014';
    const m = String(u.mobile || '').replace(/\D/g, '');
    if (m.length >= 7) return 'GC-' + m.slice(-7);
    const e = String(u.email || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (e.length >= 4) return 'GC-' + e.slice(-7);
    const n = String(u.name || '').trim().replace(/\s+/g, '').toUpperCase();
    if (n) return 'GC-' + n.slice(0, 7);
    return '\u2014';
}

// ══════════════════════════════════════════
// STATE & LOCAL STORAGE HARDENING
// ══════════════════════════════════════════
function getSafeStorage(key, fallback) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.warn(`LocalStorage parse error for ${key}:`, e);
        return fallback;
    }
}

function setSafeStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn('Storage write error:', e); }
}

function getSessionStorage(key, fallback) {
    try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        return fallback;
    }
}

function setSessionStorage(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn('SessionStorage write error:', e); }
}

/** Persist signed-in user for this tab only, or across visits when Remember me is on. */
function persistUserSession(userData, remember) {
    if (!userData) {
        localStorage.removeItem('gb_user');
        sessionStorage.removeItem('gb_user');
        return;
    }
    const clean = Object.assign({}, userData);
    delete clean.password;
    delete clean.passwordHash;
    delete clean.pw;
    if (remember) {
        setSafeStorage('gb_user', clean);
        sessionStorage.removeItem('gb_user');
    } else {
        setSessionStorage('gb_user', clean);
        localStorage.removeItem('gb_user');
    }
}

function loadPersistedUser() {
    return getSafeStorage('gb_user', null) || getSessionStorage('gb_user', null);
}

let cart         = getSafeStorage('gb_cart', []);
let user         = loadPersistedUser();
let wishlist     = getSafeStorage('gb_wishlist', []);
let orders       = getSafeStorage('gb_orders', []);
let couponDiscount   = 0;
let appliedCoupon    = '';
let currentFilter    = 'all';
let selectedPayMethod = 'cod';
// Language: persist across refresh/login. First visit only — detect browser lang.
let currentLang = (function resolveInitialLang() {
    try {
        const saved = localStorage.getItem('gb_lang');
        if (saved === 'en' || saved === 'hi') return saved;
        const nav = String((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
        let detected = 'hi';
        if (nav.indexOf('hi') === 0) detected = 'hi';
        else if (nav.indexOf('en') === 0) detected = 'en';
        localStorage.setItem('gb_lang', detected);
        return detected;
    } catch (_e) { /* ignore */ }
    return 'hi';
})();
/** Whether the current session should survive browser restarts (Remember me). */
let rememberUserSession = !!getSafeStorage('gb_user', null);

// AUTH RATE LIMITING STATE
let failedLoginAttempts = 0;
let lockoutTimerId      = null;

// ══════════════════════════════════════════
// PLATFORM / OAUTH CONFIGURATION
// Configured via <meta> tags in index.html so deployers never edit JS.
// Google OAuth Client ID: leave empty to keep Google Sign-In dormant.
// ══════════════════════════════════════════
const APP_CONFIG = {
    googleClientId: (document.querySelector('meta[name="google-client-id"]') || {}).content || '',
    // Platform API base (docs/PLATFORM-API.md). Empty = local-only mode.
    apiBase: (document.querySelector('meta[name="gb-api-base"]') || {}).content || ''
};

// Security: Remove plaintext passwords from stored user objects
(function sanitizeStoredUser() {
    if (user && user.password) {
        delete user.password;
        setSafeStorage('gb_user', user);
    }
})();

function saveCart() {
    setSafeStorage('gb_cart', cart);
}
