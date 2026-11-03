# Gurukripa Platform API (Backend `/api/v1`)

**Base URL:** `https://<your-backend-host>/api/v1` (local dev: `http://localhost:3000/api/v1`)
**Auth:** `Authorization: Bearer <JWT>` — issued by `/auth/*`. Claims: `id, tenantId, name, phone, role`. Default session: 12 h (`JWT_EXPIRATION`).
**Roles (enforced server-side, requirement F):** `CUSTOMER`, `DEALER`, `STAFF`, `SALES_MANAGER`, `ADMIN` (+ platform `TENANT_ADMIN`/`SUPER_ADMIN`).
**Validation:** all request bodies pass a whitelisting `ValidationPipe` (unknown fields stripped) with DTO constraints (phone format, pincode, GSTIN, password ≥ 8, attachment mime/size caps).
**Rate limits:** per-IP sliding window on auth and public write endpoints (login 10/min, register 8/min, dealer 5/min, guest enquiry 6/min).

All monetary totals (CGST/SGST split of the 5 % inclusive rate) are computed **only** on the server by `PricingEngineService`; clients never submit tax figures.

---

## 1. Public (no token)

| Method | Path | Purpose |
|---|---|---|
| GET | `/public/products` · `/public/products/categories` | Catalogue + categories |
| GET | `/public/announcements` | Active announcements (audience-filtered client-side) |
| POST | `/public/enquiries` | Guest enquiry (lead). Requires `contactName`, `contactPhone` |
| GET | `/tenants/:slug/branding` · `/tenants/:slug/products` | Legacy SaaS white-label endpoints (unchanged) |
| POST | `/calculator/estimate` | Wall / house / boundary estimator (wastage + mortar allowances included) |

## 2. Auth

| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/auth/register` | → CUSTOMER | `{name, phone, password, email?, language?(en\|hi\|mr), tenantSlug?}` → `{user, token}` |
| POST | `/auth/dealer-register` | → DEALER (PENDING) | adds `firmName, gstin?, licenseNo?, dealerAddress, dealerCity` |
| POST | `/auth/login` | any | phone + password (bcrypt verify) |
| GET | `/auth/me` | any | current session + account record |

Passwords: bcrypt (10 rounds), never logged or mirrored in plaintext form. Administrator accounts are **not** seeded with demo data — bootstrap via `BOOTSTRAP_ADMIN_PHONE`/`BOOTSTRAP_ADMIN_PASSWORD` env on first boot, then remove the env vars.

## 3. Customer / dealer self-service — `/me/*` (own records only; foreign ids return 404)

| Method | Path | Notes |
|---|---|---|
| GET/PATCH | `/me/profile` | name, email, language preference |
| GET/POST/DELETE | `/me/addresses` [/:id] | multiple delivery addresses, first is default |
| POST | `/me/enquiries` | `{lines[], siteLocation, notes?, contactPhone?, contactName?, attachments?(≤5 data-URL jpeg/png/webp), addressId?}` |
| GET | `/me/enquiries` · `/me/enquiries/:id` | detail includes full status **timeline** |
| GET | `/me/quotations` · `/me/quotations/:id` | PDF-ready payload: business block, GST split, lines |
| POST | `/me/quotations/:id/approve` | **approving converts the quotation into a CONFIRMED order server-side** |
| POST | `/me/quotations/:id/reject` | `{reason?}`; staff are notified |
| GET | `/me/orders` · `/me/orders/:id` | detail includes timeline + `expectedDelivery` |
| POST | `/me/orders/:id/cancel` | only while status = CONFIRMED (before production) |
| POST | `/me/orders/:id/reorder` | repeat order → new enquiry with same lines (dealer B.4) |
| GET | `/me/orders/:id/invoice` | invoice document JSON for on-device PDF rendering |
| POST | `/me/devices` | register push token `{token, platform, preferences{orderUpdates, quotations, announcements}}` |
| PUT | `/me/devices/:id/preferences` | notification opt-in management |
| GET | `/me/notifications` · POST `/me/notifications/read-all` | in-app inbox (works with zero push config) |
| GET | `/dealer/status` | PENDING/APPROVED/REJECTED + discount % |
| GET/POST | `/dealer/sites` | saved project locations |
| GET | `/dealer/overview` | approved dealers only: orders, quotations, statement totals |

## 4. Staff / manager / admin — `/staff/*`

| Method | Path | Min role |
|---|---|---|
| GET | `/staff/enquiries?status=&mine=1` · `/staff/enquiries/:id` | STAFF |
| POST | `/staff/enquiries/:id/review` | STAFF |
| POST | `/staff/enquiries/:id/assign` `{staffId}` | SALES_MANAGER |
| POST | `/staff/enquiries/:id/quotation` `{lines[], discountAmount?, validDays?, notes?, sendNow?}` | STAFF |
| POST | `/staff/quotations/:id/send` | STAFF |
| GET | `/staff/quotations` · `/staff/orders?status=` | STAFF |
| POST | `/staff/orders/:id/status` `{status, note?, expectedDelivery?}` | STAFF |
| GET/POST | `/staff/dealers` · `/staff/dealers/:id/decision` `{status, dealerDiscountPct?}` | ADMIN |
| POST/PATCH | `/staff/announcements` [/:id] | ADMIN |
| GET | `/staff/stats` | STAFF — real dashboard KPIs from live data |
| GET | `/staff/audit?limit=` | ADMIN |
| GET | `/staff/export/:entity.csv` (enquiries\|quotations\|orders) | SALES_MANAGER (exports are audit-logged) |
| GET | `/staff/staff-members` | STAFF (assignee picker) |

## 5. Workflow state machine

```
ENQUIRY   NEW → UNDER_REVIEW → QUOTATION_PREPARED → (CLOSED)
QUOTATION DRAFT → SENT → APPROVED | REJECTED        (APPROVED ⇒ ORDER CONFIRMED)
ORDER     CONFIRMED → PRODUCTION → DISPATCHED → DELIVERED
          CONFIRMED/PRODUCTION → CANCELLED (staff anytime; customer only at CONFIRMED)
```

Every transition is validated against `ENQUIRY_/QUOTATION_/ORDER_TRANSITIONS`
in `src/platform/types.ts`; illegal moves return **400**, wrong roles **403**.
Each move appends a `StatusEvent` (customer timeline), an `audit_logs` row and
a customer notification (inbox + push transport if `PUSH_WEBHOOK_URL` set).

## 6. Persistence

In-memory store is authoritative (zero-infrastructure dev, same dual-mode as
the existing `DatabaseService`). When `DATABASE_URL`/DB env is reachable the
store mirrors every write and hydrates at boot (migration
`002_platform_workflow.sql`, run via `npm run migrate`). Deletes are not
mirrored yet — see limitations.

## 7. Known limitations & pending configuration (honest status)

1. **Payments not implemented** — orders default to `PAYMENT_ON_DELIVERY`. A
   gateway integration (Razorpay chosen) requires merchant API keys + webhook
   secret before build (requirement H). Endpoints reserved: none wired — do not
   call from the app.
2. **Push transport** — inbox works now; device push activates when
   `PUSH_WEBHOOK_URL` points to an FCM-v1-capable relay (Firebase project).
   No fabricated delivery is claimed.
3. **Server PDF** — quotation/invoice **documents** are JSON payloads rendered
   client-side (print-to-PDF in web/Android). A server-rendered PDF service is
   optional later.
4. **Inventory** — deliberately absent: no real stock data exists yet
   (requirement H). Stock fields remain null, never fabricated.
5. **Dealer credit / outstanding balances** — statement shows order totals only;
   ledger semantics (credit limits, partial payments, reconciliation) need the
   business's policy before implementation.
6. **GST tax invoices** — GSTIN of record (`09AAACG7481M1Z2`) and the inclusive
   5 % split are server-computed, but legal invoice numbering/HSN-SAC
   presentation must be confirmed with the accountant before labeling
   documents as tax invoices.
7. Deletes and multi-instance horizontal scaling require the Postgres path
   (single-instance in-memory fallback is dev-only).

## 8. Verification

- `npm run build && npm test` — 30 unit/integration tests (RBAC, guards,
  workflow, ownership isolation, GST math, notifications, CSV).
- `npm run smoke` against a bootstrapped server — 18 live HTTP checks of the
  full enquiry → delivery workflow including 401/403/404 negative paths.
