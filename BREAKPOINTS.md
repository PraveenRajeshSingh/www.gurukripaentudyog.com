# Gurukripa Bricks Industry — Hard-coded Breakpoints Audit (BREAKPOINTS.md)

> Generated as part of Phase 1 Root Cause Analysis for Fluid Layout & Console Cleanup.

## 1. Disagreement Analysis (Header, Hero, Grids, Popups)

| Component | Breakpoint(s) Found | Behavioral Conflict |
|---|---|---|
| **Header Navigation** | `min-width: 1024px` / `max-width: 1023.98px` (`chrome-premium.css`), `max-width: 768px` (`app.css`) | Header abruptly drops into mobile hamburger at 1023px even when plenty of room (~950–1000px) exists for nav items. |
| **Hero Section** | `min-width: 1024px` (`chrome-premium.css`), `max-width: 900px` (`app.css`), `768px–1199px` (`mobile-fixes.css`) | Hero stays trapped in a single-column mobile stack until 1024px wide, leaving ~600px of empty space on the right at ~950px. |
| **Product Catalog Grid** | `min-width: 1024px` (`catalog-premium.css`), `max-width: 900px`, `max-width: 600px` (`app.css`), `max-width: 480px` | Different sheets define conflicting column counts (`repeat(2, 1fr)`, `repeat(3, 1fr)`, `repeat(4, 1fr)`). |
| **Popups / Sheets** | `max-width: 768px` (`popups.css`), `max-width: 640px` (`mobile-fixes.css`), `max-width: 1024px` (`viewport-adaptive.css`) | Drawers behave as bottom sheets below 768px in some files and 640px in others. |
| **Sticky FAB / Nav** | `max-width: 767.98px` (`fab-stack.css`), `max-width: 1024px` (`app.css`), `max-width: 480px` (`mobile-fixes.css`) | Bottom navigation bar vs desktop floating action button stack have divergent trigger points. |

## 2. Hard-coded Media Queries in CSS (Grouped by Breakpoint Value)

