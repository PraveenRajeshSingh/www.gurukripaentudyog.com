# CHANGELOG — Phase 7 QA & delivery

Date: 2026-11-10  
Branch: `design-responsive-pass-2026-11-10`  
Scope: documentation, DEFECTS closure, after screenshots, test evidence.

## Deliverables
- `DEFECTS.md` updated (D5/D9/D10 Fixed; D7/A* Mitigated)
- `docs/TESTING-REPORT-PHASE7.md`
- `docs/PERFORMANCE-PHASE5.md`
- `qa/after/` sample captures

---

# CHANGELOG — Phase 6 Bilingual & accessibility

Date: 2026-11-10  
Scope: a11y CSS + Hindi clip-safe utilities. Light theme remains canonical.

## What changed
- `a11y-phase6.css` — focus-visible rings, 44px icon controls, Hindi wrap, tabular prices, reduced-motion, skip-link
- Lang preference still via `gb_lang` / `setLang` (unchanged API)

---

# CHANGELOG — Phase 5 Performance & PWA

Date: 2026-11-10  
Scope: SW install budget + deferred CSS + idle warm. Offline shell preserved.

## What changed
- `sw.js` → `CACHE_VER = v14-perf`; SHELL_ASSETS trimmed to critical offline shell
- Heavy CSS/JS moved to RUNTIME_WARM
- Deferred `ops-console` / `nearby-bhatta` / `daily-prices` stylesheets
- `idle-loader.js` — Save-Data aware image/SW warm after load

---

# CHANGELOG — Phase 4 Popup & drawer system

Date: 2026-11-10  
Scope: closed-by-default overlays, history Back, sheet chrome. Business logic unchanged.

## What changed
- `popup-manager.js` — history Back closes top overlay; hashchange/boot force-close; swipe-down dismiss (reduced-motion safe)
- Expanded `ensureOverlaysClosedOnBoot` for checkout/profile/compare/legal/admin/etc.
- `popups-phase4.css` — closed visibility, desktop modal / mobile ≤92dvh sheets, FAB hide while open
- PTR respects `gb-popup-open`

---

# CHANGELOG — Phase 3 Catalog & page sections

Date: 2026-11-10  
See commit `c1413e5` — filter rail/drawer, count dedupe, card grid, `pages-phase3.css`, SW `v13-pages`.

---

# CHANGELOG — Phase 2 Header / Nav / Hero / Footer Shell

Date: 2026-11-10  
Branch: `design-responsive-pass-2026-11-10`  
Scope: application shell chrome only. Business prices / cart logic unchanged.

## What changed
- One visible language control (header); topbar lang hidden but IDs kept for `setLang` sync
- Full nav ≥1024px; hamburger <1024; bottom nav only <768px
- Header brand ellipsis / no clip at ~350px; sticky premium header
- Hero two-column only ≥1024; single column below; wrapping chips; badge clearance from FAB
- Footer 4 / 2 / 1 columns with accordion under 768px
- Brand copy aligned to **Gurukripa Bricks Industry** (EN/HI)
- FAB suppresses on account popup / overlay; hero badge clearance
- `shell-phase2.css` + updated `chrome-premium.css`; SW `v12-shell`

## Verification
- Live CDP at 360 / 890 / 1024 / 1366 (run after commit)
- `npm test`

---

# CHANGELOG — Phase 1 Centralized Design System

Date: 2026-11-10  
Branch: `design-responsive-pass-2026-11-10`  
Scope: CSS cascade only. No JS business-logic changes. No new runtime dependencies.

## What changed
- Added `src/styles/layers.css` — explicit `@layer` order
- Reworked `tokens.css`; added `design-system.css`
- Wrapped existing stylesheets into cascade layers
- SW `v11-design-system`

---

# CHANGELOG — Cart / Wishlist / Button fix pass

Date: 2026-11-10  
See `ROOT_CAUSES.md` and prior commerce commit `0bdfac2`.
