// ══════════════════════════════════════════
// ACCOUNT HUB — profile modal: header card, quick access grid,
// order history, saved construction sites, wishlist & GST business info
// Split from the original monolithic auth.js (SRP).
// Depends on: openAuth (auth-modal.js), updateAuthUI (auth-modal.js),
//             renderOrderHistory (invoice.js),
//             closeUserDropdown (ui.js), getAvatarBg, sanitizeHTML, setSafeStorage (state.js),
//             showToast, t() (ui.js),
//             SavedSites, BuyerProfile (saved-sites.js),
//             applyTranslations (ui.js).
// ══════════════════════════════════════════

// Tab order of the hub. 'address' survives only as an alias of 'sites' —
// the navbar account menu still calls openProfileTab('address').
const PROFILE_TABS = ['info', 'orders', 'enquiries', 'sites', 'wishlist', 'gst'];

function openProfile() {
    if (!user) { openAuth('login'); return; }
    closeUserDropdown();

    const name = sanitizeHTML(user.name || 'User');
    const email = sanitizeHTML(user.email || '—');
    const hName = document.getElementById('profileHeaderName');
    const hEmail = document.getElementById('profileHeaderEmail');
    if (hName) hName.textContent = name;
    if (hEmail) hEmail.textContent = email;

    const initial = name[0]?.toUpperCase() || 'U';
    const avatar = document.getElementById('profileAvatarLg');
    const aLetter = document.getElementById('profileAvatarLetter');
    if (aLetter) aLetter.textContent = initial;
    if (avatar) avatar.style.background = getAvatarBg(name);

    const pOrders = document.getElementById('profileStatOrders');
    const pWish = document.getElementById('profileStatWishlist');
    if (pOrders) pOrders.textContent = orders.length;
    if (pWish) pWish.textContent = wishlist.length;
    const vName = document.getElementById('profileViewName');
    const vEmail = document.getElementById('profileViewEmail');
    const vMobile = document.getElementById('profileViewMobile');
    const vAddr = document.getElementById('profileViewAddress');
    const aDisp = document.getElementById('profileAddressDisplay');

    if (vName) vName.textContent = name;
    if (vEmail) vEmail.textContent = email;
    if (vMobile) vMobile.textContent = sanitizeHTML(user.mobile || '—');
    if (vAddr) vAddr.textContent = sanitizeHTML(user.address || '—');
    const vRef = document.getElementById('profileViewRef');
    if (vRef) vRef.textContent = getAccountRef(user);
    if (aDisp) aDisp.textContent = sanitizeHTML(user.address || 'No saved address yet.');

    cancelEditProfile();
    renderAccountHub();
    switchProfileTab('info');
    renderOrderHistory();
    renderWishlistInProfile();
    renderEnquiriesInProfile();

    document.getElementById('profileModal')?.classList.add('open');
    overlayLock();
    translateProfileModal();
}

/**
 * The hub is partly static markup and partly JS-rendered, so it must be
 * re-localised every time it opens - otherwise a Hindi user gets an English
 * popup (and switching language while it is open leaves stale strings).
 * Previously this call site referenced an undefined function, which threw a
 * ReferenceError on every open.
 */
function translateProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal && typeof applyTranslations === 'function') applyTranslations(modal);
}

