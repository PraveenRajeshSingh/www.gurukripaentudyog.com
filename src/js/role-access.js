// ══════════════════════════════════════════
// ROLE ACCESS — centralized UI audience + permissions
// Maps Platform API roles + local buyerType onto storefront
// audiences. Backend JWT guards remain the security boundary.
// Depends on: user (state.js), BuyerProfile (optional).
// ══════════════════════════════════════════
const RoleAccess = (() => {
    const STAFF = new Set(['STAFF', 'DISPATCHER', 'WAREHOUSE_STAFF', 'DRIVER', 'SALES']);
    const MANAGER = new Set(['SALES_MANAGER', 'MANAGER']);
    const ADMIN = new Set(['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN', 'OWNER']);

    /** Canonical UI audiences (not a second auth system). */
    const AUDIENCES = ['guest', 'customer', 'contractor', 'staff', 'manager', 'admin'];

    /**
     * Permission keys used for data-perm visibility.
     * Customer keys are always true for signed-in retail/contractor.
     * Ops keys require staff+.
     */
    const PERM_BY_AUDIENCE = {
        guest: [
            'products.view', 'estimates.create', 'cart.manage', 'wishlist.manage',
            'auth.register', 'auth.login', 'contact.view', 'language.switch'
        ],
        customer: [
            'products.view', 'estimates.create', 'estimates.view_own', 'cart.manage',
            'wishlist.manage', 'orders.view_own', 'quotations.view_own', 'enquiries.manage_own',
            'sites.manage_own', 'profile.manage_own', 'notifications.view_own',
            'invoices.view_own', 'tracker.view_own', 'contact.view', 'language.switch'
        ],
        contractor: [
            // customer + bulk / multi-site
            'products.view', 'estimates.create', 'estimates.view_own', 'cart.manage',
            'wishlist.manage', 'orders.view_own', 'quotations.view_own', 'enquiries.manage_own',
            'sites.manage_own', 'profile.manage_own', 'notifications.view_own',
            'invoices.view_own', 'tracker.view_own', 'bulk.enquire', 'dealer.overview',
            'gst.manage_own', 'contact.view', 'language.switch'
        ],
        staff: [
            'products.view', 'ops.orders', 'ops.enquiries', 'ops.quotations',
            'ops.dispatch', 'ops.inventory', 'contact.view'
        ],
        manager: [
            'products.view', 'ops.orders', 'ops.enquiries', 'ops.quotations',
            'ops.dispatch', 'ops.inventory', 'ops.reports', 'ops.dealers', 'contact.view'
        ],
        admin: [
            'products.view', 'ops.orders', 'ops.enquiries', 'ops.quotations',
            'ops.dispatch', 'ops.inventory', 'ops.reports', 'ops.dealers',
            'ops.audit', 'ops.settings', 'ops.users', 'contact.view'
        ]
    };

    function normalizeRole(role) {
        return String(role || '').trim().toUpperCase().replace(/\s+/g, '_');
    }

    function platformRole(u) {
        return normalizeRole((u && u.role) || 'CUSTOMER');
    }

    function isContractorLike(u) {
        if (!u) return false;
        const r = platformRole(u);
        if (r === 'DEALER') return true;
        if (u.buyerType === 'contractor') return true;
        if (window.BuyerProfile && typeof BuyerProfile.type === 'function') {
            try { return BuyerProfile.type() === 'contractor'; } catch (_e) { /* ignore */ }
        }
        return false;
    }

    function isStaffLike(u) {
        if (!u) return false;
        const r = platformRole(u);
        if (STAFF.has(r) || MANAGER.has(r) || ADMIN.has(r)) return true;
        // Legacy ERP actor roles used on-device
        const legacy = ['OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES_MANAGER', 'SALES',
            'INVENTORY', 'WAREHOUSE', 'DELIVERY', 'DRIVER'];
        return legacy.indexOf(r) >= 0;
    }

    function isManagerLike(u) {
        if (!u) return false;
        const r = platformRole(u);
        return MANAGER.has(r) || ADMIN.has(r) || r === 'SALES_MANAGER' || r === 'OWNER';
    }

    function isAdminLike(u) {
        if (!u) return false;
        const r = platformRole(u);
        return ADMIN.has(r);
    }

    /** Highest matching UI audience for the current session. */
    function audience(u) {
        const who = u !== undefined ? u : (typeof user !== 'undefined' ? user : null);
        if (!who) return 'guest';
        if (isAdminLike(who)) return 'admin';
        if (isManagerLike(who)) return 'manager';
        if (isStaffLike(who)) return 'staff';
        if (isContractorLike(who)) return 'contractor';
        return 'customer';
    }

    function permissionsFor(aud) {
        return (PERM_BY_AUDIENCE[aud] || PERM_BY_AUDIENCE.guest).slice();
    }

    function can(perm, u) {
        const aud = audience(u);
        const list = permissionsFor(aud);
        // Staff/manager/admin also keep personal customer tools when signed in.
        if (aud === 'staff' || aud === 'manager' || aud === 'admin') {
            const personal = permissionsFor('customer');
            if (personal.indexOf(perm) >= 0) return true;
        }
        if (aud === 'contractor' && permissionsFor('customer').indexOf(perm) >= 0) return true;
        return list.indexOf(perm) >= 0;
    }

    function roleLabel(u) {
        const aud = audience(u);
        switch (aud) {
            case 'admin': return 'Administrator';
            case 'manager': return 'Manager';
            case 'staff': return 'Yard Staff';
            case 'contractor': return 'Contractor / Builder';
            case 'customer': return 'Customer';
            default: return 'Guest';
        }
    }

    /**
     * Apply data-audience / data-perm visibility across the document.
     * data-audience="customer,contractor" → show when audience matches any
     * data-audience-hide="guest" → hide when audience matches
     * data-perm="orders.view_own" → show when can(perm)
     * data-perm-any="a,b" → show if any perm matches
     */
    function applyVisibility(root) {
        const scope = root || document;
        const aud = audience();
        const who = typeof user !== 'undefined' ? user : null;

        scope.querySelectorAll('[data-audience]').forEach((el) => {
            const allowed = String(el.getAttribute('data-audience') || '')
                .split(',').map((s) => s.trim()).filter(Boolean);
            const show = allowed.indexOf(aud) >= 0 || (allowed.indexOf('signed-in') >= 0 && !!who);
            setVisible(el, show);
        });

        scope.querySelectorAll('[data-audience-hide]').forEach((el) => {
            const blocked = String(el.getAttribute('data-audience-hide') || '')
                .split(',').map((s) => s.trim()).filter(Boolean);
            if (blocked.indexOf(aud) >= 0) setVisible(el, false);
        });

        scope.querySelectorAll('[data-perm]').forEach((el) => {
            setVisible(el, can(el.getAttribute('data-perm'), who));
        });

        scope.querySelectorAll('[data-perm-any]').forEach((el) => {
            const perms = String(el.getAttribute('data-perm-any') || '').split(',').map((s) => s.trim());
            setVisible(el, perms.some((p) => can(p, who)));
        });

        // Ops portal: staff+ only (never customers)
        document.querySelectorAll('[data-ops-portal], .topbar-ops-btn').forEach((el) => {
            const show = can('ops.orders', who) || can('ops.reports', who) || can('ops.settings', who);
            setVisible(el, show);
            if (el.classList.contains('drawer-link')) {
                el.style.display = show ? '' : 'none';
            }
        });

        document.body.setAttribute('data-audience', aud);
        const badgeText = document.getElementById('udRoleBadgeText');
        if (badgeText && who) badgeText.textContent = roleLabel(who);
    }

    function setVisible(el, show) {
        if (!el) return;
        el.hidden = !show;
        el.setAttribute('aria-hidden', show ? 'false' : 'true');
        if (show) el.removeAttribute('inert');
        else el.setAttribute('inert', '');
    }

    /** Open customer tools; prompt login only when the feature needs an account. */
    function requireCustomer(actionLabel, next) {
        const who = typeof user !== 'undefined' ? user : null;
        if (who) {
            if (typeof next === 'function') next();
            return true;
        }
        if (typeof showToast === 'function') {
            showToast((typeof t === 'function' ? t('auth.requireLogin') : 'Sign in to continue') +
                (actionLabel ? ' — ' + actionLabel : ''), 'info');
        }
        if (typeof openAuth === 'function') openAuth('login');
        return false;
    }

    function goEstimator() {
        if (typeof closeUserDropdown === 'function') closeUserDropdown();
        if (typeof toggleDrawer === 'function') {
            const d = document.getElementById('mobileDrawer');
            if (d && d.classList.contains('open')) toggleDrawer();
        }
        const el = document.getElementById('calculator');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (typeof renderSavedEstimates === 'function') {
            try { renderSavedEstimates(); } catch (_e) { /* ignore */ }
        }
    }

    function goCustomerDashboard() {
        requireCustomer('My Dashboard', function () {
            if (typeof openProfile === 'function') openProfile();
        });
    }

    function goBulkQuote() {
        if (typeof openBulkQuoteModal === 'function') openBulkQuoteModal();
    }

    document.addEventListener('DOMContentLoaded', function () {
        applyVisibility();
    });

    return {
        AUDIENCES,
        audience,
        can,
        permissionsFor,
        roleLabel,
        platformRole,
        isContractorLike,
        isStaffLike,
        isManagerLike,
        isAdminLike,
        applyVisibility,
        requireCustomer,
        goEstimator,
        goCustomerDashboard,
        goBulkQuote
    };
})();
window.RoleAccess = RoleAccess;
