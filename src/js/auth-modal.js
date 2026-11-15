// ══════════════════════════════════════════
// AUTH MODAL — Sign In / Sign Up / Lockout / Utilities
// Split from the original monolithic auth.js (SRP).
// All function names are globals preserved verbatim.
// Depends on: sanitizeHTML, getAvatarBg, getSafeStorage, setSafeStorage (state.js),
//             showToast (ui.js), t() (ui.js), prefillUserInCheckout (checkout.js),
//             closeUserDropdown (ui.js), toggleDrawer (ui.js),
//             openProfile (profile-modal.js), GBDialogs (dialogs.js).
// ══════════════════════════════════════════
const _authEyeSVG = `<svg class="icon" aria-hidden="true"><use href="#i-eye"/></svg>`;
const _authEyeOffSVG = `<svg class="icon" aria-hidden="true"><use href="#i-eye-off"/></svg>`;
const _authLockSVG = `<svg class="icon icon--md" aria-hidden="true"><use href="#i-lock"/></svg>`;
const _authStarSVG = `<svg class="icon icon--md" aria-hidden="true"><use href="#i-star"/></svg>`;
const _authShieldSVG = `<svg class="icon icon--md" aria-hidden="true"><use href="#i-shield"/></svg>`;

function openAuth(tab = 'login') {
    // Avoid stacked sheets covering the auth form (legal, profile, tracker…).
    if (typeof closeAllModalOverlays === 'function') {
        document.querySelectorAll('.modal-overlay.open').forEach(function (el) {
            if (el.id !== 'authModal') closeOverlay(el);
        });
    }
    if (window.GBAuthUi && typeof GBAuthUi.mount === 'function') GBAuthUi.mount();
    switchAuthTab(tab);
    if (typeof openOverlay === 'function') openOverlay('authModal');
    else {
        document.getElementById('authModal')?.classList.add('open');
        overlayLock();
    }
    setTimeout(function () {
        const panelId = tab === 'register' ? 'registerPanel'
            : tab === 'recover' ? 'recoverPanel'
            : tab === 'reset' ? 'resetPanel'
            : 'loginPanel';
        const panel = document.getElementById(panelId);
        const first = panel && panel.querySelector('input:not([type="checkbox"]):not([type="hidden"]):not([disabled])');
        if (first) try { first.focus({ preventScroll: true }); } catch (_e) {}
        const body = document.querySelector('#authModal .modal-body');
        if (body) body.scrollTop = 0;
        if (window.GBAuthUi) GBAuthUi.syncFloatFields();
    }, 60);
}

function closeAuth() {
    if (typeof closeOverlay === 'function') closeOverlay('authModal');
    else {
        document.getElementById('authModal')?.classList.remove('open');
        overlayUnlock();
    }
}

function handleAuthOverlayClick(e) {
    if (e.target.id === 'authModal') closeAuth();
}

