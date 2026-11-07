// ══════════════════════════════════════════
// AUTH MODAL — Sign In / Sign Up / Lockout / Utilities
// Split from the original monolithic auth.js (SRP).
// All function names are globals preserved verbatim.
// Depends on: sanitizeHTML, getAvatarBg, getSafeStorage, setSafeStorage (state.js),
//             showToast (ui.js), t() (ui.js), prefillUserInCheckout (checkout.js),
//             closeUserDropdown (ui.js), toggleDrawer (ui.js),
//             openProfile (profile-modal.js), GBDialogs (dialogs.js).
// ══════════════════════════════════════════
const _authEyeSVG = `<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const _authEyeOffSVG = `<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
const _authLockSVG = `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`;
const _authStarSVG = `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 5.3 5.9.9-4.3 4.2 1 5.8L12 15.4 6.8 18.2l1-5.8L3.5 8.2l5.9-.9z"/></svg>`;

function openAuth(tab = 'login') {
    switchAuthTab(tab);
    document.getElementById('authModal')?.classList.add('open');
    overlayLock();
}

function closeAuth() {
    document.getElementById('authModal')?.classList.remove('open');
    overlayUnlock();
}

function handleAuthOverlayClick(e) {
    if (e.target.id === 'authModal') closeAuth();
}

function switchAuthTab(tab, btn) {
    const loginPanel = document.getElementById('loginPanel');
    const regPanel = document.getElementById('registerPanel');
    const tabLogin = document.getElementById('tabLogin');
    const tabReg = document.getElementById('tabRegister');
    if (!loginPanel || !regPanel) return;

    // Driven by the `hidden` property rather than inline display, so the panels
    // stay in one visibility model with the rest of the storefront.
    const showLogin = tab === 'login' || (btn && btn.id === 'tabLogin');
    loginPanel.hidden = !showLogin;
    regPanel.hidden = showLogin;
    tabLogin?.classList.toggle('active', showLogin);
    tabReg?.classList.toggle('active', !showLogin);
    // aria-current is set on the active control only, matching the profile hub.
    // "page" would claim a navigation change that a dialog tab is not.
    showLogin ? tabLogin?.setAttribute('aria-current', 'true') : tabLogin?.removeAttribute('aria-current');
    showLogin ? tabReg?.removeAttribute('aria-current') : tabReg?.setAttribute('aria-current', 'true');

    // Headings come from the dictionary so switching to Hindi re-labels the
    // dialog instead of leaving an English title painted over a Hindi form.
    const title = document.getElementById('authTitle');
    const sub = document.getElementById('authSubtitle');
    if (title) title.textContent = t(showLogin ? 'auth.signInTitle' : 'auth.signUpTitle');
    if (sub) sub.textContent = t(showLogin ? 'auth.signInSub' : 'auth.signUpSub');
    document.getElementById('authBadge').innerHTML = showLogin ? _authLockSVG : _authStarSVG;
}

function resolveLoginPhone(email) {
    if (window.GBApi && GBApi.phoneFor) {
        const mapped = GBApi.phoneFor(email);
        if (mapped) return String(mapped).replace(/\D/g, '').slice(-10);
    }
    const users = getSafeStorage('gb_users', []);
    const found = users.find(u => u && String(u.email || '').toLowerCase() === String(email).toLowerCase());
    if (found && found.mobile) return String(found.mobile).replace(/\D/g, '').slice(-10);
    return '';
}

function handleLogin(e) {
    e.preventDefault();
    if (failedLoginAttempts >= 3) {
        triggerFormShake('loginForm');
        showToast(t('auth.locked'), 'error');
        return;
    }

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    clearAuthErrors();

    let valid = true;
    if (!email || !/\S+@\S+\.\S+/.test(email)) { showFieldError('loginEmailErr', 'Enter a valid email'); valid = false; }
    if (!password || password.length < 6) { showFieldError('loginPasswordErr', 'Password must be 6+ characters'); valid = false; }
    if (!valid) {
        triggerFormShake('loginForm');
        return;
    }

    setButtonLoading('loginSubmitBtn', true, 'Signing in...');

    // Server-first sign-in when the Platform API is configured (docs/PLATFORM-API.md).
    // Resolve phone from the email→phone map or the local profile directory.
    if (window.GBApi && GBApi.enabled()) {
        const phone = resolveLoginPhone(email);
        if (phone && phone.length === 10) {
            GBApi.login({ phone, password }).then(su => {
                failedLoginAttempts = 0;
                loginSuccess({
                    id: su.id,
                    name: su.name,
                    email: su.email || email,
                    mobile: su.phone || phone,
                    role: su.role || 'CUSTOMER',
                    tenantId: su.tenantId
                });
                GBApi.flushOutbox();
            }).catch(err => {
                if (err.code === 401) {
                    failedLoginAttempts++;
                    setButtonLoading('loginSubmitBtn', false, 'Sign In to Account');
                    triggerFormShake('loginForm');
                    if (failedLoginAttempts >= 3) startLockoutTimer();
                    else showToast(t('auth.invalidLogin', { n: 3 - failedLoginAttempts }), 'error');
                } else {
                    // Network down: verify against the local credential verifier only.
                    finishLocalLogin(email, password);
                }
            });
            return;
        }
        // API on but no phone on file — cannot call /auth/login; do not invent a session.
        setButtonLoading('loginSubmitBtn', false, 'Sign In to Account');
        showFieldError('loginEmailErr', t('auth.needPhone') || 'No mobile linked to this email on this device. Sign up once, or call the yard.');
        triggerFormShake('loginForm');
        return;
    }
    finishLocalLogin(email, password);
}

