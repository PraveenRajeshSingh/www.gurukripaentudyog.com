// ══════════════════════════════════════════
// AUTH, OTP & PROFILE MODAL
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
        showToast('🔒 Account locked due to repeated failed attempts.', 'error');
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
                showToast(`❌ Invalid login. ${3 - failedLoginAttempts} attempt(s) remaining.`, 'error');
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
    showToast(`👋 Welcome back, ${user.name}!`, 'success');
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
        showToast('🎉 Account created successfully!', 'success');
    }, 1000);
}

function logoutUser() {
    user = null;
    localStorage.removeItem('gb_user');
    updateAuthUI();
    closeUserDropdown();
    showToast('👋 Signed out successfully.');
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
    showToast('📧 Password reset link sent to your registered email!', 'info');
}

// OTP Panel Logic
function setupOtpInputs() {
    const digits = document.querySelectorAll('.otp-digit');
    digits.forEach((d, idx) => {
        d.addEventListener('keyup', e => {
            if (e.key >= '0' && e.key <= '9') {
                d.classList.add('filled');
                if (idx < digits.length - 1) digits[idx + 1].focus();
            } else if (e.key === 'Backspace') {
                d.classList.remove('filled');
                if (idx > 0) digits[idx - 1].focus();
            }
        });
        d.addEventListener('paste', handleOtpPaste);
    });
}

function handleOtpPaste(e) {
    e.preventDefault();
    const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return;
    const digits = document.querySelectorAll('.otp-digit');
    pasteData.split('').forEach((char, idx) => {
        if (digits[idx]) {
            digits[idx].value = char;
            digits[idx].classList.add('filled');
        }
    });
    digits[5]?.focus();
}

function openOtpPanel() {
    const lp = document.getElementById('loginPanel');
    const rp = document.getElementById('registerPanel');
    const op = document.getElementById('otpPanel');
    if (lp) lp.style.display = 'none';
    if (rp) rp.style.display = 'none';
    if (op) op.style.display = 'block';
    const at = document.getElementById('authTitle');
    const as = document.getElementById('authSubtitle');
    if (at) at.textContent = 'OTP Sign In';
    if (as) as.textContent = 'Verify 6-digit code';
    setTimeout(() => document.querySelector('.otp-digit')?.focus(), 100);
}

function closeOtpPanel() {
    const op = document.getElementById('otpPanel');
    const lp = document.getElementById('loginPanel');
    if (op) op.style.display = 'none';
    if (lp) lp.style.display = 'block';
    const at = document.getElementById('authTitle');
    const as = document.getElementById('authSubtitle');
    if (at) at.textContent = 'Welcome Back';
    if (as) as.textContent = 'Sign in to your account';
}

function verifyOtp() {
    const digits = Array.from(document.querySelectorAll('.otp-digit')).map(d => d.value).join('');
    if (digits.length < 6) {
        showToast('❌ Please enter all 6 digits of your OTP.', 'error');
        return;
    }
    loginSuccess({ name: 'Verified Customer', email: 'user@gurukripa.in', mobile: '9198923230' });
    showToast('✅ OTP Verified!', 'success');
}

// PROFILE MODAL
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
    document.body.style.overflow = 'hidden';
    translateProfileModal();
}

function closeProfile() {
    document.getElementById('profileModal')?.classList.remove('open');
    document.body.style.overflow = '';
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

    if (!name || name.length < 2) { showToast('Please enter a valid name', 'error'); return; }
    if (!email || !/\S+@\S+\.\S+/.test(email)) { showToast('Please enter a valid email', 'error'); return; }

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
    showToast('✅ Profile updated successfully!', 'success');
}

function renderWishlistInProfile() {
    const container = document.getElementById('profileWishlistGrid');
    if (!container) return;
    const items = PRODUCTS.filter(p => wishlist.includes(p.id));
    if (!items.length) {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:24px;color:var(--ink-3);font-size:.85rem">No saved wishlist items.</div>';
        return;
    }
    container.innerHTML = items.map(item => `
        <div class="wishlist-item">
            <img class="wishlist-item-img" src="${item.img}" alt="${sanitizeHTML(item.name)}">
            <div style="flex:1;min-width:0">
                <div class="wishlist-item-name line-clamp-1">${sanitizeHTML(item.name)}</div>
                <div class="wishlist-item-price">₹${item.price}/${item.unit}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="addToCart(${item.id});showToast('Added to cart!')" style="padding:4px 8px;font-size:.72rem">Add</button>
        </div>
    `).join('');
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('profileModal')?.classList.contains('open')) {
        closeProfile();
    }
});
