# GURUKRIPA BRICKS INDUSTRY — CHANGELOG

## Comprehensive Spacing, Grid Alignment, Image Fit, and Visual Cleanup Pass

**Date:** 2026-11-11  
**Platform:** Static HTML/CSS/JS PWA on GitHub Pages  
**Test Suite:** 32 suites, 164 tests passing (0 failures)  
**Layout Container Standard:** Single unified container `width: min(100% - 2 * var(--gutter), 1240px); margin-inline: auto;` with 0px left/right alignment variance across all sections.

---

### Defect 1: Container Mismatch Across Sections
- **Problem:** Header and footer spanned ~55–1297px at 1366px viewport, but the hero was ~100–1251px, FAQ was restricted to a 700px column, and each section had differing widths and paddings.
- **Root Cause:**
  - `src/styles/viewport-adaptive.css` had `.container` max-width 1200px with `padding-inline: var(--page-gutter)`.
  - `src/styles/chrome-premium.css` had `.hero-premium__grid` max-width 1200px with `padding: 0 clamp(16px, 3vw, 24px)`.
  - `src/styles/footer-studio.css` had `.footer-studio__container` max-width 1280px with `padding-inline: clamp(16px, 4vw, 32px)`.
  - `src/styles/sections.css` had `.faq-list` restricted to `max-width: 700px`.
- **Fix:**
  - Defined unified layout tokens in `tokens.css`:
    ```css
    --gutter: clamp(16px, 4vw, 32px);
    --layout-max: 1240px;
    --container-max: 1240px;
    ```
  - Standardized `.container`, `.hero-premium__grid`, and `.footer-studio__container` to:
    ```css
    width: min(100% - 2 * var(--gutter), var(--layout-max));
    max-width: var(--layout-max);
    margin-inline: auto;
    padding-inline: 0;
    box-sizing: border-box;
    ```
  - Centered FAQ column at `max-width: 800px; margin-inline: auto;`.
- **Measured Result:** At 1366px, Header, Hero, Categories, Prices, Products, Calculator, About, Gallery, CTA, Cities, Nearby Bhatta, FAQ, Contact, and Footer all align with `cLeft: 56px`, `cRight: 1296px`, and `cWidth: 1240px`. **Variance: 0.0px.**

---

### Defect 2: Hero Image Framing, Corner Radius, and Quality
- **Problem:** Hero image ended ~46px short of column edge, had square top/right corners with rounded bottom-left corner (looked clipped), and exhibited softness on high-resolution displays.
- **Root Cause:**
  - `src/styles/chrome-premium.css` line 238 set `.hero-premium__media { border-radius: 0 0 0 28px; }` at 1024px+.
  - Srcset lacked a 1600w desktop asset, causing desktop browsers to upscale smaller variants.
- **Fix:**
  - Set uniform `border-radius: 18px` on all four corners.
  - Generated high-quality bicubic downsampled `hero-1600.jpg` from authentic repo photo `redbrick1.jpg` (1,068 KB source).
  - Updated `<picture>` srcset in `src/pages/partials/hero.html` with `hero-1600.jpg 1600w` and `sizes="(max-width:1023px) 100vw, (max-width:1366px) 48vw, 44vw"`.
  - Applied `width: 100%; height: 100%; object-fit: cover; object-position: center;`.
  - Added `text-wrap: balance` to hero headline.
  - Positioned the "Est. 1998 / Jaunpur" badge with exact 16px insets.

---

### Defect 3: Trust Strip Marquee Typography, Edge Cutoff, and Overlap
- **Problem:** Ticker items were abruptly clipped at viewport edges; text colors were mixed orange and dark cream; duplicate items were announced twice by screen readers.
- **Root Cause:**
  - `mobile-fixes.css` overrode `.trust-strip` with a cream gradient background.
  - Item 2 had inline `style="color:var(--brand);font-weight:700"`.
  - No CSS edge fade masks were applied.
- **Fix:**
  - Removed `.trust-strip` cream background override in `mobile-fixes.css`.
  - Removed inline `style` attribute on `.trust-item` in `trust-marquee.html`.
  - Added CSS gradient mask fades in `src/styles/sections.css`:
    ```css
    mask-image: linear-gradient(to right, transparent 0%, black 48px, black calc(100% - 48px), transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 48px, black calc(100% - 48px), transparent 100%);
    ```
  - Added `aria-hidden="true"` to duplicate items for accessibility.
  - Fixed strip height to `44px` with `prefers-reduced-motion` wrapping fallback.

---

### Defect 4: Nav Item Alignment and Scroll-Spy Highlighting
- **Problem:** "Book Bricks" sat 4px lower than adjacent links; nav highlight stuck on "Home" while scrolling other sections.
- **Root Cause:**
  - `<button class="nav-link nav-link-btn">` lacked `display: inline-flex; align-items: center; vertical-align: middle;` parity with `<a>` links.
  - Active navigation relied solely on manual click events (`setActiveNav`); no IntersectionObserver scroll-spy existed to track scroll position.
