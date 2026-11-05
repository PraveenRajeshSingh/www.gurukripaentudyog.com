# Production Deployment Guide

## Production host (authoritative)

**GitHub Pages is the single production host** for the public site
(`www.gurukripaentudyog.com`), published by `.github/workflows/deploy.yml` from the
legacy `www/` bundle. There is exactly one production deployment path — Vercel is
**not** a production host. GitHub Actions (`web-ci-deploy.yml`) only tests and builds;
it never auto-deploys. Do not add a second publish target without retiring `deploy.yml`
first, so the two never conflict.

## 1. Web CI (GitHub Actions) — no auto-deploy

The Next.js app under `apps/web` builds in CI but is **not** deployed by CI. To run
a manual preview/deploy of the Next.js app on Vercel (optional, not the live site):
1. Import this GitHub repository into Vercel as a separate project.
2. Set **Root Directory** to `apps/web` (Project Settings → General). Without this, Vercel would
   build the legacy static storefront instead of the Next.js app.
3. Add the environment variable `BACKEND_API_URL` (Production/Preview) pointing at the NestJS
   platform API, e.g. `https://api.gurukripaentudyog.com`. It is read only by the server-side
   proxies under `apps/web/src/app/api/*`; if it is missing, those routes answer a truthful `503`.
4. `vercel --prod` (with `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` / token) deploys a preview host.
   This host must NOT be pointed at `www.gurukripaentudyog.com` while GitHub Pages serves it.

### What CI verifies on every push/PR to `main`
`.github/workflows/web-ci-deploy.yml` (name: **Web CI**) runs, and must pass, before merge:
1. `npm ci` installs every workspace from the root lockfile.
2. Compiles and tests `packages/api-contracts` (schemas, GST math, estimator).
3. Runs the `apps/web` structural route tests and the legacy regression suite (`npm test`).
4. `npm run www` assembles the legacy static `www/` bundle that GitHub Pages publishes.
5. A real `next build` of `apps/web` so a broken page is caught in CI.

There are **no required Vercel secrets** for CI. Vercel secrets are only needed if an
operator intentionally creates a manual `apps/web` preview project.

### Custom Domain Configuration
- Primary domain: `www.gurukripaentudyog.com` → served by GitHub Pages.

### Cutover Status (important)
The apex domain is **served by GitHub Pages** through `.github/workflows/deploy.yml`,
which publishes the legacy `www/` bundle. Treat any Vercel `apps/web` deployment as a
**preview host only**. To ever cut the Next.js app over to `www.gurukripaentudyog.com`:
1. Add the domain to the Vercel `apps/web` project and verify DNS ownership.
2. Point the registrar CNAME at `cname.vercel-dns.com` (allow TTL to expire).
3. Disable or delete `deploy.yml` so GitHub Pages stops serving the old bundle, and re-issue
   `.well-known/assetlinks.json` / `apple-app-site-association` from the Next.js app if the native
   shells rely on them.
Until all three are done, GitHub Pages remains the production host and Vercel stays preview-only.

### Legacy Static Storefront
The repository root still ships the static PWA (`npm run www` → `www/`, configured by the root
`vercel.json`) for the Capacitor Android/iOS shells. It is no longer published by CI; deploy it
only if a shell build still needs the offline bundle.

---

## 2. Android Release Deployment (Google Play Store)

### Automated Build via GitHub Actions
The workflow `.github/workflows/android-build.yml` runs on push to `main` (under `apps/android/**`) or manual trigger:
1. Sets up JDK 17 and caches Gradle (wrapper + dependencies) with `gradle/actions/setup-gradle`.
2. Runs Kotlin unit tests (`./gradlew test`).
3. Compiles the release APK (`./gradlew assembleRelease`).
4. Generates the production Android App Bundle (`./gradlew bundleRelease`).
5. Uploads artifacts (and the test report on failure) to the GitHub Actions run summary.

CI artifacts are **unsigned**: `app-release-unsigned.apk` and `app-release.aab` are for review only.
Sign the AAB before uploading it to Play Console, as shown below.

### Signing the Release AAB
For production release on Google Play Console:
1. Generate an upload keystore:
   ```bash
   keytool -genkey -v -keystore gurukripa-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. Place keystore credentials in `apps/android/gradle.properties` (never commit keys to source control):
   ```properties
   MYAPP_UPLOAD_STORE_FILE=gurukripa-upload-key.jks
   MYAPP_UPLOAD_KEY_ALIAS=upload
   MYAPP_UPLOAD_STORE_PASSWORD=******
   MYAPP_UPLOAD_KEY_PASSWORD=******
   ```
3. Upload `apps/android/app/build/outputs/bundle/release/app-release.aab` to Google Play Console.
