// Where do the remaining markup defects live? Reported per source partial so
// they can be fixed at the origin rather than in the generated index.html.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dirs = ['src/pages/partials', 'src/pages'];

const report = {
    untypedButton: {},
    unsafeBlank: {},
    placeholderHref: {},
    inlineStyle: {},
    emoji: {}
};

const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;

function bump(bucket, key) { bucket[key] = (bucket[key] || 0) + 1; }

for (const dir of dirs) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) {
        if (!f.endsWith('.html')) continue;
        const src = fs.readFileSync(path.join(abs, f), 'utf8');
        // Strip HTML comments - they are prose, not shipped markup.
        const code = src.replace(/<!--[\s\S]*?-->/g, '');
        const rel = dir + '/' + f;

        (code.match(/<button(?![^>]*\btype=)[^>]*>|<button>/g) || []).forEach(() => bump(report.untypedButton, rel));
        (code.match(/<a[^>]*target="_blank"[^>]*>/g) || []).filter(a => !/rel="[^"]*noopener/.test(a)).forEach(() => bump(report.unsafeBlank, rel));
        (code.match(/href="#"/g) || []).forEach(() => bump(report.placeholderHref, rel));
        (code.match(/\sstyle="/g) || []).forEach(() => bump(report.inlineStyle, rel));
        code.split(/\r?\n/).forEach(l => { if (emoji.test(l)) bump(report.emoji, rel); });
    }
}

const names = {
    untypedButton: '<button> without type= (defaults to submit inside a form)',
    unsafeBlank: 'target="_blank" without rel="noopener"',
    placeholderHref: 'placeholder href="#"',
    inlineStyle: 'inline style=" attribute',
    emoji: 'source lines containing emoji'
};
for (const [k, title] of Object.entries(names)) {
    const rows = Object.entries(report[k]).sort((a, b) => b[1] - a[1]);
    const total = rows.reduce((s, r) => s + r[1], 0);
    console.log('\n=== ' + title + '  [total ' + total + ']');
    rows.forEach(([f, n]) => console.log('  ' + String(n).padStart(3) + '  ' + f));
}
