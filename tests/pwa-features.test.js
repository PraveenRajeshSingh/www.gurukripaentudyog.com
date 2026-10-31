const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// These modules are plain browser IIFEs that publish onto `window` and rely on
// a handful of globals from other files (getSafeStorage, formatINR, ...). Each
// test builds its own sandbox, the same style as tests/erp.test.js.
const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function makeStorage() {
    const map = new Map();
    return {
        map,
        getItem: (k) => (map.has(k) ? map.get(k) : null),
        setItem: (k, v) => map.set(k, String(v)),
        removeItem: (k) => map.delete(k)
    };
}

// ── WhatsApp order handoff ───────────────────────────────────────────
function loadWhatsApp(opts = {}) {
    const opened = [];
    const mockWindow = {
        Platform: { isNative: () => Boolean(opts.native) },
        open: (...args) => { opened.push(args); return { closed: false }; }
    };
    const scope = {
        window: mockWindow,
        Platform: mockWindow.Platform,
        formatINR: (v) => '₹' + Number(v || 0),
        formatNum: (v) => String(Number(v || 0)),
        navigator: { onLine: true }
    };
    new Function('scope', `
        const window = scope.window;
        const Platform = scope.Platform;
        const formatINR = scope.formatINR;
        const formatNum = scope.formatNum;
        const navigator = scope.navigator;
        ${read('src/js/whatsapp-order.js')}
    `)(scope);
    return { order: mockWindow.WhatsAppOrder, opened };
}

function sampleOrder() {
    return {
        ref: 'GBI-20261031-4821',
        createdAt: Date.UTC(2026, 9, 31, 10, 30),
        items: [
            { name: 'Shiv Eent Grade-A', qty: 1000, price: 7.2, unit: 'per piece' },
            { name: 'Cement Bag (50kg)', qty: 2, price: 410, unit: 'per bag' }
        ],
        subtotal: 8020,
        discount: 200,
        coupon: 'SAVE10',
        total: 7820,
        estimator: {
            tab: 'wall',
            project: 'Wall (20ft × 10ft, 9" thick)',
            bricks: 1640,
            trolleys: 0.4,
            cementBags: 12,
            sandCuFt: 574,
            cost: 19680
        },
        delivery: {
            name: 'Ramesh Verma',
            phone: '9876543210',
            address: 'Plot 12, Jalalpur Road',
            city: 'Jaunpur',
            pincode: '222001',
            roadAccess: 'narrow',
            unloading: 'Self-unloading at site'
        },
        payment: 'upi',
        notes: ['Please call before dispatch'],
        online: false
    };
}

