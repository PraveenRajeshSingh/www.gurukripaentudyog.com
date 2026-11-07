const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/* ── Tiny DOM stub ──────────────────────────────────────────────────
   dialogs.js only touches a narrow slice of the DOM: one overlay it
   creates via innerHTML and then grabs children by #id/.class, plus a
   few document-level capture listeners. Selectors are memoized so the
   same stub instance is shared between build() and the API methods. */
function makeDom() {
    const cache = new Map();
    const byId = new Map();

    class El {
        constructor(name) {
            this.name = name;
            this.id = name.startsWith('#') ? name.slice(1) : '';
            this.dataset = {};
            this.attrs = {};
            this._cls = new Set();
            this.listeners = {};
            this.textContent = '';
            this.innerHTML = '';
            this.hidden = false;
            this.disabled = false;
            this.value = '';
            this.className = '';
            this.classList = {
                add: (c) => this._cls.add(c),
                remove: (c) => this._cls.delete(c),
                contains: (c) => this._cls.has(c)
            };
        }
        setAttribute(k, v) { this.attrs[k] = String(v); }
        getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
        hasAttribute(k) { return k in this.attrs; }
        addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
        fire(t, ev) {
            const e = ev || { target: this, preventDefault() {}, stopPropagation() {} };
            (this.listeners[t] || []).forEach((f) => f(e));
        }
        querySelector(sel) { return getEl(sel); }
        focus() { this.focused = true; }
        closest() { return null; }
        matches() { return false; }
    }

    function getEl(sel) {
        if (!cache.has(sel)) {
            const el = new El(sel);
            cache.set(sel, el);
            if (sel.startsWith('#')) byId.set(sel.slice(1), el);
        }
        return cache.get(sel);
    }

    const doc = {
        created: [],
        appended: [],
        listeners: {},
        createElement(tag) { const el = new El('<' + tag + '>'); doc.created.push(el); return el; },
        body: { appendChild(el) { doc.appended.push(el); if (el.id) byId.set(el.id, el); } },
        getElementById(id) { return byId.get(id) || getEl('#' + id); },
        addEventListener(t, f) { (doc.listeners[t] = doc.listeners[t] || []).push(f); }
    };
    return { doc, getEl, byId };
}

function loadDialogs() {
    const { doc, getEl } = makeDom();
    const stack = [];
    let locks = 0, unlocks = 0;
    const win = {};
    const sandboxDoc = doc;
    new Function('window', 'document', 'OVERLAY_STACK', 'overlayLock', 'overlayUnlock',
        read('src/js/dialogs.js'))(win, sandboxDoc, stack,
        () => { locks++; }, () => { unlocks++; });
    return { GB: win.GBDialogs, doc, getEl, stack, overlay: () => doc.appended[0], locks: () => locks, unlocks: () => unlocks };
}

