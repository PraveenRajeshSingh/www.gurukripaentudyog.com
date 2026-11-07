# Multi-Tenant SaaS Architecture — Gurukripa Platform

**Date:** 2026-11-07  
**Scope:** Phase 1 audit + Phase 2 isolation hardening (not a full 17-phase build)  
**Primary tenant today:** `tenant-gurukripa-001` (`slug: gurukripa`)

---

## 1. Current-state audit (Phase 1)

### Stack

| Layer | Reality |
|-------|---------|
| Storefront | Static PWA (`src/` → `scripts/build.js` → `index.html`) + Capacitor Android/iOS shells |
| Platform API | NestJS (`backend/src/platform`) — JWT claims include `tenantId` + `role` |
| Data | In-memory store authoritative; optional Postgres mirror (`002_platform_workflow.sql`) |
| Demo tenants | Mock registry: Gurukripa + Awadh (`tenant-awadh-002`) for catalogue/branding only |

### What already works

- JWT session carries `tenantId`; most list APIs filter by `user.tenantId`.
- Customer ownership checks on quotations/orders (`userId === JWT subject`).
- RolesGuard + staff/manager role sets on `/api/v1/staff/*`.
- Estimators: Wall/Brick, Full Building, Boundary Wall (client math + optional `/calculator/estimate`).
- Honest payments: COD / WhatsApp confirmation — **no** fake gateway success.
- Product catalogue, cart, wishlist, compare, enquiries → quotation → order workflow.

### Gaps found (security-relevant)

| Issue | Risk | Status |
|-------|------|--------|
| `GET /staff/dealers` hardcoded Gurukripa tenant | Staff of other tenants would still see Gurukripa dealers | **Fixed** — uses `user.tenantId` |
| `addEvent` / `audit` always wrote Gurukripa `tenantId` | Audit/timeline pollution & false attribution | **Fixed** — uses actor `tenantId` |
| Workflow staff actions lacked tenant assert | Tenant A staff could mutate Tenant B enquiry/quote/order by ID | **Fixed** — `assertTenantAccess` |
| Dealer decision / announcement patch missing tenant check | Cross-tenant admin mutation by ID | **Fixed** |
| Login phone fallback scanned **all** tenants | Same phone in Tenant B could log into wrong business without slug | **Fixed** — slug-scoped lookup only |
| `TenantIsolationGuard` unused on platform routes | Body/path `tenantId` spoof not blocked | **Fixed** — wired into `Authenticated()` |
| Legacy `POST /orders` + `POST /sync/push` trusted body `tenantId` | Unauthenticated cross-tenant writes | **Fixed** — JWT + JWT tenant only |
| Invoice branding hard-coded Gurukripa | Wrong legal entity on other-tenant invoices | **Fixed** — uses order `tenantId` |
| Public catalogue still primary-tenant default | White-label by slug exists; public `/public/*` still Gurukripa | Deferred (2b) |
| Roles `DRIVER` / warehouse / dispatcher in enum but not `STAFF_ROLES` | Incomplete RBAC for delivery/inventory | Deferred |
| SQL `user_role` enum vs TS 10-role set | Schema drift if Postgres authoritative | Deferred with migration |
| Coupons client-only; Razorpay env unused | No live payments | Deferred (needs credentials) |
| Live GPS / Distance Matrix | Not wired | Deferred (needs provider + consent) |
| Native iOS App Store readiness | Capacitor shell only | Deferred |
| Full PM (BOQ projects, expenses, ledgers) | Partial / local ERP only | Deferred phases |
| No tenant onboarding UI/API | Seed-only demo tenants | Deferred (2b) |

### Estimators (existing)

1. **Wall / Brick** — quantity from dimensions & brick size.  
2. **Full Building Materials** — rooms/floors → materials list.  
3. **Boundary Wall** — length/height → bricks/cement/sand.  

All are **indicative**; UI must not claim certified structural design. Saved estimates are local / saved-sites — not multi-project PM yet.

### Integrations

| Integration | Status |
|-------------|--------|
| Maps / routing | Haversine + PIN zones; no Distance Matrix |
| Payments | COD / on-delivery only |
| GST | Server GST-inclusive split (5%) for quotations/orders |
| Email / SMS / WhatsApp | Optional webhook / manual WA; no provider SDK |
| Push | Device tokens + optional `PUSH_WEBHOOK_URL` |

---

## 2. Tenancy model (choice)

**Selected: shared database / shared schema with `tenant_id` on every business row.**

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Shared DB + shared schema + `tenant_id` | Matches current store + SQL mirror; lowest cost; single migration path | Must enforce scoped queries everywhere | **Chosen** |
| Shared DB + schema-per-tenant | Stronger isolation | Ops complexity; Nest store not designed for it | Reject for now |
| DB-per-tenant | Max isolation | Cost and ops for SME brick yards | Reject until enterprise tier |

