#!/usr/bin/env node
/*
 * build.js — Assemble root index.html from src/pages/index.src.html + partials.
 *
 * Design goals:
 *   - Zero runtime cost: the served index.html remains a single HTTP response.
 *   - SEO-safe: fully-formed markup reaches crawlers without JS execution.
 *   - Deterministic: same partials -> byte-identical output.
 *   - No framework: pure Node, no dependencies, ~50 lines.
 *
 * Markers supported in src/pages/index.src.html:
 *   <!-- @include:partials/foo.html -->
 *   Replaced by the contents of src/pages/partials/foo.html (relative to src/pages/).
 *   Recursive includes are supported (a partial may itself contain <!-- @include:... -->).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'src', 'pages');
const TEMPLATE = path.join(PAGES_DIR, 'index.src.html');
const OUTPUT = path.join(ROOT, 'index.html');

const INCLUDE_RE = /<!--\s*@include:([^\s]+)\s*-->/g;

function resolveIncludes(file, seen = new Set()) {
  const abs = path.resolve(PAGES_DIR, file);
  if (seen.has(abs)) {
    throw new Error(`Circular @include detected at: ${file}`);
  }
  seen.add(abs);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing include target: ${file}`);
  }
  let content = fs.readFileSync(abs, 'utf8');
  content = content.replace(INCLUDE_RE, (_, ref) => resolveIncludes(ref, new Set(seen)));
  return content;
}

function main() {
  if (!fs.existsSync(TEMPLATE)) {
    console.error(`Template not found: ${TEMPLATE}`);
    process.exit(1);
  }
  const html = resolveIncludes(TEMPLATE);
  fs.writeFileSync(OUTPUT, html, 'utf8');
  const lineCount = html.split('\n').length;
  console.log(`build.js: wrote ${path.relative(ROOT, OUTPUT)} (${lineCount} lines, ${Buffer.byteLength(html)} bytes)`);
}

main();
