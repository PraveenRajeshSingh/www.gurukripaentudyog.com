# One-click authorized deployment runbook

Production website host: **GitHub Pages** (`deploy.yml` → `www/`).  
Android CI: `android-build.yml`.  
iOS shell validation: `ios-build.yml` (signed release needs Apple secrets).  
Backend CI: `backend-ci.yml`.  
Security: `security-scan.yml`.

## Maintainer commands (GitHub UI)

In the repository **Actions** tab, authorized maintainers can run:

| Action | Workflow | Notes |
| --- | --- | --- |
| Deploy Website | Deploy to GitHub Pages | `workflow_dispatch` already enabled |
| Run All Web Tests | Web CI | Push/PR + manual via re-run |
| Build Android APK/AAB | Android CI & Build Automation | Artifacts uploaded; Play upload is separate |
| Validate iOS shell | iOS Structure & CI Gate | Signed TestFlight needs Apple API key secrets |
| Run Security Scans | Security Scan | npm audit + secret pattern gate |
| Backend tests | Backend CI | Nest build + isolation/pricing/idempotency tests |

## Local equivalents

```bash
npm ci
npm run test:all          # contracts + web + legacy
npm test                  # legacy regression
npm run www               # assemble GitHub Pages bundle
npm run build:web         # Next.js bundle

# Backend
cd backend && npm ci && npm run build && npm test && npm run migrate
```

## Required external credentials (never commit)

| Secret | Used for |
| --- | --- |
| `GOOGLE_MAPS_API_KEY` / `GOOGLE_MAPS_SERVER_KEY` | Maps / Places |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / webhook secret | Live payments + signature verify |
| `JWT_SECRET` | Backend sessions |
| Database URL | Postgres platform store |
| Android keystore + Play Console API | Signed Play release |
| Apple Team ID, provisioning, App Store Connect API key | TestFlight / App Store |

## Rollback

1. GitHub Pages: redeploy previous green commit via Actions → Deploy to GitHub Pages (select older SHA checkout if needed) or revert the merge on `main`.
2. Keep database backups before migrations; migration `003_pricing_payments_idempotency.sql` is additive only.
3. Do not delete customer/order/invoice rows to “fix” a release.

## Honest limits

- Website deploy is automated; Play Store / App Store **production** publishing still needs store-console approval and signing secrets.
- Payment verify refuses to mark paid unless `RAZORPAY_KEY_SECRET` is configured server-side.
- Nearby supplier discovery uses OpenStreetMap; Google Places needs a configured browser key.
