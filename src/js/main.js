// ══════════════════════════════════════════
// MAIN BOOTSTRAP & APPLICATION INITIALIZATION
// ══════════════════════════════════════════

// ── Global error resilience ──────────────────────────────
// CHANGE: primary handlers live in reliability.js (ring buffer + Diagnostics).
// Keep a thin console mirror here so DevTools still shows [GBI] tags.
(function initGlobalErrorHandling() {
    window.addEventListener('error', (e) => {
        try { console.error('[GBI]', e.error || e.message || e); } catch (_) { /* ignore */ }
    });
    window.addEventListener('unhandledrejection', (e) => {
        try { console.error('[GBI] Unhandled promise rejection:', e.reason); } catch (_) { /* ignore */ }
    });
})();

// Run an init step in isolation so a single failing module cannot abort the
// rest of the page bootstrap (this is what causes "half-loaded" / laggy pages).
function safeRun(label, fn) {
    try {
        if (typeof fn === 'function') fn();
    } catch (err) {
        console.error(`[GBI] init "${label}" failed:`, err);
    }
}

// Main Bootstrap & Initialization
document.addEventListener('DOMContentLoaded', () => {
    const steps = {
        'ensureOverlaysClosedOnBoot': () => { if (typeof ensureOverlaysClosedOnBoot === 'function') ensureOverlaysClosedOnBoot(); },
        'renderProducts': () => renderProducts('all'),
        'updateCartUI': () => updateCartUI(),
        'updateWishlistBadges': () => { if (typeof updateWishlistBadges === 'function') updateWishlistBadges(); },
        'updateAuthUI': () => updateAuthUI(),
        'validateServerSession': () => { if (typeof validateServerSession === 'function') validateServerSession(); },
        'initScrollProgress': () => initScrollProgress(),
        'initCounters': () => initCounters(),
        'initNavHighlight': () => initNavHighlight(),
        'initScrollReveal': () => initScrollReveal(),
        'initTouchSwipe': () => initTouchSwipe(),
        'prefillUserInCheckout': () => prefillUserInCheckout(),
        'setLang': () => setLang(currentLang),
        'initGoogleSignIn': () => initGoogleSignIn(),
        'initAlerts': () => { if (window.PushNotifications) PushNotifications.init(); },
        'checkOrderStatus': () => { if (window.PushNotifications) PushNotifications.checkOrderStatusChanges(); },
        'renderOfflineOutbox': () => { if (window.WhatsAppOrder) WhatsAppOrder.renderQueuedNotice(); },
        'Platform.init': () => { if (window.Platform && typeof window.Platform.init === 'function') window.Platform.init(); },
        'ensureOverlaysClosedAfterInit': () => { if (typeof ensureOverlaysClosedOnBoot === 'function') ensureOverlaysClosedOnBoot(); }
    };
    Object.keys(steps).forEach((k) => safeRun(k, steps[k]));
});

// FAQ Accordion
function toggleFaq(btn) {
    const item = btn.closest('.faq-item');
    if (!item) return;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        const q = i.querySelector('.faq-q');
        if (q) q.setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
    }
}

// Contact Form Handler
// The static storefront has no message server, so this form must NOT pretend a
// send happened. It validates the enquiry, then hands the details to the kiln's
// real, always-working channel (WhatsApp) and tells the user the truth. Mirrors
// the honest handoff used by the estimator, cart and pincode checker.
function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('contactSubmitBtn');
    if (!btn || btn.disabled) return;

    const val = (id) => {
        const el = document.getElementById(id);
        return el && typeof el.value === 'string' ? el.value.trim() : '';
    };
    const name = val('cName');
    const email = val('cEmail');
    const phone = val('cPhone');
    const subjectEl = document.getElementById('cSubject');
    const subject = (subjectEl && subjectEl.selectedOptions && subjectEl.selectedOptions[0]
        ? subjectEl.selectedOptions[0].text : val('cSubject')) || 'General Inquiry';
    const message = val('cMessage');

    // Validation mirrors the visible required fields (see enquiry form rules).
    const problems = [];
    if (name.length < 2) problems.push('your full name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) problems.push('a valid email address');
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').slice(-10))) problems.push('a valid 10-digit mobile number');
    if (message.length < 5) problems.push('a short message');
    if (problems.length) {
        showToast(t('contact.provideFields', { fields: problems.join(', ') }), 'error');
        return;
    }

    const payload = {
        name, email, phone: phone.replace(/\D/g, '').slice(-10),
        subject, message, source: 'contact-form'
    };
    const text = encodeURIComponent(
        'Website enquiry\n' +
        'Name: ' + name + '\n' +
        'Phone: ' + phone + '\n' +
        'Email: ' + email + '\n' +
        'Subject: ' + subject + '\n' +
        'Message: ' + message
    );

    btn.disabled = true;
    btn.textContent = t('contact.opening');

    const openWhatsApp = () => {
        try {
            window.open('https://wa.me/919198923230?text=' + text, '_blank', 'noopener');
            showToast(t('contact.handedOff'), 'success');
            form.reset();
        } catch (err) {
            showToast(t('contact.handoffFailed'), 'error');
        }
        btn.disabled = false;
        btn.textContent = t('contact.sendBtn');
    };

    // Server-first when Platform API is configured; always hand off to WhatsApp after.
    if (window.GBApi && GBApi.enabled()) {
        const send = (captchaToken) => {
            const body = Object.assign({}, payload, captchaToken ? { captchaToken } : {});
            return GBApi.submitEnquiry(body).then(() => {
                showToast(t('contact.serverSaved') || 'Enquiry saved. Opening WhatsApp…', 'success');
                openWhatsApp();
            }).catch(() => {
                openWhatsApp();
            });
        };
        if (window.GBRecaptcha && GBRecaptcha.isEnabled()) {
            GBRecaptcha.getToken('enquiry').then(send).catch(function () { send(''); });
        } else {
            send('');
        }
        return;
    }
    openWhatsApp();
}

