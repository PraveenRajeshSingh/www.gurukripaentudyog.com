const fs = require('fs');
const path = require('path');
const html = fs.readFileSync('index.html', 'utf8');
// collect inline handler names
const names = new Set();
const re = /on(?:click|change|input|submit|keypress|keydown|focus|blur|load|error|toggle)="([^"]*)"/g;
let m;
while ((m = re.exec(html))) {
  const body = m[1];
  const calls = body.matchAll(/([A-Za-z_$][\w$]*)\s*\(/g);
  for (const c of calls) names.add(c[1]);
}
// gather JS source
let js = '';
fs.readdirSync('src/js').forEach(f => { if (f.endsWith('.js')) js += fs.readFileSync(path.join('src/js', f), 'utf8') + '\n'; });
js += fs.readFileSync('index.html', 'utf8');
const builtins = new Set(['if', 'return', 'function', 'event', 'alert', 'confirm', 'parseInt', 'parseFloat', 'String', 'Number', 'Math', 'Date', 'JSON', 'localStorage', 'sessionStorage', 'setTimeout', 'clearTimeout', 'window', 'document', 'this', 'void', 'typeof', 'encodeURIComponent', 'decodeURIComponent', 'getElementById', 'querySelector', 'querySelectorAll', 'addEventListener', 'removeEventListener', 'preventDefault', 'stopPropagation', 'scrollIntoView', 'print', 'open', 'close', 'location', 'matchMedia', 'toggleTheme', 'haptic']);
const missing = [];
[...names].sort().forEach(n => {
  if (builtins.has(n)) return;
  const def = new RegExp('(function\\s+' + n + '\\s*\\(|(const|let|var)\\s+' + n + '\\s*=|' + n + '\\s*[:=]\\s*(function|\\()' + '|window\\.' + n + '\\s*=)');
  if (!def.test(js)) missing.push(n);
});
console.log('inline handler names: ' + names.size);
console.log('unresolved: ' + missing.length + (missing.length ? ' -> ' + missing.join(', ') : ''));
