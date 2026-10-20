const fs = require('fs'), path = require('path');
function walk(d, ext, out = []) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f); const s = fs.statSync(p);
    if (s.isDirectory()) { if (f === 'node_modules' || f === 'www' || f === '.git') continue; walk(p, ext, out); }
    else if (f.endsWith(ext)) out.push(p);
  }
  return out;
}
const html = walk('src/pages', '.html');
const js = [...walk('src/js', '.js'), ...walk('src/services', '.js'), ...walk('src/utils', '.js')];
let src = ''; for (const f of js) src += fs.readFileSync(f, 'utf8') + '\n';
const defined = new Set(); let m;
for (const re of [/function\s+([A-Za-z_$][\w$]*)/g, /([A-Za-z_$][\w$]*)\s*[:=]\s*(?:async\s*)?(?:function|\()/g, /([A-Za-z_$][\w$]*)\s*\(/g]) {
  while ((m = re.exec(src))) defined.add(m[1]);
}
const calls = new Map();
const handlerRe = /on(?:click|change|input|submit|keyup|keydown|load)="([^"]+)"/g;
const nameRe = /([A-Za-z_$][\w$]*)\s*\(/g;
for (const f of html) {
  const t = fs.readFileSync(f, 'utf8');
  for (const h of t.matchAll(handlerRe)) {
    for (const n of h[1].matchAll(nameRe)) {
      const id = n[1];
      if (!calls.has(id)) calls.set(id, new Set());
      calls.get(id).add(path.basename(f));
    }
  }
}
const kw = new Set(['if','for','while','switch','catch','return','typeof','parseInt','parseFloat','toString','toLocaleString','querySelector','querySelectorAll','getElementById','addEventListener','scrollTo','scrollIntoView','preventDefault','stopPropagation','alert','confirm','includes','filter','map','join','split','toFixed','then','void','this','Number','String','Array','Object','JSON','Math','Date','setTimeout','setInterval','focus','blur','remove','add','toggle','contains','push','test','replace','forEach','require','open','close']);
const missing = [...calls.keys()].filter(k => !defined.has(k) && !kw.has(k) && !k.includes('.'));
console.log('=== Handler calls NOT found among JS definitions ===');
for (const k of missing.sort()) console.log('  ' + k + '  <- ' + [...calls.get(k)].join(', '));
console.log('distinct calls:', calls.size, '| missing:', missing.length);
