# CI/CD Setup (GitHub Actions)

All workflows live under `.github/workflows/`.

---

## Pipeline map

```
push/PR → main
   ├─ web-ci-deploy.yml     → contracts, web tests, legacy tests, www, next build
   ├─ deploy.yml            → publish www/ to GitHub Pages (production site)
   ├─ android-build.yml     → Compose tests + unsigned APK/AAB (path filter apps/android)
   └─ backend-ci.yml        → NestJS build + tests (path filter backend/)
```

There is **no** automatic production deploy of NestJS or Play/App Store upload in this repository.

---

## 1. Web CI — `web-ci-deploy.yml`

**Triggers:** push + pull_request to `main`

**Steps (exact):**

1. `actions/checkout@v4`
2. Node 20 + npm cache
3. `npm ci`
4. `npm run build:contracts`
5. `npm run test:contracts`
6. `npm run test:web`
7. `npm test`
8. `npm run www`
9. `npm run build:web`

**Does not:** deploy to Vercel or Pages.

---

## 2. Production web deploy — `deploy.yml`

**Triggers:** push to `main`, `workflow_dispatch`

**Permissions:** `pages: write`, `id-token: write`

**Steps:**

1. Checkout
2. Node 20
3. `node scripts/build.js && node scripts/prepare-www.js`
4. `actions/configure-pages@v5`
5. Upload `www/` artifact
6. `actions/deploy-pages@v4`

**Environment:** `github-pages`

Approval: use GitHub Environment protection rules if you require reviewers before Pages deploy.

---

## 3. Android CI — `android-build.yml`

**Triggers:** changes under `apps/android/**`, or manual dispatch

**Steps:** JDK 17 → `./gradlew test` → `assembleRelease` → `bundleRelease` → upload artifacts

Artifacts are unsigned.

---

## 4. Backend CI — `backend-ci.yml`

**Triggers:** changes under `backend/**`, or manual dispatch

**Steps:**

```bash
cd backend
npm ci
npm run build
npm test   # JWT_SECRET set to a CI-only dummy
```

Also asserts `dist/src/platform/health.controller.js` exists after build.

---

## 5. Recommended environment protection

| Environment | Protection |
| --- | --- |
| `github-pages` | Optional required reviewers |
| Future `production-api` | Required reviewers + wait timer |
| Future Play upload | Manual workflow only |

---

## 6. Adding a backend CD job (template — not enabled)

When you have a host:

1. Build/push Docker image from `backend/Dockerfile`
2. SSH/kubectl/fly deploy
3. Run `npm run migrate` against staging first
4. Smoke `curl $HOST/health`
5. Require `workflow_dispatch` or environment approval for production

Do not auto-migrate production from every push without review.
