# Gurukripa Bricks Industry (गुरुकृपा ईंट उद्योग)
### Cross-Platform Production Architecture: Web · Android · iOS

[![Build Status](https://img.shields.io/badge/Build-Passing-15803d.svg)]()
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android%20%7C%20iOS-C8460A.svg)]()
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)]()

---

## 1. Executive Summary & Architecture Standard

Gurukripa Bricks Industry is an enterprise client-side e-commerce and manufacturing portal engineered with a **Single Source of Truth** architecture:

```
                          ┌──────────────────────────┐
                          │   Core Source of Truth   │
                          │     (src/pages, src/js,  │
                          │         src/styles)      │
                          └─────────────┬────────────┘
                                        │
                                        ▼ (npm run www)
                          ┌──────────────────────────┐
                          │    Clean Deploy Bundle   │
                          │          (./www)         │
                          └──────┬──────┬──────┬─────┘
                                 │      │      │
            ┌────────────────────┘      │      └───────────────────┐
            ▼                           ▼                          ▼
    ┌───────────────┐           ┌───────────────┐          ┌───────────────┐
    │  Web Browser  │           │    Android    │          │      iOS      │
    │ (GitHub Pages │           │  Native Shell │          │  Native Shell │
    │ Custom Domain)│           │ (Google Play) │          │  (App Store)  │
    └───────────────┘           └───────────────┘          └───────────────┘
```

### Why this stack over a complete framework rewrite?
1. **Preservation of 100% of Working Business Logic:** Gurukripa Bricks contains verified, production-ready algorithms for 3-in-1 brick estimation, 5% Indian GST calculations (CGST 2.5% + SGST 2.5%), bilingual English/Hindi localization, coupon discounts, order tracking, and client state. Rewriting into React Native or Flutter would duplicate 100% of these rules and introduce severe regression risks.
2. **Zero-Runtime Overhead:** Vanilla ES6+ modules with native browser rendering provide instantaneous sub-300ms initial paint, 60fps animations, zero virtual DOM reconciliation overhead, and complete offline capability via Service Worker (`sw.js`).
3. **True Cross-Platform Parity:** Using Capacitor 6, the exact same staged web bundle (`./www`) compiles directly into native Android (`android/`) and iOS (`ios/`) applications, accessing native APIs (Status Bar, Splash Screen, Hardware Back Button, Haptics, and Web Share) through a unified platform adapter.

---

## 2. Directory Structure & Naming Standard

```
www.gurukripaentudyog.com/
├── .well-known/                # Deep links & domain association
│   ├── assetlinks.json         # Android App Links (SHA-256 fingerprint)
│   └── apple-app-site-association # iOS Universal Links (Apple Team ID)
├── android/                    # Native Android Studio Gradle Project (Capacitor)
├── ios/                        # Native iOS Xcode Project (Capacitor)
├── docs/                       # Technical architecture documentation
│   └── ARCHITECTURE.md
├── scripts/                    # Deterministic build & staging automation
│   ├── build.js                # Assembles index.html from partials
│   └── prepare-www.js          # Stages clean runtime bundle into ./www/
├── src/                        # Primary source of truth
│   ├── assets/                 # Brand imagery, icons, logos, and vendor fonts
│   ├── js/                     # Modular client-side JavaScript (globals preserved)
│   │   ├── auth-modal.js       # Authentication, validation, and lockout management
│   │   ├── calculator.js       # 3-in-1 Wall, House & Boundary brick estimator
│   │   ├── cart.js             # Cart drawer, free-delivery meter, and coupons
│   │   ├── chatbot.js          # Automated customer inquiry assistant
│   │   ├── checkout.js         # Multi-step checkout & payment wizard
│   │   ├── data.js             # Product catalog, coupons, and vendor directory
│   │   ├── google-auth.js      # Google OAuth 2.0 client bridge
│   │   ├── i18n.js             # Bilingual EN/HI translation dictionaries
│   │   ├── invoice.js          # GST Tax invoice generation and re-order logic
│   │   ├── main.js             # Bootstrap lifecycle and event bindings
│   │   ├── otp-panel.js        # Mobile OTP authentication modal
│   │   ├── platform.js         # Cross-platform runtime adapter (Web/Android/iOS)
│   │   ├── products.js         # Product catalog rendering and filtering
│   │   ├── profile-modal.js    # User profile, addresses, and order history
│   │   ├── state.js            # Secure state persistence and XSS sanitization
│   │   ├── tracker.js          # Real-time bhatta order and trolley delivery tracker
│   │   └── utils.js            # Indian number grouping and currency formatting
│   ├── pages/
│   │   ├── index.src.html      # Main page template with deterministic @include markers
│   │   └── partials/           # 38 granular UI section partials (< 250 lines each)
│   ├── styles/                 # Cascade-ordered modular stylesheets
│   │   ├── tokens.css          # Design tokens, color system, and global reset
│   │   ├── base.css            # Base typography, layout container, buttons
│   │   ├── sections.css        # Page sections (hero, features, catalog, bhatta)
│   │   ├── overlays.css        # Modals, drawers, lightboxes, and popups
│   │   ├── extras.css          # Calculator, sound tester, and vendor showcase
│   │   ├── app.css             # Application-level controls, theme toggles, and nav
│   │   ├── mobile-fixes.css    # Responsive touch targets, dark theme, and grid rules
│   │   └── refinements.css     # Micro-interactions, animations, and visual polish
│   └── types/
│       └── index.d.ts          # TypeScript domain models and contracts
├── tests/                      # Automated unit and integration test suite
│   ├── build.test.js           # Build integrity and line-count constraint validation
│   ├── calculator.test.js      # Material estimation formula verification
│   ├── coupons.test.js         # Coupon discount logic and boundary tests
│   ├── i18n.test.js            # Bilingual key parity and placeholder integrity
│   ├── pricing.test.js         # Catalog pricing and GST reverse-tax calculations
│   └── utils.test.js           # Currency formatting, sanitization, and security
├── capacitor.config.json       # Capacitor cross-platform shell configuration
├── index.html                  # Assembled production web entry point
├── manifest.json               # Progressive Web App manifest
├── package.json                # Project dependencies, scripts, and engine specs
└── sw.js                       # Offline caching service worker
```

