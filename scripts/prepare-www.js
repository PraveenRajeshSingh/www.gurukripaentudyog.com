#!/usr/bin/env node
/*
 * prepare-www.js — Copy the deployable web bundle into ./www for Capacitor.
 *
 * Why a dedicated webDir instead of pointing Capacitor at the repo root?
 *   The repo root also contains source-only / tooling folders (node_modules,
 *   .git, android, ios, scripts, docs, and the src/pages/* partials + template).
 *   Bundling those into a native app would bloat it and ship non-runtime files.
 *   www/ is the clean, minimal, exactly-what-the-web-serves output.
 *
 * This does NOT change the GitHub Pages deploy, which still uploads the repo
 * root. www/ is generated for native packaging only (and is git-ignored).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'www');

// Root entries never shipped into the native bundle.
const EXCLUDE_ROOT = new Set([
  'node_modules', '.git', '.github', '.qoder', '.vscode',
  'www', 'android', 'ios', 'docs', 'scripts',
  'package.json', 'package-lock.json', 'npm-shrinkwrap.json',
  'capacitor.config.json', 'capacitor.config.ts',
  '.gitignore', '.editorconfig', 'README.md', 'LICENSE', 'LICENSE.md'
]);

// Whole subtree excluded even though its parent ships.
const EXCLUDE_SUBTREES = new Set([
  path.join('src', 'pages') // partials + shell template are build-time only
]);

function copyTree(srcDir, relBase) {
  for (const entry of fs.readdirSync(srcDir)) {
    const abs = path.join(srcDir, entry);
    const rel = relBase ? path.join(relBase, entry) : entry;
    if (EXCLUDE_SUBTREES.has(rel)) continue;
    if (!relBase && EXCLUDE_ROOT.has(entry)) continue;

    const dest = path.join(OUT, rel);
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      copyTree(abs, rel);
    } else {
      fs.copyFileSync(abs, dest);
    }
  }
}

// Fresh www/
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

copyTree(ROOT, '');

const indexAt = path.join(OUT, 'index.html');
if (!fs.existsSync(indexAt)) {
  console.error('prepare-www.js: index.html missing in www/ — run `npm run build` first.');
  process.exit(1);
}

function countFiles(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? countFiles(path.join(dir, e.name)) : 1;
  }
  return n;
}
console.log(`prepare-www.js: staged ${countFiles(OUT)} files into ./www/`);