// Newsletter / rate updates: no mailing backend on the static site.
// Opens a pre-filled WhatsApp message so the yard can add the number to alerts.
function handleNewsletter(e) {
    e.preventDefault();
    const form = e.target;
    const input = form.querySelector('input');
    const status = document.getElementById('footerNewsStatus');
    const btn = document.getElementById('footerNewsBtn');
    if (!input) return;

    const setStatus = (msg, kind) => {
        if (!status) return;
        status.textContent = msg || '';
        status.classList.remove('is-error', 'is-success');
        if (kind) status.classList.add(kind);
    };

    let raw = input.value.trim().replace(/[\s\-()]/g, '');
    if (raw.startsWith('+91')) raw = raw.slice(3);
    if (raw.startsWith('91') && raw.length === 12) raw = raw.slice(2);
    if (!/^[6-9]\d{9}$/.test(raw)) {
        setStatus(t('footer.phoneInvalid') || 'Enter a valid 10-digit Indian mobile number.', 'is-error');
        input.focus();
        return;
    }

    if (btn) btn.classList.add('is-loading');
    setStatus(t('footer.phoneOpening') || 'Opening WhatsApp…', null);

    const text = encodeURIComponent(
        'Namaste Gurukripa Ent Udyog!\nPlease add +91' + raw +
        ' for brick rate updates and dispatch alerts.\nThank you.'
    );
    const url = 'https://wa.me/919198923230?text=' + text;
    try {
        window.open(url, '_blank', 'noopener,noreferrer');
        setStatus(t('footer.phoneSuccess') || 'WhatsApp opened — send the message to get rate updates.', 'is-success');
        if (typeof showToast === 'function') showToast(t('footer.phoneSuccess') || 'WhatsApp opened for rate updates.', 'success');
    } catch (_err) {
        setStatus(t('footer.phoneError') || 'Could not open WhatsApp. Call +91 91989 23230.', 'is-error');
    }
    if (btn) btn.classList.remove('is-loading');
}

// Bulk RFQ Modal Handlers
function openBulkQuoteModal() {
    const modal = document.getElementById('bulkQuoteModal');
    if (modal) {
        modal.classList.add('open');
        overlayLock();
    }
}

function closeBulkQuoteModal() {
    const modal = document.getElementById('bulkQuoteModal');
    if (modal) {
        modal.classList.remove('open');
        overlayUnlock();
    }
}

function collectBulkQuote() {
    const val = (id) => {
        const el = document.getElementById(id);
        return el && typeof el.value === 'string' ? el.value.trim() : '';
    };
    return {
        name: val('rfqName'),
        phone: val('rfqPhone'),
        company: val('rfqCompany'),
        gstin: val('rfqGstin'),
        product: val('rfqProduct'),
        qty: val('rfqQty'),
        site: val('rfqSite'),
        roadAccess: val('rfqRoad') || 'wide',
        unloadingReq: val('rfqUnload') || 'driver'
    };
}

function handleBulkQuoteSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('rfqSubmitBtn');
    const notice = document.getElementById('rfqResultNotice');
    if (btn) {
        if (btn.disabled) return;
        btn.disabled = true;
    }

    const payload = collectBulkQuote();

    let quote = null;
    try {
        if (window.GurukripaServices && window.GurukripaServices.QuotationService) {
            quote = window.GurukripaServices.QuotationService.submitRFQ(payload);
        }
    } catch (err) {
        console.error('[GBI] RFQ submit failed:', err); // falls back to manual notice below
    }

    const enquiryBody = {
        name: payload.name,
        phone: String(payload.phone || '').replace(/\D/g, '').slice(-10),
        company: payload.company,
        gstin: payload.gstin,
        product: payload.product,
        quantity: payload.qty,
        site: payload.site,
        roadAccess: payload.roadAccess,
        unloadingReq: payload.unloadingReq,
        subject: 'Bulk RFQ',
        message: `Bulk RFQ for ${payload.product || 'bricks'} × ${payload.qty} at ${payload.site}`,
        source: 'bulk-rfq',
        localQuoteId: quote ? quote.id : undefined
    };

    const finishUi = (opts) => {
        const pending = !!(opts && opts.pending);
        if (notice) {
            notice.style.display = 'block';
            notice.innerHTML = pending
                ? `⏳ Saved on this device as <strong>Pending, not sent yet</strong> (${quote ? quote.id : 'QT-LOCAL'}). Waiting to send when you are back online.`
                : `✓ RFQ Generated: <strong>${quote ? quote.id : 'QT-LOCAL'}</strong>. Our Jaunpur Bhatta Sales Manager will call ${sanitizeHTML(payload.phone)} within 30 minutes with official rate quote.`;
        }
        if (btn) {
            btn.disabled = false;
            btn.textContent = pending ? 'Saved — Waiting to send' : 'RFQ Successfully Sent ✓';
        }
        showToast(pending
            ? 'RFQ saved offline — not sent yet.'
            : 'Bulk Quotation Request Logged!', pending ? 'warning' : 'success');
        setTimeout(() => {
            closeBulkQuoteModal();
            e.target.reset();
            if (notice) notice.style.display = 'none';
            if (btn) btn.textContent = 'Submit Bulk RFQ Quotation Request →';
        }, pending ? 2200 : 3000);
    };

    // Offline: never claim "sent" — queue as Waiting to send
    if (!navigator.onLine) {
        const waMsg = [
            '*BULK RFQ — Gurukripa Bricks Industry*',
            quote && quote.id ? `Enquiry ref: *${quote.id}*` : '',
            `Name: ${payload.name}`,
            `Phone: ${payload.phone}`,
            `Quantity: ${payload.qty}`,
            `Site: ${payload.site}`
        ].filter(Boolean).join('\n');
        if (window.OfflineQueue) {
            OfflineQueue.enqueue('rfq', enquiryBody, {
                ref: quote ? quote.id : ('RFQ-' + Date.now()),
                message: waMsg,
                waLink: window.WhatsAppOrder ? WhatsAppOrder.buildLink(waMsg) : '',
                status: 'pending',
                label: 'Pending, not sent yet'
            }).then(() => finishUi({ pending: true }));
        } else {
            finishUi({ pending: true });
        }
        return;
    }

    if (window.GBApi && GBApi.enabled()) {
        const sendRfq = (captchaToken) => {
            const body = Object.assign({}, enquiryBody, captchaToken ? { captchaToken } : {});
            return GBApi.submitEnquiry(body).then(() => finishUi()).catch((err) => {
                if (err && err.code === 'network' && window.OfflineQueue) {
                    OfflineQueue.enqueue('rfq', body, {
                        ref: quote ? quote.id : undefined,
                        status: 'pending',
                        label: 'Pending, not sent yet'
                    }).then(() => finishUi({ pending: true }));
                } else {
                    finishUi();
                }
            });
        };
        if (window.GBRecaptcha && GBRecaptcha.isEnabled()) {
            GBRecaptcha.getToken('booking').then(sendRfq).catch(function () { sendRfq(''); });
        } else {
            sendRfq('');
        }
        return;
    }
    setTimeout(() => finishUi(), 600);
}