---

## 3. Design System & Semantic Color Tokens

Tokens are centralized in [`src/styles/tokens.css`](file:///c:/Users/HP/www.gurukripaentudyog.com/src/styles/tokens.css) and cascaded universally:

| Category | Token | Light Theme | Dark Theme | Purpose |
|---|---|---|---|---|
| **Brand** | `--brand` | `#C8460A` | `#C8460A` | Primary terracotta red brick brand |
| **Brand Dark** | `--brand-dark` | `#8B2E05` | `#8B2E05` | Deep kiln clay accent |
| **Brand Accent** | `--brand-amber` | `#F5A623` | `#F5A623` | Kiln fire highlights and stars |
| **Surfaces** | `--bg` | `#FAFAF9` | `#130B05` | Main page canvas |
| | `--bg-card` | `#FFFFFF` | `#1C1009` | Elevated cards, forms, and dialogs |
| | `--bg-subtle` | `#F5F0EC` | `#241509` | Subtle section backgrounds |
| **Typography** | `--ink` | `#1C1009` | `#F5EEE8` | High-contrast headings (WCAG AAA) |
| | `--ink-2` | `#4A3728` | `#D4BCA8` | Primary body text (WCAG AA) |
| | `--ink-3` | `#6B5545` | `#9F826E` | Secondary/helper text (WCAG AA >= 4.5:1) |
| **Borders** | `--line` | `rgba(200,70,10,0.12)` | `rgba(200,70,10,0.18)` | Subtle card dividers |
| | `--line-mid` | `rgba(200,70,10,0.22)` | `rgba(200,70,10,0.30)` | Input borders and table lines |
| **Semantics** | `--success` | `#15803d` | `#15803d` | Confirmation, orders, and delivery |
| | `--warning` | `#b45309` | `#b45309` | Low stock, offline alerts |
| | `--danger` | `#b91c1c` | `#b91c1c` | Error alerts and form errors |
| | `--info` | `#0369a1` | `#0369a1` | Tooltips, informational notices |
| **A11y** | `--focus-ring` | `rgba(200,70,10,0.35)` | `rgba(245,166,35,0.45)` | Visible keyboard focus outline |

### Theme Switching Mechanism
Theme mode can be controlled via:
1. **User manual selection:** Light or Dark via UI toggle button in Topbar, Navbar, and Mobile Drawer. Stored in `localStorage.getItem('gb_theme')`.
2. **System auto-detection:** Respects `prefers-color-scheme: dark` automatically when no manual preference is set.
3. **Zero FOUC:** An inline pre-render script in `<head>` applies `data-theme` before CSS rendering begins.

---

## 4. Cross-Platform Runtime Adapter (`Platform.js`)

[`src/js/platform.js`](file:///c:/Users/HP/www.gurukripaentudyog.com/src/js/platform.js) provides a clean, unified platform bridge:

- `Platform.isNative()`: Detects whether code runs inside Capacitor native shell.
- `Platform.getPlatform()`: Returns `'android'`, `'ios'`, or `'web'`.
- `Platform.init()`: Sets platform classes (`is-native`, `platform-android`, `platform-ios`), initializes StatusBar color and style, hides native SplashScreen, and binds hardware back-button listener.
- **Hardware Back Button Handling:** Automatically intercepts Android back presses. If a modal or drawer is open (`checkoutModal`, `productModal`, `profileModal`, `authModal`, `cartDrawer`, etc.), it dismisses the topmost modal instead of exiting the application.
- `Platform.share({ title, text, url })`: Native Capacitor Share plugin → Web Share API → Clipboard fallback.
- `Platform.haptic(type)`: Subtle haptic vibration for button taps and action confirmations on mobile devices.
- `Platform.openExternal(url)`: Native In-App Browser popover on Android/iOS; clean `target="_blank"` on desktop.
- `Platform.setTheme(theme)` / `Platform.toggleTheme()`: Updates UI, document attributes, status bar theme, and storage.

---

## 5. Development, Testing, and Verification Commands

### Prerequisites
- Node.js 18+ (verified on Node v20.14.0)
- npm 9+

### Commands
```bash
# 1. Run the automated test suite (21 unit & integration tests)
npm test

# 2. Build root index.html from partials
npm run build

# 3. Stage the clean deployable web bundle into ./www
npm run www

# 4. Run test verification + build + staging in one step
npm run check

# 5. Synchronize web distribution into Android and iOS native projects
npm run sync

# 6. Launch local development server
npm run serve
```

### Automated Test Coverage
All tests run with Node's native test runner (`node --test tests/`):
- `tests/pricing.test.js`: Validates all 8 products, mandatory attributes, trolley calculations, and balanced 5% GST reverse-calculations.
- `tests/calculator.test.js`: Verifies Wall, House, and Boundary wall material estimation formulas.
- `tests/coupons.test.js`: Verifies percentage (`GURU10`, `FIRSTORDER`) and flat (`BRICK50`) coupon calculations.
- `tests/i18n.test.js`: Verifies 100% parity between English and Hindi dictionaries, validating that all translation keys and placeholder tokens match.
- `tests/utils.test.js`: Validates Indian numbering format (`formatINR`, `formatNum`), XSS sanitization, and deterministic avatar gradients.
- `tests/build.test.js`: Verifies deterministic HTML assembly and validates that every HTML and CSS file strictly respects the 10,000-line ceiling (Requirement 10).

---

## 6. Production Release & Deployment Guide

### A. Web Deployment (GitHub Pages & Custom Domain)
1. Run `npm run check` to verify all tests pass and `index.html` is up to date.
2. Commit and push changes to `main`.
3. GitHub Pages automatically serves the root repository directory at `https://www.gurukripaentudyog.com`.

### B. Android Release (Google Play Store)
1. Run `npm run www && npx cap sync android`.
2. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```
3. Update version code and version name in `android/app/build.gradle`:
   ```groovy
   versionCode 2
   versionName "1.1"
   ```
4. Build the release Android App Bundle (AAB):
   - In Android Studio: **Build** > **Generate Signed Bundle / APK** > **Android App Bundle**.
   - Or via CLI: `cd android && ./gradlew bundleRelease`.
5. Extract the SHA-256 fingerprint from your release keystore and update `.well-known/assetlinks.json`:
   ```bash
   keytool -list -v -keystore your-upload-key.keystore
   ```
6. Upload the generated `.aab` file (`android/app/build/outputs/bundle/release/app-release.aab`) to Google Play Console under **Production**.

### C. iOS Release (Apple App Store)
*(Note: iOS archive and signing requires macOS and Xcode 15+)*
1. On a macOS machine, clone the repository and run:
   ```bash
   npm install
   npm run www
   npx cap sync ios
   ```
2. Open the project in Xcode:
   ```bash
   npx cap open ios
   ```
3. In Xcode:
   - Select the target `App`.
   - Under **Signing & Capabilities**, select your Apple Developer Team and bundle identifier (`com.gurukripa.bricks`).
   - Under **General**, verify the Version and Build numbers.
4. Replace `TEAMID` in `.well-known/apple-app-site-association` with your Apple Team ID.
5. In Xcode, select **Product** > **Archive**.
6. When the Organizer window opens, click **Validate App**, then **Distribute App** to upload directly to App Store Connect.

---

## 7. Security and Production Safeguards

- **Zero Hardcoded Secrets:** No API keys, credentials, or private secrets exist in the client repository.
- **Client-Side Auth Hardening:** Authentication runs in `localStorage` with client-side rate limiting (3-attempt lockout with 30s countdown timer) and automatic password omission from storage.
- **XSS Sanitization:** All user-supplied data in templates is escaped via `sanitizeHTML()`.
- **Content Security & Safe Storage:** All `localStorage` reads and writes are wrapped in `try/catch` defensive handlers with fallback recovery.
- **Safe Area Insets:** CSS variables `--sat` and `--sab` protect content against iPhone notches, dynamic islands, and Android gesture navigation bars.

---
© Gurukripa Bricks Industry. All rights reserved.
