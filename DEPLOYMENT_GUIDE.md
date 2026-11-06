# Gurukripa Ent Udyog — Complete Deployment Guide

**Audience:** a new developer or operator who must clone this repository, configure credentials, build, connect PostgreSQL, and ship Web / Android / iOS without guessing.

**Last verified against repository scripts:** NestJS `backend/`, Next.js `apps/web`, Capacitor shells `android/` + `ios/`, native Compose `apps/android/`, GitHub Actions under `.github/workflows/`.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [Technology stack](#2-technology-stack)
3. [Production architecture](#3-production-architecture)
4. [Prerequisites](#4-prerequisites)
5. [Repository setup](#5-repository-setup)
6. [Environment configuration](#6-environment-configuration)
7. [Database](#7-database)
8. [Backend API](#8-backend-api)
9. [Web (legacy PWA + Next.js)](#9-web-legacy-pwa--nextjs)
10. [Android](#10-android)
11. [iOS](#11-ios)
12. [File storage](#12-file-storage)
13. [CI/CD](#13-cicd)
14. [Domain, DNS, SSL](#14-domain-dns-ssl)
15. [Post-deployment verification](#15-post-deployment-verification)
16. [Rollback](#16-rollback)
17. [Security checklist](#17-security-checklist)
18. [Production launch checklist](#18-production-launch-checklist)

### Detailed companions

| Doc | Purpose |
| --- | --- |
| [docs/DEPLOYMENT_WEB.md](docs/DEPLOYMENT_WEB.md) | GitHub Pages + optional Vercel preview |
| [docs/DEPLOYMENT_ANDROID.md](docs/DEPLOYMENT_ANDROID.md) | Capacitor + native Compose + Play Store |
| [docs/DEPLOYMENT_IOS.md](docs/DEPLOYMENT_IOS.md) | Capacitor iOS + App Store / TestFlight |
| [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) | PostgreSQL, migrations, backup |
| [docs/ENVIRONMENT_CONFIGURATION.md](docs/ENVIRONMENT_CONFIGURATION.md) | All env files and variables |
| [docs/CI_CD_SETUP.md](docs/CI_CD_SETUP.md) | GitHub Actions workflows |
| [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) | Go-live gate |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common failures |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Existing short deployment notes |
| [docs/PLAY-STORE-LISTING.md](docs/PLAY-STORE-LISTING.md) | Play listing copy |
| [docs/ANDROID-PACKAGING.md](docs/ANDROID-PACKAGING.md) | Capacitor / TWA packaging |
| [docs/SECURITY.md](docs/SECURITY.md) | Security rules |

---

## 1. Project overview

Gurukripa Ent Udyog is a brick manufacturing / logistics platform with:

- A **legacy static PWA** (`src/` → `npm run www` → `www/`) published to **GitHub Pages** as the live site `https://www.gurukripaentudyog.com`.
- A **Next.js 14** storefront (`apps/web`) built in CI; optional **Vercel preview** only (not the live apex until an explicit cutover).
- A **NestJS** multi-tenant API (`backend/`) with **PostgreSQL**.
- **Capacitor 6** Android/iOS shells wrapping the `www/` bundle (`android/`, `ios/`, app id `com.gurukripa.bricks`).
- A separate **native Kotlin Jetpack Compose** app (`apps/android/`, applicationId `com.gurukripa.entudyog`).

Do not confuse the two Android package names.

---

## 2. Technology stack

| Layer | Technology | Path |
| --- | --- | --- |
| Legacy web / PWA | Vanilla HTML/JS modules + CSS tokens | `src/`, `www/` |
| Modern web | Next.js 14 App Router, React 18, Tailwind | `apps/web` |
| Shared math/schemas | TypeScript package | `packages/api-contracts` |
| Backend | NestJS 10, JWT auth, class-validator | `backend/` |
| Database | PostgreSQL 15 | `docker-compose.yml`, `backend/src/database/migrations/` |
| Capacitor mobile | Capacitor 6 | `capacitor.config.json`, `android/`, `ios/` |
| Native Android | Kotlin, Compose, Room, Retrofit | `apps/android/` |
| CI/CD | GitHub Actions | `.github/workflows/` |
| Production web host | GitHub Pages | `deploy.yml` |
| Optional preview | Vercel (`apps/web`) | `apps/web/vercel.json` |

---

## 3. Production architecture

```
                    ┌──────────────────────────────────────┐
                    │  DNS: www.gurukripaentudyog.com      │
                    └──────────────────┬───────────────────┘
                                       │ HTTPS
                                       ▼
                    ┌──────────────────────────────────────┐
                    │  GitHub Pages  (legacy www/ bundle)  │  ← deploy.yml
                    │  Capacitor shells load same www/     │
                    └──────────────────┬───────────────────┘
                                       │ optional API calls
                                       ▼
                    ┌──────────────────────────────────────┐
                    │  NestJS API  (VPS / Docker / cloud)  │
                    │  /health  /api/v1/*                  │
                    └──────────────────┬───────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │  PostgreSQL 15                       │
                    └──────────────────────────────────────┘

  Preview only:  apps/web on Vercel  ──server proxy──►  BACKEND_API_URL
  Native Compose: apps/android  ──Retrofit──►  same NestJS API
```

**Missing for full production (external, not inventable here):**

- Hosted PostgreSQL with TLS and backups.
- Deployed NestJS process with real `JWT_SECRET` + `DATABASE_URL`.
- Play Console / App Store Connect accounts, signing keys, screenshots.
- Optional object storage if you move invoice PDFs / enquiry photos off data-URLs.

---

## 4. Prerequisites

| Tool | Version | Used for |
| --- | --- | --- |
| Node.js | 20 LTS (CI uses 20) | Web + backend builds |
| npm | 10+ | Workspaces + `backend/` own lockfile |
| Docker + Compose | recent | Local Postgres + API |
| JDK | 17 | Android Gradle |
| Android Studio / SDK 34 | — | APK/AAB |
| Xcode | latest stable on macOS | iOS archive / TestFlight |
| Git | — | Clone / CI |

---

## 5. Repository setup

```bash
git clone <YOUR_REPO_URL>
cd www.gurukripaentudyog.com   # or your local folder name

# Root workspaces (apps/web + packages/*)
npm ci

# Backend has its own package-lock — install separately
cd backend && npm ci && cd ..
```

Expected: root `node_modules/` present; `backend/node_modules/` present.

---

## 6. Environment configuration

See **[docs/ENVIRONMENT_CONFIGURATION.md](docs/ENVIRONMENT_CONFIGURATION.md)**.

Quick start (placeholders only):

```bash
cp .env.example .env
cp .env.development.example .env.development   # optional
cp backend/.env.example backend/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `backend/.env` and `apps/web/.env.local` with **your** local values. Never commit `.env`, `.env.local`, keystores, or JWT secrets.

---

## 7. Database

See **[docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md)**.

```bash
# Start Postgres (+ optional API) with local-only defaults
docker compose up -d postgres

# Apply migrations when using a bare Postgres (Compose also mounts migrations into initdb)
cd backend
npm run build
# set DATABASE_URL in backend/.env first
npm run migrate
```

Migrations:

- `backend/src/database/migrations/001_initial_schema.sql`
- `backend/src/database/migrations/002_platform_workflow.sql`

---

## 8. Backend API

```bash
cd backend
cp .env.example .env   # then edit
npm ci
npm run build
npm run start:dev      # or: npm start  (after build)

# Verify
curl -s http://127.0.0.1:3000/health
```

Expected JSON includes `"ok": true`.

Production: set `NODE_ENV=production`, strong `JWT_SECRET`, real `DATABASE_URL`, restricted `CORS_ORIGINS`. Process exits if `JWT_SECRET` is missing in production.

Docker:

```bash
# From repo root — uses env vars; change defaults before any shared host
docker compose up -d --build
curl -s http://127.0.0.1:3000/health
```

---

## 9. Web (legacy PWA + Next.js)

### 9.1 Legacy production site (GitHub Pages)

```bash
npm ci
npm run www          # build.js + prepare-www.js → ./www
# Deployed automatically by .github/workflows/deploy.yml on push to main
```

Details: [docs/DEPLOYMENT_WEB.md](docs/DEPLOYMENT_WEB.md).

### 9.2 Next.js app (CI + optional Vercel preview)

```bash
# apps/web/.env.local must set BACKEND_API_URL=http://127.0.0.1:3000
npm run build:web
npm run start:web
```

Open `http://localhost:3000`. Without `BACKEND_API_URL`, auth/enquiry proxies return **503** (by design).

---

## 10. Android

Two products:

| Path | ID | How to ship |
| --- | --- | --- |
| `android/` (Capacitor) | `com.gurukripa.bricks` | `npm run www && npx cap sync android` then Android Studio / Gradle |
| `apps/android/` (Compose) | `com.gurukripa.entudyog` | `./gradlew assembleRelease` / `bundleRelease` |

Full steps: [docs/DEPLOYMENT_ANDROID.md](docs/DEPLOYMENT_ANDROID.md), [docs/PLAY-STORE-LISTING.md](docs/PLAY-STORE-LISTING.md).

**This guide does not claim Play Store publication.** Signing keys stay off-repo.

---

## 11. iOS

Capacitor project under `ios/`. **Requires macOS + Xcode + Apple Developer Program.**

```bash
npm run www
npx cap sync ios
npx cap open ios
```

Full steps: [docs/DEPLOYMENT_IOS.md](docs/DEPLOYMENT_IOS.md).

---

## 12. File storage

Current behaviour:

- Enquiry attachments may travel as data-URLs (Nest body limit 5 MB).
- Product images ship as static files under `apps/web/public/images` and legacy `src/assets/images`.
- Invoice PDF UI exists in the legacy PWA; no S3/R2 bucket is wired in-repo.

For production object storage, introduce bucket credentials **only** on the backend (see DATABASE / ENVIRONMENT docs). Never put storage secrets in frontend env vars prefixed `NEXT_PUBLIC_`.

---

## 13. CI/CD

| Workflow | File | What it does |
| --- | --- | --- |
| Web CI | `web-ci-deploy.yml` | contracts + web tests + legacy tests + `www` + `next build` |
| Deploy Pages | `deploy.yml` | Publishes `www/` to GitHub Pages (production site) |
| Android CI | `android-build.yml` | Compose app tests + unsigned APK/AAB artifacts |
| Backend CI | `backend-ci.yml` | `npm ci`, build, test NestJS |

Details: [docs/CI_CD_SETUP.md](docs/CI_CD_SETUP.md).

Production deploys of the public website require push to `main` (or manual `workflow_dispatch` on `deploy.yml`). Backend/host deploys are **manual** until you attach a host (VPS/Fly/Render/etc.).

---

## 14. Domain, DNS, SSL

| Record | Typical value |
| --- | --- |
| `www` | GitHub Pages CNAME / Pages custom domain |
| Apex | Redirect to `www` or Pages A records per GitHub docs |
| `api` (optional) | A/AAAA or CNAME to your NestJS host |

HTTPS for Pages is automatic once the custom domain is verified. API TLS is terminated by your reverse proxy (Caddy/nginx/Traefik/cloud LB).

---

## 15. Post-deployment verification

```bash
# Legacy site
curl -I https://www.gurukripaentudyog.com/
curl -I https://www.gurukripaentudyog.com/manifest.json

# API (replace host)
curl -s https://api.YOUR_DOMAIN/health

# Next.js preview (if used)
curl -I https://YOUR_VERCEL_PREVIEW/
```

Manual: open Home, Products, Estimator, Contact enquiry, Profile sign-in, Tracker (authed).

---

## 16. Rollback

1. **GitHub Pages:** revert the bad commit on `main` and re-run `deploy.yml`, or redeploy a previous Actions artifact.
2. **Backend:** redeploy previous Docker image / process binary; restore DB from last backup if a migration was destructive (prefer forward-fix migrations).
3. **Store apps:** halt rollout in Play Console / App Store Connect; ship previous versionCode / build number.

---

## 17. Security checklist

- [ ] No secrets in git history for this release
- [ ] `JWT_SECRET` set in production; backend refuses to boot without it when `NODE_ENV=production`
- [ ] `CORS_ORIGINS` limited to real frontends
- [ ] DB not publicly writable; SSL mode required in production URL
- [ ] Upload keystore / Apple certs only on operator machines / CI secrets
- [ ] Razorpay / Maps keys restricted by referrer/IP
- [ ] Review [docs/SECURITY.md](docs/SECURITY.md)

---

## 18. Production launch checklist

Use [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md).

---

## Exact command cheat-sheet

```bash
# Install
npm ci && (cd backend && npm ci)

# Local DB + API
docker compose up -d
curl http://127.0.0.1:3000/health

# Legacy web bundle
npm run www

# Next.js
npm run build:web && npm run start:web

# Tests
npm run test:contracts && npm run test:web && npm test
(cd backend && npm test)

# Capacitor Android sync
npm run www && npx cap sync android

# Compose Android release (unsigned in CI)
cd apps/android && ./gradlew assembleRelease bundleRelease
```
