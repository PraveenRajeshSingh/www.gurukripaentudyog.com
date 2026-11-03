'use strict';
// ══════════════════════════════════════════════════════════════════
// SAVED CONSTRUCTION SITES + BUYER PROFILE
// Gurukripa Bricks Industry — contractor address book & account type
// ══════════════════════════════════════════════════════════════════
// A contractor running three sites in Jaunpur does not want to retype a
// delivery address on every order, and each site has its own pincode, road
// access and unloading reality. This module keeps that address book on the
// device:
//
//   • localStorage is the source of truth so every onclick handler can read
//     synchronously (the rest of the app works the same way).
//   • IndexedDB (OfflineStore.meta) gets a best-effort mirror, which keeps the
//     book available to the offline outbox and survives a tab restart where
//     localStorage is cleared by the browser.
//
// BuyerProfile records whether the account is a retail buyer or a GST
// business. The GSTIN check is a FORMAT check only — it proves the number is
// shaped like a valid Indian GSTIN, not that the registration is active on
// the government portal. The badge copy says exactly that.
// ══════════════════════════════════════════════════════════════════

const SITES_KEY = 'gb_saved_sites';
const MAX_SITES = 12;

// ── Saved construction sites ─────────────────────────────────────
const SavedSites = (function () {

    function blank() {
        return {
            id: '',
            nickname: '',
            address: '',
            city: 'Jaunpur',
            pincode: '',
            roadAccess: 'wide',
            notes: '',
            isDefault: false,
            updatedAt: 0
        };
    }

    function list() {
        const rows = getSafeStorage(SITES_KEY, []);
        return Array.isArray(rows) ? rows.filter((r) => r && r.id) : [];
    }

    function persist(rows) {
        setSafeStorage(SITES_KEY, rows);
        mirror(rows);
        renderAll();
        return rows;
    }

    // Best-effort IndexedDB mirror — never blocks or throws into the UI.
    function mirror(rows) {
        try {
            if (window.OfflineStore) OfflineStore.setMeta('savedSites', rows);
        } catch (_e) { /* storage unavailable */ }
    }

    function get(id) {
        return list().find((s) => String(s.id) === String(id)) || null;
    }

    function defaultSite() {
        const rows = list();
        return rows.find((s) => s.isDefault) || rows[0] || null;
    }

    function makeId() {
        return 'site_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    }

    function validPincode(pin) {
        return /^[1-9][0-9]{5}$/.test(String(pin || '').trim());
    }

    // spec: { id?, nickname, address, city, pincode, roadAccess, notes }
    function add(spec) {
        const rows = list();
        const site = Object.assign(blank(), spec || {});
        site.nickname = String(site.nickname || '').trim().slice(0, 40);
        site.address = String(site.address || '').trim().slice(0, 160);
        site.city = String(site.city || '').trim().slice(0, 60);
        site.pincode = String(site.pincode || '').trim();
        site.notes = String(site.notes || '').trim().slice(0, 120);
        site.updatedAt = Date.now();

        if (site.nickname.length < 2) return { error: 'Give the site a name, e.g. "Jalalpur Site #2".' };
        if (!validPincode(site.pincode)) return { error: 'Delivery pincode must be 6 digits.' };
        if (rows.length >= MAX_SITES) return { error: 'Address book is full (' + MAX_SITES + ' sites). Delete one first.' };

        // First site saved is automatically the default.
        if (!rows.length) site.isDefault = true;
        if (site.isDefault) rows.forEach((r) => { r.isDefault = false; });

        site.id = makeId();
        rows.unshift(site);
        persist(rows);
        return { site: site };
    }

    function update(id, patch) {
        const rows = list();
        const at = rows.findIndex((s) => String(s.id) === String(id));
        if (at < 0) return { error: 'Site not found.' };
        const next = Object.assign({}, rows[at], patch || {}, { updatedAt: Date.now() });
        next.pincode = String(next.pincode || '').trim();
        if (next.nickname && next.nickname.trim().length < 2) return { error: 'Site name is too short.' };
        if (!validPincode(next.pincode)) return { error: 'Delivery pincode must be 6 digits.' };
        if (patch && patch.isDefault) rows.forEach((r) => { r.isDefault = false; });
        rows[at] = next;
        persist(rows);
        return { site: next };
    }

    function remove(id) {
        const rows = list();
        const victim = rows.find((s) => String(s.id) === String(id));
        const next = rows.filter((s) => String(s.id) !== String(id));
        // Never leave the book without a default.
        if (victim && victim.isDefault && next.length) next[0].isDefault = true;
        persist(next);
        return true;
    }

    function setDefault(id) {
        const rows = list().map((s) => Object.assign({}, s, {
            isDefault: String(s.id) === String(id),
            updatedAt: Date.now()
        }));
        persist(rows);
        return rows.find((s) => s.isDefault) || null;
    }

    // One-line locality used by the profile quick-access tile.
    function localityHint() {
        const rows = list();
        if (!rows.length) return 'None yet';
        const def = defaultSite();
        const town = (def && (def.city || def.pincode)) || 'site';
        return rows.length === 1
            ? String(town)
            : rows.length + ' sites · ' + String(town);
    }

    // ── Rendering ────────────────────────────────────────────────
    function roadLabel(v) {
        return v === 'narrow' ? 'Narrow lane · mini trolley' : 'Wide road · truck / trolley';
    }

    function cardHtml(s, opts) {
        const o = opts || {};
        const id = sanitizeHTML(s.id);
        const actions = [];
        if (o.picker) {
            actions.push(`<button type="button" class="site-card__btn site-card__btn--use" onclick="useSavedSite('${id}')">Deliver here</button>`);
        } else {
            if (!s.isDefault) {
                actions.push(`<button type="button" class="site-card__btn" onclick="makeSavedSiteDefault('${id}')">Set as default</button>`);
            }
            actions.push(`<button type="button" class="site-card__btn" onclick="editSavedSite('${id}')">Edit</button>`);
            actions.push(`<button type="button" class="site-card__btn site-card__btn--del" onclick="deleteSavedSite('${id}')">Delete</button>`);
        }
        return `
            <div class="site-card${s.isDefault ? ' site-card--default' : ''}" data-site-id="${id}">
                <div class="site-card__head">
                    <span class="site-card__name">${sanitizeHTML(s.nickname)}</span>
                    ${s.isDefault ? '<span class="site-card__flag">Default</span>' : ''}
                </div>
                <p class="site-card__addr">${sanitizeHTML(s.address || 'No street address saved.')}</p>
                <p class="site-card__meta">${sanitizeHTML(s.city || '')}${s.pincode ? ' · ' + sanitizeHTML(s.pincode) : ''}</p>
                <p class="site-card__road">${roadLabel(s.roadAccess)}${s.notes ? ' · ' + sanitizeHTML(s.notes) : ''}</p>
                <div class="site-card__actions">${actions.join('')}</div>
            </div>`;
    }

    function renderInto(containerId, opts) {
        const box = document.getElementById(containerId);
        if (!box) return;
        const rows = list();
        if (!rows.length) {
            box.innerHTML = `<div class="site-empty">${(opts && opts.emptyText) || 'No saved sites yet. Save a site once and every future order can reuse its pincode and road access.'}</div>`;
            return;
        }
        box.innerHTML = `<div class="site-grid">${rows.map((s) => cardHtml(s, opts)).join('')}</div>`;
    }

    // Refreshes every surface that shows sites, wherever it lives.
    function renderAll() {
        renderInto('savedSitesContainer');
        renderInto('pTabSitesList');
        renderInto('coSiteChips', { picker: true, emptyText: '' });

        // The checkout block only makes sense once there is something to pick.
        const block = document.getElementById('coSavedSites');
        if (block) block.classList.toggle('hidden', !list().length);
    }

    return {
        list, get, add, update, remove, setDefault, defaultSite,
        localityHint, validPincode, renderInto, renderAll, MAX_SITES
    };
})();

window.SavedSites = SavedSites;

// ── Inline "save this site" form (estimator + checkout + profile) ──
function toggleSaveSitePanel() {
    const panel = document.getElementById('saveSitePanel');
    if (!panel) return;
    const showing = !panel.classList.contains('hidden');
    panel.classList.toggle('hidden', showing);
    if (!showing) {
        const input = document.getElementById('siteNameInput');
        if (input) input.focus();
    }
}

// Same affordance inside the checkout sheet, which has its own panel so the
// estimator's block is never toggled from the wrong context.
function toggleCheckoutSaveSite() {
    const panel = document.getElementById('saveSitePanelCheckout');
    if (!panel) return;
    const showing = !panel.classList.contains('hidden');
    panel.classList.toggle('hidden', showing);
    if (!showing) {
        const input = document.getElementById('siteNameInputCheckout');
        if (input) { input.value = ''; input.focus(); }
    }
}

// Captures the current delivery fields (checkout) or the last estimator
// result (calculator) as a named site.
function saveConstructionSite() {
    if (!user) { openAuth('login'); return; }
    const estEl = document.getElementById('siteNameInput');
    const coEl = document.getElementById('siteNameInputCheckout');
    const nickname = (coEl && coEl.value.trim()) || (estEl ? estEl.value.trim() : '');

    const spec = {
        nickname: nickname,
        address: (document.getElementById('coAddress') || {}).value || (user.address || ''),
        city: (document.getElementById('coCity') || {}).value || 'Jaunpur',
        pincode: (document.getElementById('coPincode') || {}).value || '',
        roadAccess: (document.getElementById('coRoadAccess') || {}).value || 'wide',
        notes: ''
    };

    // Save straight from the estimator: keep the brick count as a working note.
    const est = window.lastCalcEstimate;
    if (!spec.address && est && est.project) spec.address = est.project;
    if (est && est.bricks) spec.notes = est.bricks + ' pcs · ' + (est.trolleys || 0) + ' trolley load';

    const res = SavedSites.add(spec);
    if (res.error) { showToast(res.error, 'error'); return; }

    if (estEl) estEl.value = '';
    if (coEl) coEl.value = '';
    ['saveSitePanel', 'saveSitePanelCheckout'].forEach((id) => {
        const panel = document.getElementById(id);
        if (panel) panel.classList.add('hidden');
    });
    showToast('"' + res.site.nickname + '" saved to your sites on this device.', 'success');
    if (typeof renderAccountHub === 'function' && document.getElementById('profileModal')?.classList.contains('open')) renderAccountHub();
}

// Profile-side shortcut: name a site without going through checkout first.
async function addSiteFromProfile() {
    if (!user) { openAuth('login'); return; }
    if (!window.GBDialogs) return;
    const nickname = await GBDialogs.prompt({ title: 'Add saved site', label: 'Site name', placeholder: 'e.g. Jalalpur Site #2', required: true, confirmLabel: 'Next' });
    if (nickname === null) return;
    const address = await GBDialogs.prompt({ title: 'Add saved site', label: 'Street / village / landmark', value: user.address || '', confirmLabel: 'Next' });
    if (address === null) return;
    const pincode = await GBDialogs.prompt({ title: 'Add saved site', label: 'Delivery pincode (6 digits)', confirmLabel: 'Next' });
    if (pincode === null) return;
    const road = await GBDialogs.prompt({
        title: 'Add saved site',
        label: 'Road access at the plot',
        value: 'wide',
        message: 'Type "narrow" for a village lane; anything else means a truck can reach it.'
    });
    if (road === null) return;

    const res = SavedSites.add({
        nickname: nickname,
        address: address,
        city: 'Jaunpur',
        pincode: pincode.trim(),
        roadAccess: /narrow/i.test(road) ? 'narrow' : 'wide'
    });
    if (res.error) { showToast(res.error, 'error'); return; }
    showToast('"' + res.site.nickname + '" added to your sites.', 'success');
    if (typeof renderAccountHub === 'function') renderAccountHub();
}

function renderSavedSites() { SavedSites.renderAll(); }

async function editSavedSite(id) {
    const s = SavedSites.get(id);
    if (!s || !window.GBDialogs) return;
    const nickname = await GBDialogs.prompt({ title: 'Edit saved site', label: 'Site name', value: s.nickname, required: true, confirmLabel: 'Next' });
    if (nickname === null) return;
    const address = await GBDialogs.prompt({ title: 'Edit saved site', label: 'Street / landmark', value: s.address || '', confirmLabel: 'Next' });
    if (address === null) return;
    const pincode = await GBDialogs.prompt({ title: 'Edit saved site', label: 'Delivery pincode', value: s.pincode || '' });
    if (pincode === null) return;
    const res = SavedSites.update(id, { nickname: nickname.trim(), address: address.trim(), pincode: pincode.trim() });
    if (res.error) { showToast(res.error, 'error'); return; }
    showToast('Site updated.', 'success');
}

function deleteSavedSite(id) {
    const s = SavedSites.get(id);
    if (!s || !window.GBDialogs) return;
    GBDialogs.confirm({
        title: 'Remove saved site?',
        message: 'Remove "' + s.nickname + '" from your saved sites on this device?',
        confirmLabel: 'Remove',
        danger: true
    }).then(function (go) {
        if (!go) return;
        SavedSites.remove(id);
        showToast('Site removed from this device.', 'success');
    });
}

function makeSavedSiteDefault(id) {
    SavedSites.setDefault(id);
    showToast('Default delivery site updated.', 'success');
}

// Fills the checkout delivery block from a saved site.
function useSavedSite(id) {
    const s = SavedSites.get(id);
    if (!s) return;
    const set = (elId, val) => { const el = document.getElementById(elId); if (el && val) el.value = val; };
    set('coAddress', s.address);
    set('coCity', s.city);
    set('coPincode', s.pincode);
    const road = document.getElementById('coRoadAccess');
    if (road && s.roadAccess) road.value = s.roadAccess;
    if (typeof handleCheckoutAddressCheck === 'function') handleCheckoutAddressCheck();
    if (typeof buildCheckoutSummary === 'function') buildCheckoutSummary();
    document.querySelectorAll('#coSiteChips .site-card').forEach((c) => c.classList.remove('site-card--picked'));
    const chip = document.querySelector('#coSiteChips [data-site-id="' + s.id + '"]');
    if (chip) chip.classList.add('site-card--picked');
    showToast('Delivering to ' + s.nickname + ' (' + s.pincode + ').', 'success');
}

// ── Buyer profile: account type + GST business info ──────────────
const BuyerProfile = (function () {
    // Indian GSTIN: 2 digit state code, 5 letters, 4 digits, 1 check letter,
    // entity number, 'Z', 1 checksum character. 15 characters total.
    const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

    function validGstin(raw) {
        const v = String(raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
        return { value: v, ok: GSTIN_RE.test(v) };
    }

    function mask(gstin) {
        const v = String(gstin || '').toUpperCase();
        if (v.length < 6) return '';
        return v.slice(0, 7) + '…' + v.slice(-1);
    }

    function type() {
        return (user && user.buyerType === 'contractor') ? 'contractor' : 'retail';
    }

    function isGstSaved() {
        return !!(user && user.gstin && validGstin(user.gstin).ok);
    }

    // Honest copy: the tick means the GSTIN is shaped correctly and the
    // business name is on file — not a government verification.
    function badge() {
        if (type() === 'contractor' && isGstSaved()) {
            return { label: 'GST Business · Number Valid', tone: 'verified', title: 'GSTIN format validated on this device. The yard confirms registration before issuing a tax invoice.' };
        }
        if (type() === 'contractor') {
            return { label: 'Contractor · Add GSTIN', tone: 'pending', title: 'Add your GSTIN to receive GST invoices with your business name.' };
        }
        return { label: 'Retail Buyer', tone: 'neutral', title: 'Home and individual orders. Switch to GST business for tax invoices.' };
    }

    function piecesOrdered() {
        const rows = (typeof orders !== 'undefined' && Array.isArray(orders)) ? orders : [];
        return rows.reduce((sum, o) => sum + (Number(o.pieces) || 0), 0);
    }

    function saveFromForm() {
        if (!user) return { error: 'Sign in first.' };
        const typeEl = document.querySelector('input[name="buyerType"]:checked');
        const gstinEl = document.getElementById('editGstin');
        const bizEl = document.getElementById('editBusinessName');
        const panEl = document.getElementById('editPan');

        const nextType = typeEl ? typeEl.value : type();
        const gstin = gstinEl ? gstinEl.value.trim().toUpperCase().replace(/[^0-9A-Z]/g, '') : '';
        const business = bizEl ? bizEl.value.trim() : '';

        if (gstin && !GSTIN_RE.test(gstin)) return { error: 'That GSTIN does not look right — 15 characters, e.g. 09AAACG1234A1Z5.' };
        if (nextType === 'contractor' && !gstin && !business) return { error: 'For a GST business, enter the business name or the GSTIN.' };

        user.buyerType = nextType;
        user.gstin = gstin;
        user.businessName = business;
        user.pan = panEl ? panEl.value.trim().toUpperCase() : '';
        delete user.password;
        setSafeStorage('gb_user', user);
        if (typeof updateAuthUI === 'function') updateAuthUI();
        return { ok: true };
    }

    return { validGstin, mask, type, isGstSaved, badge, piecesOrdered, saveFromForm };
})();

window.BuyerProfile = BuyerProfile;
