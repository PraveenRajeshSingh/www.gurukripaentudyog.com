// ══════════════════════════════════════════
// AUTH MODAL — Sign In / Sign Up / Lockout / Utilities
// Split from the original monolithic auth.js (SRP).
// All function names are globals preserved verbatim.
// Depends on: sanitizeHTML, getAvatarBg, getSafeStorage, setSafeStorage (state.js),
//             showToast (ui.js), t() (ui.js), prefillUserInCheckout (checkout.js),
//             closeUserDropdown (ui.js), toggleDrawer (ui.js),
//             closeOtpPanel (otp-panel.js), openProfile (profile-modal.js).
// ══════════════════════════════════════════
function openAuth(tab = 'login') {
    switchAuthTab(tab);
    closeOtpPanel();
    document.getElementById('authModal')?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeAuth() {
    document.getElementById('authModal')?.classList.remove('open');
    document.body.style.overflow = '';
}

function handleAuthOverlayClick(e) {
    if (e.target.id === 'authModal') closeAuth();
}

function switchAuthTab(tab, btn) {
    closeOtpPanel();
    const loginPanel = document.getElementById('loginPanel');
    const regPanel = document.getElementById('registerPanel');
    const tabLogin = document.getElementById('tabLogin');
    const tabReg = document.getElementById('tabRegister');
    if (!loginPanel || !regPanel) return;

    if (tab === 'login' || (btn && btn.id === 'tabLogin')) {
        loginPanel.style.display = 'block';
        regPanel.style.display = 'none';
        tabLogin?.classList.add('active');
        tabReg?.classList.remove('active');
        document.getElementById('authTitle').textContent = 'Welcome Back';
        document.getElementById('authSubtitle').textContent = 'Sign in to your account';
        document.getElementById('authBadge').textContent = '🔐';
    } else {
        loginPanel.style.display = 'none';
        regPanel.style.display = 'block';
        tabLogin?.classList.remove('active');
        tabReg?.classList.add('active');
        document.getElementById('authTitle').textContent = 'Create Account';
        document.getElementById('authSubtitle').textContent = 'Join Gurukripa Bricks today';
        document.getElementById('authBadge').textContent = '✨';
    }
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

    setTimeout(() => {
        const users = getSafeStorage('gb_users', []);
        const found = users.find(u => u.email === email);

        if (found) {
            failedLoginAttempts = 0;
            loginSuccess({ name: found.name, email: found.email, mobile: found.mobile });
        } else {
            failedLoginAttempts++;
            setButtonLoading('loginSubmitBtn', false, 'Sign In to Account →');
            triggerFormShake('loginForm');

            if (failedLoginAttempts >= 3) {
                startLockoutTimer();
            } else {
                showToast(t('auth.invalidLogin', { n: 3 - failedLoginAttempts }), 'error');
            }
        }
    }, 1000);
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

function loginSuccess(userData) {
    user = { ...userData };
    delete user.password;
    setSafeStorage('gb_user', user);
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

    setTimeout(() => {
        const users = getSafeStorage('gb_users', []);
        if (users.some(u => u.email === email)) {
            setButtonLoading('registerSubmitBtn', false, 'Create Free Account →');
            showFieldError('regEmailErr', 'Email already registered');
            triggerFormShake('registerForm');
            return;
        }

        const newUser = { name, mobile, email };
        users.push(newUser);
        setSafeStorage('gb_users', users);

        loginSuccess({ name, mobile, email });
        setButtonLoading('registerSubmitBtn', false, 'Create Free Account →');
        showToast(t('auth.created'), 'success');
    }, 1000);
}

function logoutUser() {
    user = null;
    localStorage.removeItem('gb_user');
    updateAuthUI();
    closeUserDropdown();
    showToast(t('auth.signedOut'));
}

function updateAuthUI() {
    const authBtns = document.getElementById('navAuthBtns');
    const userMenu = document.getElementById('navUserMenu');
    const drawerAuth = document.getElementById('drawerAuthBtns');

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
        const udNameEl = document.getElementById('udName');
        if (udNameEl) udNameEl.textContent = sanitizeHTML(user.name || 'User');
        const udEmailEl = document.getElementById('udEmail');
        if (udEmailEl) udEmailEl.textContent = sanitizeHTML(user.email || '');

        if (drawerAuth) drawerAuth.innerHTML = `<button class="btn btn-ghost btn-full" onclick="logoutUser();toggleDrawer()">Sign Out (${sanitizeHTML(user.name?.split(' ')[0])})</button>`;
        const mnLabel = document.getElementById('mnProfileLabel');
        if (mnLabel) mnLabel.textContent = user.name?.split(' ')[0] || 'Me';
    } else {
        authBtns?.classList.remove('hidden');
        userMenu?.classList.add('hidden');
        if (drawerAuth) drawerAuth.innerHTML = `<button class="btn btn-primary btn-full" onclick="openAuth('register');toggleDrawer()">Sign Up — Free</button><button class="btn btn-outline btn-full" onclick="openAuth('login');toggleDrawer()">Sign In</button>`;
        const mnLabel = document.getElementById('mnProfileLabel');
        if (mnLabel) mnLabel.textContent = 'Profile';
    }
}

function handleMobileProfile() { user ? openProfile() : openAuth('login'); }

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
    if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
    else { input.type = 'password'; btn.textContent = '👁️'; }
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

function handleForgotPw(e) {
    e.preventDefault();
    showToast(t('auth.resetSent'), 'info');
}