**Rules**

1. Never trust `tenantId` from browser, mobile, URL, or body. Resolve business via **verified JWT** (or public `tenantSlug` → registry lookup for unauthenticated catalogue/login).  
2. Every staff mutation calls `assertTenantAccess(user, entity.tenantId)` (`SUPER_ADMIN` may cross tenants).  
3. Cache keys, exports, notifications, and file paths must include `tenantId`.  
4. When Postgres RLS is enabled later, policies mirror the same `tenant_id = current_setting(...)` pattern; app-layer checks remain mandatory.

---

## 3. Roles (target vs today)

| Role | Today | Target |
|------|-------|--------|
| Guest | Public catalogue + guest enquiry | Same |
| CUSTOMER / DEALER | `/me/*` ownership | Same + wishlist/estimates ownership |
| STAFF / SALES_MANAGER / ADMIN / TENANT_ADMIN | Staff console | Granular permissions |
| DRIVER / DISPATCHER / WAREHOUSE | Enum only | Wire into `STAFF_ROLES` + scoped APIs |
| SUPER_ADMIN | Guard bypass for roles | Platform tenant management only |

Customers keep own orders, profile, addresses, quotes, enquiries, wishlist, estimates **without** admin rights. Tenant Admin ≠ other tenants.

---

## 4. Phased roadmap (dependencies)

| Phase | Focus | Depends on | Status |
|-------|-------|------------|--------|
| **1** | Audit + docs | — | **Done** (this doc + prior audits) |
| **2a** | Isolation hardening + cross-tenant tests | Phase 1 | **Done** (this delivery) |
| **2b** | Tenant onboarding API, branding, slug domains | 2a | Next |
| **3** | Granular RBAC + invitations + audit UI | 2a | Next |
| **4** | Server cart/coupons/checkout integrity | 2a | After 2b |
| **5** | Inventory / warehouses / PO | 2b, 3 | Later |
| **6** | Estimators → projects / BOQ / expenses | 2b | Later |
| **7** | Delivery / drivers / POD | 3, 5 | Later |
| **8** | Ledgers / GST reports / real payments | Credentials + 4 | Blocked without merchant keys |
| **9** | Email/SMS/WA providers | Credentials | Blocked without providers |
| **10–11** | Android polish + native iOS + offline sync | 2a, 4 | Incremental |
| **12–16** | Analytics, security hardening, perf, a11y | Prior phases | Ongoing |
| **17** | Staging → production release process | All critical paths | Ops |

**Do not** implement phases 4–17 in one change. Each phase: migrations → code → automated tests → manual smoke → document config.

---

## 5. Data ownership (current)

```
Tenant 1─n User (role, phone unique per tenant)
Tenant 1─n Enquiry / Quotation / Order / Announcement / Audit / Event
User   1─n Address, Device, Notification, SavedSite
Enquiry 1─n Quotation → Order (same tenantId copied)
```

Product catalogue today: mock DB keyed by tenant (Gurukripa + Awadh seeds). Platform workflow tables mirror entities with `tenant_id`.

---

## 6. Acceptance vs deferred

**Accepted for this slice**

- Documented architecture and roadmap.  
- Cross-tenant staff mutations blocked.  
- Dealers/announcements/audit/events tenant-scoped.  
- Login scoped by `tenantSlug` (default Gurukripa).  
- Automated cross-tenant tests in `backend/test/platform.test.ts`.

**Explicitly deferred (incomplete / blocked)**

- Full SaaS billing & usage limits.  
- Custom domains / subdomain routing in production.  
- Live UPI/card gateway, GPS tracking, SMS/email/WA providers.  
- Complete inventory, accounting, project PM, iOS App Store claim.  
- Postgres RLS policies (planned with shared-schema choice).

---

## 7. Configuration & secrets

- Keep merchant keys, SMTP, SMS, WhatsApp, map API keys in env only — never commit.  
- `BOOTSTRAP_ADMIN_*` seeds primary tenant admin only.  
- Production must set strong `JWT_SECRET` and disable in-memory-only mode when Postgres is authoritative.

---

## Related docs

- [MASTER-PLATFORM-PLAN.md](./MASTER-PLATFORM-PLAN.md)  
- [ARCHITECTURE.md](./ARCHITECTURE.md)  
- [SECURITY.md](./SECURITY.md)  
- [PLATFORM-API.md](./PLATFORM-API.md)  
- [PHASE1-CATALOG-REPORT.md](./PHASE1-CATALOG-REPORT.md)  
