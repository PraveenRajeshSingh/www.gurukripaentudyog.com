// ══════════════════════════════════════════
// MAIN BOOTSTRAP & APPLICATION INITIALIZATION
// ══════════════════════════════════════════
// Main Bootstrap & Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderProducts('all');
    updateCartUI();
    if (typeof updateWishlistBadges === 'function') {
        updateWishlistBadges();
    }
    updateAuthUI();
    initScrollProgress();
    initCounters();
    initNavHighlight();
    initScrollReveal();
    initTouchSwipe();
    prefillUserInCheckout();
    setupOtpInputs();
    setLang(currentLang);
    initGoogleSignIn();
    if (window.Platform && typeof window.Platform.init === 'function') {
        window.Platform.init();
    }
});

// FAQ Accordion
function toggleFaq(btn) {
    const item = btn.closest('.faq-item');
    if (!item) return;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
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
        document.body.style.overflow = 'hidden';
    }
}

function closeBulkQuoteModal() {
    const modal = document.getElementById('bulkQuoteModal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function handleBulkQuoteSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('rfqSubmitBtn');
    const notice = document.getElementById('rfqResultNotice');
    if (btn) btn.disabled = true;

    const payload = {
        name: document.getElementById('rfqName')?.value,
        phone: document.getElementById('rfqPhone')?.value,
        company: document.getElementById('rfqCompany')?.value,
        gstin: document.getElementById('rfqGstin')?.value,
        product: document.getElementById('rfqProduct')?.value,
        qty: document.getElementById('rfqQty')?.value,
        site: document.getElementById('rfqSite')?.value,
        roadAccess: document.getElementById('rfqRoad')?.value,
        unloadingReq: document.getElementById('rfqUnload')?.value
    };

    let quote = null;
    if (window.GurukripaServices && window.GurukripaServices.QuotationService) {
        quote = window.GurukripaServices.QuotationService.submitRFQ(payload);
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

// Nav Search Live Filter & Shortcut
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('navSearch');
    if (!searchInput) return;

    // Ctrl+K / Cmd+K focus shortcut
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
        if (e.key === 'Escape') {
            if (document.activeElement === searchInput) {
                searchInput.blur();
                searchInput.value = '';
                renderProducts(currentFilter || 'all');
            }
            if (document.getElementById('mobileDrawer')?.classList.contains('open')) {
                toggleDrawer();
            }
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
