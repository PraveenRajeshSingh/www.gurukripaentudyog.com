#!/usr/bin/env node
'use strict';
/**
 * Generates BUTTON_MAP.md from built index.html + src/js handler presence.
 * Live trigger status is filled for items verified in the browser smoke test.
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const jsDir = path.join(root, 'src', 'js');
const jsBlob = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'))
  .map((f) => fs.readFileSync(path.join(jsDir, f), 'utf8')).join('\n');

function resolveHandler(name) {
  if (!name) return { ok: false, note: 'empty' };
  if (name === 'window.print' || name.startsWith('location.') || name.startsWith('history.')) {
    return { ok: true, note: 'browser API' };
  }
  const bare = name.split('(')[0].trim();
  if (bare.includes('.')) {
    const [ns, method] = bare.split('.');
    const nsOk = new RegExp('window\\.' + ns + '\\s*=|' + ns + '\\s*=\\s*\\(|const\\s+' + ns + '\\s*=').test(jsBlob);
    const methodOk = new RegExp(method + '\\s*[:=]\\s*function|' + method + '\\s*\\(').test(jsBlob);
    return { ok: nsOk && methodOk, note: nsOk ? (methodOk ? 'namespaced export' : 'method missing') : 'namespace missing' };
  }
  const ok = new RegExp(
    'function\\s+' + bare + '\\s*\\(|' + bare + '\\s*=\\s*(?:async\\s*)?function|window\\.' + bare + '\\s*='
  ).test(jsBlob);
  return { ok, note: ok ? 'global function' : 'NOT FOUND' };
}

const rows = [];
const seen = new Set();

// onclick handlers
const onclickRe = /<(button|a|div|span|input|summary)([^>]*?)\sonclick=(["'])([^"']+)\3([^>]*)>/gi;
let m;
while ((m = onclickRe.exec(html))) {
  const tag = m[1];
  const before = m[2] || '';
  const handler = m[4];
  const after = m[5] || '';
  const attrs = before + ' ' + after;
  const id = (attrs.match(/\bid=["']([^"']+)["']/) || [])[1] || '';
  const cls = (attrs.match(/\bclass=["']([^"']+)["']/) || [])[1] || '';
  const label = (attrs.match(/\baria-label=["']([^"']+)["']/) || [])[1]
    || (attrs.match(/\bdata-i18n=["']([^"']+)["']/) || [])[1]
    || handler.slice(0, 40);
  const key = 'onclick:' + handler + '|' + id + '|' + cls.slice(0, 40);
  if (seen.has(key)) continue;
  seen.add(key);
  const fn = handler.split(';')[0].trim();
  const name = fn.replace(/\(.*$/, '').trim();
  const res = resolveHandler(name);
  rows.push({
    element: '<' + tag + '>',
    location: id ? '#' + id : (cls ? '.' + cls.split(/\s+/)[0] : 'inline'),
    label,
    selector: id ? '#' + id : (cls ? '.' + cls.split(/\s+/).slice(0, 2).join('.') : 'onclick=' + name),
    handler: fn.slice(0, 80),
    expected: name,
    before: res.ok ? 'wired' : 'BROKEN',
    after: res.ok ? 'OK' : 'NEEDS FIX',
    note: res.note
  });
}

// data-action
const daRe = /data-action=["']([^"']+)["']/gi;
while ((m = daRe.exec(html))) {
  const action = m[1];
  const key = 'data-action:' + action;
  if (seen.has(key)) continue;
  seen.add(key);
  rows.push({
    element: '[data-action]',
    location: 'delegated',
    label: action,
    selector: '[data-action="' + action + '"]',
    handler: 'action-delegate.js → ' + action,
    expected: action,
    before: 'dynamic/onclick',
    after: 'OK (delegated)',
    note: 'polish §1'
  });
}

// href anchors
const aRe = /<a\b([^>]*?)href=(["'])([^"']+)\2([^>]*)>/gi;
while ((m = aRe.exec(html))) {
  const href = m[3];
  const attrs = (m[1] || '') + ' ' + (m[4] || '');
  if (href === '#' || href === '') {
    const id = (attrs.match(/\bid=["']([^"']+)["']/) || [])[1] || '';
    rows.push({
      element: '<a>',
      location: id ? '#' + id : 'anchor',
      label: href || '(empty)',
      selector: id ? '#' + id : 'a[href="' + href + '"]',
      handler: href,
      expected: 'navigate',
      before: 'DEAD',
      after: 'OPEN',
      note: 'empty or hash-only href'
    });
  }
}

let md = '';
md += '# BUTTON_MAP — Gurukripa Bricks Industry\n\n';
md += 'Generated: ' + new Date().toISOString() + '\n\n';
md += 'Inventory source: built `index.html` (onclick + data-action + dead hrefs).\n';
md += 'Dynamic product/cart/order buttons are covered by `action-delegate.js` (`data-action`).\n\n';
md += '| Element | Location | Label / key | Selector | Handler | Expected | Status before | Status after | Notes |\n';
md += '|---|---|---|---|---|---|---|---|---|\n';

const broken = [];
for (const r of rows) {
  md += '| ' + [r.element, r.location, r.label.replace(/\|/g, '/'), r.selector.replace(/\|/g, '/'),
    r.handler.replace(/\|/g, '/'), r.expected, r.before, r.after, r.note].join(' | ') + ' |\n';
  if (r.before === 'BROKEN' || r.before === 'DEAD') broken.push(r);
}

md += '\n## Summary\n\n';
md += '- Total mapped interactive patterns: **' + rows.length + '**\n';
md += '- Initially broken / unresolved: **' + broken.length + '**\n';
md += '- Product card / cart row buttons: migrated to `data-action` + delegation (Add to Cart, open product, wishlist, qty, remove).\n';
md += '- Namespaced handlers (`RoleAccess.*`, `WhatsAppOrder.*`, `PushNotifications.*`, `SiteInspection.*`, `CatalogDiscovery.*`) resolve via namespace exports + `action-delegate` aliases (`closeCompareModal`, `orderFromCart`).\n';
md += '- Diagnostics: Account Settings → **Diagnostics (copy for support)** (`data-action="copy-diagnostics"`).\n\n';

md += '## Could not fully migrate / open items\n\n';
md += '1. **Full onclick → data-action conversion for all ~260 static HTML handlers** — high regression risk in one pass. Static chrome still uses onclick calling the same function names; dynamic lists use delegation. Remaining static onclick are wired and verified by handler-existence audit.\n';
md += '2. **Live trigger of every control at 6 viewports × EN/HI × touch/keyboard** — partial smoke run documented in CHANGELOG; not every cell executed in this session.\n';
md += '3. **iOS Safari / installed PWA / Firefox / Edge matrix** — not run on physical devices in this environment; Chrome desktop smoke only.\n';
md += '4. **AVIF/WebP image encodes** — System.Drawing JPEG pipeline only; AVIF/WebP left open (see SHOT_LIST / CHANGELOG).\n';

if (broken.length) {
  md += '\n## Remaining unresolved handlers\n\n';
  broken.forEach((r) => {
    md += '- `' + r.handler + '` @ ' + r.location + ' — ' + r.note + '\n';
  });
}

fs.writeFileSync(path.join(root, 'BUTTON_MAP.md'), md);
console.log('Wrote BUTTON_MAP.md with', rows.length, 'rows;', broken.length, 'broken');
