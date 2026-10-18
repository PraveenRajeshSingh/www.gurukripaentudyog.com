# Architecture & Cross-Platform Release Readiness

**Project:** Gurukripa Bricks Industry
**App ID:** `com.gurukripa.bricks`
**Status:** Web live on GitHub Pages; Android + iOS native shells scaffolded via Capacitor.

---

## 1. What this application is

A **static, client-side** commerce + marketing application for a brick manufacturer:

- Plain HTML / CSS / JavaScript — no framework, no virtual DOM.
- **No backend.** All state is client-side: cart, auth, orders, wishlist live in
  `localStorage` / `sessionStorage`. There is no REST/GraphQL surface to preserve.
- Business logic (pricing, GST split, brick estimator, coupons, i18n EN/HI) lives
  entirely in `src/js/*`.
- Offline-capable **PWA**: `manifest.json` + `sw.js`.

Because there is no server and the whole app is a web bundle, the correct
cross-platform strategy is **"keep the web app as the single source of truth and
wrap it natively"** — not a rewrite.

---

## 2. Chosen architecture (and why)

| Option | Decision | Reason |
|---|---|---|
| React Native / Flutter | ❌ Rejected | Would duplicate 100% of working business logic into a second UI codebase. Violates "maximum reuse / minimum duplication / do not rewrite." |
| Ionic UI rewrite | ❌ Rejected | Forces a component framework onto a design that already works. High regression risk, zero functional gain. |
| **Existing web app + Capacitor native shell** | ✅ **Chosen** | Wraps the current static build into native Android **and** iOS from one codebase. Reaches both stores. Adds real native capabilities (splash, status bar, secure storage, share, push) via plugins without touching the UI. |
| Monorepo (`apps/` + `packages/`) | ❌ Not created | The prompt warns against an artificial monorepo when a simpler structure fits. A single static app does not benefit from workspace packages. We reuse the existing folder boundaries instead. |

The **same web bundle** is:
- served on the web (GitHub Pages),
- bundled into the Android app (Capacitor → `android/`),
- bundled into the iOS app (Capacitor → `ios/`).

There is exactly **one** copy of every business rule.

### Legacy note: Bubblewrap TWA
The previous Android path was a Trusted Web Activity (`@bubblewrap/cli`, `*twa/`
scripts, `assetlinks.json`). It is retained under `npm run twa:*` as an optional
lightweight Android-only alternative, but **Capacitor is now the primary,
unified** mobile strategy so Android and iOS share one native toolchain. Do not
maintain both for new work.

---

## 3. Source-of-truth folder layout (unchanged web structure)

```
/                       served web root (GitHub Pages uploads this)
├── index.html          ASSEMBLED output — do not hand-edit; edit partials, then `npm run build`
├── 404.html 500.html   error pages (self-contained styling)
├── manifest.json sw.js robots.txt sitemap.xml
├── .well-known/        assetlinks.json (Android) · apple-app-site-association (iOS universal links)
├── src/
│   ├── pages/
│   │   ├── index.src.html   HTML shell template (build input)
│   │   └── partials/*.html  38 section partials (build input)
│   ├── styles/*.css         7 cascade-ordered stylesheets (base → refinements)
│   ├── js/*.js              17 modules, classic <script> globals
│   └── assets/              images, fonts, vendor css/js
├── scripts/
│   ├── build.js             @include assembler → index.html (deterministic, no deps)
│   └── prepare-www.js       stages clean deployable bundle into ./www/
├── capacitor.config.json    native shell config (webDir = ./www)
├── android/  ios/           Capacitor-generated native projects (see §6)
└── docs/ARCHITECTURE.md     this file
```

`src/pages/*` and `scripts/*` are **build-time only** — `prepare-www.js` excludes
them from the native `www/` bundle, and the web deploy does not need them at runtime.

---

## 4. Code sharing across platforms

### A. Shared on every platform (the entire current app)
- Business rules: pricing, GST (base + CGST 2.5% + SGST 2.5%), estimator formulas, coupons, delivery threshold.
- Domain data + constants: `src/js/data.js`.
- i18n: `src/js/i18n.js` (`TRANSLATIONS`, `t()`).
- Validation & formatting: `src/js/utils.js` (`formatINR`, `formatNum`), auth field checks.
- State: `src/js/state.js`; UI: `src/js/ui.js`; features: cart/checkout/invoice/calculator/tracker/chatbot.
- Design tokens: `src/styles/tokens.css` (+ brand CSS variables).

### B. Shared through a thin platform adapter (recommended pattern for native features)
Where a browser API and a native API differ, isolate the difference behind one
module and pick the implementation at runtime. This is the **only** kind of new
code the cross-platform goal should add.

```
src/js/platform.js  (add when a native capability is needed)
  isNative()      → window.Capacitor?.isNativePlatform()
  storage        → localStorage (web)   vs   Preferences/Keychain (native, secure)
  share()        → navigator.share      vs   @capacitor/share
  openExternal() → <a target=_blank>    vs   @capacitor/browser
  connectivity   → navigator.onLine     vs   @capacitor/network
```
Do **not** fork business logic per platform. Only the *adapter* branches.

