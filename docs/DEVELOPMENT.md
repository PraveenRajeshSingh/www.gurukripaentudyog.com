# Development & Local Setup Guide

## 1. Prerequisites

- **Node.js:** v18+ or v20+ (tested on Node v20.14.0)
- **npm:** 9+ / 10+
- **JDK (for Android):** Java 17+
- **Android Studio (optional for Android UI):** Koala / Ladybug or newer with Compose Preview support

---

## 2. Quick Start

Install once from the repository root — npm workspaces links `apps/web` and
`packages/api-contracts`, and building the contracts package runs automatically:

```bash
npm ci
```

### A. Testing the Shared Packages & Core Logic
```bash
# Compile + run API contracts, Zod-lite validation, 5% GST & 3-in-1 Estimator unit tests
npm run test:contracts
```

### B. Testing Web Application Routes & Structure
```bash
# Run Next.js web application integrity checks
npm run test:web
```

### C. Testing Backend ERP & Pricing Isolation
```bash
# Build the NestJS API, then run multi-tenant isolation and 5% reverse-GST tests
npm run test:backend
```

### D. Running Full Legacy Regression Test Suite (108 Tests)
```bash
# Run all legacy PWA and catalog regression tests
npm test

# Or everything the CI pipeline checks, in one command
npm run test:all
```

---

## 3. Running Applications Locally

### Web Application (`apps/web`)
```bash
npm run dev:web        # builds api-contracts first, then http://localhost:3000
npm run build:web      # production next build
```
Server-side API proxies read `BACKEND_API_URL`; put it in `apps/web/.env.local` while developing
(never commit it). Without it the `/api/*` routes return `503` instead of pretending to succeed.

### Android Application (`apps/android`)
```bash
cd apps/android
./gradlew test             # Estimator, Pricing and FormValidation unit tests
./gradlew assembleDebug    # debug APK
```
Or open it in Android Studio:
1. Select **Open** and choose `apps/android`.
2. Allow Gradle to sync dependencies from MavenCentral and Google (Gradle 8.9 wrapper is committed).
3. Run on an Android Emulator (API 24+) or physical device via USB debugging.

---

## 4. Anti-Slop Code Standards

All contributors must strictly respect the Anti-Slop rules:
- **No fake statistics:** Never invent establishment years, daily capacities, customer counts, or fake reviews.
- **No fake interactive elements:** All buttons, forms, and calculators must execute real logic or display honest unavailable/error states.
- **Verified pricing only:** 8 verified catalog products with verified piece rates and 4,000-brick trolley calculations.