/**
 * Strip any legacy password material from the device user directory.
 * Passwords must never live in localStorage — server auth (GBApi) owns them.
 */
function scrubLocalUserSecrets() {
    try {
        const users = getSafeStorage('gb_users', []);
        if (!Array.isArray(users) || !users.length) return;
        let changed = false;
        const cleaned = users.map((u) => {
            if (!u || typeof u !== 'object') return u;
            if (!('password' in u) && !('passwordHash' in u) && !('pw' in u)) return u;
            changed = true;
            const next = Object.assign({}, u);
            delete next.password;
            delete next.passwordHash;
            delete next.pw;
            return next;
        });
        if (changed) setSafeStorage('gb_users', cleaned);
    } catch (_e) { /* ignore */ }
}

function finishLocalLogin(email, password) {
    scrubLocalUserSecrets();
    const fail = () => {
        failedLoginAttempts++;
        setButtonLoading('loginSubmitBtn', false, 'Sign In to Account');
        triggerFormShake('loginForm');
        if (failedLoginAttempts >= 3) startLockoutTimer();
        else showToast(t('auth.invalidLogin', { n: 3 - failedLoginAttempts }), 'error');
    };

    verifyLocalCredential(email, password).then((ok) => {
        if (!ok) { fail(); return; }
        const users = getSafeStorage('gb_users', []);
        const found = users.find(u => String(u.email || '').toLowerCase() === String(email).toLowerCase());
        if (!found) { fail(); return; }
        failedLoginAttempts = 0;
        loginSuccess({ name: found.name, email: found.email, mobile: found.mobile });
        showToast(t('auth.deviceSession') || 'Signed in on this device. Server password is not stored in the browser.', 'info');
    }).catch(() => { fail(); });
}

/** Device-only credential verifier (salted SHA-256). Plaintext is never stored. */
const AUTH_VERIFIER_KEY = 'gb_auth_verifiers';

function _toHex(buf) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function _sha256Hex(str) {
    const data = new TextEncoder().encode(str);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return _toHex(digest);
}

async function storeLocalCredential(email, password) {
    if (!email || !password || !window.crypto || !crypto.subtle) return false;
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = _toHex(saltBytes);
    const hash = await _sha256Hex(salt + '\0' + password);
    const map = getSafeStorage(AUTH_VERIFIER_KEY, {});
    map[String(email).toLowerCase()] = { salt, hash, at: Date.now() };
    setSafeStorage(AUTH_VERIFIER_KEY, map);
    return true;
}

async function verifyLocalCredential(email, password) {
    if (!email || !password || !window.crypto || !crypto.subtle) return false;
    const map = getSafeStorage(AUTH_VERIFIER_KEY, {});
    const entry = map[String(email).toLowerCase()];
    if (!entry || !entry.salt || !entry.hash) return false;
    const hash = await _sha256Hex(entry.salt + '\0' + password);
    return hash === entry.hash;
}

function startLockoutTimer() {
    const alertBox = document.getElementById('authLockoutAlert');
    const timerSpan = document.getElementById('lockoutTimer');
    if (alertBox) alertBox.classList.add('visible');
    let sec = 30;
    if (timerSpan) timerSpan.textContent = sec;

    clearInterval(lockoutTimerId);
    lockoutTimerId = setInterval(() => {
        sec--;
        if (timerSpan) timerSpan.textContent = sec;
        if (sec <= 0) {
            clearInterval(lockoutTimerId);
            failedLoginAttempts = 0;
            if (alertBox) alertBox.classList.remove('visible');
        }
    }, 1000);
}

