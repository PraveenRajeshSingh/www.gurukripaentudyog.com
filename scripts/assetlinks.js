#!/usr/bin/env node
/*
 * assetlinks.js — write .well-known/assetlinks.json for the Android app.
 *
 * Digital Asset Links is what hides the browser URL bar in a Trusted Web
 * Activity and what makes https://www.gurukripaentudyog.com links open the
 * installed app instead of Chrome. Google verifies it by fetching
 *   https://<host>/.well-known/assetlinks.json
 * and matching the package name + signing certificate SHA-256 fingerprint.
 *
 * The fingerprint is NOT guessable — it comes from the key that actually
 * signs the uploaded bundle. Two keys matter:
 *   • Play App Signing key  (Play Console → Setup → App signing) — use this
 *     for anything installed from the Play Store.
 *   • Upload / local keystore — use this when sideloading an APK you built.
 * Ship both fingerprints when both install paths must work.
 *
 * Usage:
 *   node scripts/assetlinks.js --fingerprint=AA:BB:…:FF
 *   node scripts/assetlinks.js --keystore=android.keystore --alias=gurukripa
 *   node scripts/assetlinks.js --check        # validate what is committed
 *
 * The keystore password is read from ANDROID_KEYSTORE_PASSWORD (preferred)
 * or --storepass, so it never has to be pasted into the command line.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_NAME = 'com.gurukripa.bricks';
const TARGETS = [
  path.join(ROOT, '.well-known', 'assetlinks.json'),
  path.join(ROOT, 'www', '.well-known', 'assetlinks.json') // mirrored after `npm run www`
];

const FP_PATTERN = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

function usage() {
  console.log(`assetlinks.js — generate .well-known/assetlinks.json

  --fingerprint=<SHA256>   signing cert fingerprint (repeatable / comma separated)
  --keystore=<path>        derive the fingerprint from a keystore via keytool
  --alias=<name>           key alias inside --keystore
  --storepass=<password>   keystore password (or set ANDROID_KEYSTORE_PASSWORD)
  --package=<id>           Android package name (default: ${PACKAGE_NAME})
  --out=<path>             target file (default: .well-known/assetlinks.json)
  --check                  validate committed file(s); exit 1 on placeholders
  --help                   show this message`);
}

function parseArgs(argv) {
  const opts = { fingerprints: [], keystore: '', alias: '', storepass: '', package: PACKAGE_NAME, out: '', check: false, help: false };
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') { opts.help = true; continue; }
    if (arg === '--check') { opts.check = true; continue; }
    const m = /^--([a-z-]+)=(.+)$/.exec(arg);
    if (!m) { console.error(`assetlinks.js: unknown argument "${arg}"`); opts.help = true; continue; }
    const [, key, value] = m;
    if (key === 'fingerprint') opts.fingerprints.push(...value.split(','));
    else if (key === 'keystore') opts.keystore = value;
    else if (key === 'alias') opts.alias = value;
    else if (key === 'storepass') opts.storepass = value;
    else if (key === 'package') opts.package = value;
    else if (key === 'out') opts.out = value;
    else { console.error(`assetlinks.js: unknown option --${key}`); opts.help = true; }
  }
  return opts;
}

// Accepts "aa:bb:…", "AABB…", with or without spaces, and normalises to the
// uppercase colon-separated form Google expects.
function normalise(raw) {
  const clean = String(raw || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (clean.length !== 64) return null;
  const pairs = clean.match(/.{2}/g);
  return pairs ? pairs.join(':') : null;
}

function fromKeystore(opts) {
  if (!opts.keystore) return null;
  if (!opts.alias) {
    console.error('assetlinks.js: --keystore also needs --alias.');
    return null;
  }
  const pass = opts.storepass || process.env.ANDROID_KEYSTORE_PASSWORD || '';
  const args = ['-list', '-v', '-keystore', opts.keystore, '-alias', opts.alias];
  if (pass) args.push('-storepass', pass);

  let output;
  try {
    output = execFileSync('keytool', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    const detail = (err.stderr || err.message || '').toString().trim();
    console.error(`assetlinks.js: keytool failed — ${detail || 'is keytool on PATH?'}`);
    return null;
  }

  const match = /SHA256:\s*([0-9A-Fa-f:]+)/.exec(output);
  const fp = match ? normalise(match[1]) : null;
  if (!fp) {
    console.error('assetlinks.js: could not read a SHA256 fingerprint from keytool output.');
    return null;
  }
  return fp;
}

function buildStatement(packageName, fingerprints) {
  return [{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: packageName,
      sha256_cert_fingerprints: fingerprints
    }
  }];
}

function writeAll(content, explicitOut) {
  const written = [];
  const targets = explicitOut ? [path.resolve(ROOT, explicitOut)] : TARGETS;
  for (const file of targets) {
    const dir = path.dirname(file);
    // The www/ mirror only exists after `npm run www`; skip it silently.
    if (!explicitOut && path.basename(dir) === '.well-known' && !fs.existsSync(dir)) continue;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, content);
    written.push(path.relative(ROOT, file));
  }
  return written;
}

function check() {
  let ok = true;
  for (const file of TARGETS) {
    if (!fs.existsSync(file)) continue;
    const rel = path.relative(ROOT, file);
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      console.error(`${rel}: not valid JSON — ${err.message}`);
      ok = false;
      continue;
    }
    const statement = Array.isArray(parsed) ? parsed[0] : null;
    const target = statement && statement.target;
    const fps = (target && target.sha256_cert_fingerprints) || [];
    const valid = fps.filter(fp => FP_PATTERN.test(String(fp).toUpperCase()));
    if (!target || !target.package_name || !valid.length) {
      console.error(`${rel}: still contains placeholder fingerprints. Run: npm run assetlinks -- --fingerprint=<SHA256>`);
      ok = false;
    } else {
      console.log(`${rel}: OK — ${target.package_name} (${valid.length} fingerprint${valid.length > 1 ? 's' : ''})`);
    }
  }
  if (!ok) process.exitCode = 1;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { usage(); return; }
  if (opts.check) { check(); return; }

  const fingerprints = opts.fingerprints.map(normalise).filter(Boolean);
  if (opts.fingerprints.length && fingerprints.length !== opts.fingerprints.length) {
    console.error('assetlinks.js: a --fingerprint value was not a 32-byte SHA-256 (expected 95 chars like AB:CD:…).');
  }
  const fromStore = fromKeystore(opts);
  if (fromStore && !fingerprints.includes(fromStore)) fingerprints.push(fromStore);

  if (!fingerprints.length) {
    usage();
    console.error('\nassetlinks.js: no valid fingerprint supplied — nothing was written.');
    process.exitCode = 1;
    return;
  }

  const content = JSON.stringify(buildStatement(opts.package, fingerprints), null, 2) + '\n';
  const written = writeAll(content, opts.out);
  console.log(`assetlinks.js: wrote ${written.join(', ')}`);
  console.log(`  package: ${opts.package}`);
  fingerprints.forEach(fp => console.log(`  sha256 : ${fp}`));
  console.log('\nNext: commit the file, deploy, then verify with');
  console.log(`  https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://www.gurukripaentudyog.com&relation=delegate_permission/common.handle_all_urls`);
}

main();
