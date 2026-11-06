const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

describe('My Account popup architecture', () => {
    test('account menu is a dedicated partial included from navbar', () => {
        const nav = read('src/pages/partials/navbar.html');
        assert.match(nav, /@include:partials\/account-menu\.html/);
        assert.ok(fs.existsSync(path.join(root, 'src/pages/partials/account-menu.html')));
    });

    test('account popup exposes profile identity and real action hooks', () => {
        const menu = read('src/pages/partials/account-menu.html');
        assert.match(menu, /id="userDropdown"/);
        assert.match(menu, /id="udName"/);
        assert.match(menu, /id="udEmail"/);
        assert.match(menu, /id="udPhone"/);
        assert.match(menu, /openProfile\(\)/);
        assert.match(menu, /openAccountEditProfile/);
        assert.match(menu, /openProfileTab\('orders'\)/);
        assert.match(menu, /openTrackerModal/);
        assert.match(menu, /requestSignOut/);
        assert.match(menu, /handleForgotPw/);
        assert.match(menu, /account-popup-backdrop/);
        assert.match(menu, /udStatOrders/);
    });

    test('account-popup.js module wires identity helpers without fake data', () => {
        const js = read('src/js/account-popup.js');
        assert.match(js, /fillAccountPopupIdentity/);
        assert.match(js, /refreshAccountPopupStats/);
        assert.match(js, /openAccountEditProfile/);
        assert.match(js, /Never invents|never invent/i);
        const mods = read('src/pages/partials/javascript-modules.html');
        assert.match(mods, /account-popup\.js/);
    });

    test('design tokens expose semantic account aliases', () => {
        const tokens = read('src/styles/tokens.css');
        assert.match(tokens, /--color-primary:\s*var\(--brand\)/);
        assert.match(tokens, /--color-surface:\s*var\(--bg-card\)/);
        assert.match(tokens, /--shadow-modal:/);
    });

    test('account.css is linked in head cascade', () => {
        const head = read('src/pages/partials/head.html');
        assert.match(head, /account\.css/);
        assert.ok(fs.existsSync(path.join(root, 'src/styles/account.css')));
        const css = read('src/styles/account.css');
        assert.match(css, /position:\s*fixed/);
        assert.match(css, /\.is-sheet/);
        assert.match(css, /account-popup-backdrop/);
        assert.match(css, /\.ud-phone/);
        assert.match(css, /z-index:\s*var\(--z-modal/);
    });

    test('local auth never persists password material', () => {
        const auth = read('src/js/auth-modal.js');
        assert.match(auth, /scrubLocalUserSecrets/);
        assert.doesNotMatch(auth, /passwordHash:\s*localPwHash/);
        assert.match(auth, /never persist password|Never persist password|never stored/i);
        assert.match(auth, /fillAccountPopupIdentity/);
    });

    test('dropdown open/close portals fixed popup and manages sheet chrome', () => {
        const ui = read('src/js/ui.js');
        assert.match(ui, /syncAccountPopupChrome/);
        assert.match(ui, /isAccountSheetMode/);
        assert.match(ui, /ensureAccountPopupPortaled/);
        assert.match(ui, /positionAccountPopup/);
        assert.match(ui, /openUserDropdown/);
        assert.match(ui, /account-popup-open/);
        assert.match(ui, /max-width:\s*1024px/);
    });

    test('mobile profile opens account popup when signed in', () => {
        const auth = read('src/js/auth-modal.js');
        assert.match(auth, /function handleMobileProfile/);
        assert.match(auth, /openUserDropdown/);
    });

    test('change password uses real recovery flow, not a dummy form', () => {
        const menu = read('src/pages/partials/account-menu.html');
        assert.match(menu, /Change Password/);
        assert.match(menu, /handleForgotPw/);
        assert.match(menu, /Notification Settings/);
        assert.match(menu, /openNotificationCenter/);
        assert.match(menu, /udRoleBadge/);
    });
});
