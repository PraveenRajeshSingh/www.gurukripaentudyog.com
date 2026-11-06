const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const i18nJs = fs.readFileSync(path.resolve(__dirname, '../src/js/i18n.js'), 'utf8');
const scope = {};
new Function('scope', i18nJs + '; scope.TRANSLATIONS = TRANSLATIONS;')(scope);
const { TRANSLATIONS } = scope;

describe('Localization & Language Completeness', () => {
    test('Both English (en) and Hindi (hi) dictionaries exist', () => {
        assert.ok(TRANSLATIONS.en, 'English dictionary must exist');
        assert.ok(TRANSLATIONS.hi, 'Hindi dictionary must exist');
    });

    test('All English translation keys exist in Hindi', () => {
        const enKeys = Object.keys(TRANSLATIONS.en);
        const hiKeys = new Set(Object.keys(TRANSLATIONS.hi));

        const missingInHi = [];
        for (const k of enKeys) {
            if (!hiKeys.has(k)) missingInHi.push(k);
        }

        assert.equal(missingInHi.length, 0, `Missing Hindi translations for keys: ${missingInHi.join(', ')}`);
    });

    test('Interpolation placeholders match between languages', () => {
        const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;

        for (const key of Object.keys(TRANSLATIONS.en)) {
            const enStr = TRANSLATIONS.en[key];
            const hiStr = TRANSLATIONS.hi[key];
            if (typeof enStr !== 'string' || typeof hiStr !== 'string') continue;

            const enPlaceholders = (enStr.match(placeholderRegex) || []).sort();
            const hiPlaceholders = (hiStr.match(placeholderRegex) || []).sort();

            assert.deepEqual(
                hiPlaceholders,
                enPlaceholders,
                `Placeholder mismatch for key "${key}": EN has [${enPlaceholders}] but HI has [${hiPlaceholders}]`
            );
        }
    });

    test('Critical storefront partials wire key i18n attributes', () => {
        const read = (rel) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8');
        const checks = [
            ['src/pages/partials/navbar.html', 'nav.categories'],
            ['src/pages/partials/hero.html', 'hero.cta1'],
            ['src/pages/partials/contact.html', 'contact.title'],
            ['src/pages/partials/footer.html', 'footer.quickLinks'],
            ['src/pages/partials/mobile-bottom-nav.html', 'mobile.home'],
            ['src/pages/partials/about.html', 'about.desc'],
            ['src/pages/partials/cta-banner.html', 'cta.title'],
            ['src/pages/partials/faq.html', 'faq.desc'],
            ['src/pages/partials/cities.html', 'cities.desc'],
            ['src/pages/partials/wishlist-drawer.html', 'wishlist.title'],
            ['src/pages/partials/checkout-modal.html', 'checkout.title'],
        ];
        for (const [file, key] of checks) {
            assert.match(read(file), new RegExp(`data-i18n="${key}"`), `${file} must wire ${key}`);
        }
        assert.ok(TRANSLATIONS.en['hero.cta1'] && TRANSLATIONS.hi['hero.cta1']);
        assert.ok(TRANSLATIONS.en['about.desc'] && TRANSLATIONS.hi['about.desc']);
    });
});
