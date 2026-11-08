#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const count = (re) => (html.match(re) || []).length;
const report = {
  buttons: count(/<button\b/gi),
  anchors: count(/<a\b/gi),
  roleButton: count(/role=["']button["']/gi),
  onclick: count(/\sonclick=/gi),
  hrefHashOnly: count(/href=["']#["']/gi),
  hrefEmpty: count(/href=["']["']/gi),
  summary: count(/<summary\b/gi),
  inputSubmit: count(/<input[^>]+type=["'](submit|button)["']/gi),
  scripts: count(/<script\b/gi),
  images: count(/<img\b/gi),
  htmlBytes: Buffer.byteLength(html)
};

// Collect onclick function names
const fns = new Map();
const re = /onclick=["']([^"']+)["']/gi;
let m;
while ((m = re.exec(html))) {
  const call = m[1].replace(/\([^)]*\)/, '()').trim();
  const name = call.split('(')[0].trim();
  fns.set(name, (fns.get(name) || 0) + 1);
}

// Check which onclick names exist as functions in src/js
const jsDir = path.join(root, 'src', 'js');
const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));
const jsBlob = jsFiles.map((f) => fs.readFileSync(path.join(jsDir, f), 'utf8')).join('\n');
const missing = [];
const present = [];
for (const name of fns.keys()) {
  if (!name || name.startsWith('document.') || name.startsWith('event.') || name === 'if') continue;
  const ok = new RegExp('function\\s+' + name + '\\s*\\(|' + name + '\\s*=\\s*function|window\\.' + name + '\\s*=').test(jsBlob);
  (ok ? present : missing).push({ name, count: fns.get(name) });
}

console.log(JSON.stringify({ report, onclickUnique: fns.size, missing, presentSample: present.slice(0, 20) }, null, 2));