| Media Query | Occurrences | Source Locations (Sample) |
|---|---|---|
| `@media (display-mode: standalone)` | 3 | app.css:61, app.css:1046, mobile-fixes.css:1994 |
| `@media (hover: hover) and (pointer: fine)` | 2 | catalog-premium.css:884, mobile-scroll-master.css:197 |
| `@media (max-height: 500px) and (orientation: landscape)` | 1 | interaction-fixes.css:397 |
| `@media (max-height: 520px)` | 2 | interaction-fixes.css:566, popup-polish.css:251 |
| `@media (max-height: 560px)` | 2 | refinements.css:1721, viewport-adaptive.css:248 |
| `@media (max-height: 700px)` | 1 | refinements.css:1977 |
| `@media (max-width: 1023.98px)` | 6 | catalog-premium.css:347, chrome-premium.css:90, pages-phase3.css:33... |
| `@media (max-width: 1023px)` | 1 | calculator-studio.css:855 |
| `@media (max-width: 1024px)` | 9 | app.css:83, app.css:159, app.css:326... |
| `@media (max-width: 1099.98px)` | 1 | chrome-premium.css:180 |
| `@media (max-width: 340px)` | 2 | mobile-fixes.css:1937, mobile-fixes.css:1958 |
| `@media (max-width: 359.98px)` | 1 | pages-phase3.css:110 |
| `@media (max-width: 359px)` | 2 | calculator-studio.css:977, mobile-scroll-master.css:451 |
| `@media (max-width: 360px)` | 10 | app.css:147, app.css:297, app.css:986... |
| `@media (max-width: 375px)` | 1 | interaction-fixes.css:367 |
| `@media (max-width: 380px)` | 6 | app.css:550, chrome-premium.css:187, ecommerce.css:163... |
| `@media (max-width: 400px)` | 1 | calculator-studio.css:967 |
| `@media (max-width: 420px)` | 3 | app.css:477, ops-console.css:480, popups.css:471 |
| `@media (max-width: 430px)` | 1 | ux-responsive.css:479 |
| `@media (max-width: 479px)` | 1 | calculator-studio.css:955 |
| `@media (max-width: 480px)` | 22 | app.css:108, app.css:273, app.css:342... |
| `@media (max-width: 520px)` | 1 | ecommerce.css:245 |
| `@media (max-width: 540px)` | 3 | app.css:671, refinements.css:1963, ux-responsive.css:139 |
| `@media (max-width: 560px)` | 6 | account.css:366, chrome-premium.css:309, refinements.css:395... |
| `@media (max-width: 600px)` | 2 | app.css:422, refinements.css:712 |
| `@media (max-width: 620px)` | 1 | refinements.css:2578 |
| `@media (max-width: 639.98px)` | 1 | catalog-premium.css:77 |
| `@media (max-width: 639px)` | 5 | calculator-studio.css:879, mobile-fixes.css:2660, popup-polish.css:186... |
| `@media (max-width: 640px)` | 15 | app.css:510, app.css:875, app.css:964... |
| `@media (max-width: 719px)` | 1 | ops-console.css:954 |
| `@media (max-width: 720px)` | 1 | mobile-fixes.css:2566 |
| `@media (max-width: 767.98px)` | 7 | chrome-premium.css:363, fab-stack.css:188, fab-stack.css:238... |
| `@media (max-width: 767.98px) and (orientation: landscape)` | 1 | fab-stack.css:210 |
| `@media (max-width: 767px)` | 7 | compact-catalog-account.css:69, interaction-fixes.css:188, mobile-scroll-master.css:418... |
| `@media (max-width: 768px)` | 15 | app.css:54, app.css:1011, app.css:1099... |
| `@media (max-width: 900px)` | 6 | app.css:392, ecommerce.css:160, popup-polish.css:348... |
| `@media (max-width: 960px)` | 2 | compact-catalog-account.css:485, refinements.css:622 |
| `@media (min-width: 1000px)` | 1 | ops-console.css:713 |
| `@media (min-width: 1024px)` | 16 | catalog-premium.css:241, catalog-premium.css:320, catalog-premium.css:522... |
| `@media (min-width: 1024px) and (max-width: 1279.98px)` | 1 | pages-phase3.css:126 |
| `@media (min-width: 1024px) and (max-width: 1279px)` | 1 | compact-catalog-account.css:58 |
| `@media (min-width: 1024px) and (max-width: 1365px)` | 1 | mobile-scroll-master.css:495 |
| `@media (min-width: 1025px)` | 7 | compact-catalog-account.css:545, compact-catalog-account.css:793, interaction-fixes.css:357... |
| `@media (min-width: 1280px)` | 3 | catalog-premium.css:528, compact-catalog-account.css:53, design-system.css:75 |
| `@media (min-width: 1280px) and (max-width: 1535.98px)` | 1 | pages-phase3.css:131 |
| `@media (min-width: 1366px)` | 1 | mobile-scroll-master.css:500 |
| `@media (min-width: 1441px)` | 2 | interaction-fixes.css:414, nearby-bhatta.css:585 |
| `@media (min-width: 1536px)` | 3 | catalog-premium.css:534, design-system.css:81, pages-phase3.css:136 |
| `@media (min-width: 360px) and (max-width: 374px)` | 1 | mobile-scroll-master.css:465 |
| `@media (min-width: 360px) and (max-width: 639.98px)` | 1 | pages-phase3.css:116 |
| `@media (min-width: 375px) and (max-width: 389px)` | 1 | mobile-scroll-master.css:470 |
| `@media (min-width: 376px) and (max-width: 480px)` | 1 | interaction-fixes.css:378 |
| `@media (min-width: 390px) and (max-width: 413px)` | 1 | mobile-scroll-master.css:475 |
| `@media (min-width: 414px) and (max-width: 479px)` | 1 | mobile-scroll-master.css:480 |
| `@media (min-width: 480px)` | 3 | catalog-premium.css:879, design-system.css:44, popups.css:217 |
| `@media (min-width: 480px) and (max-width: 639px)` | 1 | calculator-studio.css:988 |
| `@media (min-width: 480px) and (max-width: 767px)` | 1 | mobile-scroll-master.css:485 |
| `@media (min-width: 481px) and (max-width: 1024px)` | 1 | interaction-fixes.css:726 |
| `@media (min-width: 481px) and (max-width: 767px)` | 2 | compact-catalog-account.css:788, interaction-fixes.css:384 |
| `@media (min-width: 481px) and (max-width: 768px)` | 1 | app.css:1039 |
| `@media (min-width: 560px)` | 2 | ops-console.css:712, ux-responsive.css:345 |
| `@media (min-width: 621px)` | 1 | ux-responsive.css:357 |
| `@media (min-width: 640px)` | 7 | ecommerce.css:323, ecommerce.css:342, overlays.css:632... |
| `@media (min-width: 640px) and (max-width: 1023.98px)` | 2 | catalog-premium.css:516, pages-phase3.css:121 |
| `@media (min-width: 640px) and (max-width: 1023px)` | 1 | calculator-studio.css:994 |
| `@media (min-width: 700px)` | 1 | popup-polish.css:305 |
| `@media (min-width: 768px)` | 6 | chrome-premium.css:392, design-system.css:51, fab-stack.css:222... |
| `@media (min-width: 768px) and (max-width: 1023.98px)` | 1 | shell-phase2.css:143 |
| `@media (min-width: 768px) and (max-width: 1023px)` | 2 | compact-catalog-account.css:63, mobile-scroll-master.css:490 |
| `@media (min-width: 768px) and (max-width: 1024px)` | 3 | interaction-fixes.css:390, interaction-fixes.css:573, viewport-adaptive.css:267 |
| `@media (min-width: 769px)` | 2 | mobile-fixes.css:1934, mobile-fixes.css:2202 |
| `@media (min-width: 900px)` | 1 | refinements.css:1163 |
| `@media (orientation: landscape) and (max-height: 500px)` | 1 | mobile-scroll-master.css:505 |
| `@media (prefers-reduced-motion: no-preference)` | 1 | nearby-bhatta.css:160 |
| `@media (prefers-reduced-motion: reduce)` | 29 | a11y-phase6.css:68, account.css:337, calculator-studio.css:253... |
| `@media max-width:600px below) so the button` | 1 | refinements.css:1064 |
| `@media prefers-color-scheme: dark) and explicit` | 1 | mobile-fixes.css:27 |
| `@media print` | 2 | extras.css:1470, fab-stack.css:183 |
| `@media(max-width: 600px)` | 1 | mobile-fixes.css:253 |
| `@media(max-width: 768px)` | 1 | mobile-fixes.css:1874 |
| `@media(max-width: 900px)` | 1 | mobile-fixes.css:247 |
| `@media(max-width:1024px)` | 6 | base.css:662, extras.css:141, extras.css:452... |
| `@media(max-width:320px)` | 1 | extras.css:1431 |
| `@media(max-width:360px)` | 3 | extras.css:1384, mobile-fixes.css:1250, mobile-fixes.css:1794 |
| `@media(max-width:380px)` | 1 | mobile-fixes.css:1626 |
| `@media(max-width:400px)` | 1 | mobile-fixes.css:1713 |
| `@media(max-width:480px)` | 19 | extras.css:653, extras.css:1024, extras.css:1108... |
| `@media(max-width:520px)` | 1 | mobile-fixes.css:1258 |
| `@media(max-width:540px)` | 3 | mobile-fixes.css:1266, mobile-fixes.css:1655, mobile-fixes.css:1692 |
| `@media(max-width:560px)` | 4 | extras.css:318, extras.css:952, sections.css:1010... |
| `@media(max-width:640px)` | 6 | base.css:674, extras.css:46, extras.css:1256... |
| `@media(max-width:767.98px)` | 1 | mobile-fixes.css:1384 |
| `@media(max-width:767px)` | 1 | mobile-fixes.css:1488 |
| `@media(max-width:768px)` | 7 | extras.css:640, extras.css:1213, mobile-fixes.css:1353... |
| `@media(max-width:900px)` | 8 | extras.css:942, extras.css:1018, extras.css:1196... |
| `@media(min-width:1280px)` | 1 | extras.css:1159 |
| `@media(min-width:1440px)` | 1 | extras.css:1146 |
| `@media(min-width:2560px)` | 1 | extras.css:1129 |
| `@media(min-width:768px) and (max-width:1199px)` | 1 | mobile-fixes.css:1462 |

