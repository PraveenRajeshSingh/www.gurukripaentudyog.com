// ══════════════════════════════════════════
// MAIN BOOTSTRAP & APPLICATION INITIALIZATION
// ══════════════════════════════════════════

// ── Global error resilience ──────────────────────────────
// One unexpected error should never leave a customer staring at a broken,
// frozen page. We log the technical detail for developers and show a calm,
// friendly message to the user (rate-limited so it can never spam).
(function initGlobalErrorHandling() {
    let lastNotice = 0;
    const notify = () => {
        const now = Date.now();
        if (now - lastNotice < 8000) return; // max one notice per 8s
        lastNotice = now;
        try {
            if (typeof showToast === 'function') {
                showToast('Something didn\u2019t load as expected. Please pull down to refresh \u2014 your cart &amp; details are safe.', 'error');
            }
        } catch (_) { /* never let the error handler itself throw */ }
    };
    window.addEventListener('error', (e) => {
        console.error('[GBI]', e.error || e.message || e);
        if (e.error) notify(); // ignore benign resource load failures
    });
    window.addEventListener('unhandledrejection', (e) => {
        console.error('[GBI] Unhandled promise rejection:', e.reason);
        notify();
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
        'Platform.init': () => { if (window.Platform && typeof window.Platform.init === 'function') window.Platform.init(); }
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
        GBApi.submitEnquiry(payload).then(() => {
            showToast(t('contact.serverSaved') || 'Enquiry saved. Opening WhatsApp…', 'success');
            openWhatsApp();
        }).catch(() => {
            openWhatsApp();
        });
        return;
    }
    openWhatsApp();
}

// Newsletter: there is no mailing backend on the static site, so instead of a
// fake "subscribed" toast we open the visitor's mail app addressed to the yard
// office. Honest, and the request genuinely reaches the business.
function handleNewsletter(e) {
    e.preventDefault();
    const input = e.target.querySelector('input');
    if (!input) return;
    const email = input.value.trim();
    if (!email || !/\S+@\S+\.\S+/.test(email)) { showToast(t('toast.invalidEmail'), 'error'); return; }
    window.location.href = 'mailto:info@gurukripaentudyog.com?subject=' +
        encodeURIComponent('Newsletter signup request') +
        '&body=' + encodeURIComponent('Please add ' + email + ' to your offers & new-rate alerts.');
    showToast(t('toast.newsletterHandoff'), 'info');
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
        GBApi.submitEnquiry(enquiryBody).then(() => finishUi()).catch((err) => {
            if (err && err.code === 'network' && window.OfflineQueue) {
                OfflineQueue.enqueue('rfq', enquiryBody, {
                    ref: quote ? quote.id : undefined,
                    status: 'pending',
                    label: 'Pending, not sent yet'
                }).then(() => finishUi({ pending: true }));
            } else {
                finishUi();
            }
        });
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
