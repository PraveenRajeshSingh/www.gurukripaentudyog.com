# Android Packaging — `.apk` / `.aab` from the live web app

**App ID:** `com.gurukripa.bricks`
**Live app:** <https://www.gurukripaentudyog.com/>
**Bundle output:** `android/app/build/outputs/bundle/release/app-release.aab`

There are two supported routes to the Play Store. Both ship the **same** web
bundle produced by `npm run www` — no UI is rewritten.

| Route | Wrapper | Use when |
|---|---|---|
| **A. Capacitor** (already scaffolded in `android/`) | Native shell + bundled `www/` | You want native camera, hardware back-button handling, custom splash, and full control of the signing key. **This is the recommended route for this repo.** |
| **B. Bubblewrap (TWA)** | Trusted Web Activity pointing at the live URL | You want the site itself to stay the app — updates ship on every deploy without a new Play release. Requires Digital Asset Links on the domain root. |

---

## 0. Prerequisites

- Node 18+ and `npm ci` in the repo root.
- JDK 17 (`java -version`).
- Android Studio with SDK Platform 34 + Build Tools (or a CLI SDK with `ANDROID_HOME` set).
- A release keystore. Create once and keep it out of git:

```bash
keytool -genkeypair -v -keystore android-upload.keystore -alias gurukripa \
  -keyalg RSA -keysize 2048 -validity 10000
```

`android-upload.keystore`, `*.jks` and `android/local.properties` are already
git-ignored — never commit them and never lose them. Losing the upload key
means filing a key-reset request with Play Console.

---

## 1. Route A — Capacitor (recommended)

### 1.1 Build and sync the web bundle

```bash
npm ci
npm run www          # scripts/build.js -> www/ then scripts/prepare-www.js
npx cap sync android # copies www/ into android/app/src/main/assets/public
```

`npm run www` is the only supported way to refresh the shell. Copying files by
hand leaves stale `index.html` partials in the APK.

### 1.2 Native capabilities already wired

| Capability | Where it lives | Notes |
|---|---|---|
| Hardware back button | `src/js/platform.js` → `registerBackButton()` | Pops the top overlay from `OVERLAY_STACK`, then closes the drawer/cart, and only exits the app when nothing is left. The alert centre is registered in the stack, so Back closes it instead of quitting. |
| Camera | `src/js/native-camera.js` | Uses `Capacitor.Plugins.Camera` when present (`@capacitor/camera`), otherwise falls back to `<input type="file" capture="environment">`. |
| Camera permission | `android/app/src/main/AndroidManifest.xml` | `CAMERA` declared; the plugin asks at runtime on first capture. `uses-feature … required="false"` keeps no-camera devices installable. |
| Notification permission | `AndroidManifest.xml` | `POST_NOTIFICATIONS` (Android 13+). Requested by `PushNotifications.enableAlerts()`. |
| iOS camera strings | `ios/App/App/Info.plist` | `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`. iOS rejects the build without them. |
| Offline caching | `sw.js` + `src/js/offline-store.js` | Capacitor serves the bundle from `https://localhost`, where service workers are allowed — the same cache-first rules apply inside the app. |
| Splash / status bar | `capacitor.config.json` | `SplashScreen`, `StatusBar` plugin config. |

### 1.3 Release signing

Add the signing config once to `android/app/build.gradle` (do **not** commit
passwords — read them from `android/keystore.properties`, which is git-ignored):

```gradle
def keystoreProps = new Properties()
def keystoreFile = rootProject.file('keystore.properties')
if (keystoreFile.exists()) keystoreProps.load(new FileInputStream(keystoreFile))

android {
    signingConfigs {
        release {
            storeFile file(keystoreProps['storeFile'])
            storePassword keystoreProps['storePassword']
            keyAlias keystoreProps['keyAlias']
            keyPassword keystoreProps['keyPassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}
```

`android/keystore.properties`:

```properties
storeFile=../../android-upload.keystore
storePassword=********
keyAlias=gurukripa
keyPassword=********
```

### 1.4 Build the bundle

```bash
cd android
./gradlew bundleRelease     # -> app/build/outputs/bundle/release/app-release.aab
./gradlew assembleRelease   # -> app/build/outputs/apk/release/app-release.apk (sideload test)
```

Bump `versionCode` in `android/app/build.gradle` for **every** Play upload;
`versionName` is the user-visible version (`1.0.0` today).

