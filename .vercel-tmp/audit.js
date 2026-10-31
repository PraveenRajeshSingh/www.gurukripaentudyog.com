// Temp audit: cross-check the built page's inline handlers + JS-referenced ids.
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// 1. every onclick="fn(...)" must resolve to a function defined in a shipped script
const jsFiles = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"[^>]*>/g)].map(m => m[1]);
let src = '';
for (const ref of jsFiles) {
    const p = ref.replace(/^\/?(?:www\/)?/, '');
    const cand = ['src/js/' + p.split('/').pop(), p];
    const found = cand.find(f => fs.existsSync(f));
    if (found) src += fs.readFileSync(found, 'utf8') + '\n';
}
const handlers = new Set([...html.matchAll(/on(?:click|change|input|submit)="\s*([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]));
const builtins = new Set(['event', 'this', 'if', 'alert', 'confirm', 'prompt', 'window', 'location', 'scrollTo', 'setTimeout']);
const missingFns = [...handlers].filter(h => !builtins.has(h)
    && !new RegExp('function\\s+' + h + '\\s*\\(').test(src)
    && !new RegExp('(window\\.' + h + '\\s*=|const\\s+' + h + '\\s*=|let\\s+' + h + '\\s*=|var\\s+' + h + '\\s*=)').test(src));

// 2. ids looked up by JS must exist in the page (or be created by JS itself)
const jsIds = new Set([...src.matchAll(/getElementById\(\s*'([^']+)'\s*\)/g)].map(m => m[1]));
const pageIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
const missingIds = [...jsIds].filter(id => !pageIds.has(id)
    && !new RegExp('id=[\'"]?' + id + '[\'"]?').test(src)
    && !new RegExp('id="' + id + '"').test(fs.readFileSync('index.html', 'utf8')));

// 3. stylesheet links resolve
const css = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(m => m[1]);
const missingCss = css.filter(c => !fs.existsSync(c.replace(/^\/?(?:www\/)?/, '')));

console.log(JSON.stringify({
    scriptsShipped: jsFiles.length,
    inlineHandlers: handlers.size,
    missingFns,
    jsIdLookups: jsIds.size,
    missingIds,
    cssLinks: css.length,
    missingCss
}, null, 2));