function triggerFormShake(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.classList.add('auth-form-shake');
    setTimeout(() => form.classList.remove('auth-form-shake'), 450);
}

/** Platform API staff roles that may open the Operations Portal (UI gate only). */
const STAFF_ROLES = ['STAFF', 'SALES_MANAGER', 'ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN', 'owner', 'admin', 'accountant', 'sales_manager'];

function normalizeRole(role) {
    return String(role || 'CUSTOMER').toUpperCase();
}

function isStaffUser(u) {
    if (!u) return false;
    const r = normalizeRole(u.role);
    return STAFF_ROLES.some((s) => String(s).toUpperCase() === r);
}

function requireAuth(opts) {
    if (user) return true;
    if (typeof showToast === 'function') showToast(t('auth.requireLogin'), 'info');
    openAuth((opts && opts.tab) || 'login');
    return false;
}

function requireStaffAccess() {
    if (!requireAuth()) return false;
    if (isStaffUser(user)) return true;
    if (typeof showToast === 'function') showToast(t('auth.accessDenied'), 'error');
    return false;
}

/**
 * When Platform API is on and a JWT exists, re-validate via /auth/me.
 * Expired/invalid tokens clear the local session. Network failures keep the
 * offline profile so the storefront still works without inventing privileges.
 */
function validateServerSession() {
    if (!window.GBApi || !GBApi.enabled()) return Promise.resolve(user);
    const sess = GBApi.session();
    if (!sess || !sess.token) {
        // Stale local profile with no JWT — keep browsing as guest for private actions.
        return Promise.resolve(user);
    }
    return GBApi.me().then((su) => {
        if (!su) return user;
        user = Object.assign({}, user || {}, {
            id: su.id,
            name: su.name || (user && user.name),
            email: su.email || (user && user.email),
            mobile: su.phone || (user && user.mobile),
            role: su.role || 'CUSTOMER',
            tenantId: su.tenantId
        });
        delete user.password;
        persistUserSession(user, rememberUserSession);
        updateAuthUI();
        return user;
    }).catch((err) => {
        if (err && (err.code === 401 || err.code === 403)) {
            user = null;
            persistUserSession(null, false);
            GBApi.logout();
            updateAuthUI();
            if (typeof showToast === 'function') showToast(t('auth.sessionExpired'), 'warning');
        }
        return user;
    });
}

function loginSuccess(userData) {
    user = { ...userData };
    delete user.password;
    // Prefer role/id from the Platform JWT session when present.
    if (window.GBApi && GBApi.enabled()) {
        const su = (GBApi.session() || {}).user;
        if (su) {
            if (su.id) user.id = su.id;
            if (su.role) user.role = su.role;
            if (su.tenantId) user.tenantId = su.tenantId;
            if (su.phone && !user.mobile) user.mobile = su.phone;
        }
    }
    if (!user.role) user.role = 'CUSTOMER';
    const rememberEl = document.getElementById('rememberMe');
    rememberUserSession = rememberEl ? !!rememberEl.checked : true;
    persistUserSession(user, rememberUserSession);
    updateAuthUI();
    closeAuth();
    showToast(t('auth.welcome', { name: user.name }), 'success');
    prefillUserInCheckout();
}
function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName')?.value.trim();
    const mobile = document.getElementById('regMobile')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const confirm = document.getElementById('regConfirm')?.value;

    clearAuthErrors();
    let valid = true;
    if (!name || name.length < 2) { showFieldError('regNameErr', 'Enter your full name'); valid = false; }
    if (!mobile || !/^\d{10}$/.test(mobile.replace(/\D/g, ''))) { showFieldError('regMobileErr', 'Enter 10-digit mobile number'); valid = false; }
    if (!email || !/\S+@\S+\.\S+/.test(email)) { showFieldError('regEmailErr', 'Enter valid email'); valid = false; }
    if (!password || password.length < 6) { showFieldError('regPasswordErr', 'Password must be 6+ chars'); valid = false; }
    if (password !== confirm) { showFieldError('regConfirmErr', 'Passwords do not match'); valid = false; }
    const termsChk = document.getElementById('regTerms');
    const termsErr = document.getElementById('regTermsErr');
    if (termsChk && !termsChk.checked) {
        if (termsErr) termsErr.textContent = t('auth.termsRequired');
        valid = false;
    } else if (termsErr) { termsErr.textContent = ''; }

    if (!valid) {
        triggerFormShake('registerForm');
        return;
    }

    setButtonLoading('registerSubmitBtn', true, 'Creating Account...');

    // Server-first registration: real account with hashed password + JWT session.
    if (window.GBApi && GBApi.enabled()) {
        GBApi.register({ name, phone: mobile.replace(/\D/g, ''), password, email })
            .then(() => {
                const users = getSafeStorage('gb_users', []);
                if (!users.some(u => String(u.email || '').toLowerCase() === String(email).toLowerCase())) {
                    users.push({ name, mobile, email });
                    setSafeStorage('gb_users', users);
                }
                return storeLocalCredential(email, password);
            })
            .then(() => {
                setButtonLoading('registerSubmitBtn', false, 'Create Free Account');
                const su = (GBApi.session() || {}).user || {};
                loginSuccess({
                    id: su.id,
                    name: su.name || name,
                    mobile: su.phone || mobile,
                    email: su.email || email,
                    role: su.role || 'CUSTOMER',
                    tenantId: su.tenantId
                });
                GBApi.flushOutbox();
            })
            .catch(err => {
                setButtonLoading('registerSubmitBtn', false, 'Create Free Account');
                if (err.code === 409) { showFieldError('regMobileErr', 'Mobile already registered — sign in instead'); triggerFormShake('registerForm'); return; }
                if (err.code === 400) { showFieldError('regPasswordErr', err.message || 'Check the details and retry'); triggerFormShake('registerForm'); return; }
                showToast('Server unreachable — account created offline on this device.', 'info');
                finishLocalRegister(name, mobile, email, password);
            });
        return;
    }
    finishLocalRegister(name, mobile, email, password);
}

