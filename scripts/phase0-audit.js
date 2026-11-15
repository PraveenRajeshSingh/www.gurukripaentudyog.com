/**
 * Phase 0 diagnose — button + i18n inventory (no DOM click execution).
 * Run: node scripts/phase0-audit.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'src/js/i18n.js'), 'utf8');

function extractKeys(block) {
  const keys = [];
  const re = /'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g;
  let m;
  while ((m = re.exec(block))) keys.push(m[1].replace(/\\'/g, "'"));
  return keys;
}

const hiStart = i18n.indexOf('hi: {');
const enKeys = extractKeys(i18n.slice(0, hiStart));
const hiKeys = extractKeys(i18n.slice(hiStart));
const enSet = new Set(enKeys);
const hiSet = new Set(hiKeys);

const dataI18n = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]);
const uniqData = [...new Set(dataI18n)];
const missingEn = uniqData.filter((k) => !enSet.has(k));
const missingHi = uniqData.filter((k) => !hiSet.has(k));
const onlyEn = [...enSet].filter((k) => !hiSet.has(k));
const onlyHi = [...hiSet].filter((k) => !enSet.has(k));

const buttons = (html.match(/<button\b/gi) || []).length;
const anchors = (html.match(/<a\b/gi) || []).length;
const roleButton = (html.match(/role="button"/gi) || []).length;
const roleTab = (html.match(/role="tab"/gi) || []).length;
const roleMenuitem = (html.match(/role="menuitem"/gi) || []).length;
const roleSwitch = (html.match(/role="switch"/gi) || []).length;
const onclick = (html.match(/\sonclick="/gi) || []).length;
const dataAction = (html.match(/data-action=/gi) || []).length;
const hrefHash = (html.match(/href="#"/gi) || []).length;
const hrefEmpty = (html.match(/href=""/gi) || []).length;
const typeSubmit = (html.match(/type="submit"/gi) || []).length;

const onclickFns = {};
for (const m of html.matchAll(/\sonclick="([^"]+)"/gi)) {
  const raw = m[1].trim();
  const name = raw.split('(')[0].trim();
  onclickFns[name] = (onclickFns[name] || 0) + 1;
}

const jsDir = path.join(root, 'src/js');
const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));
const jsBlob = jsFiles.map((f) => fs.readFileSync(path.join(jsDir, f), 'utf8')).join('\n');

const missingFns = [];
for (const name of Object.keys(onclickFns)) {
  if (!name || name === 'void' || name.startsWith('document.') || name.startsWith('window.')) continue;
  // bare identifiers used as handlers
  const id = name.replace(/^window\./, '');
  const declared =
    new RegExp('function\\s+' + id + '\\s*\\(').test(jsBlob) ||
    new RegExp(id + '\\s*=\\s*function').test(jsBlob) ||
    new RegExp('(?:window\\.)?' + id + '\\s*=').test(jsBlob) ||
    new RegExp('global\\.' + id).test(jsBlob);
  if (!declared) missingFns.push({ name: id, count: onclickFns[name] });
}

const hardHexOutsideTokens = (() => {
  const styles = [];
  function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (f.endsWith('.css') && f !== 'tokens.css') styles.push(p);
    }
  }
  walk(path.join(root, 'src/styles'));
  let count = 0;
  const samples = [];
  for (const p of styles) {
    const txt = fs.readFileSync(p, 'utf8');
    const hits = txt.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    count += hits.length;
    if (hits.length && samples.length < 15) {
      samples.push({ file: path.relative(root, p), count: hits.length });
    }
  }
  return { count, sampleFiles: samples };
})();

const report = {
  generatedAt: new Date().toISOString(),
  i18n: {
    source: 'src/js/i18n.js (in-memory TRANSLATIONS; no /i18n/*.json)',
    enKeyCount: enSet.size,
    hiKeyCount: hiSet.size,
    dataI18nUniqueInIndex: uniqData.length,
    dataI18nOccurrences: dataI18n.length,
    missingInEn: missingEn,
    missingInHi: missingHi,
    keysOnlyInEn: onlyEn.slice(0, 40),
    keysOnlyInHi: onlyHi.slice(0, 40),
    keysOnlyInEnCount: onlyEn.length,
    keysOnlyInHiCount: onlyHi.length
  },
  buttonsBefore: {
    buttonElements: buttons,
    anchorElements: anchors,
    roleButton,
    roleTab,
    roleMenuitem,
    roleSwitch,
    onclickAttributes: onclick,
    dataActionAttributes: dataAction,
    hrefHash,
    hrefEmpty,
    typeSubmit,
    uniqueOnclickHandlers: Object.keys(onclickFns).length,
    onclickHandlerHistogram: onclickFns,
    handlersNotFoundInSrcJs: missingFns
  },
  themeHardcodedColorsOutsideTokens: hardHexOutsideTokens,
  toggleFindings: {
    langToggleMarkup: 'header .nav-lang (#navLangEn/#navLangHi) present; topbar .topbar-controls hidden',
    langHiddenDesktopRule:
      'src/styles/ux-responsive.css .nav-lang{display:none} + @media (max-width:900px){.nav-lang{display:inline-flex}} in @layer patches beats chrome-premium .nav-premium .nav-lang{display:inline-flex} in @layer features — so DESKTOP (>900px) hides the header language toggle',
    themeToggleMarkup: 'NONE — .theme-toggle-btn removed from templates',
    themePinnedLight:
      'head.html inline script + platform.js init() force data-theme=light and removeItem(gb_theme)'
  }
};

const outDir = path.join(root, 'qa');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'phase0-audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
