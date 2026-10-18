const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mock localStorage and document for headless environment
const mockStorage = new Map();
const globalMock = {
    localStorage: {
        getItem: (k) => mockStorage.get(k) || null,
        setItem: (k, v) => mockStorage.set(k, String(v)),
        removeItem: (k) => mockStorage.delete(k),
        clear: () => mockStorage.clear()
    },
    document: {
        querySelector: () => null
    }
};

const utilsJs = fs.readFileSync(path.resolve(__dirname, '../src/js/utils.js'), 'utf8');
const stateJs = fs.readFileSync(path.resolve(__dirname, '../src/js/state.js'), 'utf8');

const scope = {};
new Function('globalMock', 'scope', `
    const localStorage = globalMock.localStorage;
    const document = globalMock.document;
    ${utilsJs}
    ${stateJs}
    scope.formatINR = formatINR;
    scope.formatNum = formatNum;
    scope.sanitizeHTML = sanitizeHTML;
    scope.getAvatarBg = getAvatarBg;
    scope.getSafeStorage = getSafeStorage;
    scope.setSafeStorage = setSafeStorage;
`)(globalMock, scope);

const { formatINR, formatNum, sanitizeHTML, getAvatarBg, getSafeStorage, setSafeStorage } = scope;

describe('Shared Utilities & Security Functions', () => {
    test('formatINR formats numbers with ₹ and Indian comma grouping', () => {
        assert.equal(formatINR(0), '₹0');
        assert.equal(formatINR(1000), '₹1,000');
        assert.equal(formatINR(28200), '₹28,200');
        assert.equal(formatINR(100000), '₹1,00,000');
        assert.equal(formatINR(1000000), '₹10,00,000');
    });

    test('formatNum formats numbers with Indian grouping without ₹', () => {
        assert.equal(formatNum(4000), '4,000');
        assert.equal(formatNum(38000), '38,000');
    });

    test('sanitizeHTML escapes XSS payload characters', () => {
        const dangerous = '<script>alert("xss & \'attack\'")</script>';
        const clean = sanitizeHTML(dangerous);
        assert.ok(!clean.includes('<script>'), 'Must not contain unescaped tags');
        assert.ok(clean.includes('&lt;script&gt;'));
        assert.ok(clean.includes('&quot;'));
        assert.ok(clean.includes('&#039;'));
        assert.ok(clean.includes('&amp;'));
    });

    test('getAvatarBg returns deterministic CSS gradient', () => {
        const bg1 = getAvatarBg('Rahul Kumar');
        const bg2 = getAvatarBg('Rahul Kumar');
        assert.equal(bg1, bg2, 'Same name must produce identical gradient');
        assert.ok(bg1.startsWith('linear-gradient('));
    });

    test('Safe storage handles write and read with fallback gracefully', () => {
        setSafeStorage('test_key', { count: 42 });
        const val = getSafeStorage('test_key', null);
        assert.deepEqual(val, { count: 42 });

        const fallback = getSafeStorage('non_existent', 'default_val');
        assert.equal(fallback, 'default_val');
    });
});