function switchAuthTab(tab, btn) {
    const loginPanel = document.getElementById('loginPanel');
    const regPanel = document.getElementById('registerPanel');
    const recoverPanel = document.getElementById('recoverPanel');
    const resetPanel = document.getElementById('resetPanel');
    const tabLogin = document.getElementById('tabLogin');
    const tabReg = document.getElementById('tabRegister');
    const tabsBar = document.getElementById('authTabs');
    if (!loginPanel || !regPanel) return;

    let step = 'login';
    if (btn && btn.id === 'tabRegister') step = 'register';
    else if (btn && btn.id === 'tabLogin') step = 'login';
    else if (tab === 'register' || tab === 'login' || tab === 'recover' || tab === 'reset') step = tab;

    const showLogin = step === 'login';
    const showRegister = step === 'register';
    const showRecover = step === 'recover';
    const showReset = step === 'reset';

    loginPanel.hidden = !showLogin;
    regPanel.hidden = !showRegister;
    if (recoverPanel) recoverPanel.hidden = !showRecover;
    if (resetPanel) resetPanel.hidden = !showReset;

    if (tabsBar) tabsBar.hidden = showRecover || showReset;
    tabLogin?.classList.toggle('active', showLogin);
    tabReg?.classList.toggle('active', showRegister);
    showLogin ? tabLogin?.setAttribute('aria-current', 'true') : tabLogin?.removeAttribute('aria-current');
    showRegister ? tabReg?.setAttribute('aria-current', 'true') : tabReg?.removeAttribute('aria-current');

    const title = document.getElementById('authTitle');
    const sub = document.getElementById('authSubtitle');
    const badge = document.getElementById('authBadge');
    if (showRecover) {
        if (title) title.textContent = t('auth.recoverTitle') || 'Recover your account';
        if (sub) sub.textContent = t('auth.recoverSub') || 'Yard office resets access by hand';
        if (badge) badge.innerHTML = _authShieldSVG;
    } else if (showReset) {
        if (title) title.textContent = t('auth.resetTitle') || 'Reset password';
        if (sub) sub.textContent = t('auth.resetSub') || 'Coming soon — no reset API yet';
        if (badge) badge.innerHTML = _authLockSVG;
    } else {
        if (title) title.textContent = t(showLogin ? 'auth.signInTitle' : 'auth.signUpTitle');
        if (sub) sub.textContent = t(showLogin ? 'auth.signInSub' : 'auth.signUpSub');
        if (badge) badge.innerHTML = showLogin ? _authLockSVG : _authStarSVG;
    }

    const activePanel = showRecover ? recoverPanel
        : showReset ? resetPanel
        : showRegister ? regPanel
        : loginPanel;
    if (window.GBAuthUi && activePanel) {
        GBAuthUi.animatePanel(activePanel, (showRecover || showReset) ? 'forward' : (showRegister ? 'forward' : 'back'));
    }

    clearAuthErrors();
    const body = document.querySelector('#authModal .modal-body');
    if (body) body.scrollTop = 0;
    setTimeout(function () {
        const panel = activePanel;
        const first = panel && panel.querySelector('input:not([type="checkbox"]):not([type="hidden"]):not([disabled]), button:not([disabled]), a[href]');
        if (first && document.getElementById('authModal')?.classList.contains('open')) {
            try { first.focus({ preventScroll: true }); } catch (_e) {}
        }
        if (window.GBAuthUi) GBAuthUi.syncFloatFields();
    }, 40);
}

/** Open the honest recover step (no fake email/OTP). */
function openAuthRecover() {
    openAuth('recover');
}

/** UI-kit / preview only — reset fields stay disabled. */
function openAuthResetPreview() {
    switchAuthTab('reset');
}