describe('WhatsApp order handoff', () => {
    test('formats cart lines, totals, estimator, delivery and payment', () => {
        const { order } = loadWhatsApp();
        const msg = order.buildMessage(sampleOrder());

        assert.ok(msg.includes('*NEW BRICK ORDER — Gurukripa Bricks Industry*'));
        assert.ok(msg.includes('Order ref: *GBI-20261031-4821*'));
        assert.ok(msg.includes('Placed offline from a construction site (queued on device).'));

        // Cart lines: qty + unit + rate + line total
        assert.ok(msg.includes('1. Shiv Eent Grade-A'));
        assert.ok(msg.includes('   1000 pieces x ₹7.2 = *₹7200*'));
        assert.ok(msg.includes('   2 bags x ₹410 = *₹820*'));
        assert.ok(msg.includes('Subtotal: ₹8020'));
        assert.ok(msg.includes('Coupon (SAVE10): -₹200'));
        assert.ok(msg.includes('*Grand total: ₹7820*'));

        // Exact wall estimator specs
        assert.ok(msg.includes('*WALL ESTIMATOR*'));
        assert.ok(msg.includes('Project: Wall (20ft × 10ft, 9" thick)'));
        assert.ok(msg.includes('Bricks needed: 1640 pcs'));
        assert.ok(msg.includes('Trolley load: 0.4 (4,000 pcs / trolley)'));
        assert.ok(msg.includes('Cement: 12 bags'));
        assert.ok(msg.includes('Sand: 574 cu.ft'));
        assert.ok(msg.includes('Estimated budget: ₹19680'));

        // Delivery pincode + road access labels are human-readable
        assert.ok(msg.includes('Buyer: Ramesh Verma'));
        assert.ok(msg.includes('Phone: 9876543210'));
        assert.ok(msg.includes('City / Pincode: Jaunpur - 222001'));
        assert.ok(msg.includes('Road access: Narrow village lane (mini trolley needed)'));
        assert.ok(msg.includes('Unloading: Self-unloading at site'));

        assert.ok(msg.includes('*PAYMENT PREFERENCE*'));
        assert.ok(msg.includes('UPI / QR (GPay, PhonePe, Paytm)'));
        assert.ok(msg.includes('*NOTES*'));
        assert.ok(msg.includes('• Please call before dispatch'));
    });

    test('falls back to order value when no cart items are attached', () => {
        const { order } = loadWhatsApp();
        const msg = order.buildMessage({ total: 500 });
        assert.ok(msg.includes('*Order value: ₹500*'));
        assert.ok(!msg.includes('*CART ITEMS*'));
        assert.ok(!msg.includes('*WALL ESTIMATOR*'));
    });

    test('defaults the payment preference to cash on delivery', () => {
        const { order } = loadWhatsApp();
        assert.ok(order.buildMessage({}).includes('Cash on Delivery'));
    });

    test('labels the estimator block by tab', () => {
        const { order } = loadWhatsApp();
        assert.ok(order.buildMessage({ estimator: { tab: 'house', bricks: 38000 } }).includes('*HOUSE ESTIMATOR*'));
        assert.ok(order.buildMessage({ estimator: { tab: 'boundary', bricks: 8550 } }).includes('*BOUNDARY ESTIMATOR*'));
        assert.ok(!order.buildMessage({ estimator: {} }).includes('ESTIMATOR'));
    });

    test('buildLink points at the yard number and encodes the message', () => {
        const { order } = loadWhatsApp();
        const text = 'Namaste!\nWall 20x10 ft & 9" thick';
        const link = order.buildLink(text);

        assert.ok(link.startsWith('https://wa.me/919198923230?text='));
        assert.ok(!link.includes('\n'));
        assert.equal(decodeURIComponent(link.split('?text=')[1]), text);
    });

    test('order references are dated and unique enough for quoting', () => {
        const { order } = loadWhatsApp();
        const ref = order.makeOrderRef();
        assert.match(ref, /^GBI-\d{8}-\d{4}$/);

        const now = new Date();
        const stamp = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
        assert.equal(ref.slice(4, 12), stamp);
    });

    test('native builds hand the link to the OS instead of a popup', () => {
        const { order, opened } = loadWhatsApp({ native: true });
        order.openLink('https://wa.me/919198923230');
        assert.deepEqual(opened[0], ['https://wa.me/919198923230', '_system']);
    });
});

// ── Alerts (pure logic) ──────────────────────────────────────────────
function loadAlerts() {
    const storage = makeStorage();
    const mockWindow = {};
    const scope = {
        window: mockWindow,
        getSafeStorage: (k, d) => (storage.map.has(k) ? JSON.parse(storage.map.get(k)) : d),
        setSafeStorage: (k, v) => storage.map.set(k, JSON.stringify(v)),
        showToast: () => {},
        document: { getElementById: () => null, addEventListener: () => {} }
    };
    new Function('scope', `
        const window = scope.window;
        const getSafeStorage = scope.getSafeStorage;
        const setSafeStorage = scope.setSafeStorage;
        const showToast = scope.showToast;
        const document = scope.document;
        ${read('src/js/push-notifications.js')}
    `)(scope);
    return mockWindow.PushNotifications;
}

