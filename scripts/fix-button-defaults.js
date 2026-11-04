// Codemod: add type="button" to typeless <button> tags, and rel="noopener" to
// target="_blank" anchors that lack it.
//
// Both are default-hazard fixes, not cosmetics: a typeless button inside a form
// submits it, and window.open('_blank') without noopener hands the opened page a
// handle on the opener. Buttons that are inside a <form> and carry no onclick of
// their own are left alone - for those, submitting the form IS the job.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'src/pages/partials');
const apply = process.argv.includes('--apply');

let typed = 0, skipped = 0, noopener = 0;
const skippedList = [];

for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.html')) continue;
    const file = path.join(dir, f);
    let src = fs.readFileSync(file, 'utf8');

    // --- 1. button types -----------------------------------------------------
    // Form spans are found from the comment-stripped copy so a "<form>" inside
    // prose never mis-marks a button, but the rewrite happens on the real text
    // (comment removal shifts every index, so ranges are recomputed there).
    const formRanges = (html) => {
        const out = [];
        const stack = [];
        const tok = /<form\b[^>]*>|<\/form>/gi;
        let m;
        while ((m = tok.exec(html))) {
            if (m[0][1] === '/') {
                const open = stack.pop();
                if (open !== undefined && !stack.length) out.push([open, m.index]);
            } else stack.push(m.index);
        }
        return out;
    };

    const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
    const ranges = formRanges(stripComments(src));
    const inForm = (at) => ranges.some(([a, b]) => at > a && at < b);

    const parts = [];
    let cursor = 0;
    const btok = /<button\b/gi;
    // The opening tag is read with a quote-aware scan rather than a lazy `.*?>`
    // because attributes here contain `>` (comparisons inside onclick), which
    // would cut a plain regex short and leave half a tag behind.
    const tagEnd = (html, from) => {
        let q = null;
        for (let i = from + 7; i < html.length; i++) {
            const c = html[i];
            if (q) { if (c === q) q = null; continue; }
            if (c === '"' || c === "'") { q = c; continue; }
            if (c === '>') return i;
        }
        return -1;
    };
    let m;
    while ((m = btok.exec(src))) {
        const close = tagEnd(src, m.index);
        if (close < 0) continue;
        if (m.index < cursor) continue;
        const tag = src.slice(m.index, close + 1);
        if (/\btype\s*=/.test(tag)) continue;
        if (inForm(m.index) && !/\bonclick\s*=/.test(tag)) {
            skipped++;
            skippedList.push(f + ':' + src.slice(0, m.index).split(/\r?\n/).length);
            continue;
        }
        parts.push(src.slice(cursor, m.index));
        // Insert right after "<button" so the attribute order stays readable.
        parts.push('<button type="button"' + tag.slice(7));
        cursor = close + 1;
        typed++;
    }
    if (parts.length) {
        parts.push(src.slice(cursor));
        src = parts.join('');
    }

    // --- 2. rel="noopener" ---------------------------------------------------
    src = src.replace(/<a\b((?:(?!target="_blank")[\s\S])*?)target="_blank"((?:[\s\S])*?)>/g, (full, pre, post) => {
        if (/\brel="[^"]*noopener/.test(pre + post)) return full;
        noopener++;
        return '<a' + pre + 'target="_blank" rel="noopener"' + post + '>';
    });

    if (apply) fs.writeFileSync(file, src, 'utf8');
}

console.log(apply ? 'APPLIED' : 'DRY RUN');
console.log('  buttons given type="button" :', typed);
console.log('  left as submit buttons      :', skipped, skippedList.join(', '));
console.log('  anchors given rel=noopener  :', noopener);
