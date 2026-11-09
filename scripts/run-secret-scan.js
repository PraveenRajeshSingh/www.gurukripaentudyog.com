#!/usr/bin/env node
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');

let out = '';
try {
  out = execSync(
    'git grep -nE "BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY|rzp_live_[A-Za-z0-9]+|sk_live_[A-Za-z0-9]{16,}" -- ' +
      '":!.github/workflows/security-scan.yml" ":!docs/**" ":!**/*.md" ":!TEST_ACCOUNTS.local.md"',
    { encoding: 'utf8' }
  );
} catch (e) {
  if (e.status > 1) {
    console.error(e.stderr || e.message);
    process.exit(e.status);
  }
  out = e.stdout || '';
}

if (out && out.trim()) {
  console.log(out);
  console.error('Possible secret material detected in the repository');
  process.exit(1);
}
console.log('No high-confidence secret patterns found in tracked source.');

for (const f of [
  '.env.example',
  '.env.development.example',
  '.env.production.example',
  'backend/.env.example',
]) {
  if (!fs.existsSync(f)) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (/RAZORPAY_(KEY_ID|KEY_SECRET|WEBHOOK_SECRET)=.+/m.test(t)) {
    console.error('Committed env example must leave Razorpay values blank:', f);
    process.exit(1);
  }
}
console.log('Razorpay placeholders in env examples are blank.');
process.exit(0);
