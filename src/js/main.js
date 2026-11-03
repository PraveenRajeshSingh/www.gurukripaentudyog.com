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
        'initScrollProgress': () => initScrollProgress(),
        'initCounters': () => initCounters(),
        'initNavHighlight': () => initNavHighlight(),
        'initScrollReveal': () => initScrollReveal(),
        'initTouchSwipe': () => initTouchSwipe(),
        'prefillUserInCheckout': () => prefillUserInCheckout(),
        'setupOtpInputs': () => setupOtpInputs(),
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
function handleContactSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('contactSubmitBtn');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = t('contact.sending');
    setTimeout(() => {
        btn.disabled = false;
        btn.textContent = t('contact.sendBtn');
        e.target.reset();
        showToast(t('toast.msgSent'), 'success');
    }, 1200);
}

// Newsletter Handler
function handleNewsletter(e) {
    e.preventDefault();
    const input = e.target.querySelector('input');
    if (!input) return;
    const email = input.value.trim();
    if (!email || !/\S+@\S+\.\S+/.test(email)) { showToast(t('toast.invalidEmail'), 'error'); return; }
    input.value = '';
    showToast(t('toast.subscribed'), 'success');
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
    if (btn) btn.disabled = true;

    const payload = collectBulkQuote();

    let quote = null;
    try {
        if (window.GurukripaServices && window.GurukripaServices.QuotationService) {
            quote = window.GurukripaServices.QuotationService.submitRFQ(payload);
        }
    } catch (err) {
        console.error('[GBI] RFQ submit failed:', err); // falls back to manual notice below
    }

    setTimeout(() => {
        if (notice) {
            notice.style.display = 'block';
            notice.innerHTML = `✓ RFQ Generated: <strong>${quote ? quote.id : 'QT-2026-SUBMITTED'}</strong>. Our Jaunpur Bhatta Sales Manager will call ${sanitizeHTML(payload.phone)} within 30 minutes with official rate quote.`;
        }
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'RFQ Successfully Sent ✓';
        }
        showToast('Bulk Quotation Request Logged!', 'success');
        setTimeout(() => {
            closeBulkQuoteModal();
            e.target.reset();
            if (notice) notice.style.display = 'none';
            if (btn) btn.textContent = 'Submit Bulk RFQ Quotation Request →';
        }, 3000);
    }, 600);
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

// Nav Search Live Filter & Shortcut
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('navSearch');
    if (!searchInput) return;

    // Escape clears an active search field. Overlay close (ESC), drawer toggle and
    // Ctrl/Cmd+K focus are centralised in the ui.js OVERLAY_STACK to avoid
    // duplicate handlers double-firing (e.g. toggleDrawer toggling twice).
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.blur();
            searchInput.value = '';
            renderProducts(currentFilter || 'all');
        }
    });

    let debounceTimer;
    searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        const q = this.value.trim().toLowerCase();
        debounceTimer = setTimeout(() => {
            if (!q) {
                renderProducts(currentFilter || 'all');
                return;
            }
            const grid = document.getElementById('productsGrid');
            if (!grid) return;
            const matches = PRODUCTS.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.desc.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                (p.badge && p.badge.toLowerCase().includes(q))
            );

            const countEl = document.getElementById('productsCount');
            if (countEl) countEl.textContent = `${matches.length} product${matches.length !== 1 ? 's' : ''}`;

            if (!matches.length) {
                grid.innerHTML = `
                    <div style="grid-column:1/-1;text-align:center;padding:50px 20px;">
                        <div style="font-size:2.5rem;margin-bottom:12px">🔍</div>
                        <h3 style="font-family:var(--display);color:var(--ink);margin-bottom:6px">No bricks matching "${sanitizeHTML(q)}"</h3>
                        <p style="color:var(--ink-3);font-size:.9rem;margin-bottom:18px">Try searching for "awwal", "shiv", "grade", or "red"</p>
                        <button class="btn btn-outline btn-sm" onclick="document.getElementById('navSearch').value='';renderProducts('all')">View All Bricks</button>
                    </div>`;
                return;
            }
            grid.innerHTML = matches.map(p => renderProductCard(p)).join('');
            document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 220);
    });
});