function finishLocalRegister(name, mobile, email, password) {
    const users = getSafeStorage('gb_users', []);
    if (users.some(u => String(u.email || '').toLowerCase() === String(email).toLowerCase())) {
        setButtonLoading('registerSubmitBtn', false, 'Create Free Account');
        showFieldError('regEmailErr', 'Email already registered');
        triggerFormShake('registerForm');
        return;
    }

    // Profile only in gb_users — never persist password plaintext here.
    // A salted SHA-256 verifier is stored separately under gb_auth_verifiers.
    const newUser = { name, mobile, email };
    users.push(newUser);
    setSafeStorage('gb_users', users);
    if (window.GBApi && GBApi.rememberEmail) GBApi.rememberEmail(email, mobile);

    storeLocalCredential(email, password).then(() => {
        loginSuccess({ name, mobile, email });
        setButtonLoading('registerSubmitBtn', false, 'Create Free Account');
        showToast(t('auth.created'), 'success');
    }).catch(() => {
        loginSuccess({ name, mobile, email });
        setButtonLoading('registerSubmitBtn', false, 'Create Free Account');
        showToast(t('auth.created'), 'success');
    });
}

function logoutUser() {
    user = null;
    persistUserSession(null, false);
    if (window.GBApi) GBApi.logout();
    updateAuthUI();
    closeUserDropdown();
    showToast(t('auth.signedOut'));
}

/**
 * Confirmed sign-out used by every "Sign Out" control in the storefront - the
 * account dropdown, the drawer and the profile hub all route through here so
 * there is exactly one confirmation, never two stacked dialogs.
 * The account menu is closed first so the sheet is not left behind the overlay.
 */
function requestSignOut() {
    closeUserDropdown();
    if (!window.GBDialogs) { logoutUser(); return; }
    GBDialogs.confirm({
        title: 'Sign out of this account?',
        message: 'Your cart, wishlist and saved sites stay on this device. You will need to sign in again to place an order.',
        confirmLabel: 'Sign Out',
        danger: true,
        onConfirm: function () { logoutUser(); }
    });
}

