# GURUKRIPA BRICKS INDUSTRY — REMOVAL LOG

This document logs all elements, CSS rules, inline styles, and spacers modified or removed during the spacing, grid alignment, image fit, and cleanup pass.

---

## Phase 1 — i18n JSON source of truth (2026-11-15)

### A. Embedded TRANSLATIONS object in `src/js/i18n.js`
- **Removed:** ~800-line in-file `const TRANSLATIONS = { en:…, hi:… }` dictionary.
- **Replacement:** `/i18n/en.json` + `/i18n/hi.json` (source of truth) + generated `src/js/i18n-data.js` sync bundle + thin `i18n.js` runtime.
- **Proof:** `node scripts/check-i18n-parity.js` (465/465); `node --test tests/i18n.test.js`; grep shows no `const TRANSLATIONS =` in runtime file.
- **Kept:** Public `t()`, `applyTranslations()`, `setLang()` / `setLanguage()` names and `gb_lang` storage key.

### B. Duplicate `t` / `applyTranslations` in `ui.js`
- **Removed:** Second copies that overwrote the i18n runtime after defer load order.
- **Replacement:** `ui.js` only owns `setLang` / `setLanguage` and re-render hooks.

---

## Auth overlap / cascade fix (2026-11-15)

### A. Legacy refinements R2 auth chrome
- **Removed from `refinements.css`:** `#authModal .modal-box { max-width: 460px }`, old `.auth-modal-brand` / `.auth-tab` gradient pills, global `.auth-input` / `.auth-submit` / `.auth-social-btn` visual rules that applied site-wide and crushed `#authModal` floating labels + split shell.
- **Kept:** `.google-gsi-mount`, `.auth-terms-err`; shared form primitives in `overlays.css` for nearby/RFQ.
- **Replacement:** `auth-premium.css` moved to `@layer patches` (wins cascade).

### B. Mobile sheet drag-pill + flat input padding on auth
- **Changed in `mobile-fixes.css`:** `.modal-box::before` drag handle, sheet radius, and `padding: 12px 14px !important` on inputs now use `:not(.auth-shell)` so they no longer overlap the auth header/labels.
- **Changed:** `.modal-body` max-height clamp excluded for `.auth-scroll`.

---

## Batch 3 Phase 1 — Sticky / floating header (2026-11-15)

### A. Hardcoded header glass color
- **Removed / replaced:** `background: rgba(255, 255, 255, 0.96)` on `.nav-premium` in `chrome-premium.css`
- **Replacement:** `background: var(--nav-glass, …)` (light + dark tokens)
- **Reason:** Floating pill and dark theme need the same token; hardcoded white broke dark and mixed poorly with the translucent floating state.

### B. Hardcoded scroll-margin
- **Removed / replaced:** `scroll-margin-top: 78px` in `refinements.css`; `scroll-margin-top: var(--nav-h, 72px)` alone in `viewport-adaptive.css`
- **Replacement:** `calc(var(--header-h, …) + 16px)` so anchors clear the measured / floating header
- **Kept:** Legacy `#spbar` width updates in `ui.js` (progress also mirrored to `--nav-progress`)

### C. Nothing deleted from public nav markup
- Sentinel, progress line, and active pill were **added**; no nav links, cart, wishlist, lang, or search controls removed.

---

## Batch 2 Phase 1 — OTP Autofill (2026-11-15)

### A. Legacy unused OTP digit styles
- **Removed:** `.otp-row`, `.otp-digit`, `.otp-digit:focus`, `.otp-digit.filled` from `src/styles/mobile-fixes.css`
- **Reason:** No HTML used these classes; leftover from an unfinished OTP sketch.
- **Replacement:** `src/styles/otp-autofill.css` (`.otp-field`, `.otp-digit` under the new component)
- **Verification:** `rg "otp-row|otp-digit" --glob "*.{html,js}"` shows only the new module / template / ui-kit.

---

## Phase 1 — Auth Premium (2026-11-15)

### A. Modal-scoped auth chrome moved out of `overlays.css`
- **Removed / relocated:** `#authModal`-oriented visual rules for `.auth-tabs`, `.auth-tab`, `.auth-options`, `.auth-forgot`, `.auth-divider`, `.auth-social-*`, `.auth-switch`, `.pw-strength*` that targeted the old compact modal look.
- **Kept:** Shared `.auth-input` / `.auth-field` / `.auth-label` / `.auth-submit` primitives used by Nearby Bhatta, RFQ, and other forms.
- **Replacement:** `src/styles/auth-premium.css` (scoped under `#authModal`).
- **Verification:** Grep confirms nearby/RFQ still use `.auth-input`; auth modal markup uses `#authModal` selectors.

### B. Inline ad-hoc SVG icons in auth modal
- **Removed:** Per-field inline eye/lock/mail path SVGs inside `auth-modal.html`.
- **Replacement:** Lucide sprite `<use href="#i-…"/>` via `icon-sprite.html`.
- **JS:** `_authEyeSVG` / `_authLockSVG` / `_authStarSVG` now reference sprite symbols.

### C. Fabricated “reset email sent” path
- **Already removed in prior work** (`handleForgotPw` honesty). Phase 1 keeps that contract and surfaces it as the Recover panel instead of a toast-only dialog.

---

