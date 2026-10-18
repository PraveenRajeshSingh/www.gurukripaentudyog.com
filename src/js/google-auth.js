// ══════════════════════════════════════════
// GOOGLE SIGN-IN (Google Identity Services)
// Official OpenID Connect flow. Requires a Web OAuth Client ID from
// Google Cloud Console, supplied via <meta name="google-client-id">.
// When no Client ID is configured, the feature stays dormant and the
// button shows a setup notice instead of failing.
// Split from the original monolithic auth.js (SRP).
// Depends on: APP_CONFIG (state.js), getSafeStorage, setSafeStorage (state.js),
//             sanitizeHTML (state.js), loginSuccess (auth-modal.js),
//             showToast, t() (ui.js).
// ══════════════════════════════════════════

function decodeJwtPayload(token) {
    const part = (token || '').split('.')[1];
    if (!part) return null;
    try {
        const json = decodeURIComponent(atob(part.replace(/-/g, '+').replace(/_/g, '/'))
            .split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(json);
    } catch (e) { console.warn('Google credential decode failed:', e); return null; }
}

function loadGoogleGsi(cb) {
    if (window.google && window.google.accounts && window.google.accounts.id) { cb(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = cb;
    s.onerror = () => console.warn('Google Identity Services failed to load.');
    document.head.appendChild(s);
}

function initGoogleSignIn() {
    const clientId = APP_CONFIG.googleClientId;
    if (!clientId) return; // feature intentionally dormant until configured
    loadGoogleGsi(() => {
        try {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: onGoogleCredential,
                auto_select: false,
                cancel_on_tap_outside: true
            });
            const mounts = [document.getElementById('googleGsiBtn'), document.getElementById('googleGsiBtnReg')];
            let rendered = false;
            mounts.forEach(mount => {
                if (!mount) return;
                window.google.accounts.id.renderButton(mount, {
                    theme: 'outline', size: 'large', width: 300, text: 'signin_with', shape: 'pill'
                });
                mount.style.display = 'flex';
                rendered = true;
            });
            if (rendered) {
                ['googleCustomBtn', 'googleCustomBtnReg'].forEach(id => {
                    const custom = document.getElementById(id);
                    if (custom) custom.style.display = 'none';
                });
            }
        } catch (e) { console.warn('Google Sign-In init failed:', e); }
    });
}

function handleGoogleSignIn() {
    if (!APP_CONFIG.googleClientId) { showToast(t('auth.googleNotConfigured'), 'info'); return; }
    if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.prompt();
    } else {
        showToast(t('auth.googleUnavailable'), 'error');
    }
}

function onGoogleCredential(response) {
    const p = decodeJwtPayload(response && response.credential);
    if (!p || !p.email) { showToast(t('auth.googleUnavailable'), 'error'); return; }
    if (p.email_verified === false) { showToast(t('auth.googleUnavailable'), 'error'); return; }

    // Create or retrieve the account keyed on Google's stable sub (not email alone).
    const users = getSafeStorage('gb_users', []);
    let account = users.find(u => u.sub === p.sub);
    if (!account) {
        account = {
            sub: p.sub, name: p.name, email: p.email,
            picture: p.picture, verified: p.email_verified,
            provider: 'google', createdAt: Date.now()
        };
        users.push(account);
        setSafeStorage('gb_users', users);
    }

    failedLoginAttempts = 0;
    loginSuccess({ name: account.name, email: account.email, mobile: account.mobile || '', picture: account.picture, sub: account.sub });
    showToast(t('auth.googleSuccess', { name: sanitizeHTML(account.name?.split(' ')[0] || account.name) }), 'success');
}
