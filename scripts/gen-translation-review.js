/**
 * Build TRANSLATION_REVIEW.csv from /i18n/en.json + hi.json
 * Flags empty strings, HTML markup, and mechanical-looking HI as needs review.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const en = JSON.parse(fs.readFileSync(path.join(root, 'i18n/en.json'), 'utf8'));
const hi = JSON.parse(fs.readFileSync(path.join(root, 'i18n/hi.json'), 'utf8'));

function esc(s) {
  return '"' + String(s).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
}

function confidence(key, enVal, hiVal) {
  if (!hiVal || !String(hiVal).trim()) return 'needs review';
  if (/privacy|terms|refund|legal|policy/i.test(key)) return 'needs review';
  if (/<[a-z]/i.test(String(enVal)) || /<[a-z]/i.test(String(hiVal))) return 'needs review';
  if (key === 'products.filters') return 'needs review';
  if (enVal === hiVal && /[A-Za-z]{4,}/.test(String(enVal)) && !/Gurukripa|WhatsApp|OTP|UPI|ISI|GPS|FAQ|PDF|COD/.test(String(enVal))) {
    return 'needs review';
  }
  return 'ok';
}

function whereUsed(key) {
  if (key.startsWith('nav.')) return 'header/nav';
  if (key.startsWith('auth.')) return 'auth popup';
  if (key.startsWith('cart.') || key.startsWith('checkout.')) return 'cart/checkout';
  if (key.startsWith('footer.') || key.startsWith('legal.')) return 'footer/policies';
  if (key.startsWith('hero.')) return 'hero';
  if (key.startsWith('toast.') || key.startsWith('error.')) return 'toasts/errors';
  if (key.startsWith('calculator.') || key.startsWith('studio.')) return 'estimator';
  if (key.startsWith('products.') || key.startsWith('catalog.')) return 'products';
  if (key.startsWith('faq.')) return 'faq';
  if (key.startsWith('mobile.') || key.startsWith('drawer.')) return 'mobile chrome';
  return 'general';
}

const keys = Object.keys(en).sort();
const lines = ['key,English,Hindi,where_used,confidence'];
for (const k of keys) {
  lines.push([esc(k), esc(en[k] || ''), esc(hi[k] || ''), esc(whereUsed(k)), esc(confidence(k, en[k], hi[k]))].join(','));
}
fs.writeFileSync(path.join(root, 'TRANSLATION_REVIEW.csv'), lines.join('\n') + '\n', 'utf8');
const needs = keys.filter((k) => confidence(k, en[k], hi[k]) === 'needs review').length;
console.log(JSON.stringify({ rows: keys.length, needsReview: needs }, null, 2));