describe('Alert engine', () => {
    test('diffPrices reports only genuine decreases', () => {
        const alerts = loadAlerts();
        const previous = [
            { id: 1, name: 'Shiv Eent', price: 8 },
            { id: 2, name: 'Awwal', price: 7 },
            { id: 3, name: 'Duwam', price: 5 }
        ];
        const live = [
            { id: 1, name: 'Shiv Eent', price: 7.5 },   // drop
            { id: 2, name: 'Awwal', price: 7 },         // unchanged
            { id: 3, name: 'Duwam', price: 5.5 },       // increase
            { id: 4, name: 'New Stock', price: 9 }      // not previously cached
        ];

        const drops = alerts.diffPrices(previous, live);
        assert.equal(drops.length, 1);
        assert.equal(drops[0].id, 1);
        assert.equal(drops[0].name, 'Shiv Eent');
        assert.equal(drops[0].oldPrice, 8);
        assert.equal(drops[0].newPrice, 7.5);
        assert.equal(drops[0].drop, 0.5);
    });

    test('diffPrices rounds to paise and ignores junk values', () => {
        const alerts = loadAlerts();
        const drops = alerts.diffPrices(
            [{ id: 1, name: 'A', price: 7.05 }, { id: 2, name: 'B', price: 'n/a' }],
            [{ id: 1, name: 'A', price: 6.9 }, { id: 2, name: 'B', price: 4 }]
        );
        assert.equal(drops.length, 1);
        assert.equal(drops[0].drop, 0.15);
    });

    test('normaliseStage maps yard status strings to alert stages', () => {
        const alerts = loadAlerts();
        assert.equal(alerts.normaliseStage('Dispatched from Jalalpur yard'), 'dispatched');
        assert.equal(alerts.normaliseStage('In transit'), 'dispatched');
        assert.equal(alerts.normaliseStage('Out for delivery'), 'delivered');
        assert.equal(alerts.normaliseStage('Unloaded at site'), 'delivered');
        assert.equal(alerts.normaliseStage('Loading on trolley'), 'loading');
        assert.equal(alerts.normaliseStage('Token received'), 'token');
        assert.equal(alerts.normaliseStage('Processing'), 'token');
        assert.equal(alerts.normaliseStage('Cancelled'), 'cancelled');
        assert.equal(alerts.normaliseStage(''), '');
        assert.equal(alerts.normaliseStage('something else'), '');
    });
});

// ── Offline store (localStorage fallback path) ───────────────────────
function loadOfflineStore() {
    const storage = makeStorage();
    const mockWindow = {};
    const scope = { window: mockWindow, localStorage: storage };
    new Function('scope', `
        const window = scope.window;
        const localStorage = scope.localStorage;
        ${read('src/js/offline-store.js')}
    `)(scope);
    return mockWindow.OfflineStore;
}

