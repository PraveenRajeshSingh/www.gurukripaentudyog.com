# SCREEN_INVENTORY — GURUKRIPA SERVICES (Phase 0)

**Branch:** `design-responsive-pass-2026-11-10`  
**Scanned:** 2026-11-10  
**Surface:** Legacy static PWA (`index.html` built from `src/pages/index.src.html` + partials). GitHub Pages path `/www.gurukripaentudyog.com/`.  
**Also present (separate HTML):** `offline.html`, `privacy.html`, `404.html`, `500.html`.  
**Not in main SPA shell:** Next preview under `apps/web` (parity only — out of Phase 0 redesign scope unless noted).

No code changes in Phase 0.

---

## A. Standalone pages

| Page | File | Notes / known problems |
|---|---|---|
| Storefront SPA | `index.html` (built) / `src/pages/index.src.html` | Primary surface; hash sections below |
| Offline shell | `offline.html` | SW fallback |
| Privacy (standalone) | `privacy.html` | Also mirrored in `#legalModal` |
| 404 | `404.html` | |
| 500 | `500.html` | |
| Manifest / SW | `manifest.json`, `sw.js` | SW precaches CSS/JS/images at install (defect #7) |

---

## B. Hash routes / in-page sections (main SPA)

Source: `src/pages/index.src.html` includes + section `id`s in partials.

| # | Hash / id | Partial | Primary CSS | Open / navigate | Known problems (from prompt + scan) |
|---|---|---|---|---|---|
| 1 | `#home` | `hero.html` | `sections.css`, `chrome-premium.css`, `refinements.css`, `viewport-adaptive.css` | Default / logo / nav Home | Defect #1: ~770–890px width underused; blurry hero; glass card wrap; CTA stack; Est. pill oval. Defect #4: FAB overlaps hero badge |
| 2 | (trust strip) | `trust-marquee.html` | `sections.css`, `refinements.css` | Scroll | Marquee / motion vs `prefers-reduced-motion` |
| 3 | `#categories` | `categories.html` | `sections.css`, `catalog-premium.css` | Nav / chips | Align with design system |
| 4 | `#price-list` | `daily-prices.html` | `daily-prices.css` | Deep link | Distinct from `#products` but often confused with catalog |
| 5 | `#products` | `products.html` | `catalog-premium.css`, `ecommerce.css`, `compact-catalog-account.css`, `ux-responsive.css` | Nav Products | Defect #5: filters, count ×3, card alignment, duplicate images, stretched Filters btn |
| 6 | `#calculator` | `calculator-2-0.html` | `calculator-studio.css` | Bottom nav Estimator / drawer | Studio layout on narrow widths |
| 7 | `#about` | `about.html` | `sections.css` | Nav About | Brand name inconsistency (#8) |
| 8 | `#gallery` | `factory-gallery.html` | `sections.css`, lightbox `#lb` | Gallery open → `lb` | Lightbox a11y |
| 9 | `#reviews` | `reviews.html` | `sections.css` | Scroll | Testimonials |
| 10 | (CTA) | `cta-banner.html` | `sections.css` | — | |
| 11 | `#cities` | `cities.html` | `sections.css` | Drawer “Delivery” | Delivery coverage |
| 12 | `#nearby-bhatta` | `nearby-bhatta.html` | `nearby-bhatta.css` | Nav Brick Suppliers | Map + list; GPS prompts |
| 13 | `#faq` | `faq.html` | `sections.css` | `toggleFaq` | Accordion |
| 14 | `#contact` | `contact.html` | `sections.css` | Nav Contact | Map iframe + form |
| 15 | Footer `#siteFooter` | `footer.html` | `footer-studio.css`, `chrome-premium.css` | — | Brand legal name (#8); 4-col responsive |
| — | Book Bricks | (no section) | — | `openBulkQuoteModal()` | Modal, not hash |

**Partials present but not included in `index.src.html`:**  
`blog.html`, `brick-detail-cards.html`, `brick-quality-specifications-and-sound-tester.html`, `price-comparison.html`, `quality-process.html`, `where-to-use-which-brick.html`, `why-brl-direct-from-bhatta.html`, `mobile-floating-quick-action-bar.html` (explicitly removed from shell). Treat as dormant unless re-included.

---

## C. Chrome / shell (always present)

| UI | Selector / id | Styles | Open / close | Known problems |
|---|---|---|---|---|
| Page loader | `.page-loader` / `page-loader.html` | `base.css` | Boot hide | — |
| Scroll progress | `#spbar` | `base.css` / `tokens.css` | — | — |
| Top bar | `.topbar` / `topbar.html` | `base.css`, `chrome-premium.css`, `mobile-scroll-master.css` | Always | Defect #3: duplicate language toggle (`#langEn`/`#langHi` + header `#navLangEn`/`#navLangHi`) |
| Header / navbar | `.navbar` / `navbar.html` | `base.css`, `chrome-premium.css`, `mobile-fixes.css` | Sticky | Defect #2: brand clipped ~350px; badge truncated |
| User dropdown / account popup | `#userDropdown`, `#accountPopupSheet`, `#accountPopupBackdrop` | `account.css`, `compact-catalog-account.css` | `toggleUserDropdown` / `closeUserDropdown` | — |
| Mobile drawer | `#mobileDrawer`, `#drawerOverlay` | `overlays.css`, `mobile-scroll-master.css`, `chrome-premium.css` | `toggleDrawer` | Must stay closed on load (recent translateZ fix) |
| Mobile bottom nav | `.mobile-nav` | `mobile-fixes.css`, `fab-stack.css`, tokens `--bottom-nav-h` | Always (CSS) | Defect #3: still visible ~890px; should hide ≥768px |
| FAB stack | `#fabStack`, `#fabHelpBtn`, `#fabWaBtn`, `#fabHelpMenu` | `fab-stack.css` | `toggleFab` / `toggleFabHelp` / `closeFabHelp` | Defect #4: overlaps hero badge & 4th product card |
| WhatsApp float (legacy) | `.wa-float` in `whatsapp-float.html` | `mobile-fixes.css` (hidden ≤768) | Link | May still conflict with FAB |
| Pull-to-refresh | `#gb-ptr-indicator` | `pwa-offline.css` / JS | `pull-to-refresh.js` | Must disable when popup open / inner scroll |
| Toast | `#toast-container` | `tokens.css` | `showToast` | z-index `--z-toast: 9999` |

---

## D. Drawers, sheets, modals, dialogs, toasts

| UI | id / selector | Styles (primary) | Open | Close | Known problems |
|---|---|---|---|---|---|
| Cart drawer | `#cartDrawer`, `#cartOverlay` | `overlays.css`, `ecommerce.css`, `mobile-scroll-master.css` | `openCart` | `closeCart` | Auto-open fixed via translate3d + boot; verify |
| Wishlist drawer | `#wishlistDrawer`, `#wishlistOverlay` | same as cart | `openWishlistDrawer` | `closeWishlistDrawer` | Defect #10 class: must not open on product page load |
| Auth (login/register) | `#authModal` | `overlays.css`, `popup-polish.css`, `account.css` | `openAuth(tab)` | `closeAuth` | OTP / Google paths |
| My Account / profile | `#profileModal` | `account.css`, `compact-catalog-account.css`, `ops-console.css` (tabs) | `openProfile` / `openProfileTab` | `closeProfile` | Tabs overflow; edit profile |
| Account edit (from menu) | profile tab / `openAccountEditProfile` | `account-popup.js` | `openAccountEditProfile` | via profile | — |
| Checkout | `#checkoutModal` | `overlays.css`, `ecommerce.css`, `popup-polish.css` | `openCheckout` | `closeCheckout` / steps `showCheckoutStep` | Sticky totals; 1-col <480 |
| Bulk quote / RFQ / Book Bricks | `#bulkQuoteModal` | `overlays.css`, `popup-polish.css` | `openBulkQuoteModal` | `closeBulkQuoteModal` | — |
| Product detail | `#productModal` | `overlays.css`, `catalog-premium.css` | `openProductDetail` | `closeProductModal` | Gallery + info |
| Compare (catalog) | `#compareModal`, `#compareBar` | `catalog-premium.css`, `ecommerce.css` | `CatalogDiscovery.openCompare` | `closeCompareModal` | Horizontal scroll |
| Nearby detail | `#nearbyDetailModal` | `nearby-bhatta.css` | `NearbyBhatta.openDetail` | `closeDetail` | — |
| Nearby compare | `#nearbyCompareModal` | `nearby-bhatta.css` | `NearbyBhatta.openCompare` | `closeCompare` | — |
| Nearby quote | `#nearbyQuoteModal` | `nearby-bhatta.css` | `NearbyBhatta.openQuote` | `closeQuote` | — |
| Filter sheet / rail | `#catalogSidebar`, `#filterSheetBackdrop` | `catalog-premium.css`, `compact-catalog-account.css` | `toggleFilterSheet` | `toggleFilterSheet(false)` | Defect #5: desktop opens inline, weak/no backdrop; Filters btn ~520px |
| Sort sheet | `#catalogSortSheet` | `catalog-premium.css` | `openCatalogSortSheet` | `closeCatalogSortSheet` | Mobile bottom sheet |
| Mini cart bar | `#catalogMiniCart` | `catalog-premium.css` | cart state | — | Must clear FAB / bottom nav |
| Pincode / delivery checker | `#pincodeModal` | `overlays.css` | `openPincodeModal` | `closePincodeModal` | — |
| Live tracker | `#trackerModal` | `mobile-fixes.css`, `overlays.css` | `openTrackerModal` | `closeTrackerModal` | — |
| Order details | `#orderDetailsModal` | `overlays.css` | `openOrderDetailsModal` | `closeOrderDetailsModal` | — |
| GST tax invoice | `#gstInvoiceModal` | `mobile-fixes.css` | `openGstInvoice` | `closeGstInvoice` | Legal name (#8) |
| Invoice PDF preview | `#invoicePdfModal` | `mobile-fixes.css` | `openInvoicePdf` | `closeInvoicePdf` | Print stylesheet |
| Company profile | `#companyProfileModal` | `mobile-fixes.css` | `openCompanyProfile` | `closeCompanyProfile` | Admin hero fields optional |
| Legal / policies | `#legalModal` | `overlays.css` | `openLegalModal(tab)` | `closeLegalModal` | Tabs: privacy/terms/refund/shipping |
| Notification center | `#notificationCenterModal` | `overlays.css` | `openNotificationCenter` | `closeNotificationCenter` | — |
| Admin / ops portal | `#adminPortalModal` | `ops-console.css` | `openAdminPortal` | `closeAdminPortal` | Staff-only; not public |
| Lightbox | `#lb`, `#lbImg`, `#lbCap` | `extras.css` / overlays | gallery click / `lbClose` | `lbClose` | Pinch/swipe TBD |
| Chatbot / assistant | `#chatbotWrap`, `#chatbotBox` | `extras.css`, tokens `--z-chat` | `toggleChatbot` | `toggleChatbot(false)` | Full-screen mobile |
| Confirm / alert / prompt | `#gbDialogModal` (JS-built) | `popups.css` / overlays | `GBDialogs.show` / confirm | dismiss | Shared `OVERLAY_STACK` |
| PWA update toast | (pwa.js) | `pwa-offline.css` | `showUpdateToast` | `hideUpdateToast` | Keep |
| Search suggest panel | `#searchSuggestPanel` | `ecommerce.css` / navbar | focus search | `CatalogDiscovery` hide | Not a modal |
| Voice search | `#voiceSearchBtn` | navbar | `toggleVoiceSearch` | — | — |
| Saved sites panel | (calculator / profile) | `calculator-studio.css` | `toggleSaveSitePanel` | — | — |

---

## E. CSS inventory (load order from `head.html`)

**Count:** 27 files under `src/styles/` + `src/assets/fonts/offline-fonts.css`  
**Total stylesheet weight (styles only):** **694.8 KB** uncompressed on disk.

| File | KB | Role |
|---|---:|---|
| tokens.css | 12.6 | Variables / z-index / toast |
| base.css | 26.1 | Reset-ish, chrome base |
| sections.css | 46.0 | Page sections |
| overlays.css | 39.6 | Modals/drawers |
| popups.css | 13.7 | Dialog patterns |
| extras.css | 49.1 | Lightbox, chatbot, misc |
| app.css | 38.6 | App shell glue |
| mobile-fixes.css | **118.0** | Large patch dump |
| refinements.css | **95.6** | Patch dump |
| account.css | 11.0 | Account |
| ops-console.css | 25.9 | Admin (eager today) |
| ux-responsive.css | 12.8 | Patch |
| ecommerce.css | 16.4 | Cart/commerce |
| popup-polish.css | 12.4 | Patch |
| interaction-fixes.css | 21.4 | Patch (`!important` heavy) |
| compact-catalog-account.css | 21.4 | Patch |
| pwa-offline.css | 5.6 | Offline / PTR |
| calculator-studio.css | 24.3 | Estimator (eager) |
| fab-stack.css | 6.2 | FAB |
| footer-studio.css | 12.5 | Footer |
| polish-pass.css | 3.1 | Patch |
| catalog-premium.css | 26.4 | Products |
| nearby-bhatta.css | 12.5 | Suppliers |
| daily-prices.css | 1.9 | Price list |
| viewport-adaptive.css | 14.6 | Adaptive |
| mobile-scroll-master.css | 19.5 | Scroll/drawers (also root of prior auto-open bug) |
| chrome-premium.css | 7.5 | Recent header/hero/footer |

**`!important` counts (selected):** mobile-fixes **499**, interaction-fixes **101**, viewport-adaptive **75**, ux-responsive **74**, compact-catalog-account **69**, popup-polish **46**, refinements **32**, catalog-premium **28**, mobile-scroll-master **27**, ecommerce **21**. Total scale indicates Phase 1 consolidation is required.

---

## F. Global layout / scroll / z-index rules that can break UX

### Z-index scale (`tokens.css`)
| Token | Value | Use |
|---|---:|---|
| `--z-sticky` | 100 | |
| `--z-fixed` / `--z-header` | 900 | Bottom nav & sticky header (same band — collision risk) |
| `--z-overlay` | 1000 | Dim layers |
| `--z-drawer` | 1010 | Cart / wishlist / mobile drawer |
| `--z-modal` | 1100 | Dialogs |
| `--z-chat` | 1150 | Assistant |
| `--z-lightbox` | 1200 | Lightbox |
| `--z-toast` | 9999 | Toasts / loader |

Overrides: `mobile-scroll-master` uses 9998 for some fixed layers; `mobile-fixes` forces `.mobile-nav` ~990 `!important`; base loader 9999.

### Overflow / body lock
- `overlayLock` / `overlayUnlock` in `ui.js`: `body` `position:fixed` + `top:-scrollY` + width lock.
- `mobile-scroll-master.css`: `html, body` touch-action / overscroll; `.modal-overlay` `overflow:hidden`, `touch-action:none`; open-body companions with `overflow:hidden !important`.
- `mobile-fixes.css`: `body { overscroll-behavior-y: contain }`; many `overflow:hidden` on cards/modals (clip risk).
- `viewport-adaptive.css`: fixed overlay + `overflow:hidden !important` patterns.

### Touch / PTR
- `touch-action: pan-y` / `manipulation` / `none` on overlays (`mobile-scroll-master.css`).
- `pull-to-refresh.js` + `#gb-ptr-indicator`; suppresses native PTR on Android; must pause when modal open / inner scroll.

### Position:fixed layers (frequent)
Topbar, navbar, drawer, cart/wishlist, bottom nav, FAB, scroll-top, mini-cart, chatbot, lightbox, PTR indicator, toast, page loader, filter backdrop.

---

## G. Open/close function map (canonical)

| Function | File |
|---|---|
| `toggleDrawer` | `ui.js` |
| `openCart` / `closeCart` | `cart.js` |
| `openWishlistDrawer` / `closeWishlistDrawer` | `wishlist-drawer.js` |
| `openAuth` / `closeAuth` | `auth-modal.js` |
| `openProfile` / `closeProfile` / `openProfileTab` | `profile-modal.js` |
| `openCheckout` / `closeCheckout` / `showCheckoutStep` | `checkout.js` |
| `openBulkQuoteModal` / `closeBulkQuoteModal` | `main.js` |
| `openProductDetail` / `closeProductModal` | `products.js` |
| `toggleFilterSheet` / `openCatalogSortSheet` / `closeCatalogSortSheet` | `products.js` |
| `CatalogDiscovery.openCompare` / `closeCompareModal` | `catalog-discovery.js` |
| `NearbyBhatta.openDetail|Compare|Quote` / closes | `nearby-bhatta.js` |
| `openPincodeModal` / `closePincodeModal` | `pincodeChecker.js` |
| `openTrackerModal` / `closeTrackerModal` | `tracker.js` |
| `openOrderDetailsModal` / `closeOrderDetailsModal` | `invoice.js` |
| `openGstInvoice` / `closeGstInvoice` | `invoice.js` |
| `openInvoicePdf` / `closeInvoicePdf` | `invoice.js` |
| `openCompanyProfile` / `closeCompanyProfile` | `invoice.js` |
| `openLegalModal` / `closeLegalModal` | `ui.js` |
| `openNotificationCenter` / `closeNotificationCenter` | `ui.js` |
| `openAdminPortal` / `closeAdminPortal` | `admin-portal.js` |
| `toggleChatbot` | `chatbot.js` |
| `toggleFab` / `toggleFabHelp` / `closeFabHelp` | `fab-stack.js` / `ui.js` |
| `showToast` | `ui.js` |
| `GBDialogs.*` | `dialogs.js` |
| `lbClose` | (gallery / extras) |
| `overlayLock` / `overlayUnlock` / `openOverlay` / `closeOverlay` | `ui.js` |
| `ensureOverlaysClosedOnBoot` | `ui.js` |

---

## H. Defect register (seed for DEFECTS.md — Phase 0 status: observed / not fixed)

| ID | Symptom | Suspected root (from code scan) | Status |
|---|---|---|---|
| D1 | Hero underuses width ~770–890px; blurry image; glass wrap; CTA column; Est. pill oval | Hero grid/media queries + missing/incorrect `srcset`/`sizes`; glass `max-width` + word-break; pill `border-radius:999px` | Open → Phase 2–3 |
| D2 | ~350px header clips brand; Est. badge truncated | Navbar flex without `min-width:0`; badge text not shortened | Open → Phase 2 |
| D3 | Duplicate lang toggle; bottom nav at ~890px | Topbar + navbar both call `setLang`; bottom nav media query not `max-width:767px` only | Open → Phase 2 |
| D4 | FAB overlaps hero badge & product card 4 | FAB fixed offsets ignore content; no collision avoid | Open → Phase 2 |
| D5 | Products filters / counts / card align / images | Filter sheet desktop mode; triplicate count nodes (`#productsCount`, `#catalogSheetCount`, `#productsCountDesktop`/`#catalogShowing`); no subgrid; shared product images | Open → Phase 3 |
| D6 | Navy/neon vs warm theme; SHIV photo is benchmark | Product renders / theme tokens | Open → Phase 1/3 |
| D7 | Slow 4G: ~200 req / 7.7 MB; SW precaches everything | `sw.js` install list; 27 CSS + many JS eager | Open → Phase 5 |
| D8 | Brand “Gurukripa Services” vs “Gurukripa Bricks Industry” | Scattered strings in header vs title/meta/footer/invoice | Open → Phase 2 |
| D9 | Drawers default-open class | `translateZ(0)` wiped off-canvas transforms | **Mitigated** in prior pass (`mobile-scroll-master` + boot closer) — re-verify Phase 7 |

---

## I. Before screenshots (captured Phase 0)

Path: `qa/before/` (also mirrored under Cursor temp screenshots during capture).  
Method: Cursor browser + CDP `Emulation.setDeviceMetricsOverride` against `http://localhost:4173/` (static `serve`).  
Playwright script `scripts/qa-before-screenshots.mjs` is staged for Phase 7 (needs local `playwright` install; not run successfully in Phase 0).

| File | Viewport | Screen | Notes from capture |
|---|---|---|---|
| `350-home.png` | 350 | Hero | Brand name clipped by EN\|हिंदी; Est. pill cramped; FAB overlaps CTA |
| `360-home.png` | 360 | Hero | Same class of header clip / FAB overlap |
| `768-home.png` | 768 | Hero | Left column only; large empty right; hamburger still used |
| `770-home.png` | 770 | Hero | **Measured:** copyW≈302, mediaW≈302, `bottomNav=block`, img=`hero-768.jpg` natural≈369 |
| `890-home.png` | 890 | Hero | **Measured:** copy/media ≈350 each, `bottomNav=block`, Filters btn ≈341px; duplicate lang (topbar+header) |
| `1024-home.png` | 1024 | Hero | Two-column attempt; glass card / image quality issues |
| `1024-products.png` | 1024 | Products | Filters control wide; duplicate “8 products” |
| `1366-home.png` | 1366 | Hero | Full nav visible; **img currentSrc=`hero-768.jpg`** (natural 655) — wrong srcset for desktop |
| `1366-products.png` | 1366 | Products | **Measured:** `#productsCount`, `#catalogSheetCount`, `#productsCountDesktop` all visible with “8 products”; filter rail / grid spacing broken |

Not yet captured as image files (inventory complete; screenshots deferred to Phase 7 sweep): calculator, nearby, contact, footer, every popup. Live DOM inventory above still covers them.

---

## J. Phase 0 live measurements (Runtime.evaluate)

| Width | Finding |
|---:|---|
| 770 | Hero columns ≈302px each; bottom nav `display:block`; hero file `hero-768.jpg` |
| 890 | Hero columns ≈350px; bottom nav `block`; Filters button width ≈341 |
| 1366 | Hero copy ≈594 / media ≈538; bottom nav `none`; hero still serves `hero-768.jpg`; three product-count nodes visible |

---

## K. Evidence notes for later phases

- CSS before: **27 files, 694.8 KB** (`src/styles`).
- JS modules: **53** files under `src/js`.
- Partials: **53** under `src/pages/partials`.
- Existing docs to cross-check: `BUTTON_MAP.md`, `SHOT_LIST.md`, `docs/POPUP-UX-REPORT.md`, `CATALOG_REDESIGN.md`.
- Document title still **“Gurukripa Bricks Industry …”** while header/footer display **Gurukripa Services** (D8).
