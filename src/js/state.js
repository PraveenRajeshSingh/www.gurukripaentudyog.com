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
    if (!name) return 'linear-gradient(135deg, #C8460A, #8B2E05)';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash) % 360;
    return `linear-gradient(135deg, hsl(${h}, 70%, 45%), hsl(${(h + 40) % 360}, 80%, 35%))`;
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

let cart         = getSafeStorage('gb_cart', []);
let user         = getSafeStorage('gb_user', null);
let wishlist     = getSafeStorage('gb_wishlist', []);
let orders       = getSafeStorage('gb_orders', []);
let couponDiscount   = 0;
let appliedCoupon    = '';
let currentFilter    = 'all';
let selectedPayMethod = 'upi';
let currentLang      = localStorage.getItem('gb_lang') || 'en';

// AUTH RATE LIMITING STATE
let failedLoginAttempts = 0;
let lockoutTimerId      = null;

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