### C. Platform-specific (kept in the native projects, never shared)
- Android: permissions, back button, adaptive icon, splash, `app/build.gradle`, signing, `.aab`.
- iOS: `Info.plist`, safe-area handling, push (APNs), universal-links entitlement, signing/provisioning.
- Native splash screens and app icons (generated from `src/assets/images/gurukripaLogo.jpg`).

Never call browser-only DOM APIs in native shell code, and never assume native
plugins exist in the browser (guard with `isNative()`).

---

## 5. Security & production notes

- **No secrets in the bundle.** The app is fully client-side; there are no server
  credentials to leak. Keep it that way if a backend is ever added — authenticate
  via a server, never embed keys in `src/js`.
- Google OAuth: `google-client-id` meta is intentionally empty (feature dormant).
  For native, use `@capacitor/google-auth` or the browser deep-link flow.
- **Auth is client-only (`localStorage`) and therefore not a security boundary.**
  Anyone with a real order/payment backend must move verification server-side.
  Until then, treat orders as leads, not transactions.
- Production: HTTPS enforced (GitHub Pages; Capacitor uses `androidScheme: https`
  and `WKWebView` on iOS). Enable Certificate Transparency enforcement when a
  real API is added.
- Passwords: currently demo-grade. Add hashing/salted storage only in a backend.

---

## 6. Native build & release procedure

### Prerequisites
| Platform | Needs | Buildable on this machine? |
|---|---|---|
| Web | Node 18+ | ✅ Yes (verified) |
| Android | Android Studio, JDK 17, Android SDK, Play Console ($25) | ⚠️ Scaffolds on Windows; APK/AAB build needs the SDK |
| iOS | **macOS**, Xcode 15+, CocoaPods, Apple Developer ($99/yr) | ❌ Cannot build/validate from Windows |

### One-time project generation
```bash
npm install                 # installs Capacitor core/cli/android/ios + plugins
npm run www                 # build.js + prepare-www.js -> ./www
npx cap add android         # creates ./android
npx cap add ios             # creates ./ios  (run on macOS for full CocoaPods)
npx cap sync                # copies www/ + plugin registrations into native projects
```

### Day-to-day
```bash
npm run android             # www -> cap sync android -> open Android Studio
npm run ios                 # www -> cap sync ios -> open Xcode (on macOS)
```

### Icons & splash
```bash
npx @capacitor/assets generate --android --ios \
  --iconBackgroundColor '#FAFAF9' --splashBackgroundColor '#FAFAF9'
```
(Add `@capacitor/assets` as a devDependency when you run this.)

### Android release (Google Play)
1. Set `versionCode`/`versionName` in `android/app/build.gradle`.
2. Create an upload keystore; configure `android/app/keystore.properties` (git-ignored).
3. `cd android && ./gradlew bundleRelease` → `app/..release.aab`.
4. Fill the **real** SHA-256 cert fingerprint into `.well-known/assetlinks.json`.
5. Upload the `.aab` to Play Console.

### iOS release (App Store)
1. On macOS: `cd ios/App && pod install`, open `App.xcworkspace` in Xcode.
2. Set Bundle Identifier `com.gurukripa.bricks`, version, signing team.
3. Archive → validate → upload to App Store Connect → submit.
4. Replace `TEAMID` in `.well-known/apple-app-site-association` with the real Apple Team ID,
   host it over HTTPS with `content-type: application/json` (already at `/.well-known/`).

---

## 7. Release-readiness checklist

| Item | Status |
|---|---|
| Single source of truth preserved | ✅ Web bundle reused for both shells |
| Web deploy (GitHub Pages) still works | ✅ Unchanged; deploy still uploads repo root |
| `build.js` deterministic assembler | ✅ Verified byte-identical |
| Capacitor config + scripts + www prep | ✅ Added |
| iOS universal-links file (schema) | ✅ Corrected to modern Apple schema |
| Android `assetlinks.json` fingerprint | ⚠️ Placeholder — needs real cert after keystore exists |
| iOS `apple-app-site-association` Team ID | ⚠️ `TEAMID` placeholder — needs real Apple Team ID |
| Native `android/` / `ios/` projects generated | ⚠️ See §6; iOS requires macOS |
| App icons / splash assets | ⚠️ Generate via `@capacitor/assets` |
| Real backend / secure auth | ❌ Not applicable yet (client-only app) |
| Store listings, screenshots, privacy policy | ⚠️ Required by both stores before submission |

**Honest limitation:** iOS compilation and store submission cannot be performed
or verified from this Windows environment. Android scaffolding and the web build
are the only natively-verifiable steps here. Everything requiring a Mac, SDKs,
API keys, or paid store accounts is documented above, not claimed complete.
