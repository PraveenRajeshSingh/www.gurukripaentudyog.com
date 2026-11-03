# Production Deployment Guide

## 1. Web Deployment (Vercel — `apps/web`)

The Next.js website is engineered for deployment on Vercel as a monorepo project.

### One-time Vercel project setup
1. Import this GitHub repository into Vercel.
2. Set **Root Directory** to `apps/web` (Project Settings → General). Without this, Vercel would
   build the legacy static storefront instead of the Next.js app.
3. Add the environment variable `BACKEND_API_URL` (Production/Preview) pointing at the NestJS
   platform API, e.g. `https://api.gurukripaentudyog.com`. It is read only by the server-side
   proxies under `apps/web/src/app/api/*`; if it is missing, those routes answer a truthful `503`.
4. Copy the Project ID and Org ID from **Project Settings → Other** into GitHub secrets.

### Continuous Deployment via GitHub Actions
The workflow `.github/workflows/web-ci-deploy.yml` triggers on push to the `main` branch:
1. `npm ci` installs every workspace from the root lockfile.
2. Compiles and tests `packages/api-contracts` (schemas, GST math, estimator).
3. Runs the `apps/web` structural route tests and the legacy regression suite (`npm test`).
4. Runs a real `next build` so a broken page can never reach the deploy job.
5. `vercel build --prod` + `vercel deploy --prebuilt --prod` publishes the Next.js app.

### Required GitHub Repository Secrets
To enable automated Vercel deployment, configure these secrets under **Settings > Secrets and variables > Actions**:
- `VERCEL_TOKEN`: Your Vercel Personal Access Token.
- `VERCEL_ORG_ID`: Your Vercel Team / Account ID.
- `VERCEL_PROJECT_ID`: The Project ID of the `apps/web` project created above.

### Custom Domain Configuration
- Primary domain: `www.gurukripaentudyog.com`
- Configure CNAME record pointing to `cname.vercel-dns.com` in your DNS registrar.

### Cutover Status (important)
The apex domain is **currently served by GitHub Pages** through `.github/workflows/deploy.yml`,
which publishes the legacy `www/` bundle. Publishing `apps/web` from CI does not move traffic by
itself. To cut the Next.js app over to `www.gurukripaentudyog.com`:
1. Add the domain to the Vercel `apps/web` project and verify DNS ownership.
2. Point the registrar CNAME at `cname.vercel-dns.com` (allow TTL to expire).
3. Disable or delete `deploy.yml` so GitHub Pages stops serving the old bundle, and re-issue
   `.well-known/assetlinks.json` / `apple-app-site-association` from the Next.js app if the native
   shells rely on them.
Until that is done, treat the Vercel deployment as the preview host for `apps/web`.

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
