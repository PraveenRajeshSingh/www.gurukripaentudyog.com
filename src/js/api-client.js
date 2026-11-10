// ══════════════════════════════════════════
// API CLIENT — Gurukripa Platform API (docs/PLATFORM-API.md)
// Server-first client with honest local fallback:
//   • Disabled until APP_CONFIG.apiBase is configured (meta name="gb-api-base").
//   • When enabled: real auth sessions (JWT), server-stored enquiries/orders.
//   • When the network fails: write operations are queued in an outbox and
//     replayed automatically on reconnect; reads fall back to local data.
// Depends on: APP_CONFIG, getSafeStorage, setSafeStorage (state.js).
// Exposed as window.GBApi for use by auth-modal, enquiry flows and profile.
// ══════════════════════════════════════════
const GBApi = (() => {
    const OUTBOX_KEY = 'gb_api_outbox';
    const SESSION_KEY = 'gb_session';
    const EMAIL_PHONE_KEY = 'gb_email_map';

    const base = () => (APP_CONFIG.apiBase || '').replace(/\/+$/, '');
    const enabled = () => !!base();

    // ---------- session ----------
    function session() { return getSafeStorage(SESSION_KEY, null); }
    function setSession(s) { setSafeStorage(SESSION_KEY, s); }
    function clearSession() { localStorage.removeItem(SESSION_KEY); localStorage.removeItem('gb_user'); }
    function token() { return session()?.token || ''; }

    // ---------- core request ----------
    async function request(path, { method = 'GET', body, auth = true, timeoutMs = 10000 } = {}) {
        if (!enabled()) { const e = new Error('API not configured'); e.code = 'disabled'; throw e; }
        const headers = { 'content-type': 'application/json' };
        if (auth && token()) headers.authorization = 'Bearer ' + token();
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        try {
            const res = await fetch(base() + path, {
                method, headers, signal: ctrl.signal,
                body: body === undefined ? undefined : JSON.stringify(body),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                const err = new Error(json.message || json.error || ('HTTP ' + res.status));
                err.code = res.status;
                throw err;
            }
            return json;
        } catch (err) {
            if (err.name === 'AbortError') { const e = new Error('Request timed out'); e.code = 'network'; throw e; }
            if (!err.code) err.code = 'network'; // fetch rejection = offline/DNS/CORS
            throw err;
        } finally { clearTimeout(timer); }
    }

    // ---------- auth ----------
    async function register({ name, phone, password, email, language, captchaToken }) {
        const data = await request('/auth/register', {
            method: 'POST',
            body: { name, phone, password, email, language, captchaToken, tenantSlug: 'gurukripa' },
            auth: false,
        });
        rememberEmail(data.user.email || email, data.user.phone);
        setSession({ token: data.token, user: data.user });
        return data.user;
    }

    async function login({ phone, password, captchaToken }) {
        const data = await request('/auth/login', {
            method: 'POST',
            body: { phone, password, captchaToken },
            auth: false,
        });
        rememberEmail(data.user.email, data.user.phone);
        setSession({ token: data.token, user: data.user });
        return data.user;
    }

    async function registerDealer(dto) {
        const data = await request('/auth/dealer-register', {
            method: 'POST',
            body: { ...dto, tenantSlug: 'gurukripa' },
            auth: false,
        });
        setSession({ token: data.token, user: data.user });
        return { user: data.user, dealerStatus: data.dealerStatus };
    }

    /** Server-side cart price/stock revalidation before checkout confirm. */
    async function validateCart(lines) {
        return request('/tenants/gurukripa/cart/validate', {
            method: 'POST',
            body: { lines: lines || [] },
            auth: false,
        });
    }

    async function me() { return request('/auth/me'); }

    function logout() { clearSession(); }

    // email→phone mapping: the storefront logs in by email, the platform API by phone.
    function rememberEmail(email, phone) {
        if (!email || !phone) return;
        const map = getSafeStorage(EMAIL_PHONE_KEY, {});
        map[email.toLowerCase()] = phone;
        setSafeStorage(EMAIL_PHONE_KEY, map);
    }
    function phoneFor(email) { return getSafeStorage(EMAIL_PHONE_KEY, {})[String(email).toLowerCase()] || ''; }

    // ---------- customer data ----------
    const endpoints = {
        profile: () => request('/me/profile'),
        updateProfile: (patch) => request('/me/profile', { method: 'PATCH', body: patch }),
        addresses: () => request('/me/addresses'),
        addAddress: (a) => request('/me/addresses', { method: 'POST', body: a }),
        removeAddress: (id) => request('/me/addresses/' + id, { method: 'DELETE' }),
        enquiries: () => request('/me/enquiries'),
        enquiry: (id) => request('/me/enquiries/' + id),
        quotations: () => request('/me/quotations'),
        quotation: (id) => request('/me/quotations/' + id),
        approveQuotation: (id) => request('/me/quotations/' + id + '/approve', { method: 'POST', body: {} }),
        rejectQuotation: (id, reason) => request('/me/quotations/' + id + '/reject', { method: 'POST', body: { reason } }),
        orders: () => request('/me/orders'),
        order: (id) => request('/me/orders/' + id),
        invoice: (id) => request('/me/orders/' + id + '/invoice'),
        cancelOrder: (id, reason) => request('/me/orders/' + id + '/cancel', { method: 'POST', body: { reason } }),
        reorder: (id) => request('/me/orders/' + id + '/reorder', { method: 'POST', body: {} }),
        notifications: () => request('/me/notifications'),
        markNotificationsRead: () => request('/me/notifications/read-all', { method: 'POST', body: {} }),
        registerDevice: (token, platform, preferences) => request('/me/devices', { method: 'POST', body: { token, platform, preferences } }),
        dealerOverview: () => request('/me/dealer/overview'),
        savedSites: () => request('/me/dealer/sites'),
        addSavedSite: (s) => request('/me/dealer/sites', { method: 'POST', body: s }),
    };

    // ---------- enquiries (server-first, outbox on network failure) ----------
    async function submitEnquiry(payload) {
        const path = token() ? '/me/enquiries' : '/public/enquiries';
        try {
            return await request(path, { method: 'POST', body: payload });
        } catch (err) {
            if (err.code === 'network') queue(path, payload);
            throw err;
        }
    }

    // ---------- offline outbox ----------
    function queue(path, payload) {
        const items = getSafeStorage(OUTBOX_KEY, []);
        items.push({ path, payload, at: new Date().toISOString() });
        setSafeStorage(OUTBOX_KEY, items);
    }

    async function flushOutbox() {
        if (!enabled() || !navigator.onLine) return 0;
        const items = getSafeStorage(OUTBOX_KEY, []);
        if (!items.length) return 0;
        const remaining = [];
        let sent = 0;
        for (const item of items) {
            try { await request(item.path, { method: 'POST', body: item.payload }); sent++; }
            catch (err) {
                if (err.code === 'network') { remaining.push(item); } // still offline: retry later
                // 4xx payloads are kept out of the loop; surfaced via console for support triage
                else console.warn('[api] outbox entry rejected:', item.path, err.message);
            }
        }
        setSafeStorage(OUTBOX_KEY, remaining);
        if (sent) typeof showToast === 'function' && showToast(`Synced ${sent} saved offline request${sent > 1 ? 's' : ''}.`, 'success');
        return sent;
    }

    function pendingOutboxCount() { return getSafeStorage(OUTBOX_KEY, []).length; }

    // Public catalog reads used to hydrate offline-first screens.
    const publicApi = {
        products: () => request('/public/products', { auth: false }),
        categories: () => request('/public/products/categories', { auth: false }),
        announcements: () => request('/public/announcements', { auth: false }),
        estimate: (params) => request('/calculator/estimate', { method: 'POST', body: params, auth: false }),
    };

    window.addEventListener('online', () => flushOutbox());

    return {
        enabled, request, session, token, logout, flushOutbox, pendingOutboxCount, phoneFor, rememberEmail,
        register, login, registerDealer, me, submitEnquiry, validateCart, endpoints, public: publicApi,
    };
})();
window.GBApi = GBApi;
