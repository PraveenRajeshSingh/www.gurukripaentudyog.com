// Optional admin-managed hero overrides (local company profile / ERP store).
// Never invent promotional stats. Only applies real saved fields when present.
(function (global) {
    'use strict';

    function readHeroOverrides() {
        try {
            if (window.GurukripaERP && GurukripaERP.Documents && typeof GurukripaERP.Documents.companyProfile === 'function') {
                const p = GurukripaERP.Documents.companyProfile();
                if (p && (p.heroHeadline || p.heroDescription || p.heroImageUrl)) return p;
            }
        } catch (_e) { /* ignore */ }
        try {
            const raw = localStorage.getItem('gb_hero_overrides');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch (_e2) {
            return null;
        }
    }

    function applyHeroOverrides() {
        const o = readHeroOverrides();
        if (!o) return;
        const h = document.getElementById('heroHeadline');
        const d = document.getElementById('heroDescription');
        const img = document.getElementById('heroBannerImg');
        const cta1 = document.getElementById('heroCtaPrimary');
        const cta2 = document.getElementById('heroCtaSecondary');
        const cta3 = document.getElementById('heroCtaBook');
        if (h && o.heroHeadline) h.textContent = String(o.heroHeadline);
        if (d && o.heroDescription) d.textContent = String(o.heroDescription);
        if (img && o.heroImageUrl) {
            img.src = String(o.heroImageUrl);
            img.removeAttribute('srcset');
        }
        if (cta1 && o.ctaPrimaryLabel) cta1.textContent = String(o.ctaPrimaryLabel);
        if (cta1 && o.ctaPrimaryHref) cta1.setAttribute('href', String(o.ctaPrimaryHref));
        if (cta2 && o.ctaSecondaryLabel) cta2.textContent = String(o.ctaSecondaryLabel);
        if (cta2 && o.ctaSecondaryHref) cta2.setAttribute('href', String(o.ctaSecondaryHref));
        if (cta3 && o.ctaBookLabel) cta3.textContent = String(o.ctaBookLabel);
    }

    global.GBHeroAdmin = { applyHeroOverrides: applyHeroOverrides, readHeroOverrides: readHeroOverrides };

    document.addEventListener('DOMContentLoaded', function () {
        try { applyHeroOverrides(); } catch (_e) { /* ignore */ }
    });
})(typeof window !== 'undefined' ? window : this);