describe('GBDialogs API surface', () => {
    test('publishes confirm/alert/prompt/isDirty/requestDismiss without building UI', () => {
        const { GB, doc } = loadDialogs();
        assert.equal(typeof GB.confirm, 'function');
        assert.equal(typeof GB.alert, 'function');
        assert.equal(typeof GB.prompt, 'function');
        assert.equal(typeof GB.isDirty, 'function');
        assert.equal(typeof GB.requestDismiss, 'function');
        assert.equal(doc.appended.length, 0); // lazy: nothing rendered until first show()
    });

    test('confirm opens the shared overlay, resolves true on confirm, unlocks', async () => {
        const { GB, getEl, stack, overlay, locks, unlocks } = loadDialogs();
        const p = GB.confirm({ title: 'Remove item?', message: 'This cannot be undone.' });
        const el = overlay();
        assert.ok(el._cls.has('open'), 'overlay marked open');
        assert.equal(stack.length, 1, 'registered with OVERLAY_STACK (ESC/backdrop reuse)');
        assert.equal(locks(), 1, 'scroll lock ref-counted through ui.js manager');
        assert.equal(getEl('#gbDlgTitle').textContent, 'Remove item?');
        assert.equal(getEl('#gbDlgCancel').hidden, false);
        getEl('#gbDlgOk').fire('click');
        assert.equal(await p, true);
        assert.ok(!el._cls.has('open'), 'closed after settle');
        assert.equal(unlocks(), 1, 'scroll lock released');
    });

    test('danger confirm styles the action as destructive, alert hides Cancel', () => {
        const { GB, getEl, overlay } = loadDialogs();
        GB.confirm({ title: 'Delete', danger: true });
        assert.equal(getEl('#gbDlgOk').className.includes('gb-btn-danger'), true);
        overlay().fire('click'); // safe backdrop: this dialog holds no user data
        GB.alert({ title: 'Done', message: 'Saved', kind: 'success' });
        assert.equal(getEl('#gbDlgCancel').hidden, true, 'alert has a single action');
        getEl('#gbDlgOk').fire('click');
    });

    test('alert dismisses by backdrop as acceptance', async () => {
        const { GB, getEl, stack } = loadDialogs();
        const p = GB.alert({ title: 'Note', message: 'Rates update daily' });
        assert.equal(stack[0][0], 'gbDialogModal');
        stack[0][1](); // ESC path: ui.js calls the registered closer
        assert.equal(await p, true, 'alert resolves truthy when dismissed');
    });

    test('prompt: required blocks empty submit, then resolves the typed value', async () => {
        const { GB, getEl, overlay } = loadDialogs();
        const p = GB.prompt({ title: 'Edit site', label: 'Site name', required: true });
        const input = getEl('#gbDlgInput');
        input.value = '   ';
        getEl('#gbDlgOk').fire('click');
        assert.equal(getEl('#gbDlgErr').hidden, false, 'required error shown');
        assert.equal(overlay()._cls.has('open'), true, 'dialog stays open');
        input.value = ' Shivam Nagar ';
        getEl('#gbDlgOk').fire('click');
        assert.equal(await p, 'Shivam Nagar', 'value trimmed by settle path');
    });

    test('async onConfirm: busy until success, inline error (no settle) on failure', async () => {
        const { GB, getEl, overlay, locks, unlocks } = loadDialogs();
        let boom = true;
        const p = GB.confirm({
            title: 'Remove',
            onConfirm: () => boom
                ? Promise.reject(new Error('Server unreachable — nothing was removed.'))
                : Promise.resolve()
        });
        getEl('#gbDlgOk').fire('click');
        await new Promise((r) => setImmediate(r));
        assert.equal(overlay()._cls.has('open'), true, 'failure keeps the dialog open');
        assert.match(getEl('#gbDlgErr').textContent, /Server unreachable/);
        boom = false;
        getEl('#gbDlgOk').fire('click');
        assert.equal(await p, true);
        assert.equal(locks(), unlocks(), 'every lock paired with an unlock');
    });

    test('isDirty only reports live, non-hidden changed fields', () => {
        const { GB } = loadDialogs();
        const ov = (fields) => ({ querySelectorAll: () => fields });
        assert.equal(GB.isDirty(ov([])), false);
        assert.equal(GB.isDirty(ov([{ dataset: { gbDirty: '1' }, disabled: false, type: 'text' }])), true);
        assert.equal(GB.isDirty(ov([{ dataset: { gbDirty: '1' }, disabled: true, type: 'text' }])), false);
        assert.equal(GB.isDirty(ov([{ dataset: { gbDirty: '' }, disabled: false, type: 'text' }])), false);
        assert.equal(GB.isDirty(null), false);
    });
});

describe('Dialog system integration (static checks)', () => {
    test('dialogs.js loads exactly once, after ui.js, before feature modules', () => {
        const html = read('src/pages/partials/javascript-modules.html');
        const order = (s) => html.indexOf(s);
        assert.ok(order('src/js/ui.js') >= 0 && order('src/js/dialogs.js') > order('src/js/ui.js'));
        assert.equal(html.split('dialogs.js').length - 1, 1, 'no duplicate script tag');
    });

    test('ESC and backdrop dismissal route through the unsaved-changes guard', () => {
        const ui = read('src/js/ui.js');
        assert.match(ui, /GBDialogs\.isDirty/);
        assert.match(ui, /GBDialogs\.requestDismiss/);
        assert.match(ui, /\[data-autofocus\]/, 'focus lands in the dialog on open');
        const dialogs = read('src/js/dialogs.js');
        assert.match(dialogs, /addEventListener\('click'[\s\S]*,\s*true\)/, 'capture-phase backdrop guard');
    });

    test('every modal overlay declares dialog semantics', () => {
        const files = fs.readdirSync(path.join(ROOT, 'src/pages/partials'))
            .filter((f) => /modal|drawer|notification-center/.test(f))
            .map((f) => read(path.join('src/pages/partials', f)));
        for (const src of files) {
            if (!src.includes('class="modal-overlay')) continue;
            assert.match(src, /aria-modal="true"/, 'overlay must be announced as a dialog');
        }
    });

    test('responsive dialog CSS: safe areas, short screens, bottom sheet, spinner', () => {
        const css = read('src/styles/refinements.css');
        const popups = read('src/styles/popups.css');
        const polish = read('src/styles/popup-polish.css');
        assert.match(css, /env\(safe-area-inset-left\)/);
        assert.match(css, /env\(safe-area-inset-bottom\)/);
        assert.match(css, /@media \(max-height: 560px\)/, 'landscape/zoom short-viewport rules');
        assert.match(css, /\.gb-btn-danger/);
        assert.match(css, /@keyframes gbSpin/);
        assert.match(popups, /\.modal-box--lg/);
        assert.match(popups, /\.gb-dialog-row/);
        assert.match(popups, /\.pin-vehicle/);
        assert.match(polish, /popup-radius-sheet/);
        assert.match(polish, /align-items:\s*flex-end/);
        assert.match(polish, /font-size:\s*16px/);
        const head = read('src/pages/partials/head.html');
        assert.match(head, /popup-polish\.css/);
    });

    test('native popups removed from the storefront (no window.confirm/prompt left)', () => {
        const src = read('src/js/saved-sites.js');
        assert.doesNotMatch(src, /window\.(confirm|prompt|alert)\(/);
        assert.match(src, /GBDialogs\.confirm/);
    });
});
