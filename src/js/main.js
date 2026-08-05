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
    btn.textContent = '⏳ Sending...';
    setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '📨 Send Message';
        e.target.reset();
        showToast('✅ Message sent! We\'ll call you back soon.', 'success');
    }, 1200);
}

// Newsletter Handler
function handleNewsletter(e) {
    e.preventDefault();
    const input = e.target.querySelector('input');
    if (!input) return;
    const email = input.value.trim();
    if (!email || !/\S+@\S+\.\S+/.test(email)) { showToast('❌ Enter a valid email', 'error'); return; }
    input.value = '';
    showToast('🎉 Subscribed! Welcome to our updates.', 'success');
}

// Nav Search Handler
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('navSearch')?.addEventListener('input', function () {
        const q = this.value.toLowerCase().trim();
        if (q.length < 2) return;
        const match = PRODUCTS.find(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
        if (match) showToast('🔍 Found: ' + sanitizeHTML(match.name) + ' — ₹' + match.price + '/' + match.unit);
    });
});