/** Submit is intentionally a no-op — there is no reset API. */
function handleResetPasswordPreview(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (typeof showToast === 'function') {
        showToast(t('auth.resetUnavailable') || 'Self-service reset is not available yet. Please call the yard.', 'info');
    }
    return false;
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
    const submitBtn = document.getElementById('loginSubmitBtn');
    if (submitBtn && (submitBtn.disabled || submitBtn.getAttribute('aria-busy') === 'true')) return;
    if (failedLoginAttempts >= 3) {
        triggerFormShake('loginForm');
        showToast(t('auth.locked'), 'error');
        return;
    }

    const identifier = (document.getElementById('loginEmail')?.value || '').trim();
    const password = document.getElementById('loginPassword')?.value;
    clearAuthErrors();

    const digits = identifier.replace(/\D/g, '').slice(-10);
    const isPhone = /^\d{10}$/.test(digits) && !identifier.includes('@');
    const isEmail = /\S+@\S+\.\S+/.test(identifier);

    let valid = true;
    if (!isPhone && !isEmail) {
        showFieldError('loginEmailErr', 'Enter a valid email or 10-digit mobile number');
        valid = false;
    }
    if (!password || password.length < 6) {
        showFieldError('loginPasswordErr', 'Password must be 6+ characters');
        valid = false;
    }
    if (!valid) {
        triggerFormShake('loginForm');
        return;
    }

    const email = isEmail ? identifier : '';
    setButtonLoading('loginSubmitBtn', true, 'Signing in...');

    // Server-first sign-in when the Platform API is configured (docs/PLATFORM-API.md).
    // Phone can be entered directly, or resolved from the email→phone map.
    if (window.GBApi && GBApi.enabled()) {
        const phone = isPhone ? digits : resolveLoginPhone(email);
        if (phone && phone.length === 10) {
            const runLogin = (captchaToken) => GBApi.login({ phone, password, captchaToken }).then(su => {
                failedLoginAttempts = 0;
                loginSuccess({
                    id: su.id,
                    name: su.name,
                    email: su.email || email || '',
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
                } else if (err.code === 400 && /CAPTCHA|captcha/i.test(String(err.message || ''))) {
                    setButtonLoading('loginSubmitBtn', false, 'Sign In to Account');
                    showToast(err.message || t('auth.captchaFailed') || 'CAPTCHA failed. Refresh and try again.', 'error');
                    triggerFormShake('loginForm');
                } else if (isEmail) {
                    // Network down: verify against the local credential verifier only.
                    finishLocalLogin(email, password);
                } else {
                    setButtonLoading('loginSubmitBtn', false, 'Sign In to Account');
                    showToast(t('auth.invalidLogin', { n: 3 - failedLoginAttempts }) || 'Sign-in failed. Check mobile and password.', 'error');
                    triggerFormShake('loginForm');
                }
            });
            if (window.GBRecaptcha && GBRecaptcha.isEnabled()) {
                GBRecaptcha.getToken('login').then(runLogin).catch(function () { runLogin(''); });
            } else {
                runLogin('');
            }
            return;
        }
        // API on but no phone on file — cannot call /auth/login; do not invent a session.
        setButtonLoading('loginSubmitBtn', false, 'Sign In to Account');
        showFieldError('loginEmailErr', t('auth.needPhone') || 'No mobile linked to this email on this device. Sign up once, or call the yard.');
        triggerFormShake('loginForm');
        return;
    }
    if (!isEmail) {
        setButtonLoading('loginSubmitBtn', false, 'Sign In to Account');
        showFieldError('loginEmailErr', 'Offline sign-in needs your registered email on this device.');
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
    // Prefer RoleAccess so CUSTOMER/DEALER never inherit yard console access.
    if (window.RoleAccess && typeof RoleAccess.isStaffLike === 'function') {
        return RoleAccess.isStaffLike(u) || RoleAccess.isManagerLike(u) || RoleAccess.isAdminLike(u);
    }
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
    const submitBtn = document.getElementById('regSubmitBtn') || document.querySelector('#registerForm button[type="submit"]');
    if (submitBtn && (submitBtn.disabled || submitBtn.getAttribute('aria-busy') === 'true')) return;
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
        const phoneDigits = mobile.replace(/\D/g, '');
        const runRegister = (captchaToken) => GBApi.register({
            name, phone: phoneDigits, password, email, captchaToken,
        })
            .then(() => {
                const users = getSafeStorage('gb_users', []);
                if (!users.some(u => String(u.email || '').toLowerCase() === String(email).toLowerCase())) {
                    users.push({ name, mobile, email });
                    setSafeStorage('gb_users', users);
                }
                return storeLocalCredential(email, password);
            })
            .then(() => {
                setButtonLoading('registerSubmitBtn', false, 'Create Account');
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
                setButtonLoading('registerSubmitBtn', false, 'Create Account');
                if (err.code === 409) { showFieldError('regMobileErr', 'Mobile already registered — sign in instead'); triggerFormShake('registerForm'); return; }
                if (err.code === 400) { showFieldError('regPasswordErr', err.message || 'Check the details and retry'); triggerFormShake('registerForm'); return; }
                showToast('Server unreachable — account created offline on this device.', 'info');
                finishLocalRegister(name, mobile, email, password);
            });
        if (window.GBRecaptcha && GBRecaptcha.isEnabled()) {
            GBRecaptcha.getToken('register').then(runRegister).catch(function () { runRegister(''); });
        } else {
            runRegister('');
        }
        return;
    }
    finishLocalRegister(name, mobile, email, password);
}

function finishLocalRegister(name, mobile, email, password) {
    const users = getSafeStorage('gb_users', []);
    if (users.some(u => String(u.email || '').toLowerCase() === String(email).toLowerCase())) {
        setButtonLoading('registerSubmitBtn', false, 'Create Account');
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
        setButtonLoading('registerSubmitBtn', false, 'Create Account');
        showToast(t('auth.created'), 'success');
    }).catch(() => {
        loginSuccess({ name, mobile, email });
        setButtonLoading('registerSubmitBtn', false, 'Create Account');
        showToast(t('auth.created'), 'success');
    });
}

