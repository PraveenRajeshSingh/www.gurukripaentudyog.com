/**
 * Fails if a key exists in one language file but not the other.
 * Usage: node scripts/check-i18n-parity.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const en = JSON.parse(fs.readFileSync(path.join(root, 'i18n/en.json'), 'utf8'));
const hi = JSON.parse(fs.readFileSync(path.join(root, 'i18n/hi.json'), 'utf8'));
const enKeys = Object.keys(en);
const hiKeys = Object.keys(hi);
const onlyEn = enKeys.filter((k) => !(k in hi));
const onlyHi = hiKeys.filter((k) => !(k in en));
const emptyEn = enKeys.filter((k) => String(en[k]).trim() === '');
const emptyHi = hiKeys.filter((k) => String(hi[k]).trim() === '');
const report = { en: enKeys.length, hi: hiKeys.length, onlyEn, onlyHi, emptyEn, emptyHi };
console.log(JSON.stringify(report, null, 2));
if (onlyEn.length || onlyHi.length) {
  console.error('FAIL: key parity mismatch');
  process.exit(1);
}
console.log('OK: en/hi key parity');
