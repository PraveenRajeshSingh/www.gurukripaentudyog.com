/**
 * Catalog discovery — Phase 1 product search / filter / compare helpers.
 * Loads catalog-discovery.js in a minimal DOM-less harness via vm + stubs.
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function loadCatalog() {
    const code = fs.readFileSync(path.join(root, 'src/js/catalog-discovery.js'), 'utf8');
    const storage = {};
    const sandbox = {
        console,
        PRODUCTS: [
            { id: 1, name: 'Shiv Eent Grade-A', category: 'shiv-eent', price: 12, rating: 5, reviews: 89, stock: 'in-stock', stockText: 'In Stock', desc: 'double-fired', features: ['Uniform 230×110×70mm', 'ISI'], badge: 'Best Seller', img: 'a.png' },
            { id: 7, name: 'Awwal Bricks', category: 'awwal', price: 7.05, rating: 4.9, reviews: 78, stock: 'in-stock', desc: 'heavy duty', features: ['Strong'], badge: 'Heavy Duty', img: 'b.png' },
            { id: 4, name: 'Machine Made Wirecut', category: 'machine-made', price: 11, rating: 4.9, reviews: 43, stock: 'low-stock', desc: 'precision wirecut', features: ['Machine precision', 'Zero size variation'], badge: 'New', img: 'c.png' },
            { id: 6, name: 'Standard Hollow Bricks', category: 'standard', price: 9, rating: 4.4, reviews: 38, stock: 'in-stock', desc: 'hollow partition', features: ['Lightweight', 'hollow'], badge: null, img: 'd.png' }
        ],
        CAT_LABELS: { 'shiv-eent': 'Shiv Eent', awwal: 'Awwal', 'machine-made': 'Machine Made', standard: 'Standard' },
        getSafeStorage(key, fallback) {
            return Object.prototype.hasOwnProperty.call(storage, key) ? JSON.parse(JSON.stringify(storage[key])) : fallback;
        },
        setSafeStorage(key, val) { storage[key] = JSON.parse(JSON.stringify(val)); },
        sanitizeHTML(s) { return String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); },
        document: {
            getElementById() { return null; },
            querySelectorAll() { return []; },
            addEventListener() {}
        },
        window: {},
        showToast() {},
        overlayLock() {},
        overlayUnlock() {}
    };
    sandbox.window = sandbox;
    vm.runInNewContext(code + '\nthis.CatalogDiscovery = CatalogDiscovery;', sandbox, { filename: 'catalog-discovery.js' });
    return sandbox.CatalogDiscovery;
}

describe('Catalog discovery', () => {
    it('filters by category, max price, stock and size', () => {
        const CD = loadCatalog();
        CD.setState({ category: 'awwal', maxPrice: 15, stock: 'all', size: 'all', query: '', sort: 'default' });
        assert.equal(CD.filterList().length, 1);
        assert.equal(CD.filterList()[0].id, 7);

        CD.setState({ category: 'all', maxPrice: 10, stock: 'all', size: 'all' });
        const under10 = CD.filterList().map((p) => p.id).sort();
        assert.deepEqual(under10, [6, 7]);

        CD.setState({ category: 'all', maxPrice: 15, stock: 'low-stock', size: 'all' });
        assert.equal(CD.filterList().length, 1);
        assert.equal(CD.filterList()[0].id, 4);

        CD.setState({ category: 'all', maxPrice: 15, stock: 'all', size: 'hollow' });
        assert.equal(CD.filterList().length, 1);
        assert.equal(CD.filterList()[0].id, 6);
    });

    it('search matches name and sorts by relevance', () => {
        const CD = loadCatalog();
        CD.setState({ category: 'all', maxPrice: 15, stock: 'all', size: 'all', query: 'wirecut', sort: 'relevance' });
        const list = CD.filterList();
        assert.ok(list.length >= 1);
        assert.equal(list[0].id, 4);
    });

    it('suggests products and remembers search history', () => {
        const CD = loadCatalog();
        const suggestions = CD.suggest('awwal');
        assert.ok(suggestions.some((s) => s.type === 'product' && /awwal/i.test(s.label)));
        CD.runSearch('awwal', { silentScroll: true });
        assert.ok(CD.getHistory().includes('awwal'));
    });

    it('tracks recently viewed and related products', () => {
        const CD = loadCatalog();
        CD.recordView(1);
        CD.recordView(7);
        assert.deepEqual(CD.getRecentIds().slice(0, 2), [7, 1]);
        const related = CD.relatedFor(1, 2);
        assert.equal(related.length, 2);
        assert.ok(related.every((p) => p.id !== 1));
    });

    it('compare list caps at three products', () => {
        const CD = loadCatalog();
        CD.clearCompare();
        CD.toggleCompare(1);
        CD.toggleCompare(7);
        CD.toggleCompare(4);
        CD.toggleCompare(6); // ignored at cap of 3
        assert.equal(CD.isCompared(6), false);
        assert.equal(CD.isCompared(1), true);
        assert.equal(CD.isCompared(7), true);
        assert.equal(CD.isCompared(4), true);
        CD.toggleCompare(1);
        assert.equal(CD.isCompared(1), false);
    });

    it('module is included in the storefront script cascade', () => {
        const mods = fs.readFileSync(path.join(root, 'src/pages/partials/javascript-modules.html'), 'utf8');
        assert.match(mods, /catalog-discovery\.js/);
        const src = fs.readFileSync(path.join(root, 'src/pages/index.src.html'), 'utf8');
        assert.match(src, /compare-modal\.html/);
    });
});
