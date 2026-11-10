/**
 * Dev-only smoke checks for cart/wishlist (no Playwright required).
 * Run: node scripts/qa-commerce-smoke.mjs
 * Spins up no server — exercises commerce-store logic in isolation via vm,
 * plus documents the browser CDP results from the live fix session.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const results = [];

function pass(name, detail) { results.push({ name, ok: true, detail }); }
function fail(name, detail) { results.push({ name, ok: false, detail }); }

// Minimal DOM/storage shim for commerce-store.js
const store = {};
const sandbox = {
  document: {
    readyState: 'complete',
    addEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null
  },
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  },
  sessionStorage: { getItem: () => null, setItem: () => {} },
  PRODUCTS: [
    { id: 1, name: 'A', price: 10, stock: 'in-stock' },
    { id: 2, name: 'B', price: 8, stock: 'out-of-stock' }
  ],
  showToast: () => {},
  console,
  setTimeout,
  clearTimeout,
  BroadcastChannel: undefined,
  addEventListener: () => {}
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

const code = fs.readFileSync(path.join(root, 'src/js/commerce-store.js'), 'utf8');
vm.runInNewContext(code, sandbox);

const C = sandbox.GBI.Commerce;
const a = C.add(1, 5);
if (a.ok && C.get().length === 1 && C.get()[0].qty === 5) pass('commerce.add', JSON.stringify(a));
else fail('commerce.add', JSON.stringify(a));

const b = C.add(2, 1);
if (!b.ok && b.reason === 'out-of-stock') pass('commerce.reject-oos', b.reason);
else fail('commerce.reject-oos', JSON.stringify(b));

const w = C.toggle(1);
if (w.ok && w.on && C.has(1)) pass('commerce.wish-on', JSON.stringify(w));
else fail('commerce.wish-on', JSON.stringify(w));

const w2 = C.toggle(1);
if (w2.ok && !w2.on && !C.has(1)) pass('commerce.wish-off', JSON.stringify(w2));
else fail('commerce.wish-off', JSON.stringify(w2));

const q = C.setQty(1, 9);
if (q.ok && C.get()[0].qty === 9) pass('commerce.setQty', JSON.stringify(q));
else fail('commerce.setQty', JSON.stringify(q));

C.remove(1);
if (C.get().length === 0) pass('commerce.remove', 'empty');
else fail('commerce.remove', JSON.stringify(C.get()));

// Persistence keys
if (store['gbi.cart.v2'] && store['gb_cart']) pass('commerce.persist-keys', 'v2+v1 present');
else fail('commerce.persist-keys', Object.keys(store).join(','));

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ pass: results.length - failed.length, fail: failed.length, results }, null, 2));
process.exit(failed.length ? 1 : 0);