## 3. JavaScript Breakpoint & Width Checks (`matchMedia`, `innerWidth`)

| File & Line | Code Snippet |
|---|---|
| `calculator.js:357` | `const mobile = window.matchMedia('(max-width: 639px)').matches;` |
| `calculator.js:366` | `if (panel) panel.scrollIntoView({ behavior: (window.matchMedia('(prefers-reduced-motion: reduce)').m` |
| `calculator.js:952` | `const wide = window.matchMedia('(min-width: 640px)').matches;` |
| `estimatorPreview.js:12` | `const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matc` |
| `estimatorPreview.js:14` | `const containerW = frame ? (frame.clientWidth \|\| 320) : 320;` |
| `fab-stack.js:55` | `if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) hide();` |
| `fab-stack.js:72` | `const mobile = window.matchMedia('(max-width: 767.98px)').matches;` |
| `fab-stack.js:87` | `const mobile = window.matchMedia('(max-width: 767.98px)').matches;` |
| `fab-stack.js:115` | `const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;` |
| `platform.js:179` | `const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;` |
| `popup-manager.js:16` | `return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);` |
| `popup-manager.js:103` | `if (window.matchMedia && !window.matchMedia('(max-width: 1023.98px)').matches) return;` |
| `products.js:378` | `return !!(window.matchMedia && window.matchMedia('(min-width: 1024px)').matches);` |
| `products.js:679` | `let _railMq = window.matchMedia ? window.matchMedia('(min-width: 1024px)') : null;` |
| `products.js:816` | `if (sb && window.matchMedia && window.matchMedia('(min-width: 1024px)').matches) {` |
| `pull-to-refresh.js:38` | `return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;` |
| `reliability.js:405` | `viewport: { w: window.innerWidth, h: window.innerHeight },` |
| `ui.js:180` | `const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;` |
| `ui.js:195` | `const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;` |
| `ui.js:342` | `if (window.matchMedia && window.matchMedia('(max-width: 1023.98px)').matches) {` |
| `ui.js:367` | `return typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 1024px)').matches;` |
| `ui.js:408` | `const vw = window.innerWidth;` |
