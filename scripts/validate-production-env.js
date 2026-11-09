#!/usr/bin/env node
/**
 * Fail closed when production deploy secrets are missing.
 * Usage: NODE_ENV=production node scripts/validate-production-env.js
 * Never prints secret values — only missing key names.
 */
'use strict';

const requiredWhenProduction = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'JWT_SECRET',
];

const optionalWarn = [
  'RAZORPAY_WEBHOOK_SECRET',
  'DATABASE_URL',
  'GOOGLE_MAPS_API_KEY',
];

function isProd() {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production'
    || process.argv.includes('--production');
}

function blank(v) {
  return v == null || String(v).trim() === '';
}

function looksLikePlaceholder(v) {
  const s = String(v || '');
  return /YOUR_|CHANGE_ME|REPLACE_ME|example|placeholder/i.test(s);
}

if (!isProd()) {
  console.log('validate-production-env: skipped (not production).');
  process.exit(0);
}

const missing = [];
const unsafe = [];

for (const key of requiredWhenProduction) {
  const val = process.env[key];
  if (blank(val)) missing.push(key);
  else if (looksLikePlaceholder(val)) unsafe.push(key);
}

if (missing.length || unsafe.length) {
  if (missing.length) {
    console.error('Missing required production environment variables:', missing.join(', '));
  }
  if (unsafe.length) {
    console.error('Placeholder-looking values for:', unsafe.join(', '));
  }
  console.error('Inject real secrets via the host secret manager before deploy.');
  process.exit(1);
}

for (const key of optionalWarn) {
  if (blank(process.env[key])) {
    console.warn('Warning: optional production variable unset:', key);
  }
}

console.log('validate-production-env: required payment and auth secrets are present (values not logged).');
process.exit(0);