## 1. Unconditional Desktop Main Content Padding-Bottom
- **Selector:** `main#main-content`
- **File:** `src/styles/fab-stack.css` (lines 235–239)
- **Original CSS Rule:**
  ```css
  main#main-content {
      scroll-padding-bottom: calc(var(--fab-stack-h) + 24px);
      padding-bottom: calc(var(--fab-stack-h) + 16px);
  }
  ```
- **Root Cause:**
  `--fab-stack-h` calculates to `52px + 44px + 44px + (12px * 2) = 164px`. Adding 16px yielded an unconditional `180px` padding-bottom on the `<main>` element on all viewports, including desktop. This created the massive ~180px empty cream gap between the Contact section and the footer.
- **Verification:** Verified in Chrome DevTools inspection on 1366px and 1920px viewports. The FAB stack on desktop sits fixed in the right viewport gutter and does not overlap main content text.
- **Action:** Restricted the padding-bottom rule exclusively to mobile viewports:
  ```css
  @media (max-width: 767.98px) {
      main#main-content {
          scroll-padding-bottom: calc(var(--fab-stack-h) + 24px);
          padding-bottom: calc(var(--fab-stack-h) + 16px);
      }
  }
  ```
- **Space Saved:** Exactly 180px of dead space removed on 1024px, 1366px, and 1920px viewports.

---

## 2. Inconsistent Trust Strip Cream Background Override
- **Selector:** `.trust-strip`
- **File:** `src/styles/mobile-fixes.css` (lines 2318–2324)
- **Original CSS Rule:**
  ```css
  .trust-strip {
      background: linear-gradient(90deg, #FAF8F5 0%, #FFF5EF 50%, #FAF8F5 100%) !important;
      border-top: 1px solid rgba(179, 54, 20, 0.08) !important;
      border-bottom: 1px solid rgba(179, 54, 20, 0.08) !important;
      padding: 12px 0 !important;
  }
  ```
- **Root Cause:**
  Overrode the canonical dark `--ink` (#252525) background in `sections.css` with a light cream gradient, clashing with the light text tokens and creating mixed dark/orange contrast defects.
- **Action:** Removed the `.trust-strip` override. Canonical dark styling with 44px fixed height and CSS mask edge fades restored.

---

## 3. Inline Color Override on Trust Marquee Item
- **Selector:** `.trust-item:nth-child(3)`
- **File:** `src/pages/partials/trust-marquee.html`
- **Original Markup:**
  ```html
  <span class="trust-item" style="color:var(--brand);font-weight:700">🔥 <strong>Kiln Chamber #3 Live</strong> — Dispatch in 4 hrs</span>
  ```
- **Root Cause:** Hardcoded inline `color:var(--brand)` caused this item to render bright orange while adjacent items rendered in off-white, producing a jarring mixed-color appearance.
- **Action:** Removed inline `style` attribute. All marquee items now follow uniform typography (`rgba(255, 255, 255, 0.85)` body text with `var(--brand-amber)` numeric/highlight accents).

---

## 4. Asymmetric Hero Media Corner Radius
- **Selector:** `.hero-premium__media`
- **File:** `src/styles/chrome-premium.css` (line 238)
- **Original CSS Rule:**
  ```css
  @media (min-width: 1024px) {
      .hero-premium__media {
          border-radius: 0 0 0 28px;
          margin: 18px 0;
      }
  }
  ```
- **Root Cause:** Top-left, top-right, and bottom-right corners were 0px (square), while only the bottom-left corner was 28px rounded. This created an artificial "clipped" appearance on desktop.
- **Action:** Replaced with uniform `border-radius: 18px` across all four corners.

---

## 5. Over-Allocated Content-Visibility Intrinsic Sizes
- **Selector:** `.trust-marquee, .cta-banner`
- **File:** `src/styles/polish-pass.css` (lines 10–19)
- **Original CSS Rule:**
  ```css
  #factory, #reviews, #faq, #contact, .cities-sec, .cta-banner, .trust-marquee {
      content-visibility: auto;
      contain-intrinsic-size: 1px 720px;
  }
  ```
- **Root Cause:** Reserving 720px of intrinsic height for the trust marquee (actual height: 44px) and CTA banner (actual height: ~120px) caused temporary 720px blank voids prior to layout rendering.
- **Action:** Removed `.trust-marquee` from `content-visibility`, reduced `.cta-banner` intrinsic size to `120px`, and tuned section containers to `360px`.

---

## 6. Persistent Contact Card Shadow Glow
- **Selector:** `.contact-info .btn-primary`
- **File:** `src/styles/sections.css`
- **Original CSS Rule:** Inherited `.btn-primary { box-shadow: 0 4px 16px rgba(168, 50, 38, 0.22); }` at resting state.
- **Root Cause:** On the light cream background of the contact section, the red brand glow looked like a blurry pink smudge/leftover artifact under the WhatsApp card.
- **Action:** Set resting `box-shadow: none` on `.contact-info .btn-primary`, activating the glow only on `:hover` and `:focus-visible`.

---

## 7. Hardcoded Bilingual Strings in FAQ
- **Selector:** `.faq-q span`
- **File:** `src/pages/partials/faq.html`
- **Original Markup:** `<span>ईंट की कीमत क्या है? / What is the price of bricks?</span>`
- **Root Cause:** Both Hindi and English were concatenated into a single string inside the template, ignoring the active language toggle (`currentLang`).
- **Action:** Replaced with `data-i18n="faq.q1"` through `data-i18n="faq.q5"`, backed by full EN and HI dictionaries in `src/js/i18n.js`.
