'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mapsJs = fs.readFileSync(path.resolve(__dirname, '../src/services/maps-service.js'), 'utf8');
const nearbyJs = fs.readFileSync(path.resolve(__dirname, '../src/services/nearby-suppliers-service.js'), 'utf8');
const uiJs = fs.readFileSync(path.resolve(__dirname, '../src/js/nearby-bhatta.js'), 'utf8');
const sectionHtml = fs.readFileSync(path.resolve(__dirname, '../src/pages/partials/nearby-bhatta.html'), 'utf8');
const indexSrc = fs.readFileSync(path.resolve(__dirname, '../src/pages/index.src.html'), 'utf8');
const modulesHtml = fs.readFileSync(path.resolve(__dirname, '../src/pages/partials/javascript-modules.html'), 'utf8');

const mockWindow = {
    GurukripaMaps: {},
    GurukripaNearby: {},
    GurukripaServices: {}
};

const scope = {
    window: mockWindow,
    document: {
        querySelector: () => ({ content: '' }),
        getElementById: () => null,
        querySelectorAll: () => [],
        createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
        head: { appendChild() {} },
        readyState: 'complete',
        addEventListener() {}
    },
    navigator: {},
    sessionStorage: {
        _d: Object.create(null),
        getItem(k) { return this._d[k] || null; },
        setItem(k, v) { this._d[k] = String(v); },
        removeItem(k) { delete this._d[k]; }
    },
    PRODUCTS: [
        { id: 7, category: 'awwal', price: 7.05, name: 'Awwal' },
        { id: 8, category: 'laal-peti', price: 6.25, name: 'Laal Peti' },
        { id: 4, category: 'machine-made', price: 11, name: 'Wirecut' }
    ],
    getSafeStorage(key, fallback) { return fallback; },
    setSafeStorage() {}
};

global.PRODUCTS = scope.PRODUCTS;
global.getSafeStorage = scope.getSafeStorage;
global.setSafeStorage = scope.setSafeStorage;

new Function('scope', `
    const window = scope.window;
    const document = scope.document;
    const navigator = scope.navigator;
    const sessionStorage = scope.sessionStorage;
    const PRODUCTS = scope.PRODUCTS;
    const getSafeStorage = scope.getSafeStorage;
    const setSafeStorage = scope.setSafeStorage;
    ${mapsJs}
    ${nearbyJs}
`)(scope);

const { GurukripaMaps, GurukripaNearby } = mockWindow;

