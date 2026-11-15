# I18N + Theme Audit (Phase 0 — diagnose only)

**Site:** Gurukripa Bricks Industry (static HTML/CSS/JS, GitHub Pages subfolder)  
**Branch:** `fix-buttons-i18n-theme`  
**Generated:** 2026-11-15  
**Evidence:** `qa/phase0-audit.json` (from `scripts/phase0-audit.js`)  
**Status:** No code changes in this phase.

---

## 1. Language — data flow

### Read
| Source | Location | Notes |
|--------|----------|-------|
| Storage key `gb_lang` | `src/js/state.js` `resolveInitialLang()` | Values: `'en'` \| `'hi'` |
| Browser language | same | If no saved key: `navigator.languages[0]` / `navigator.language`; default **`hi`** when neither en nor hi prefix (unusual — first-visit non-hi/en users get Hindi) |
| Runtime | global `currentLang` (`state.js`) | Used by `t()`, `setLang()`, calculator locale, voice search |

### Write
| Writer | Location | Effect |
|--------|----------|--------|
| `setLang(lang)` | `src/js/ui.js` | Sets `currentLang`, `localStorage.gb_lang`, `html[lang]`, syncs toggle buttons, `document.title`, `applyTranslations(document)`, re-renders products/cart/estimator/account when open |
| First visit | `state.js` | Writes detected lang to `gb_lang` |

### Apply
| Mechanism | Location | Coverage |
|-----------|----------|----------|
| In-memory dictionaries | `src/js/i18n.js` → `TRANSLATIONS.en` / `TRANSLATIONS.hi` | **No** `/i18n/en.json` or `/i18n/hi.json` yet |
| `t(key, vars)` | `src/js/ui.js` | Simple `{var}` interpolation; **no** plural rules |
| `applyTranslations(root)` | `src/js/ui.js` | Only `[data-i18n]` → `textContent` / `placeholder` / `innerHTML` for some tags |
| Markup | `index.html` + partials | `data-i18n="key"` only — **no** `data-i18n-aria-label`, `-title`, `-alt`, `-placeholder` (placeholder piggybacks on INPUT via data-i18n) |
| Precache | `sw.js` | Precaches `./src/js/i18n.js` |

### Inventory (before)
From `qa/phase0-audit.json`:
- **EN keys:** 464  
- **HI keys:** 464 (pair match OK for dictionary keys)  
- **Unique `data-i18n` in index:** 233  
- **Occurrences:** 260  
- **Missing in both dicts:** `products.filters`  
- Hard-coded EN/HI strings remain in many `onclick` toasts, `platform.js` theme toasts, auth validation, assistant chips, and JS template literals (not audited as keys)

### Breaks found
1. **Desktop language toggle invisible** — see §2.  
2. **Topbar language controls intentionally hidden** (`topbar.html`: `.topbar-controls` has `hidden aria-hidden="true"`); sync IDs `#langEn`/`#langHi` still updated by `setLang` but not operable.  
3. **Incomplete attribute translation:** aria-labels, titles, alts, meta description, OG tags not driven by i18n attributes.  
4. **No JSON source of truth** — Phase 1 requires `/i18n/en.json` + `hi.json`; today everything lives in `i18n.js`.  
5. **Dynamic UI gaps:** many toasts/errors are English literals (`platform.js` online/offline, action-delegate reason map, etc.).  
6. **`applyTranslations` uses `innerHTML`** for non-input nodes — XSS risk if a key ever contained markup; also bypasses text-only safety.  
7. **No `?i18n-debug=1`** missing-key scanner yet.  
8. **No flash guard for language** in `<head>` (theme has an inline script; language does not set `html lang` before paint from storage).

---

## 2. Why the language toggle is missing on desktop

### Element (present in DOM)
```html
<!-- src/pages/partials/navbar.html -->
<div class="nav-lang" role="group" aria-label="Language">
  <button … id="navLangEn" onclick="setLang('en')">EN</button>
  <button … id="navLangHi" onclick="setLang('hi')">हिंदी</button>
</div>
```

### Root cause (CSS cascade, not removal)
| Rule | File | Layer | Effect |
|------|------|-------|--------|
| `.nav-premium .nav-lang { display: inline-flex; }` | `src/styles/chrome-premium.css` | `@layer features` | Intended: show in header |
| `.nav-lang { display: none; }` | `src/styles/ux-responsive.css` L28–35 | **`@layer patches`** (wins over features) | Hides at all widths |
| `@media (max-width: 900px) { .nav-lang { display: inline-flex; } }` | same file L62–64 | patches | Shows only **≤900px** |

**Breakpoint:** hidden when viewport **> 900px** (desktop / large tablet).  
**Not** covered/clipped by overflow — computed `display: none`.  
**Duplicates:** topbar copy hidden on purpose; drawer has a separate toggle button (`mobile-drawer.html`) that still works.

### Fix direction (Phase 2 — not done here)
In patches layer, force header visibility at all widths, e.g. `.nav-premium .nav-lang { display: inline-flex; }`, and keep shrinking nav links under overflow — never drop the toggle.

---

## 3. Theme — data flow

