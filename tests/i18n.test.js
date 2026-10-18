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
});
