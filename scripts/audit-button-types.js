// Classify every <button> that has no explicit type.
//
// A typeless button inside a <form> is a submit button by default. Flipping it
// to type="button" would silently kill that form's submit path, so each one has
// to be classified rather than blanket-patched.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'src/pages/partials');

const rows = [];
for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.html')) continue;
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    const code = src.replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));

    // Map every top-level <form ...> ... </form> span, nesting-aware.
    const forms = [];
    const stack = [];
    const ftok = /<form\b[^>]*>|<\/form>/gi;
    let m;
    while ((m = ftok.exec(code))) {
        if (m[0][1] === '/') {
            const open = stack.pop();
            if (open !== undefined && !stack.length) forms.push([open, m.index]);
        } else stack.push(m.index);
    }

    const btok = /<button\b[\s\S]*?>/gi;
    while ((m = btok.exec(code))) {
        const tag = m[0];
        if (/\btype\s*=/.test(tag)) continue;
        const at = m.index;
        const inForm = forms.some(([a, b]) => at > a && at < b);
        const onclick = (tag.match(/\bonclick\s*=\s*"([^"]*)"/) || [])[1] || '';
        const text = tag.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 34)
            || (code.slice(at, at + 400).match(/>([^<]{1,34})/) || [, ''])[1].trim();
        rows.push({
            file: f,
            line: code.slice(0, at).split(/\r?\n/).length,
            inForm,
            // A submit-only button has no onclick of its own: the form's
            // onsubmit is the whole job.
            submitsOnly: inForm && !onclick,
            onclick: onclick.slice(0, 60),
            label: text
        });
    }
}

const submitOnly = rows.filter(r => r.submitsOnly);
const unsafe = rows.filter(r => !r.submitsOnly);
console.log('typeless buttons total      :', rows.length);
console.log('  must stay submit buttons  :', submitOnly.length, '(inside a form, no onclick)');
console.log('  safe to make type=button  :', unsafe.length);
console.log('\n--- must stay submit (do NOT blanket-patch) ---');
submitOnly.forEach(r => console.log('  ' + r.file + ':' + r.line + '  "' + r.label + '"'));
console.log('\n--- to convert ---');
unsafe.forEach(r => console.log('  ' + r.file + ':' + r.line + (r.inForm ? ' [in form]' : '') + '  ' + (r.onclick || '(no handler!)') + '   |' + r.label + '|'));