### Read / write / apply
| Piece | Location | Status |
|-------|----------|--------|
| Storage key `gb_theme` | historically used by `Platform.setTheme` | **Cleared on every load** |
| `data-theme` on `<html>` | pinned to `"light"` | Before paint (`head.html` inline script) + again in `platform.js` `init()` |
| Prefers-color-scheme | retired | Comment in `mobile-fixes.css` §25: system-dark palettes removed to stop OS dark flip |
| `Platform.setTheme` / `toggleTheme` / `updateThemeToggleUI` | `src/js/platform.js` | Logic still exists but init forces light |
| Toggle markup `.theme-toggle-btn` | templates | **NONE** — removed; `app.css` comments “Removed with the dark-mode retirement” |
| Dark tokens | `tokens.css` `html[data-theme="dark"]` | Still defined (opt-in CSS exists) but unreachable via UI |
| Account settings theme control | — | Not found as a working control |

### Breaks found
1. **Theme toggle not reachable** — markup removed; even if restored, `init()` + head script clear preference and pin light.  
2. **Product decision conflict:** Phase 2 of this ticket requires Light / Dark / System; current code intentionally retired dark mode. Restoring must reverse head pin + platform init + re-add control.  
3. **Hardcoded colors outside tokens:** ~461 hits across CSS (sample in `qa/phase0-audit.json`); dark mode would leave light boxes unless cleaned in Phase 2.  
4. Theme toast strings in `toggleTheme` are English-only.

---

## 4. Mobile search vs nav bar

### Current wiring
| Control | Behavior |
|---------|----------|
| `.nav-search-toggle` | `onclick="document.getElementById('navSearch')?.focus()"` — only focuses inline input |
| `.nav-search` / `#navSearch` | Inline header search; often hidden on compact/mobile via `chrome-premium.css` media / force-compact rules |
| CSS `.search-overlay` | Exists in `refinements.css` (styled dialog shell) |
| Full-screen search overlay HTML/JS | **Not wired** as a modal that inert-hides header + bottom nav |

### Assumption check (symptom #5)
Assumption “opening search on mobile should hide header and bottom nav” is **not implemented**. The search **icon is still intended** in the mobile/compact header (`.nav-search-toggle` shown under compact rules). **Do not remove the icon** without confirmation — Phase 4 should open a proper overlay and hide chrome while open.

---

## 5. Buttons — before numbers

From automated inventory on built `index.html` (`qa/phase0-audit.json`):

| Metric | Count |
|--------|------:|
| `<button>` | 265 |
| `<a>` | 59 |
| `role="tab"` | 11 |
| `role="menuitem"` | 15 |
| `role="switch"` | 0 |
| `onclick` attributes | 285 |
| Unique onclick handler names | 121 |
| `data-action` attributes | **1** |
| Empty / `#` href | 0 |

### Delegation vs inline
- `src/js/action-delegate.js` defines a small `ACTIONS` map (`add-to-cart`, `open-product`, `toggle-wishlist`, …) but almost all UI still uses **inline `onclick=`**.
- Self-check comparing every `data-action` to a full registry is incomplete (only 1 `data-action` in DOM).

### Handlers flagged “not found” by static name parse
(May be false positives for dotted/`typeof` expressions — verify in Phase 3 by execution:)

`RoleAccess.goCustomerDashboard`, `RoleAccess.goEstimator`, `RoleAccess.goBulkQuote`, `CatalogDiscovery.resetFilters`, `SiteInspection.captureForCheckout`, `NearbyBhatta.closeDetail|Compare|Quote`, `PushNotifications.*`, plus noisy parses of `typeof …` / `if (…)`.

### Symptom alignment
Many controls rely on globals; re-renders or missing namespaces can yield “button does nothing.” Phase 3 must build `BUTTON_MAP.json` with live click results, not only static names.

---

## 6. Related console / layout notes (in scope for later phases)

- Auth overlap was recently addressed on this branch (`013a174 fix(auth): resolve auth modal overlap…`) — verify no regression.  
- Service worker precaches `i18n.js` but not future `/i18n/*.json`.  
- Hindi layout: Devanagari fonts linked; need Phase 1/6 overflow checks at narrow widths.

---

## 7. Before screenshots

Target path: `/qa/before/` at 360 / 768 / 1366, EN+HI, light+dark.

| Viewport | EN light | HI light | EN dark | HI dark |
|----------|----------|----------|---------|---------|
| 360 | pending / blocked* | pending | N/A (theme pinned light — capture shows light only) | N/A |
| 768 | pending | pending | N/A | N/A |
| 1366 | pending | pending | N/A | N/A |

\*Screenshot capture for this phase: **not completed in-session** if no local server + browser run finishes. Dark-mode “before” will only show the pinned light theme (documents the defect). Re-run after `npx serve` or Pages preview and place files under `qa/before/`.

---

## 8. Phase 0 verdict → Phase 1 priorities

| Defect | Root cause | Next phase |
|--------|------------|------------|
| Lang toggle gone on desktop | `@layer patches` `.nav-lang{display:none}` until ≤900px | Phase 2 |
| Theme toggle missing / broken | Markup removed + head/platform pin light | Phase 2 |
| Incomplete EN/HI | In-memory dict; many literals; weak attribute coverage | Phase 1 |
| Buttons unmapped / wrong | Heavy `onclick`; tiny `data-action` registry | Phase 3 |
| Mobile search blocked by nav | Focus-only; overlay CSS unused; chrome not inert | Phase 4 |

**Phase 0 complete. Stop here before Phase 1 code changes.**
