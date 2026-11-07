# Master Platform Plan — Gurukripa Bricks Industry

**Date:** 2026-11-07 (updated after audit agents)  
**Rule:** Improve existing modules. No duplicate auth, no fake payments/GPS, phase-by-phase delivery.

**Audits:** [Storefront inventory](8283644e-2a5f-40e7-87a6-7021d719aef8) · [Platform API backend](9ab4a0f0-8a46-4598-aa8c-db597659b2d7)  
**Phase 1 report:** [PHASE1-CATALOG-REPORT.md](./PHASE1-CATALOG-REPORT.md)

---

## Architecture (current)

| Layer | Location | Notes |
|-------|----------|-------|
| Production storefront | Root static PWA (`src/`, `index.html`, Capacitor) | Primary delivery surface today |
| Next.js client | `apps/web` | CI / preview path |
| Platform API | `backend/src/platform` | Nest JWT + role guards; **in-memory authoritative** + optional Postgres mirror (`002_platform_workflow.sql`) |
| Shared math/catalog | `packages/api-contracts` | GST 5%, estimator formulas |
| Docs | `docs/PLATFORM-API.md`, `ARCHITECTURE.md`, `API.md` | Authoritative contracts |

### Platform API surface (confirmed)

| Group | Purpose |
|-------|---------|
| `/api/v1/auth` | Register, dealer-register, login, `/me` |
| `/api/v1/public` | Products, categories, announcements, guest enquiries |
| `/api/v1/me` | Profile, addresses, enquiries, quotations, orders, devices, notifications, `/me/dealer/*` |
| `/api/v1/staff` | Enquiry/quote/order ops, dealers, announcements, stats, audit, CSV |
| `/api/v1/calculator` | `POST /estimate` |
| Legacy | `/tenants/:slug/*`, mock `POST /orders`, `POST /sync/push` (no JWT) |

**RBAC:** CUSTOMER/DEALER on `/me/*` with ownership checks; STAFF→SUPER_ADMIN on `/staff/*`. Roles `DISPATCHER` / `WAREHOUSE_STAFF` / `DRIVER` exist in the enum but are **not** in `STAFF_ROLES` today.  
**Payments:** Orders hard-code `PAYMENT_ON_DELIVERY`; Razorpay env vars are unused stubs.

---

## Capability inventory

| # | Capability | Status | Notes |
|---|------------|--------|-------|
| 1 | Product discovery | **DONE (Phase 1)** | `catalog-discovery.js` — filters, suggestions, history, recent, related, compare |
| 2 | Cart / GST / coupons / checkout | **EXISTS** | Honest: no fake Razorpay success; coupons still **client-only** |
| 2b | Live payment gateway | **BLOCKED** | Needs merchant credentials + backend wiring |
| 3 | Wishlist | **EXISTS** | Local + profile hub |
| 3b | Product comparison | **DONE (Phase 1)** | Multi-select compare modal (max 3) |
| 4 | Orders / track / invoice / reorder | **EXISTS** | Reorder uses **current** catalogue prices (Phase 1 fix) |
| 5 | Transport / PIN | **PARTIAL** | Zone table + Haversine helpers; **not** Distance Matrix |
| 5b | Admin transport tariffs + checkout line | **Phase 2** | Label estimates; wire PIN charge into checkout |
| 6 | Dealer API | **EXISTS** | `/auth/dealer-register`, `/me/dealer/*`, staff approve + discount % |
| 6b | Dealer portal UI | **Phase 3** | API ready; storefront UI thin |
| 7 | Quotations | **PARTIAL** | Full workflow; client print-to-PDF (no server PDF) |
| 8 | 3-in-1 estimator / indicative BOQ | **EXISTS** | Offline save + print; not full PM BOQ software |
| 9 | Construction project management | **MISSING → Phase 2** | Saved sites ≠ projects |
| 10 | Site expenses | **PARTIAL → Phase 2** | `erp-crm` local expenses exist; **no** Platform API / customer UI |
| 11 | Notifications | **PARTIAL** | In-app inbox + optional `PUSH_WEBHOOK_URL`; no email/WA/SMS |
| 12 | Chat assistant | **PARTIAL** | Offline KB; optional `gb-chat-endpoint` |
| 13 | Reviews moderation | **MISSING → Phase 3** | Display-only stars/testimonials |
| 14 | Coupons / loyalty | **PARTIAL → Phase 3** | Static `COUPONS`; no server validation / loyalty |
| 15 | PWA | **EXISTS** | SW + offline; install prompt UX still thin |
| 16 | Admin / ops | **PARTIAL** | Local ERP + `/staff/*` when JWT present |
| 17 | Auth / RBAC | **EXISTS** | JWT + guards; storefront session `/auth/me` |
| 18 | i18n | **PARTIAL** | `en`/`hi`; DTO allows `mr` — Marathi UI missing |
| 19 | DB | **PARTIAL** | Dual-mode store; products from mock seed, not platform tables |

---

## Phased roadmap

### Phase 1 — Core e-commerce discovery — **COMPLETE**
See [PHASE1-CATALOG-REPORT.md](./PHASE1-CATALOG-REPORT.md). Suite: **145/145** pass.

### Phase 2 — Construction tools *(next)*
Priority order from audits (no fake integrations):

1. **Transport line on checkout** — use existing PIN/distance helpers; label as estimated until yard confirms.
2. **BOQ / estimate** — compare saved estimates; convert estimate → enquiry/quotation; improve PDF share.
3. **Site expense UI** — surface existing `erp-crm` expenses on saved sites / admin; do not invent server tables until needed.
4. **Lightweight projects** — extend saved sites with budget + linked estimates/orders (avoid duplicate dealer-site schema).
5. Optional: staff console prefer `/staff/stats` when API JWT present.

### Phase 3 — Business automation
Dealer portal UI on `/me/dealer/*`, server-validated coupons, reviews + moderation, notification prefs + push config, payment when Razorpay credentials exist, Marathi dictionary.

### Phase 4 — Advanced
Catalog-grounded assistant, recommendations, analytics, QR inventory.

---

## Integrations needing external credentials

| Integration | Status |
|-------------|--------|
| Platform API `gb-api-base` / `JWT_SECRET` / `DATABASE_URL` | Deploy config |
| `PUSH_WEBHOOK_URL` (+ token) | Optional device push |
| Razorpay keys | Documented only — **unused in code** |
| Maps Distance Matrix | Not configured — zone table only |
| SMS / WA Business API / SMTP | Not present |
| Google OAuth / chat endpoint metas | Optional |

---

## Non-negotiables

- No fake payment success, live GPS, or invented stock/prices.
- No second authentication system.
- Backend authorization remains source of truth for `/me/*` and `/staff/*`.
- Prefer extending Platform entities / ERP modules over parallel schemas.
- Do not mark a module complete without a tested workflow.