// One-tap WhatsApp route for the same form: the enquiry is logged locally first
// (identical record to the Submit button), then handed to the yard's WhatsApp so
// a builder on a feature phone can enquire without waiting for a call back.
function sendBulkQuoteViaWhatsApp() {
    const payload = collectBulkQuote();
    const labels = { name: 'your name', phone: 'phone number', qty: 'brick count', site: 'site address' };
    const missing = ['name', 'phone', 'qty', 'site'].filter((key) => !payload[key]);
    if (missing.length) {
        showToast('The yard needs ' + missing.map((key) => labels[key]).join(', ') + ' before it can quote a rate.', 'warning');
        return;
    }
    if (!window.WhatsAppOrder) {
        showToast('WhatsApp handoff unavailable — use “Submit Bulk RFQ”.', 'warning');
        return;
    }

    let quote = null;
    try {
        if (window.GurukripaServices && GurukripaServices.QuotationService) {
            quote = GurukripaServices.QuotationService.submitRFQ(payload);
        }
    } catch (err) {
        console.error('[GBI] RFQ log failed before WhatsApp handoff:', err);
    }

    const sel = document.getElementById('rfqProduct');
    const grade = (sel && sel.selectedOptions && sel.selectedOptions[0])
        ? sel.selectedOptions[0].text : payload.product;
    const gstin = payload.gstin.toUpperCase();
    const gstOk = gstin && (!window.BuyerProfile || BuyerProfile.validGstin(gstin).ok);

    const lines = ['*BULK RFQ — Gurukripa Bricks Industry*'];
    if (quote && quote.id) lines.push(`Enquiry ref: *${quote.id}*`);
    lines.push(`Name: ${payload.name}`);
    if (payload.company) lines.push(`Firm / Project: ${payload.company}`);
    lines.push(`Phone: ${payload.phone}`);
    lines.push(`Grade: ${grade}`);
    lines.push(`Quantity: ${formatNum(Number(payload.qty) || 0)} pcs`);
    lines.push(`Site: ${payload.site}`);
    lines.push(`Road access: ${payload.roadAccess === 'narrow' ? 'Narrow village road (mini trolley)' : 'Wide road (standard trolley)'}`);
    lines.push(`Unloading: ${payload.unloadingReq === 'self' ? 'Self-unloading at site' : 'Bhatta unloading labour required'}`);
    if (gstOk) lines.push(`GSTIN: ${gstin} — please bill in our firm name.`);
    else if (gstin) lines.push(`GSTIN on file (${gstin}) is not 15 characters — kindly check before invoicing.`);
    lines.push('');
    lines.push('Please share the latest rate and the next dispatch slot from the Jalalpur yard.');

    WhatsAppOrder.openLink(WhatsAppOrder.buildLink(lines.join('\n')));
    showToast(quote ? 'Enquiry opened in WhatsApp and logged on this device.' : 'Enquiry opened in WhatsApp.', 'success');
}

// Nav search is owned by CatalogDiscovery (suggestions, history, unified filters).
// Escape still clears the field when focused; overlay ESC stays in ui.js.
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('navSearch');
    if (!searchInput) return;
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.blur();
            searchInput.value = '';
            if (window.CatalogDiscovery) CatalogDiscovery.resetFilters();
            else renderProducts(currentFilter || 'all');
        }
    });
});


// ══════════════════════════════════════════════════════════════════
// PULL-TO-REFRESH DATA HANDLER
// Listens for 'gb:page-refresh' dispatched by pull-to-refresh.js.
// Reloads visible data without a full page reload.
// Dispatches 'gb:page-refresh-done' when complete so the PTR
// indicator can show success/error state.
// ══════════════════════════════════════════════════════════════════
document.addEventListener('gb:page-refresh', function handlePageRefresh() {
    var refreshCount = 0;
    var expectedCount = 0;
    var hasError = false;

    function done(success) {
        if (!success) hasError = true;
        refreshCount++;
        if (refreshCount >= expectedCount) {
            try {
                document.dispatchEvent(new CustomEvent('gb:page-refresh-done', {
                    bubbles: false,
                    detail: { success: !hasError }
                }));
            } catch (_e) {}
        }
    }

    // 1. Refresh daily prices / catalogue
    if (window.GurukripaCatalogPricing && typeof GurukripaCatalogPricing.syncFromApi === 'function') {
        expectedCount++;
        try {
            GurukripaCatalogPricing.syncFromApi();
            if (typeof renderDailyPrices === 'function') renderDailyPrices();
            if (typeof renderProducts === 'function') renderProducts(currentFilter || 'all');
            done(true);
        } catch (e) {
            done(false);
        }
    }

    // 2. Re-render cart UI with latest prices
    if (typeof updateCartUI === 'function') {
        expectedCount++;
        try {
            if (typeof syncCartWithLivePrices === 'function') syncCartWithLivePrices({ notify: false });
            updateCartUI();
            done(true);
        } catch (e) {
            done(false);
        }
    }

    // 3. Validate server session (re-auth check)
    if (typeof validateServerSession === 'function') {
        expectedCount++;
        try {
            validateServerSession();
            done(true);
        } catch (e) {
            done(false);
        }
    }

    // 4. If nothing was refreshed (no data modules), signal success via page reload
    if (expectedCount === 0) {
        try {
            document.dispatchEvent(new CustomEvent('gb:page-refresh-done', {
                bubbles: false,
                detail: { success: true }
            }));
        } catch (_e) {}
        // Graceful reload fallback after a short delay
        setTimeout(function () { window.location.reload(); }, 400);
    }
});
