# Gurukripa Ent Udyog (गुरुकृपा ईंट उद्योग) — Enterprise Monorepo Architecture

**Project:** Gurukripa Ent Udyog Digital Platform  
**Target Environments:** Web (legacy PWA on GitHub Pages production + Next.js 14 in `apps/web` for CI/preview), Android (Capacitor shell + native Kotlin Jetpack Compose), iOS (Capacitor), Backend REST API (NestJS/PostgreSQL).

---

## 1. System Overview

Gurukripa Ent Udyog is a heavy-industry brick manufacturing and logistics enterprise located on the Jaunpur–Varanasi Highway, Uttar Pradesh. The platform serves contractors, builders, and government infrastructure projects (PWD, UP Housing Board).

```
                                  ┌─────────────────────────────┐
                                  │  api-contracts/tokens.json  │
                                  │  (Terracotta #C8460A, etc)  │
                                  └──────────────┬──────────────┘
                                                 │
                                                 ▼
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│         apps/web          │      │   packages/api-contracts  │      │       apps/android        │
│   Next.js 14 App Router   │◄────►│  (Zod Schemas, GST Math,  │◄────►│    Kotlin Jetpack Compose │
│   Tailwind + API proxies  │      │   Estimator Engine, Data, │      │    Material 3, Room DB    │
│   (CI / optional Vercel)  │      │   Brand Tokens)           │      │    applicationId entudyog │
└───────────────────────────┘      └─────────────┬─────────────┘      └───────────────────────────┘
          ▲                                      ▼
          │                        ┌───────────────────────────┐
   GitHub Pages                    │          backend          │
   legacy www/ (production)        │   NestJS REST API,        │
   + Capacitor android/ios         │   Postgres, /health       │
                                   └───────────────────────────┘
```

Authoritative hosting rules: [DEPLOYMENT.md](DEPLOYMENT.md) and root [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md).

---

## 2. Directory Structure

```
gurukripa-ent-udyog/
├── package.json                 # npm workspaces root: apps/web + packages/*
├── apps/
│   ├── web/                     # Next.js 14 App Router, TypeScript, Tailwind CSS, Zod
│   │   ├── public/              # Verified brick photographs, favicon, manifest.webmanifest
│   │   ├── src/app/             # Routes: /, /products, /about, /services, /contact, /tracker, /profile
│   │   ├── src/app/api/         # Server proxies: /api/login, /api/enquiries, /api/me, /api/auth
│   │   ├── src/components/      # Layout chrome, UI primitives, CartProvider
│   │   ├── src/features/        # EstimatorStudio, CartDrawer, OrderTracker
│   │   ├── src/lib/             # api-proxy (server-only BACKEND_API_URL), client-api, translations
│   │   ├── tests/               # Route and structural integrity tests
│   │   └── vercel.json          # Framework, install/build commands, security headers
│   │
│   └── android/                 # Native Android application (Gradle wrapper included)
│       ├── app/src/main/java/   # Kotlin Clean Architecture
│       │   └── com/gurukripa/entudyog/
│       │       ├── app/         # MainActivity & GurukripaTheme
│       │       ├── core/        # Theme tokens, EstimatorEngine, PricingEngine, FormValidation
│       │       ├── data/        # Room Database (KSP), ProductDao, CartDao, Repositories
│       │       ├── navigation/  # Navigation Compose NavGraph & Screen sealed class
│       │       └── ui/features/ # Home, Catalog, Estimator, Cart, Contact, Profile
│       ├── app/src/test/        # Estimator, Pricing & FormValidation unit tests
│       ├── build.gradle.kts
│       └── settings.gradle.kts
│
├── packages/
│   └── api-contracts/           # Single source of truth: schemas, 5% GST, 3-in-1 math, catalog, brand tokens
│       └── src/tokens/tokens.json  # Terracotta `#C8460A`, `#8B2E05`, `#F5A623`, surface tokens
│
├── backend/                     # Multi-tenant brick supply API & pricing engine (own lockfile, not a workspace)
│   ├── src/platform/            # Enquiry → Quotation → Order workflow, tenants, auth
│   ├── src/database/migrations/ # Versioned PostgreSQL schema
│   └── test/                    # Multi-tenant isolation and 5% reverse-GST calculation tests
│
├── src/, www/, android/, ios/   # Legacy static PWA storefront + Capacitor shells (still shipped, not the target)
│
├── docs/                        # Complete technical documentation
│   ├── ARCHITECTURE.md          # This file
│   ├── DEVELOPMENT.md           # Local setup and build commands
│   ├── DEPLOYMENT.md            # Vercel and Google Play Store deployment guides
│   ├── API.md                   # OpenAPI 3.1 endpoint contracts
│   ├── PLATFORM-API.md          # Multi-tenant workflow endpoints
│   ├── SECURITY.md              # OWASP safeguards, validation, and zero-secret rules
│   └── ERP-ARCHITECTURE.md      # Legacy storefront ERP module map
│
└── .github/workflows/
    ├── web-ci-deploy.yml        # Contracts + web tests, legacy regression, next build, Vercel prod deploy
    └── android-build.yml        # Android unit tests, assembleRelease APK & bundleRelease AAB
```

---

## 3. Mathematical & Business Logic Specifications

1. **3-in-1 Material Estimator:**
   * **Wall:** $\text{Bricks} = \lceil (\text{Length} \times \text{Height}) \times 8.6 \times (\text{Thickness} / 4.5) \rceil$.
   * **House:** $\text{Bricks} = \lceil \text{Built-up SqFt} \times \text{Floors} \times 18.5 \rceil$.
   * **Boundary Wall:** $\text{Bricks} = \lceil (\text{Perimeter} \times \text{Height}) \times 8.6 \times (\text{Thickness} / 4.5) \rceil$.
   * **Trolley Conversion:** Exactly 4,000 bricks per tractor trolley load.
   * **Breakage Margin:** 5% standard handling contingency strictly included.

2. **5% Indian GST Calculation:**
   * Intra-State (Uttar Pradesh): 2.5% CGST + 2.5% SGST.
   * Inter-State: 5% IGST.
   * Reverse-tax formula: $\text{Taxable} = \text{round}(\text{Gross} / 1.05)$.