// ── Hub renderers ───────────────────────────────────────────
// Everything the header card, the metric strip, the 2×2 quick-access grid and
// the GST panel show. Counted from the local ledger — never hardcoded.
function renderAccountHub() {
    if (!window.BuyerProfile || !window.SavedSites) return;

    // Header badge: customer type + what proof is actually on file.
    const badge = BuyerProfile.badge();
    const badgeEl = document.getElementById('profileBuyerBadge');
    const badgeText = document.getElementById('profileBuyerBadgeText');
    if (badgeEl) {
        badgeEl.className = 'profile-header-badge profile-badge--' + badge.tone;
        badgeEl.title = badge.title;
    }
    if (badgeText) badgeText.textContent = badge.label;

    const rows = (typeof orders !== 'undefined' && Array.isArray(orders)) ? orders : [];
    const active = rows.filter((o) => !/deliver|cancel/i.test(o.status || '')).length;
    const sites = SavedSites.list();

    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    set('profileStatOrders', rows.length);
    set('profileStatWishlist', (typeof wishlist !== 'undefined') ? wishlist.length : 0);
    set('profileStatBricks', formatNum(BuyerProfile.piecesOrdered()));
    set('profileStatSites', sites.length);

    // Quick-access tiles
    set('hubOrdersBadge', active ? active + ' Active' : rows.length + ' Total');
    set('hubOrdersMeta', rows.length
        ? 'Last: ' + (rows[0].id || '—')
        : 'No orders placed from this device yet');
    set('hubSitesBadge', sites.length);
    set('hubSitesMeta', SavedSites.localityHint());
    set('hubWishlistBadge', (typeof wishlist !== 'undefined') ? wishlist.length : 0);

    // Enquiries & RFQs come from the same local ledger the quote form writes to.
    const quotes = (window.GurukripaServices && GurukripaServices.QuotationService)
        ? GurukripaServices.QuotationService.getAllQuotations() : [];
    const openQuotes = quotes.filter(q => !/resolved|closed|cancelled/i.test(q.status || '')).length;

    const gst = (user && user.gstin) ? user.gstin : '';
    set('hubGstBadge', gst ? BuyerProfile.mask(gst) : '—');
    set('hubGstMeta', BuyerProfile.type() === 'contractor'
        ? (user && user.businessName) || 'Contractor — GSTIN pending'
        : 'Retail buyer');

    // Shortcuts list inside Account Info
    set('hubNavOrders', rows.length + (rows.length === 1 ? ' order' : ' orders'));
    set('hubNavSites', sites.length + (sites.length === 1 ? ' site' : ' sites'));
    set('hubNavGst', gst ? BuyerProfile.mask(gst) : 'Not on file');
    set('hubNavEnquiries', quotes.length ? quotes.length + (quotes.length === 1 ? ' RFQ' : ' RFQs') : 'None yet');
    set('hubNavWishlist', ((typeof wishlist !== 'undefined') ? wishlist.length : 0) + ' items');
    set('hubEnquiryBadge', openQuotes ? openQuotes + ' Open' : quotes.length + ' Total');
    set('hubEnquiryMeta', quotes.length
        ? 'Latest: ' + (quotes[0].id || '—')
        : 'No quotation requests yet');

    SavedSites.renderInto('pTabSitesList');
    renderGstForm();
}

// ── Enquiries & bulk quotation requests ────────────────────
// Reads the gb_quotations ledger that QuotationService.submitRFQ() writes, so
// this tab shows real submissions - never a placeholder list.
function renderEnquiriesInProfile() {
    const host = document.getElementById('enquiryList');
    if (!host) return;
    const svc = window.GurukripaServices && window.GurukripaServices.QuotationService;
    const rows = svc ? svc.getAllQuotations() : [];
    if (!rows.length) {
        host.innerHTML = '<div class="hub-empty">' + t('profile.enquiries.empty') + '</div>';
        return;
    }
    host.innerHTML = rows.map(q => `
        <div class="enquiry-row">
            <div class="enquiry-row__top">
                <span class="enquiry-row__ref">${sanitizeHTML(q.id)}</span>
                <span class="enquiry-row__status">${sanitizeHTML(q.status || 'Under Review')}</span>
            </div>
            <div class="enquiry-row__title">${sanitizeHTML(q.product || 'Bulk enquiry')} · ${formatNum(q.qty || 0)} pcs</div>
            <div class="enquiry-row__meta">${sanitizeHTML(q.site || 'Site not specified')} · ${new Date(q.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <a class="enquiry-row__action" href="${waOrderURL(q.product || 'Bulk enquiry', q.qty || 1000)}" target="_blank" rel="noopener">Follow up on WhatsApp</a>
        </div>`).join('');
}

// Live GSTIN validity feedback while the buyer types. Says what was checked
// and where, so nobody reads it as a government verification.
function renderGstState() {
    const box = document.getElementById('gstState');
    const text = document.getElementById('gstStateText');
    if (!box || !text || !window.BuyerProfile) return;

    const raw = ((document.getElementById('editGstin') || {}).value || '').trim();
    const isContractor = !!document.querySelector('input[name="buyerType"]:checked')
        && document.querySelector('input[name="buyerType"]:checked').value === 'contractor';

    let tone = 'neutral';
    let msg;
    if (!raw) {
        msg = isContractor
            ? 'Add the 15-character GSTIN so the yard can bill your firm by name.'
            : 'Retail buyer — orders are billed as a cash supply, no input tax credit.';
    } else {
        const check = BuyerProfile.validGstin(raw);
        if (check.ok) {
            tone = 'verified';
            msg = 'Format valid: ' + check.value + ' — state code ' + check.value.slice(0, 2) + '. The yard still confirms the registration before a tax invoice is issued.';
        } else {
            tone = 'pending';
            msg = 'Not a valid GSTIN shape yet — ' + check.value.length + ' of 15 characters, e.g. 09AAACG1234A1Z5.';
        }
    }

    box.className = 'gst-state gst-state--' + tone;
    text.textContent = msg;
}

