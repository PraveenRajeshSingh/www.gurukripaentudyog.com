// ══════════════════════════════════════════
// PROFILE MODAL — view / edit / wishlist render
// Split from the original monolithic auth.js (SRP).
// Depends on: openAuth (auth-modal.js), updateAuthUI (auth-modal.js),
//             renderOrderHistory (invoice.js),
//             closeUserDropdown (ui.js), getAvatarBg, sanitizeHTML, setSafeStorage (state.js),
//             showToast, t() (ui.js).
// NOTE: translateProfileModal() is a pre-existing undefined reference kept
// verbatim from the original auth.js to preserve 1:1 behavior.
// ══════════════════════════════════════════

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
    if (aDisp) aDisp.textContent = sanitizeHTML(user.address || 'No saved address yet.');

    cancelEditProfile();
    switchProfileTab('info');
    renderOrderHistory();
    renderWishlistInProfile();

    document.getElementById('profileModal')?.classList.add('open');
    overlayLock();
    translateProfileModal();
}

function closeProfile() {
    document.getElementById('profileModal')?.classList.remove('open');
    overlayUnlock();
}

function handleProfileOverlayClick(e) {
    if (e.target === document.getElementById('profileModal')) closeProfile();
}

function switchProfileTab(tabName, btn) {
    if (btn) {
        document.querySelectorAll('.profile-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    ['info', 'orders', 'wishlist', 'address'].forEach(t => {
        const panel = document.getElementById('pTab' + t.charAt(0).toUpperCase() + t.slice(1));
        if (panel) panel.classList.toggle('active', t === tabName);
    });
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
    if (pView) pView.style.display = 'none';
    if (pEdit) pEdit.style.display = 'block';
}

function cancelEditProfile() {
    const pView = document.getElementById('profileViewMode');
    const pEdit = document.getElementById('profileEditMode');
    if (pView) pView.style.display = 'block';
    if (pEdit) pEdit.style.display = 'none';
}

function saveProfile(e) {
    e.preventDefault();
    const name = document.getElementById('editName')?.value.trim();
    const email = document.getElementById('editEmail')?.value.trim();
    const mobile = document.getElementById('editMobile')?.value.trim();
    const address = document.getElementById('editAddress')?.value.trim();

    if (!name || name.length < 2) { showToast(t('auth.nameInvalid'), 'error'); return; }
    if (!email || !/\S+@\S+\.\S+/.test(email)) { showToast(t('auth.emailInvalid'), 'error'); return; }

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

    const initial = name[0]?.toUpperCase() || 'U';
    const aLetter = document.getElementById('profileAvatarLetter');
    const avatar = document.getElementById('profileAvatarLg');
    if (aLetter) aLetter.textContent = initial;
    if (avatar) avatar.style.background = getAvatarBg(name);

    cancelEditProfile();
    showToast(t('auth.profileSaved'), 'success');
}

function renderWishlistInProfile() {
    const container = document.getElementById('profileWishlistGrid');
    if (!container) return;
    const items = PRODUCTS.filter(p => wishlist.includes(p.id));
    if (!items.length) {
        container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:24px;color:var(--ink-3);font-size:.85rem">${t('wishlist.empty')}</div>`;
        return;
    }
    container.innerHTML = items.map(item => `
        <div class="wishlist-item">
            <img class="wishlist-item-img" src="${item.img}" alt="${sanitizeHTML(item.name)}">
            <div style="flex:1;min-width:0">
                <div class="wishlist-item-name line-clamp-1">${sanitizeHTML(item.name)}</div>
                <div class="wishlist-item-price">₹${item.price}/${item.unit}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="addToCart(${item.id})" style="padding:4px 8px;font-size:.72rem">${t('product.add')}</button>
        </div>
    `).join('');
}

// ESC / keyboard handling is centralized in ui.js (global overlay escape).