describe('Offline-first store', () => {
    test('falls back to localStorage when IndexedDB is unavailable', async () => {
        const store = loadOfflineStore();
        assert.equal(store.isAvailable(), false);
        const snapshot = await store.catalogSnapshot();
        assert.equal(snapshot, null);
    });

    test('caches the rate card with numeric prices for offline reading', async () => {
        const store = loadOfflineStore();
        const saved = await store.cacheCatalog([
            { id: 1, name: 'Shiv Eent', price: '7.05', oldPrice: '7.5', unit: 'per piece', category: 'grade-a' },
            { id: 2, name: 'Duwam', price: 5.2 }
        ]);

        assert.deepEqual(saved.count, 2);
        const items = await store.getCachedCatalog();
        assert.equal(items.length, 2);
        assert.equal(items[0].price, 7.05);
        assert.equal(items[0].oldPrice, 7.5);
        assert.equal(items[1].unit, 'per piece');

        const status = await store.status();
        assert.equal(status.cachedRates, 2);
        assert.equal(status.queuedOrders, 0);
        assert.ok(status.savedAt > 0);
    });

    test('outbox holds offline orders until they are marked sent', async () => {
        const store = loadOfflineStore();
        const a = await store.queueOrder({ ref: 'GBI-1', message: 'first', itemCount: 4000 });
        await store.queueOrder({ ref: 'GBI-2', message: 'second', itemCount: 2000 });

        let pending = await store.listOutbox(true);
        assert.equal(pending.length, 2);
        assert.equal(pending[0].ref, 'GBI-1'); // oldest first
        assert.equal(pending[0].synced, false);

        await store.markOutboxSent(a.id);
        pending = await store.listOutbox(true);
        assert.equal(pending.length, 1);
        assert.equal(pending[0].ref, 'GBI-2');

        const all = await store.listOutbox();
        assert.equal(all.length, 2);
        assert.equal((await store.status()).queuedOrders, 1);
    });

    test('saved estimates come back newest first and can be cleared', async () => {
        const store = loadOfflineStore();
        await store.saveEstimate({ label: 'Wall 20ft', bricks: 1640, createdAt: 1000 });
        await store.saveEstimate({ label: 'House 1000 sqft', bricks: 38000, createdAt: 2000 });

        const rows = await store.listEstimates();
        assert.equal(rows.length, 2);
        assert.equal(rows[0].label, 'House 1000 sqft');
        assert.equal((await store.listEstimates(1)).length, 1);

        await store.clearEstimates();
        assert.equal((await store.listEstimates()).length, 0);
    });

    test('meta flags survive a round-trip (alert baseline)', async () => {
        const store = loadOfflineStore();
        assert.equal(await store.getMeta('priceCheck'), null);
        await store.setMeta('priceCheck', 1700000000000);
        assert.equal(await store.getMeta('priceCheck'), 1700000000000);
    });
});

// ── Service worker push plumbing ─────────────────────────────────────
function loadServiceWorker(opts = {}) {
    const listeners = {};
    const shown = [];
    const focused = [];
    const posted = [];
    const opened = [];

    const clients = opts.noOpenTabs
        ? []
        : [{
            focus: () => { focused.push(true); return Promise.resolve(); },
            postMessage: (msg) => posted.push(msg)
        }];

    const mockSelf = {
        addEventListener: (type, fn) => { listeners[type] = fn; },
        skipWaiting: () => {},
        location: { origin: 'https://www.gurukripaentudyog.com' },
        registration: {
            showNotification: (title, options) => {
                shown.push({ title, options });
                return Promise.resolve();
            }
        },
        clients: {
            matchAll: () => Promise.resolve(clients),
            openWindow: (url) => { opened.push(url); return Promise.resolve(); }
        }
    };

    new Function('self', read('sw.js'))(mockSelf);
    return { listeners, shown, focused, posted, opened };
}

function makeEvent(extra) {
    const waits = [];
    return Object.assign({
        waitUntil(p) { waits.push(p); return p; },
        _waits: waits
    }, extra);
}

