# Android Deployment

This repository ships **two** Android products. Choose one release track and do not mix package IDs in Play Console.

| Product | Path | Application ID | Wrapper |
| --- | --- | --- | --- |
| Capacitor shell (web bundle) | `android/` | `com.gurukripa.bricks` | Capacitor 6 + `www/` |
| Native Compose app | `apps/android/` | `com.gurukripa.entudyog` | Kotlin / Material 3 |

Also see: [ANDROID-PACKAGING.md](ANDROID-PACKAGING.md), [PLAY-STORE-LISTING.md](PLAY-STORE-LISTING.md).

---

## A. Capacitor shell (`android/`) — recommended for site parity

### Prerequisites

- JDK 17, Android Studio (SDK 34)
- `npm ci` at repo root
- Release keystore **not** in git

### Build & sync

```bash
npm ci
npm run www
npx cap sync android
npx cap open android
```

Or: `npm run android` (runs `www`, sync, opens Android Studio).

### Signing

Follow [ANDROID-PACKAGING.md](ANDROID-PACKAGING.md) §1.3. Store keystore passwords in local `gradle.properties` or CI secrets — never commit.

### Generate APK / AAB

From Android Studio: Build → Generate Signed Bundle / APK  
Or Gradle inside `android/` after sync.

### Play Console (Capacitor listing)

Package metadata in [PLAY-STORE-LISTING.md](PLAY-STORE-LISTING.md) targets **`com.gurukripa.bricks`**.

Steps (operator account required — not automated here):

1. Create app in Play Console with matching application ID
2. Complete Data safety, content rating, privacy policy URL (`https://www.gurukripaentudyog.com/privacy.html`)
3. Upload **signed** AAB
4. Internal testing → closed → production rollout
5. Screenshots / feature graphic prepared from real UI (see listing doc)

**Publication status:** not claimed by this repository automation. CI for Compose does not upload to Play.

### Deep links

`.well-known/assetlinks.json` must list the release signing cert SHA-256 for App Links.

---

## B. Native Compose app (`apps/android/`)

### Config

- `namespace` / `applicationId`: `com.gurukripa.entudyog`
- `versionCode` / `versionName`: see `apps/android/app/build.gradle.kts`
- `minSdk` 24, `targetSdk` 34

### CI

`.github/workflows/android-build.yml`:

```text
./gradlew test
./gradlew assembleRelease
./gradlew bundleRelease
```

Artifacts are **unsigned** review builds.

### Local release

```bash
cd apps/android
chmod +x gradlew          # Unix CI
./gradlew test
./gradlew assembleRelease
./gradlew bundleRelease
```

Outputs under `app/build/outputs/apk|bundle/release/`.

Configure signing in the module `build.gradle.kts` / `keystore` properties before Play upload.

### API endpoint

Point Retrofit base URL at your production NestJS host via BuildConfig / local properties — never hardcode production secrets in source.

---

## Device matrix

- Phones and tablets API 24+
- Internet permission required for catalog / API
- Capacitor: camera / notifications permissions declared in Manifest (runtime prompts)

---

## What this doc does **not** do

- Purchase a Play Developer account
- Generate or store your upload keystore
- Claim the app is live on Google Play