Then finish with [Digital Asset Links](#3-digital-asset-links-required-to-hide-the-url-bar)
and the [Play Store checklist](./PLAY-STORE-LISTING.md).

---

## 2. Route B — Bubblewrap (Trusted Web Activity)

```bash
npm run twa:doctor                 # verifies JDK + Android SDK are visible
npm run twa:init                   # bubblewrap init --manifest https://www.gurukripaentudyog.com/manifest.json
npm run twa:build                  # unsigned .aab + .apk for local inspection
```

`bubblewrap init` writes its own project next to the repo (by default
`./app-release-bundle.aab` and a generated Android project). Sign it with the
same release keystore before uploading:

```bash
bubblewrap build --skipPwaValidation   # signed build using the keystore you supply
```

### 2.1 Host limitation you must know

A TWA is verified against the **origin it launches**. Verification fetches
`https://<host>/.well-known/assetlinks.json` — a file that only the owner of
the host root can publish.

- ✅ `https://www.gurukripaentudyog.com/.well-known/assetlinks.json` — served by
  this repo, so the TWA launched from the custom domain verifies.
- ❌ `https://praveenrajeshsingh.github.io/.well-known/assetlinks.json` — that
  path belongs to the *user pages* root, not to this project repo. A TWA pointed
  at the `github.io/www.gurukripaentudyog.com/` sub-path will keep showing the
  URL bar until the file exists at the host root.

Conclusion: point Bubblewrap at the **custom domain** manifest (as above), or
use Route A.

---

## 3. Digital Asset Links (required to hide the URL bar)

`.well-known/assetlinks.json` must contain the SHA-256 fingerprint of the
certificate that signs the installed app. Generate it with the helper script
instead of hand-editing the placeholder:

```bash
# Fingerprint from Play Console -> Setup -> App signing (use for Play installs)
npm run assetlinks -- --fingerprint=AA:BB:CC:…:FF

# Or read it straight from your upload keystore (needs keytool on PATH)
set ANDROID_KEYSTORE_PASSWORD=********
npm run assetlinks -- --keystore=android-upload.keystore --alias=gurukripa

# Ship both, Play-signed and sideloaded builds:
npm run assetlinks -- --fingerprint=<play-signing> --fingerprint=<upload-key>

# Validate what is committed (exits 1 on placeholders)
node scripts/assetlinks.js --check
```

The script writes `.well-known/assetlinks.json` **and** mirrors it into
`www/.well-known/assetlinks.json` so the native bundle and the deployed site
agree. It is fingerprint-agnostic: whatever you pass becomes the file.

Verify after deploying:

```text
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://www.gurukripaentudyog.com&relation=delegate_permission/common.handle_all_urls
```

A correct response lists your `package_name` and fingerprints. Verification can
take a few minutes; `adb shell pm verify-app-links --re-verify com.gurukripa.bricks`
forces a device re-check.

---

## 4. Smoke-test the build before uploading

Install the release APK on a real device and confirm:

1. Purchases work with the network then again with **airplane mode** on — the
   cart, estimator and downloaded rate card must still open, and the order
   should land in the outbox until WhatsApp is reachable
   (`#cartOutboxNotice`).
2. Estimator → *Order on WhatsApp* opens WhatsApp with cart items, wall
   dimensions, pincode and payment preference filled in.
3. Site photo capture asks for the camera permission once, then stores the
   photo locally (`SiteInspection.listSaved()`).
4. Bell icon → *Enable alerts* triggers the OS notification prompt on Android 13+.
5. Hardware Back closes the alert centre → cart → drawer → app, in that order.
6. Deep link: `adb shell am start -a android.intent.action.VIEW -d "https://www.gurukripaentudyog.com/"` opens the app without a browser chrome flash.

---

## 5. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| App shows old UI after a change | Forgot `npm run www` / `npx cap sync` | Run `npm run www && npx cap sync android` and rebuild. |
| URL bar visible in the TWA | Asset Links missing or fingerprint mismatch | Run `node scripts/assetlinks.js --check`, redeploy, re-verify. |
| Camera button does nothing | Plugin missing in the native build | `npm ci` (adds `@capacitor/camera`), `npx cap sync android`, rebuild. |
| `POST_NOTIFICATIONS` never prompts | Alerts never enabled in-app | Bell → *Enable alerts* (the browser/OS only prompts on user gesture). |
| Upload rejected: version code already used | `versionCode` not incremented | Bump it in `android/app/build.gradle` and rebuild the bundle. |
| Estimator history empty after reinstall | IndexedDB is app-private storage | Expected — it is device storage, not an account. |