// Loads the GST panel with what is stored, so opening it never blanks the form.
function renderGstForm() {
    if (!user) return;
    const put = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };
    put('editBusinessName', user.businessName);
    put('editGstin', user.gstin);
    put('editPan', user.pan);

    const wantContractor = BuyerProfile.type() === 'contractor';
    const retail = document.getElementById('buyerTypeRetail');
    const contractor = document.getElementById('buyerTypeContractor');
    if (retail) retail.checked = !wantContractor;
    if (contractor) contractor.checked = wantContractor;
    renderGstState();
}

function saveBuyerProfileType() {
    const res = BuyerProfile.saveFromForm();
    if (res.error) { showToast(res.error, 'error'); return; }
    renderAccountHub();
    showToast('Business info saved on this device.', 'success');
}

function closeProfile() {
    document.getElementById('profileModal')?.classList.remove('open');
    overlayUnlock();
}

function handleProfileOverlayClick(e) {
    if (e.target === document.getElementById('profileModal')) closeProfile();
}

function switchProfileTab(tabName, btn) {
    // 'address' was the old tab name for the address book - it now lives with
    // the saved sites, so existing callers keep working.
    if (tabName === 'address') tabName = 'sites';
    const tabs = PROFILE_TABS;
    const buttons = document.querySelectorAll('.profile-tabs .profile-tab');
    if (btn) {
        buttons.forEach(b => { b.classList.remove('active'); b.removeAttribute('aria-current'); });
        btn.classList.add('active');
        btn.setAttribute('aria-current', 'true');
    } else {
        // Programmatic switch (e.g. from the navbar account menu):
        // keep the tab strip's active state in sync with the panel.
        const idx = tabs.indexOf(tabName);
        buttons.forEach((b, i) => {
            b.classList.toggle('active', i === idx);
            if (i === idx) b.setAttribute('aria-current', 'true');
            else b.removeAttribute('aria-current');
        });
    }
    tabs.forEach(t => {
        const panel = document.getElementById('pTab' + t.charAt(0).toUpperCase() + t.slice(1));
        if (panel) panel.classList.toggle('active', t === tabName);
    });
}

// Opens the profile modal directly on a given tab — used by the navbar
// account dropdown ("Saved Addresses", "My Orders & Invoices").
function openProfileTab(tab) {
    if (!user) { openAuth('login'); return; }
    openProfile();
    switchProfileTab(tab);
}

function switchToEditProfile() {
    if (!user) return;
    const eName = document.getElementById('editName');
    const eEmail = document.getElementById('editEmail');
    const eMobile = document.getElementById('editMobile');
    const eAddr = document.getElementById('editAddress');

    if (eName) eName.value = user.name || '';
    if (eEmail) eEmail.value = user.email || '';
    if (eMobile) eMobile.value = user.mobile || '';
    if (eAddr) eAddr.value = user.address || '';

    const pView = document.getElementById('profileViewMode');
    const pEdit = document.getElementById('profileEditMode');
    if (pView) pView.hidden = true;
    if (pEdit) pEdit.hidden = false;

    // Put the caret in the first field and bring it into view - on a phone the
    // on-screen keyboard otherwise covers the form the user just opened.
    requestAnimationFrame(() => {
        if (!eName) return;
        eName.focus({ preventScroll: true });
        eName.scrollIntoView({ block: 'center' });
    });
}

function cancelEditProfile() {
    const pView = document.getElementById('profileViewMode');
    const pEdit = document.getElementById('profileEditMode');
    if (pView) pView.hidden = false;
    if (pEdit) pEdit.hidden = true;
    clearProfileErrors();
    const saveBtn = document.getElementById('profileSaveBtn');
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Changes'; }
    // Return focus to the control that opened the form, per WCAG 2.4.3 - but
    // only while the hub is actually open, so openProfile() does not grab focus
    // and scroll the page behind it during its own setup pass.
    const isOpen = document.getElementById('profileModal')?.classList.contains('open');
    const back = document.getElementById('profileEditBtn');
    if (isOpen && back && pView && !pView.hidden) back.focus({ preventScroll: true });
}

function clearProfileErrors() {
    ['errEditName', 'errEditEmail', 'errEditMobile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
    ['editName', 'editEmail', 'editMobile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('error');
    });
}

