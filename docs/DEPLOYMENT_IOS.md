# iOS & App Store Deployment

**Shell:** Capacitor 6 project in `ios/`  
**Display name:** Gurukripa Bricks (`Info.plist`)  
**Config:** `capacitor.config.json` → `appId: com.gurukripa.bricks`

iOS support means the **native Capacitor shell**, not “the site opens in Safari.”

---

## Prerequisites (mandatory)

| Requirement | Notes |
| --- | --- |
| macOS | Xcode runs only on Mac |
| Xcode (latest stable) | Archive + Organizer |
| Apple Developer Program | Paid membership for TestFlight / App Store |
| CocoaPods / SPM as required by Capacitor version | `npx cap sync ios` |
| Privacy usage strings | Already in `ios/App/App/Info.plist` (camera / photo library) |

This CI environment does **not** archive iOS builds (no macOS runner configured).

---

## 1. Sync web bundle into the iOS project

```bash
npm ci
npm run www
npx cap sync ios
npx cap open ios
```

Or: `npm run ios`.

Always refresh with `npm run www` before sync so `ios` does not embed a stale storefront.

---

## 2. Xcode project settings (operator)

In Xcode → Signing & Capabilities:

1. Set **Team** to your Apple Developer team
2. Confirm **Bundle Identifier** matches App Store Connect (typically `com.gurukripa.bricks` — verify against `project.pbxproj` / Capacitor `appId`)
3. Enable automatic signing for Debug; use distribution profile for Release
4. Set Marketing Version / Build number for the release

Do **not** commit `.p12` certificates, private keys, or provisioning profiles.

---

## 3. Permissions already declared

From `Info.plist`:

- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`

Add further keys only if you enable new native plugins (location, Bluetooth, etc.).

---

## 4. Archive & TestFlight

1. Product → Destination → Any iOS Device (arm64)
2. Product → Archive
3. Organizer → Distribute App → App Store Connect
4. Enable TestFlight internal testing
5. Install on physical iPhone / iPad; verify estimator, cart WhatsApp handoff, overlays, safe areas

---

## 5. App Store Connect checklist

- App name, subtitle, description (Hindi/English as needed)
- Screenshots for required device sizes (iPhone + iPad if universal)
- Privacy policy URL: `https://www.gurukripaentudyog.com/privacy.html`
- App Privacy nutrition labels (data collected by your analytics/maps/payments — declare honestly)
- Age rating questionnaire
- Review notes: kiln B2B ordering; WhatsApp may open for quotes; no in-app Apple IAP required for WhatsApp handoff checkout

Universal Links: keep `.well-known/apple-app-site-association` aligned with Team ID + bundle id.

---

## 6. Production API

The Capacitor WebView loads the bundled `www/` (or a remote server URL if you change `capacitor.config.json` `server.url` — default is local assets). Any API calls from the PWA must target production HTTPS endpoints with CORS allowing the Capacitor origin (`capacitor://` / `https://localhost` patterns as configured).

Backend `CORS_ORIGINS` must include every origin you actually use.

---

## 7. Verification status

| Step | Status in this repo automation |
| --- | --- |
| `ios/` project present | Yes |
| Usage strings | Yes |
| `cap sync` documented | Yes |
| Xcode archive in CI | **No** (needs macOS) |
| App Store submission | **Operator only** — not claimed |