- **Fix:**
  - Standardized `.nav-link` and `.nav-link-btn` in `chrome-premium.css` with identical baseline flex metrics.
  - Implemented comprehensive `IntersectionObserver` scroll-spy in `src/js/ui.js` mapping all 14 page sections to primary nav links:
    - `#home` → Home
    - `#price-list, #categories, #products, #calculator` → Products
    - `#nearby-bhatta` → Brick Suppliers
    - `#about, #gallery, #testimonials, #reviews, #cities` → About Us
    - `#faq, #contact` → Contact Us
  - Added `history.replaceState` hash updates without scroll jumping.
  - Added `scroll-margin-top: var(--nav-h, 72px)` to all sections.

---

### Defect 5: "Today's Brick Prices" Empty Block and Developer Copy
- **Problem:** Section displayed "Catalogue unavailable." inside a ~470px void with internal developer jargon ("centralized catalogue... revalidate against these figures").
- **Root Cause:**
  - `const PRODUCTS` in `data.js` was script-scoped and not explicitly assigned to `window.PRODUCTS`.
  - Error fallback rendered full-height text block with no recovery actions.
- **Fix:**
  - Added explicit global exposure: `if (typeof window !== 'undefined') { window.PRODUCTS = PRODUCTS; }` in `src/js/data.js`.
  - Replaced developer wording in `src/pages/partials/daily-prices.html` with customer copy:
    *"Today's rates from the kiln yard. Final price and freight are confirmed by the yard."*
  - Implemented compact `.daily-prices-error` card with Retry, Call the yard, and WhatsApp order actions.
  - Added live timestamp display bound to `rows[0].priceUpdatedAt`.

---

### Defect 6: ~180px Contact-to-Footer Gap and Contact Card Pink Glow
- **Problem:** Approximately 180px of empty cream space between Contact section and footer; fuzzy pink smudge under the left contact card.
- **Root Cause:**
  - `src/styles/fab-stack.css` had `main#main-content { padding-bottom: calc(var(--fab-stack-h) + 16px); }` applied to all viewports unconditionally. `--fab-stack-h` (164px) + 16px created the 180px gap on desktop.
  - `.btn-primary` in `.contact-info` had permanent `box-shadow: 0 4px 16px rgba(168, 50, 38, 0.22)` casting red/pink reflection on cream surface.
- **Fix:**
  - Moved `main#main-content` padding-bottom in `fab-stack.css` into `@media (max-width: 767.98px)`. Desktop `mainPaddingBottom` is now **0px**.
  - Reset resting box-shadow to `none` for `.contact-info .btn-primary` in `sections.css`, activating glow exclusively on `:hover` and `:focus-visible`.

---

### Defect 7: Footer Grid Proportions, Link Row Spacing, and FAB Clearance
- **Problem:** Footer link rows spaced 56px apart (too loose); first column stretched excessively wide; floating action buttons crowded the working hours line.
- **Root Cause:**
  - `.footer-links a, .footer-links button` had `min-height: 44px` plus `gap: 4px`.
  - First column had no `max-width` limit.
  - Bottom bar padding did not provide adequate clearance for desktop FAB stack.
- **Fix:**
  - Tightened link rows in `src/styles/footer-studio.css` to 38px with `gap: 0` (visual spacing: 38px, accessible touch target maintained).
  - Constrained first column with `.footer-col-brand { max-width: 360px; }`.
  - Adjusted desktop 4-column template to `grid-template-columns: 1.3fr 1fr 1fr 1.2fr; gap: 32px;`.
  - Added `padding-inline-end: 80px` to `.footer-bottom` on desktop to keep legal links and hours fully clear of floating buttons.

---

### Defect 8: FAQ Bilingual Question Hardcoding
- **Problem:** FAQ questions displayed Hindi and English concatenated together (`"ईंट की कीमत क्या है? / What is the price of bricks?"`) regardless of the language toggle.
- **Root Cause:** Questions and answers were hardcoded as bilingual strings inside `src/pages/partials/faq.html` rather than being driven by `TRANSLATIONS`.
- **Fix:**
  - Added complete question and answer dictionaries (`faq.q1`–`faq.q5`, `faq.a1`–`faq.a5`) to both `en` and `hi` translation tables in `src/js/i18n.js`.
  - Converted `src/pages/partials/faq.html` to single-language elements bound via `data-i18n`. When switching languages, questions and answers switch instantly and cleanly.

---

### Defect 9: Inconsistent Section Spacing and Intrinsic Layout Voids
- **Problem:** Section vertical padding varied between 75px and 90px with double-stacked padding between sections and inner wrappers; large empty voids appeared prior to section rendering.
- **Root Cause:**
  - Disparate vertical padding tokens across `design-system.css`, `pages-phase3.css`, and `app.css`.
  - `contain-intrinsic-size: 1px 720px;` in `src/styles/polish-pass.css` applied to short elements like the marquee (44px) and CTA banner (120px).
- **Fix:**
  - Standardized section padding to `--space-section: clamp(40px, 6vw, 72px)`.
  - Set block gap token `--space-block: clamp(20px, 3vw, 32px)`.
  - Tuned `contain-intrinsic-size` in `polish-pass.css` to realistic section heights.

---

### Verification Summary
- **Tests:** `npm test` runs 32 test suites (164 tests). 100% passing (0 failed, 0 skipped).
- **Build:** `node scripts/build.js` generates clean 4,071-line `index.html`. All files strictly below the 10,000-line limit.
- **Service Worker:** Cache version incremented to `v15-layout` in `sw.js`. Offline shell precaching intact.