describe('Service worker push + notification handlers', () => {
    test('registers push, notificationclick and message handlers', () => {
        const sw = loadServiceWorker();
        assert.equal(typeof sw.listeners.push, 'function');
        assert.equal(typeof sw.listeners.notificationclick, 'function');
        assert.equal(typeof sw.listeners.message, 'function');
    });

    test('push payload becomes a notification with deep-link data', async () => {
        const sw = loadServiceWorker();
        const event = makeEvent({
            data: {
                json: () => ({
                    title: 'Trolley dispatched',
                    body: 'Order GBI-20261031-4821 has left the Jalalpur yard.',
                    tag: 'order-GBI-20261031-4821',
                    kind: 'order',
                    orderId: 'GBI-20261031-4821',
                    url: '#track'
                })
            }
        });

        sw.listeners.push(event);
        await Promise.all(event._waits);

        assert.equal(sw.shown.length, 1);
        assert.equal(sw.shown[0].title, 'Trolley dispatched');
        assert.match(sw.shown[0].options.body, /Jalalpur yard/);
        assert.equal(sw.shown[0].options.tag, 'order-GBI-20261031-4821');
        assert.deepEqual(sw.shown[0].options.data, {
            url: '#track',
            kind: 'order',
            orderId: 'GBI-20261031-4821'
        });
    });

    test('push falls back to raw text and default copy on malformed JSON', async () => {
        const sw = loadServiceWorker();
        const event = makeEvent({
            data: {
                json: () => { throw new Error('not json'); },
                text: () => 'raw yard message'
            }
        });

        sw.listeners.push(event);
        await Promise.all(event._waits);

        // Malformed payloads still surface the raw text under the short brand name
        assert.equal(sw.shown[0].title, 'Gurukripa Bricks');
        assert.equal(sw.shown[0].options.body, 'raw yard message');
        assert.equal(sw.shown[0].options.tag, 'gbi-alert');
        // No payload data still yields a usable deep link + kind
        assert.deepEqual(sw.shown[0].options.data, { url: './', kind: 'general', orderId: '' });
    });

    test('tapping a notification focuses the app and forwards the payload', async () => {
        let closed = false;
        const sw = loadServiceWorker();
        const event = makeEvent({
            notification: {
                close: () => { closed = true; },
                data: { url: '#track', kind: 'order', orderId: 'GBI-9' }
            }
        });

        sw.listeners.notificationclick(event);
        await Promise.all(event._waits);

        assert.ok(closed, 'notification should be dismissed on tap');
        assert.deepEqual(sw.posted[0], {
            type: 'NOTIFICATION_CLICKED',
            payload: { url: '#track', kind: 'order', orderId: 'GBI-9' }
        });
        assert.equal(sw.focused.length, 1);
    });

    test('notification tap opens the deep link when no tab is running', async () => {
        const sw = loadServiceWorker({ noOpenTabs: true });
        const event = makeEvent({
            notification: { close: () => {}, data: { url: '#track' } }
        });

        sw.listeners.notificationclick(event);
        await Promise.all(event._waits);

        assert.deepEqual(sw.opened, ['#track']);
    });

    test('page messages can request a local notification', async () => {
        const sw = loadServiceWorker();
        const event = makeEvent({
            data: { type: 'SHOW_NOTIFICATION', payload: { title: 'Wholesale rate dropped', body: 'Shiv Eent is ₹0.5 lower per brick.' } }
        });

        sw.listeners.message(event);
        await Promise.all(event._waits);

        assert.equal(sw.shown[0].title, 'Wholesale rate dropped');
        assert.equal(sw.shown[0].options.tag, 'gbi-local');
    });
});

// ── Mobile navigation contract ───────────────────────────────────────
describe('Mobile bottom navigation', () => {
    const partial = read('src/pages/partials/mobile-bottom-nav.html');

    test('exposes exactly the five primary destinations in order', () => {
        const labels = [...partial.matchAll(/class="mn-label"[^>]*>([^<]+)</g)].map(m => m[1].trim());
        assert.deepEqual(labels, ['Home', 'Products', 'Estimator', 'Cart', 'Track']);
    });

    test('drops the elevated cart FAB and the profile shortcut', () => {
        assert.ok(!partial.includes('mn-cart-fab'));
        assert.ok(!partial.includes('mnProfileLabel'));
        assert.equal((partial.match(/class="mn-item/g) || []).length, 5);
    });

    test('estimator and track open overlays instead of bare hash hops', () => {
        assert.ok(partial.includes('openMobileEstimator(this)'));
        assert.ok(partial.includes('openMobileTrack(this)'));
        assert.ok(partial.includes('id="mobileCartBadge"'));
    });
});
