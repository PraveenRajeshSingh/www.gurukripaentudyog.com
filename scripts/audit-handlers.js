// Audit: every inline event-handler name in the built page must resolve to a
// real function, every href must point at something that exists, and no UI
// chrome may still be drawn with emoji.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// 1. Collect globally-defined function names across the storefront scripts.
const jsDir = path.join(root, 'src', 'js');
const defined = new Set();
for (const f of fs.readdirSync(jsDir)) {
    if (!f.endsWith('.js')) continue;
    const src = fs.readFileSync(path.join(jsDir, f), 'utf8');
    for (const m of src.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)) defined.add(m[1]);
    for (const m of src.matchAll(/(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\()/g)) defined.add(m[1]);
    // The storefront also exports globals as `window.name = function/atprop` -
    // pincodeChecker.js and services/index.js both use this form.
    for (const m of src.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)) defined.add(m[1]);
    for (const m of src.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*[:(]\s*(?:async\s+)?(?:function|\(|[A-Za-z_$][\w$]*\s*\()/gm)) defined.add(m[1]);
    // window.Foo = { bar() {} } style namespaces are checked separately below.
}
// A handful of names are provided by vendor/3rd-party or browser globals.
const external = new Set([
    'alert', 'confirm', 'prompt', 'open', 'close', 'focus', 'blur', 'scrollTo',
    'location', 'history', 'event', 'FBAsync', 'gtag', 'dataLayer'
]);

// 2. Every identifier invoked from an inline handler.
const handlers = [...html.matchAll(/on(?:click|change|input|submit|keydown|focus|blur|load|error|toggle)="([^"]*)"/g)].map(m => m[1]);
const called = new Set();
for (const body of handlers) {
    // `(^|[^.\w$])` keeps method calls (obj.fetch(), .trim()) out of the set -
    // only bare global function names can be invoked from an inline handler.
    for (const m of body.matchAll(/(?:^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) called.add(m[1]);
}
const keywords = new Set(['if', 'else', 'for', 'while', 'switch', 'return', 'typeof', 'new', 'function']);
const missingCalls = [...called].filter(n => !defined.has(n) && !external.has(n) && !keywords.has(n));

// 3b. Inline handlers that reference an undefined global also break at runtime.
const globalsInHandlers = new Set();
for (const body of handlers) {
    for (const m of body.matchAll(/([A-Z][A-Za-z0-9_]*)\s*\./g)) globalsInHandlers.add(m[1]);
}

// 3. Hrefs: no "#" placeholders, and every in-page anchor target must exist.
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
const deadHrefs = hrefs.filter(h => h === '#' || h === '##' || h === 'javascript:void(0)');
const brokenAnchors = hrefs.filter(h => /^#/.test(h) && h.length > 1 && !ids.has(h.slice(1)));

// 4. Emoji used as interface chrome (outside of <script> content strings is
//    impossible to separate cleanly, so we report per line for review).
const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;
const lines = html.split(/\r?\n/);
const emojiLines = [];
lines.forEach((l, i) => {
    if (!emoji.test(l)) return;
    // Ignore lines that are pure script data (i18n lives in src/js, not here).
    if (/^\s*(\/\/|\*)/.test(l)) return;
    emojiLines.push((i + 1) + ': ' + l.trim().slice(0, 110));
});

// 5. <button> without type= defaults to type="submit" inside a form.
const untyped = (html.match(/<button(?![^>]*\btype=)[^>]*>/g) || []);

// 6. target=_blank without rel=noopener.
const unsafeBlank = (html.match(/<a[^>]*target="_blank"[^>]*>/g) || []).filter(a => !/rel="[^"]*noopener/.test(a));

console.log('inline handler call sites :', called.size);
console.log('MISSING functions         :', missingCalls.length ? missingCalls.join(', ') : 'none');
console.log('dead href="#"             :', deadHrefs.length);
console.log('  at lines                :', lines.map((l, i) => /href="#"/.test(l) ? (i + 1) : null).filter(Boolean).join(', '));
console.log('broken #anchor targets    :', brokenAnchors.length ? brokenAnchors.join(', ') : 'none');
console.log('buttons without type=     :', untyped.length, untyped.slice(0, 6).join(' | '));
console.log('target=_blank w/o noopener:', unsafeBlank.length);
console.log('CAPITALISED globals used  :', [...globalsInHandlers].join(', '));
console.log('lines containing emoji    :', emojiLines.length);
emojiLines.slice(0, 40).forEach(l => console.log('   ', l));