function setProfileFieldError(inputId, errId, msg) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (err) err.textContent = msg;
    if (input) { input.classList.add('error'); input.focus({ preventScroll: true }); }
    showToast(msg, 'error');
}

// Signing out is destructive enough to confirm, but the confirmation is real -
// it never claims to clear server data that this build does not hold. The dialog
// itself lives in requestSignOut() so the hub, dropdown and drawer share one.
function requestProfileSignOut() {
    if (window.requestSignOut) {
        closeProfile();
        requestSignOut();
        return;
    }
    closeProfile();
    logoutUser();
}

function saveProfile(e) {
    e.preventDefault();
    const btn = document.getElementById('profileSaveBtn');
    // One submission per tap: a slow storage write must not queue two saves.
    if (btn && btn.disabled) return;
    clearProfileErrors();

    const nameEl = document.getElementById('editName');
    const emailEl = document.getElementById('editEmail');
    const mobileEl = document.getElementById('editMobile');
    const addressEl = document.getElementById('editAddress');
    const name = (nameEl?.value || '').trim();
    const email = (emailEl?.value || '').trim();
    const mobile = (mobileEl?.value || '').trim();
    const address = (addressEl?.value || '').trim();

    if (!name || name.length < 2) { setProfileFieldError('editName', 'errEditName', t('auth.nameInvalid')); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setProfileFieldError('editEmail', 'errEditEmail', t('auth.emailInvalid')); return; }
    if (mobile && !/^[0-9]{10}$/.test(mobile)) { setProfileFieldError('editMobile', 'errEditMobile', 'Enter a 10-digit mobile number, or leave it blank.'); return; }

    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

    user.name = name;
    user.email = email;
    user.mobile = mobile;
    user.address = address;
    delete user.password;

    setSafeStorage('gb_user', user);

    updateAuthUI();
    const hName = document.getElementById('profileHeaderName');
    const hEmail = document.getElementById('profileHeaderEmail');
    const vName = document.getElementById('profileViewName');
    const vEmail = document.getElementById('profileViewEmail');
    const vMobile = document.getElementById('profileViewMobile');
    const vAddr = document.getElementById('profileViewAddress');
    const aDisp = document.getElementById('profileAddressDisplay');

    if (hName) hName.textContent = sanitizeHTML(name);
    if (hEmail) hEmail.textContent = sanitizeHTML(email);
    if (vName) vName.textContent = sanitizeHTML(name);
    if (vEmail) vEmail.textContent = sanitizeHTML(email);
    if (vMobile) vMobile.textContent = sanitizeHTML(mobile || '—');
    if (vAddr) vAddr.textContent = sanitizeHTML(address || '—');
    if (aDisp) aDisp.textContent = sanitizeHTML(address || 'No saved address yet.');
    const rRef = document.getElementById('profileViewRef');
    if (rRef) rRef.textContent = getAccountRef(user);

    const initial = name[0]?.toUpperCase() || 'U';
    const aLetter = document.getElementById('profileAvatarLetter');
    const avatar = document.getElementById('profileAvatarLg');
    if (aLetter) aLetter.textContent = initial;
    if (avatar) avatar.style.background = getAvatarBg(name);

    cancelEditProfile();
    renderAccountHub();
    showToast(t('auth.profileSaved'), 'success');
}

function renderWishlistInProfile() {
    const container = document.getElementById('profileWishlistGrid');
    if (!container) return;
    const items = PRODUCTS.filter(p => wishlist.includes(p.id));
    if (!items.length) {
        container.innerHTML = `<div class="hub-empty">${t('wishlist.empty')}</div>`;
        return;
    }
    container.innerHTML = items.map(item => `
        <div class="wishlist-item">
            <img class="wishlist-item-img" src="${item.img}" alt="${sanitizeHTML(item.name)}" loading="lazy" width="56" height="56">
            <div class="wishlist-item-body">
                <div class="wishlist-item-name line-clamp-1">${sanitizeHTML(item.name)}</div>
                <div class="wishlist-item-price">${formatINR(item.price)} / ${sanitizeHTML(item.unit || 'pc')}</div>
            </div>
            <div class="wishlist-item-actions">
                <button type="button" class="btn btn-primary btn-sm" onclick="addToCart(${item.id})">${t('product.add')}</button>
                <button type="button" class="btn btn-outline btn-sm" onclick="removeFromWishlistDrawer(${item.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

// ESC / keyboard handling is centralized in ui.js (global overlay escape).