function updateAuthUI() {
    scrubLocalUserSecrets();
    const authBtns = document.getElementById('navAuthBtns');
    const userMenu = document.getElementById('navUserMenu');
    const drawerAuth = document.getElementById('drawerAuthBtns');
    const staff = isStaffUser(user);

    // Hide Operations Portal entry points from guests and retail customers.
    document.querySelectorAll('[data-ops-portal], .topbar-ops-btn').forEach((el) => {
        el.hidden = !staff;
        el.setAttribute('aria-hidden', staff ? 'false' : 'true');
        if (el.classList.contains('drawer-link')) {
            el.style.display = staff ? '' : 'none';
        }
    });

    if (user) {
        authBtns?.classList.add('hidden');
        userMenu?.classList.remove('hidden');
        const initial = user.name?.[0]?.toUpperCase() || 'U';

        const avatarInit = document.getElementById('navAvatarInitial');
        if (avatarInit) avatarInit.textContent = initial;
        const avatarSm = document.getElementById('navAvatar');
        if (avatarSm) avatarSm.style.background = getAvatarBg(user.name);

        const userNameEl = document.getElementById('navUserName');
        if (userNameEl) userNameEl.textContent = user.name?.split(' ')[0] || 'User';

        if (typeof fillAccountPopupIdentity === 'function') fillAccountPopupIdentity(user);
        else if (typeof refreshAccountPopupStats === 'function') refreshAccountPopupStats();

        if (drawerAuth) {
            drawerAuth.innerHTML =
                `<button type="button" class="btn btn-primary btn-full" onclick="openProfile();toggleDrawer()">My Account</button>` +
                `<button type="button" class="btn btn-ghost btn-full" onclick="requestSignOut();toggleDrawer()">Sign Out (${sanitizeHTML(user.name?.split(' ')[0] || '')})</button>`;
        }
        const mnLabel = document.getElementById('mnProfileLabel');
        if (mnLabel) mnLabel.textContent = user.name?.split(' ')[0] || 'Me';
    } else {
        authBtns?.classList.remove('hidden');
        userMenu?.classList.add('hidden');
        closeUserDropdown();
        if (drawerAuth) {
            drawerAuth.innerHTML =
                `<button type="button" class="btn btn-primary btn-full" onclick="openAuth('register');toggleDrawer()">Sign Up — Free</button>` +
                `<button type="button" class="btn btn-outline btn-full" onclick="openAuth('login');toggleDrawer()">Sign In</button>`;
        }
        const mnLabel = document.getElementById('mnProfileLabel');
        if (mnLabel) mnLabel.textContent = 'Profile';
    }
}

function handleMobileProfile() {
    if (!user) {
        openAuth('login');
        return;
    }
    // Toggle the account sheet (portaled) — works even when #navUserMenu is display:none.
    const dd = document.getElementById('userDropdown');
    if (dd && dd.classList.contains('open')) {
        closeUserDropdown();
        return;
    }
    if (typeof openUserDropdown === 'function') openUserDropdown();
    else if (typeof toggleUserDropdown === 'function') toggleUserDropdown();
    else openProfile();
}

function clearAuthErrors() {
    document.querySelectorAll('.auth-error-msg').forEach(e => e.textContent = '');
    document.querySelectorAll('.auth-input').forEach(i => i.classList.remove('error'));
}

function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = msg;
        el.parentElement.querySelector('input')?.classList.add('error');
    }
}

function setButtonLoading(id, loading, text) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = loading;
    const span = btn.querySelector('span');
    if (span) span.textContent = text;
}

function togglePw(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (!input || !btn) return;
    if (input.type === 'password') { input.type = 'text'; btn.innerHTML = _authEyeOffSVG; }
    else { input.type = 'password'; btn.innerHTML = _authEyeSVG; }
}

function checkPwStrength(pw) {
    const fill = document.getElementById('pwStrengthFill');
    const text = document.getElementById('pwStrengthText');
    if (!fill) return;
    const checks = [pw.length >= 6, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)];
    const score = checks.filter(Boolean).length;
    const levels = [{ w: '25%', c: '#e53e3e', l: 'Weak' }, { w: '50%', c: '#f59e0b', l: 'Fair' }, { w: '75%', c: '#3b82f6', l: 'Good' }, { w: '100%', c: '#16a34a', l: 'Strong' }];
    const lv = levels[score - 1] || levels[0];
    fill.style.width = score ? lv.w : '0%';
    fill.style.background = lv.c;
    if (text) {
        text.textContent = score ? lv.l : '';
        text.style.color = lv.c;
    }
}

/**
 * Account recovery.
 *
 * There is no password-reset endpoint on the Platform API (see docs/PLATFORM-API.md:
 * only /auth/register, /auth/login, /auth/dealer-register and /auth/me), and the
 * storefront has no mail transport. The previous version of this function showed
 * "Password reset link sent to your registered email!" without sending anything -
 * a fabricated confirmation on a security flow. It now states the limitation and
 * hands the customer to a channel that genuinely can reset the account.
 */
function handleForgotPw() {
    if (!window.GBDialogs) {
        showToast('Password reset is handled by our yard office. Please call +91 91989 23230.', 'info');
        return;
    }
    GBDialogs.confirm({
        title: 'Recover your account',
        message: 'Gurukripa does not send automatic password-reset links yet, so we cannot email you one. Our yard office resets access by hand - call or WhatsApp +91 91989 23230 with the mobile number on your account and we will set your sign-in up again.',
        confirmLabel: 'Call the Yard Office',
        cancelLabel: 'Not now',
        icon: 'warning'
    }).then(function (go) {
        if (!go) return;
        if (window.Platform && Platform.openExternal) Platform.openExternal('tel:+919198923230');
        else window.location.href = 'tel:+919198923230';
    });
}
