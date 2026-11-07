'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function loadRoleAccess() {
    const code = fs.readFileSync(path.join(root, 'src/js/role-access.js'), 'utf8');
    const sandbox = {
        console,
        document: {
            body: { setAttribute() {} },
            getElementById() { return null; },
            querySelectorAll() { return []; },
            addEventListener() {}
        },
        window: {},
        user: null,
        BuyerProfile: null
    };
    sandbox.window = sandbox;
    vm.runInNewContext(code + '\nthis.RoleAccess = RoleAccess;', sandbox, { filename: 'role-access.js' });
    return sandbox.RoleAccess;
}

describe('RoleAccess audiences', () => {
    it('maps guests, customers, contractors, staff, managers, admins', () => {
        const RA = loadRoleAccess();
        assert.equal(RA.audience(null), 'guest');
        assert.equal(RA.audience({ name: 'A', role: 'CUSTOMER' }), 'customer');
        assert.equal(RA.audience({ name: 'B', role: 'CUSTOMER', buyerType: 'contractor' }), 'contractor');
        assert.equal(RA.audience({ name: 'C', role: 'DEALER' }), 'contractor');
        assert.equal(RA.audience({ name: 'D', role: 'STAFF' }), 'staff');
        assert.equal(RA.audience({ name: 'E', role: 'SALES_MANAGER' }), 'manager');
        assert.equal(RA.audience({ name: 'F', role: 'ADMIN' }), 'admin');
        assert.equal(RA.audience({ name: 'G', role: 'SUPER_ADMIN' }), 'admin');
    });

    it('grants customers personal tools and denies ops portal perms', () => {
        const RA = loadRoleAccess();
        const c = { role: 'CUSTOMER' };
        assert.equal(RA.can('orders.view_own', c), true);
        assert.equal(RA.can('estimates.create', c), true);
        assert.equal(RA.can('ops.orders', c), false);
        assert.equal(RA.can('ops.settings', c), false);
    });

    it('grants guests catalogue and estimator without forcing login', () => {
        const RA = loadRoleAccess();
        assert.equal(RA.can('products.view', null), true);
        assert.equal(RA.can('estimates.create', null), true);
        assert.equal(RA.can('orders.view_own', null), false);
    });

    it('contractors get bulk enquire; staff get ops but not mistaken for customers', () => {
        const RA = loadRoleAccess();
        assert.equal(RA.can('bulk.enquire', { role: 'DEALER' }), true);
        assert.equal(RA.can('ops.orders', { role: 'STAFF' }), true);
        assert.equal(RA.can('orders.view_own', { role: 'STAFF' }), true); // personal tools retained
        assert.equal(RA.isStaffLike({ role: 'CUSTOMER' }), false);
        assert.equal(RA.isStaffLike({ role: 'DEALER' }), false);
    });

    it('is wired into the storefront script cascade before account popup', () => {
        const mods = fs.readFileSync(path.join(root, 'src/pages/partials/javascript-modules.html'), 'utf8');
        const auth = mods.indexOf('auth-modal.js');
        const role = mods.indexOf('role-access.js');
        const acct = mods.indexOf('account-popup.js');
        assert.ok(auth >= 0 && role > auth && acct > role);
    });

    it('account menu exposes customer dashboard and estimator without ops-only gating', () => {
        const menu = fs.readFileSync(path.join(root, 'src/pages/partials/account-menu.html'), 'utf8');
        assert.match(menu, /My Dashboard/);
        assert.match(menu, /Brick Estimator/);
        assert.match(menu, /My Orders/);
        assert.doesNotMatch(menu, /openAdminPortal/);
    });
});
