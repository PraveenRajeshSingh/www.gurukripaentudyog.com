const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const en = JSON.parse(fs.readFileSync(path.join(root, 'i18n/en.json'), 'utf8'));
const hi = JSON.parse(fs.readFileSync(path.join(root, 'i18n/hi.json'), 'utf8'));

// Load sync bundle + runtime into a sandbox
const scope = { window: {}, document: { readyState: 'complete', addEventListener() {}, getElementsByTagName() { return []; } }, location: { search: '' }, console };
scope.window = scope;
scope.globalThis = scope;
const dataJs = fs.readFileSync(path.join(root, 'src/js/i18n-data.js'), 'utf8');
const runtimeJs = fs.readFileSync(path.join(root, 'src/js/i18n.js'), 'utf8');
new Function('window', 'document', 'location', 'console', 'globalThis', dataJs + '\n' + runtimeJs)(
  scope, scope.document, scope.location, console, scope
);
const TRANSLATIONS = scope.TRANSLATIONS;
const t = scope.t;

describe('Localization & Language Completeness (Phase 1 JSON)', () => {
  test('JSON dictionaries exist and match runtime bundle', () => {
    assert.ok(en && hi);
    assert.ok(TRANSLATIONS.en && TRANSLATIONS.hi);
    assert.equal(Object.keys(TRANSLATIONS.en).length, Object.keys(en).length);
  });

  test('All English translation keys exist in Hindi', () => {
    const missingInHi = Object.keys(en).filter((k) => !(k in hi));
    assert.equal(missingInHi.length, 0, `Missing Hindi: ${missingInHi.join(', ')}`);
  });

  test('All Hindi keys exist in English', () => {
    const missingInEn = Object.keys(hi).filter((k) => !(k in en));
    assert.equal(missingInEn.length, 0, `Missing English: ${missingInEn.join(', ')}`);
  });

  test('products.filters present (Phase 0 gap)', () => {
    assert.equal(en['products.filters'], 'Filters');
    assert.ok(hi['products.filters']);
  });

  test('Interpolation placeholders match between languages', () => {
    const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;
    for (const key of Object.keys(en)) {
      const enStr = en[key];
      const hiStr = hi[key];
      if (typeof enStr !== 'string' || typeof hiStr !== 'string') continue;
      const enPlaceholders = (enStr.match(placeholderRegex) || []).sort();
      const hiPlaceholders = (hiStr.match(placeholderRegex) || []).sort();
      assert.deepEqual(hiPlaceholders, enPlaceholders, `Placeholder mismatch for "${key}"`);
    }
  });

  test('t() falls back to English and interpolates', () => {
    scope.currentLang = 'hi';
    const sampleKey = Object.keys(en).find((k) => /\{[a-z]+\}/.test(en[k]));
    if (sampleKey) {
      const m = en[sampleKey].match(/\{([a-zA-Z0-9_]+)\}/);
      const vars = {};
      vars[m[1]] = 'X';
      const out = t(sampleKey, vars);
      assert.ok(String(out).includes('X'));
    }
    scope.currentLang = 'zz';
    assert.equal(t('nav.home'), en['nav.home'] || hi['nav.home'] || 'nav.home');
  });

  test('Critical storefront partials wire key i18n attributes', () => {
    const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
    const checks = [
      ['src/pages/partials/navbar.html', 'nav.suppliers'],
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
  });
});
