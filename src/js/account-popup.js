'use strict';
/**
 * Account popup helpers — identity + metrics for #userDropdown.
 * Keeps auth-modal.js focused on login/register; profile-modal.js on the hub.
 * Data sources: live `user`, `orders`, `wishlist`, SavedSites (device ledger).
 * Never invents profile or order records.
 */
(function (global) {
    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value == null || value === '' ? '—' : String(value);
    }

    function refreshAccountPopupStats() {
        const orderCount = Array.isArray(global.orders) ? global.orders.length : 0;
        const siteCount = (global.SavedSites && typeof global.SavedSites.list === 'function')
            ? global.SavedSites.list().length
            : 0;
        const wishCount = Array.isArray(global.wishlist) ? global.wishlist.length : 0;

        setText('udStatOrders', orderCount);
        setText('udStatSites', siteCount);
        setText('udStatWish', wishCount);

        const badge = document.getElementById('udOrdersBadge');
        if (badge) {
            if (orderCount > 0) {
                badge.hidden = false;
                badge.textContent = String(orderCount > 99 ? '99+' : orderCount);
            } else {
                badge.hidden = true;
            }
        }
    }

    function fillRoleBadge(u) {
        const badge = document.getElementById('udRoleBadge');
        const text = document.getElementById('udRoleBadgeText');
        if (!badge || !text) return;

        let label = 'Signed in';
        let verified = false;

        if (global.BuyerProfile && typeof global.BuyerProfile.badge === 'function') {
            try {
                const b = global.BuyerProfile.badge();
                if (b && b.label) {
                    label = b.label;
                    verified = b.tone === 'verified';
                }
            } catch (_) { /* ignore */ }
        } else if (u && u.role) {
            label = String(u.role);
        } else if (u && u.verified) {
            label = 'Verified buyer';
            verified = true;
        }

        text.textContent = label;
        badge.classList.toggle('is-verified', !!verified);
        badge.hidden = false;
    }

    function fillAccountPopupIdentity(u) {
        if (!u) return;
        const initial = (u.name && u.name[0] ? u.name[0] : 'U').toUpperCase();
        setText('udName', u.name || 'User');
        setText('udEmail', u.email || '—');
        setText('udPhone', u.mobile ? ('+91 ' + String(u.mobile).replace(/\D/g, '').slice(-10)) : '—');
        const udRef = document.getElementById('udRef');
        if (udRef && typeof global.getAccountRef === 'function') {
            udRef.textContent = global.getAccountRef(u);
            udRef.title = u.email || u.mobile || '';
        }
        const udInit = document.getElementById('udAvatarInitial');
        if (udInit) udInit.textContent = initial;
        const udAvatar = document.getElementById('udAvatar');
        if (udAvatar && typeof global.getAvatarBg === 'function') {
            udAvatar.style.background = global.getAvatarBg(u.name);
        }
        fillRoleBadge(u);
        refreshAccountPopupStats();
    }

    /** Open profile hub directly in edit mode (supported by profile-modal.js). */
    function openAccountEditProfile() {
        if (typeof global.closeUserDropdown === 'function') global.closeUserDropdown();
        if (!global.user) {
            if (typeof global.openAuth === 'function') global.openAuth('login');
            return;
        }
        if (typeof global.openProfile === 'function') global.openProfile();
        if (typeof global.switchProfileTab === 'function') global.switchProfileTab('info');
        if (typeof global.switchToEditProfile === 'function') {
            setTimeout(function () { global.switchToEditProfile(); }, 40);
        }
    }

    global.refreshAccountPopupStats = refreshAccountPopupStats;
    global.fillAccountPopupIdentity = fillAccountPopupIdentity;
    global.openAccountEditProfile = openAccountEditProfile;
})(window);
