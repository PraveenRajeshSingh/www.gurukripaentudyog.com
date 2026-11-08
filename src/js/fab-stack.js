// ══════════════════════════════════════════
// FAB-STACK + FOOTER HELPERS
// Single fixed stack: WhatsApp · Help · Back-to-top
// Marks: tooltip · footer-aware offset · modal hide · keyboard hide ·
//        footer product links · GSTIN copy · accordion · newsletter WA
// ══════════════════════════════════════════
(function () {
    const WA_TIP_KEY = 'gb_fab_wa_tip_seen';
    const TOP_SHOW_Y = 600;
    let tipTimer = null;

    function $(id) { return document.getElementById(id); }

    // ── Help menu ──
    window.toggleFabHelp = function toggleFabHelp() {
        const btn = $('fabHelpBtn');
        const menu = $('fabHelpMenu');
        if (!btn || !menu) return;
        const open = menu.hasAttribute('hidden');
        if (open) {
            menu.removeAttribute('hidden');
            btn.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
        } else {
            closeFabHelp();
        }
    };

    window.closeFabHelp = function closeFabHelp() {
        const btn = $('fabHelpBtn');
        const menu = $('fabHelpMenu');
        if (menu) menu.setAttribute('hidden', '');
        if (btn) {
            btn.classList.remove('is-open');
            btn.setAttribute('aria-expanded', 'false');
        }
    };

    // Keep legacy toggleFab() working for any leftover callers
    window.toggleFab = function toggleFab() {
        toggleFabHelp();
    };

    // ── Back to top visibility ──
    function syncTopBtn() {
        const btn = $('scrollTopBtn');
        if (!btn) return;
        const show = window.scrollY >= TOP_SHOW_Y;
        if (show) {
            btn.hidden = false;
            requestAnimationFrame(() => btn.classList.add('is-visible'));
        } else {
            btn.classList.remove('is-visible');
            const hide = () => { if (window.scrollY < TOP_SHOW_Y) btn.hidden = true; };
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) hide();
            else setTimeout(hide, 180);
        }
    }

    // ── FOOTER-AWARE OFFSET ──
    function setupFooterLift() {
        const footer = $('siteFooter') || document.querySelector('.footer');
        const stack = $('fabStack');
        if (!footer || !stack || typeof IntersectionObserver === 'undefined') return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    document.documentElement.style.setProperty('--fab-footer-lift', '0px');
                    return;
                }
                // Raise enough to clear the legal row on mobile (stack height band)
                const mobile = window.matchMedia('(max-width: 767.98px)').matches;
                const lift = mobile
                    ? Math.min(120, Math.max(56, Math.round(entry.intersectionRect.height * 0.12)))
                    : Math.min(72, Math.max(24, Math.round(entry.intersectionRect.height * 0.15)));
                document.documentElement.style.setProperty('--fab-footer-lift', lift + 'px');
            });
        }, { threshold: [0, 0.05, 0.15, 0.3] });
        io.observe(footer);
    }

    // ── MODAL + KEYBOARD HIDE (toggle .is-suppressed on the stack) ──
    function syncStackSuppressed() {
        const stack = $('fabStack');
        if (!stack) return;
        const isField = (el) => el && (el.matches('input, textarea, select') || el.isContentEditable);
        const mobile = window.matchMedia('(max-width: 767.98px)').matches;
        const keyboard = mobile && isField(document.activeElement);
        const modal = document.body.classList.contains('overlay-open')
            || document.body.classList.contains('gb-chat-open')
            || document.body.getAttribute('data-modal-open') === 'true'
            || document.documentElement.classList.contains('overlay-open');
        stack.classList.toggle('is-suppressed', !!(modal || keyboard));
        document.body.classList.toggle('fab-keyboard-open', !!keyboard);
    }

    function setupKeyboardHide() {
        document.addEventListener('focusin', syncStackSuppressed, true);
        document.addEventListener('focusout', () => setTimeout(syncStackSuppressed, 50), true);
        if (window.visualViewport) {
            visualViewport.addEventListener('resize', syncStackSuppressed, { passive: true });
        }
        const obs = new MutationObserver(syncStackSuppressed);
        obs.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-modal-open'] });
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }

    // ── TOOLTIP first-visit peek on touch ──
    function setupWaTooltip() {
        const tip = $('fabWaTooltip');
        if (!tip) return;
        let seen = false;
        try { seen = localStorage.getItem(WA_TIP_KEY) === '1'; } catch (_e) { /* ignore */ }
        const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
        if (!coarse || seen) return;
        tip.classList.add('is-peek');
        tipTimer = setTimeout(() => {
            tip.classList.remove('is-peek');
            try { localStorage.setItem(WA_TIP_KEY, '1'); } catch (_e) { /* ignore */ }
        }, 5000);
    }

    // Close help on outside click / Escape
    function setupHelpDismiss() {
        document.addEventListener('click', (e) => {
            const wrap = document.querySelector('.fab-stack__help-wrap');
            if (!wrap || wrap.contains(e.target)) return;
            closeFabHelp();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeFabHelp();
        });
    }

    // ── Footer product links from PRODUCTS ──
    function trolleyCost(p) {
        return Math.round(Number(p.price || 0) * 4000);
    }

    function renderFooterProducts() {
        const box = $('footerProductLinks');
        if (!box || typeof PRODUCTS === 'undefined') return;
        const fmt = (n) => (typeof formatINR === 'function' ? formatINR(n) : ('₹' + Number(n).toLocaleString('en-IN')));
        box.innerHTML = PRODUCTS.map((p) => {
            const trolley = trolleyCost(p);
            const label = p.name + (trolley ? ' (' + fmt(trolley) + '/trolley)' : '');
            const cat = p.category || 'all';
            return '<li><a href="#products" data-footer-cat="' + cat + '">' + label + '</a></li>';
        }).join('');
        box.addEventListener('click', (e) => {
            const a = e.target.closest('a[data-footer-cat]');
            if (!a) return;
            e.preventDefault();
            const cat = a.getAttribute('data-footer-cat') || 'all';
            if (typeof filterProducts === 'function') filterProducts(cat);
            const sec = document.getElementById('products');
            if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    window.copyFooterGstin = function copyFooterGstin() {
        const el = $('footerGstin');
        const text = el ? el.textContent.trim() : '09AAACG7481M1Z2';
        const done = () => {
            if (typeof showToast === 'function') showToast((typeof t === 'function' ? t('footer.gstinCopied') : null) || 'GSTIN copied', 'success');
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(() => {
                window.prompt('Copy GSTIN', text);
            });
        } else {
            window.prompt('Copy GSTIN', text);
            done();
        }
    };

    // ── Accordion (mobile Quick Links / Products) ──
    function setupFooterAccordions() {
        document.querySelectorAll('.footer-accordion').forEach((col) => {
            const btn = col.querySelector('.footer-acc-btn');
            if (!btn || btn.dataset.bound === '1') return;
            btn.dataset.bound = '1';
            btn.addEventListener('click', () => {
                const open = !col.classList.contains('is-open');
                col.classList.toggle('is-open', open);
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        });
    }

    function init() {
        const stack = $('fabStack');
        if (!stack) return;
        syncTopBtn();
        window.addEventListener('scroll', syncTopBtn, { passive: true });
        setupFooterLift();
        setupKeyboardHide();
        setupWaTooltip();
        setupHelpDismiss();
        renderFooterProducts();
        setupFooterAccordions();
        const syncPh = () => {
            const input = $('footerWaPhone');
            if (input && typeof t === 'function') input.placeholder = t('footer.phonePh');
        };
        syncPh();
        document.addEventListener('gb:lang-changed', syncPh);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