describe('Nearby Brick Bhatta & Eent Finder', () => {
    test('feature is wired into storefront build template', () => {
        assert.match(indexSrc, /nearby-bhatta\.html/);
        assert.match(indexSrc, /nearby-bhatta-modals\.html/);
        assert.match(modulesHtml, /nearby-suppliers-service\.js/);
        assert.match(modulesHtml, /nearby-bhatta\.js/);
        assert.match(sectionHtml, /id="nearby-bhatta"/);
        assert.match(sectionHtml, /Brick Bhatta &amp; Eent Suppliers Near You/);
        assert.match(uiJs, /NearbyBhatta/);
    });

    test('distance calculation stays consistent with maps service', () => {
        const d1 = GurukripaMaps.calculateDistanceKm(25.6041031, 82.7939421, 25.7465, 82.6834);
        const d2 = GurukripaNearby._internal.haversineKm(25.6041031, 82.7939421, 25.7465, 82.6834);
        assert.equal(d1, d2);
        assert.ok(d1 > 10 && d1 < 30);
    });

    test('verified Gurukripa yard uses catalogue prices only', () => {
        const gk = GurukripaNearby._internal.verifiedGurukripa();
        assert.equal(gk.verified, true);
        assert.equal(gk.pricePerBrick, 7.05);
        assert.equal(gk.priceConfidence, 'catalogue');
        assert.equal(gk.phone, '919198923230');
        assert.equal(gk.deliveryAvailable, true);
        assert.ok(gk.brickTypes.includes('first-class'));
    });

    test('OSM normalizer never invents phone, price, or rating', () => {
        const s = GurukripaNearby._internal.normalizeOsmElement({
            type: 'node',
            id: 99,
            lat: 25.61,
            lon: 82.80,
            tags: { name: 'Local Brick Bhatta', man_made: 'kiln' }
        });
        assert.ok(s);
        assert.equal(s.phone, null);
        assert.equal(s.pricePerBrick, null);
        assert.equal(s.rating, null);
        assert.equal(s.deliveryAvailable, null);
        assert.ok(s.categories.includes('brick-bhatta'));
    });

    test('OSM phone is kept only when tagged', () => {
        const s = GurukripaNearby._internal.normalizeOsmElement({
            type: 'node',
            id: 100,
            lat: 25.62,
            lon: 82.81,
            tags: {
                name: 'Fly Ash Brick Plant',
                phone: '+91 98765 43210',
                shop: 'building_materials'
            }
        });
        assert.ok(s.phone);
        assert.match(s.phone, /91/);
        assert.ok(s.brickTypes.includes('fly-ash'));
    });

    test('filters: nearest, radius, brick type, manufacturer', () => {
        const base = [
            { id: 'a', name: 'Near Bhatta', distanceKm: 2, brickTypes: ['first-class'], categories: ['brick-bhatta'], manufacturer: true, wholesale: true, deliveryAvailable: true, pricePerBrick: 8, rating: null },
            { id: 'b', name: 'Far Dealer', distanceKm: 40, brickTypes: ['aac'], categories: ['dealer'], manufacturer: false, wholesale: false, deliveryAvailable: null, pricePerBrick: null, rating: 4.8 },
            { id: 'c', name: 'Mid Wholesale', distanceKm: 8, brickTypes: ['wire-cut'], categories: ['wholesale'], manufacturer: false, wholesale: true, deliveryAvailable: true, pricePerBrick: 6, rating: 4.2 }
        ];
        const near = GurukripaNearby.filterAndSort(base, { sort: 'nearest', maxKm: 10 });
        assert.deepEqual(near.map((s) => s.id), ['a', 'c']);

        const price = GurukripaNearby.filterAndSort(base, { sort: 'price' });
        assert.equal(price[0].id, 'c');

        const rated = GurukripaNearby.filterAndSort(base, { sort: 'rating' });
        assert.equal(rated[0].id, 'b');

        const mfg = GurukripaNearby.filterAndSort(base, { manufacturerOnly: true });
        assert.equal(mfg.length, 1);
        assert.equal(mfg[0].id, 'a');

        const aac = GurukripaNearby.filterAndSort(base, { brickType: 'aac' });
        assert.equal(aac[0].id, 'b');

        const q = GurukripaNearby.filterAndSort(base, { query: '222001' });
        assert.equal(q.length, 0);
        const q2 = GurukripaNearby.filterAndSort(base, { query: 'wholesale' });
        assert.ok(q2.some((s) => s.id === 'c'));
    });

    test('recommendations keep nearest, rated, economical, and delivery distinct', () => {
        const list = [
            { id: 'bhatta', name: 'ABC Bhatta', distanceKm: 1.2, categories: ['brick-bhatta'], manufacturer: true, rating: null, pricePerBrick: null, deliveryAvailable: null },
            { id: 'mfg', name: 'XYZ Udyog', distanceKm: 3, categories: ['manufacturer'], manufacturer: true, rating: null, pricePerBrick: null, deliveryAvailable: null },
            { id: 'rated', name: 'Rated Yard', distanceKm: 5, categories: ['dealer'], manufacturer: false, rating: 4.9, pricePerBrick: 9, priceConfidence: 'catalogue', deliveryAvailable: null },
            { id: 'cheap', name: 'Cheap Yard', distanceKm: 6, categories: ['dealer'], manufacturer: false, rating: 4.0, pricePerBrick: 5.5, priceConfidence: 'catalogue', deliveryAvailable: null },
            { id: 'del', name: 'Delivery Yard', distanceKm: 7, categories: ['dealer'], manufacturer: false, rating: null, pricePerBrick: null, deliveryAvailable: true }
        ];
        const recs = GurukripaNearby.buildRecommendations(list);
        const keys = recs.map((r) => r.key);
        assert.ok(keys.includes('nearest-bhatta'));
        assert.ok(keys.includes('nearest-manufacturer'));
        assert.ok(keys.includes('best-rated'));
        assert.ok(keys.includes('most-economical'));
        assert.ok(keys.includes('delivery'));
        assert.equal(recs.find((r) => r.key === 'nearest-bhatta').supplier.id, 'bhatta');
        assert.equal(recs.find((r) => r.key === 'best-rated').supplier.id, 'rated');
        assert.equal(recs.find((r) => r.key === 'most-economical').supplier.id, 'cheap');
        assert.equal(recs.find((r) => r.key === 'delivery').supplier.id, 'del');
        const ids = recs.map((r) => r.supplier.id);
        assert.equal(new Set(ids).size, ids.length);
    });

    test('cost estimate marks estimated vs confirmed and applies GST', () => {
        const est = GurukripaNearby.estimateTotalCost({
            quantity: 4000,
            pricePerBrick: 7.05,
            priceConfidence: 'catalogue',
            transportCharges: 500,
            transportConfidence: 'confirmed',
            taxPct: 5
        });
        assert.equal(est.ok, true);
        assert.equal(est.estimated, false);
        assert.equal(est.bricksCost, 28200);
        assert.equal(est.tax, Math.round((28200 + 500) * 0.05));
        assert.equal(est.total, 28200 + 500 + est.tax);

        const missing = GurukripaNearby.estimateTotalCost({ quantity: 4000 });
        assert.equal(missing.ok, false);

        const soft = GurukripaNearby.estimateTotalCost({
            quantity: 4000,
            pricePerBrick: 7.05,
            priceConfidence: null,
            distanceKm: 20
        });
        assert.equal(soft.ok, true);
        assert.equal(soft.estimated, true);
        assert.ok(soft.transportCharges > 0);
    });

    test('maps service exposes nearby map initializer', () => {
        assert.equal(typeof GurukripaMaps.initNearbyMap, 'function');
        assert.equal(typeof GurukripaMaps.loadLeaflet, 'function');
        assert.equal(typeof GurukripaMaps.loadGoogleMapsSdk, 'function');
    });
});