function logoutUser() {
    user = null;
    persistUserSession(null, false);
    if (window.GBApi) GBApi.logout();
    // Clear user-specific IndexedDB / outbox; keep public catalogue + shell caches
    if (window.GbiPwa && typeof GbiPwa.clearUserSpecificData === 'function') {
        try { GbiPwa.clearUserSpecificData(); } catch (_e) { /* ignore */ }
    }
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
    // Role-based chrome: customer tools stay visible; ops portal staff+ only.
    if (window.RoleAccess && typeof RoleAccess.applyVisibility === 'function') {
        RoleAccess.applyVisibility();
    } else {
        const staff = isStaffUser(user);
        document.querySelectorAll('[data-ops-portal], .topbar-ops-btn').forEach((el) => {
            el.hidden = !staff;
            el.setAttribute('aria-hidden', staff ? 'false' : 'true');
            if (el.classList.contains('drawer-link')) {
                el.style.display = staff ? '' : 'none';
            }
        });
    }

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
                `<button type="button" class="btn btn-primary btn-full" onclick="openProfileFromDrawer()">My Account</button>` +
                `<button type="button" class="btn btn-ghost btn-full" onclick="closeDrawerIfOpen();requestSignOut()">Sign Out (${sanitizeHTML(user.name?.split(' ')[0] || '')})</button>`;
        }
        const mnLabel = document.getElementById('mnProfileLabel');
        if (mnLabel) mnLabel.textContent = user.name?.split(' ')[0] || 'Me';
    } else {
        authBtns?.classList.remove('hidden');
        userMenu?.classList.add('hidden');
        closeUserDropdown();
        if (drawerAuth) {
            drawerAuth.innerHTML =
                `<button type="button" class="btn btn-primary btn-full" onclick="openAuthFromDrawer('register')">Sign Up — Free</button>` +
                `<button type="button" class="btn btn-outline btn-full" onclick="openAuthFromDrawer('login')">Sign In</button>`;
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
    if (!el) return;
    el.textContent = msg;
    const field = el.closest('.auth-field') || el.parentElement;
    field?.querySelector('input')?.classList.add('error');
}

function setButtonLoading(id, loading, text) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = loading;
    btn.setAttribute('aria-busy', loading ? 'true' : 'false');
    btn.classList.toggle('is-busy', !!loading);
    const span = btn.querySelector('.auth-submit-label') || btn.querySelector('span');
    if (span) span.textContent = text;
    const spinner = btn.querySelector('.icon-spin');
    if (spinner) spinner.hidden = !loading;
    const arrow = btn.querySelector('.auth-submit-arrow');
    if (arrow) arrow.hidden = !!loading;
}

function togglePw(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (!input || !btn) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = show ? _authEyeOffSVG : _authEyeSVG;
    btn.setAttribute('aria-pressed', show ? 'true' : 'false');
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}

function checkPwStrength(pw) {
    const fill = document.getElementById('pwStrengthFill');
    const text = document.getElementById('pwStrengthText');
    if (!fill) return;
    const raw = String(pw || '');
    const rules = {
        length: raw.length >= 6,
        case: /[A-Z]/.test(raw) && /[a-z]/.test(raw),
        number: /[0-9]/.test(raw),
        symbol: /[^A-Za-z0-9]/.test(raw)
    };
    const score = Object.keys(rules).filter(function (k) { return rules[k]; }).length;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    fill.style.width = score ? (score * 25) + '%' : '0%';
    fill.setAttribute('data-level', String(score));
    // Prefer token-driven colors via data-level CSS; clear inline override if present.
    fill.style.background = '';
    if (text) {
        text.textContent = score ? labels[score] : '';
        text.style.color = '';
    }
    document.querySelectorAll('#pwRulesList [data-rule]').forEach(function (li) {
        const key = li.getAttribute('data-rule');
        li.classList.toggle('is-met', !!rules[key]);
    });
    if (window.GBAuthUi) GBAuthUi.updatePasswordMatch();
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
    // Prefer the in-modal recover step (presentation upgrade). Fallback: prior dialog.
    const recover = document.getElementById('recoverPanel');
    if (recover) {
        openAuthRecover();
        return;
    }
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
