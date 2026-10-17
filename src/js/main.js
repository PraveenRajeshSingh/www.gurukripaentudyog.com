// ══════════════════════════════════════════
// MAIN BOOTSTRAP & APPLICATION INITIALIZATION
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    renderProducts('all');
    updateCartUI();
    updateAuthUI();
    initScrollProgress();
    initCounters();
    initNavHighlight();
    initScrollReveal();
    initTouchSwipe();
    prefillUserInCheckout();
    setupOtpInputs();
    setLang(currentLang);
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

// Nav Search Handler
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('navSearch')?.addEventListener('input', function () {
        const q = this.value.toLowerCase().trim();
        if (q.length < 2) return;
        const match = PRODUCTS.find(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
        if (match) showToast(t('toast.searchFound', { name: sanitizeHTML(match.name), price: match.price, unit: match.unit }));
    });
});
