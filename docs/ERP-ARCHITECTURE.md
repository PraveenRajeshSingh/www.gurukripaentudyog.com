# Gurukripa ERP — Architecture, Local-First Core & Backend Contract

Status: **Phase 1 implemented (local-first). Backend-dependent features are
specified here as an API contract, NOT built — this project is a static PWA
with no server, database, gateway secret, or GPS feed, so those features
cannot be implemented "for real" in-repo without fabricating them.**

---

## 1. What this codebase actually is (verified)

| Concern | Reality |
|---|---|
| Framework | Static HTML/CSS/JS single-page assembled by `scripts/build.js`, shipped as a PWA and wrapped for Android/iOS with Capacitor. |
| Dependencies | `@capacitor/app`, `@capacitor/core` only. No server, ORM, DB driver, or SDK. |
| Network | Zero `fetch`/`XMLHttpRequest` in `src/js` and `src/services`. No API endpoints exist. |
| Persistence | `localStorage` via `getSafeStorage`/`setSafeStorage` (`src/js/state.js`). |
| Auth | Client-side `gb_users`; Google "sign-in" only decodes the JWT payload in the browser. No server sessions. |
| Payments | `src/services/payment-service.js` is a mock: it fabricates an order client-side and returns `sig_verified_mock_...` when the Razorpay SDK is absent. No order is created on a gateway and no signature is verified. |
| Orders | `placeOrder()` writes `gb_orders` after a `setTimeout` and shows confetti. |
| Admin dashboard | Previously rendered hardcoded numbers (`quotes.length || 3`, `₹14.8L`, `45,000`, `6`). |

---

## 2. What was built (real, in-repo, tested)

A dependency-free local-first ERP core under `src/js/`, exposed on
`window.GurukripaERP`, wired into the admin console:

- **`erp-core.js`** — storage adapter, sequential **document numbering**
  (FY-scoped, `INV/2026-27/0001`), append-only **audit log** (actor + role +
  timestamp + record ref), **RBAC** matrix, brick **unit conversions**
  (piece/hundred/thousand/trolley=4000/pallet), money rounding.
- **`erp-inventory.js`** — item/SKU master, warehouses, immutable
  **stock-movement ledger**, `onHand`/`reserved`/`available`,
  **oversell guard**, receipts/dispatch/adjust/transfer/reserve, reorder-level
  `lowStock()`, **weighted-average valuation**.
- **`erp-documents.js`** — **GST engine** (exclusive/inclusive, intra CGST+SGST
  / inter IGST, HSN/SAC, discount cap, rupee round-off), quotations → sales
  order → invoice conversion, finalize (consumes stock), cancel (retains
  record), credit notes (recompute receivable), **idempotent payments** by
  `txnId`, receipts, PO → goods-received (stock only on GRN).
- **`erp-crm.js`** — customers/suppliers, segments, multi-address, credit
  limits + `approveCreditSale`, computed **outstanding**, **aging** buckets,
  running-balance **statements**, supplier payables, expense ledger.
- **`erp-analytics.js`** — KPIs and **chart series computed only from real
  finalized records** (today/week/month/year + prev-period %, order count,
  AOV, collected/outstanding/overdue, status distribution, top products/
  customers, sales by category/segment, low stock, delivery performance),
  **gross/net profit that report `available:false` with a reason when cost or
  expense data is missing**, and **CSV export**.

Admin console (`admin-portal.js` + `admin-dashboard-modal.html`): the fake
overview KPIs, hardcoded inventory and hardcoded dispatch were replaced with
live analytics; the inventory tab renders the real ledger; **Dispatch** and a
new **Finance & Reports** tab surface receivables aging, profitability and
CSV exports. Empty states say so instead of showing made-up numbers.

Verification: `npm test` → **53/53 pass** (27 pre-existing + 26 new
`tests/erp.test.js`); `node --check` clean on every new/edited JS file;
`npm run build` and `prepare-www.js` succeed.

### Honest limits of the local-first core
- Numbering and oversell guards are atomic **within one browser tab**
  (synchronous read-modify-write). They are **not** multi-device / multi-user.
- RBAC is a **client-side gate only** — trivially bypassable; it is NOT
  security. Authoritative enforcement requires the backend.
- Data lives in `localStorage`: per-device, ~5 MB cap, cleared on browser
  data wipe. Not a system of record.

---

## 3. What CANNOT be implemented here (needs a backend) — the contract

The following prompt modules are inherently server-side. Building them in a
static site would mean faking exactly the things the spec forbids. Each maps
to endpoints to implement server-side; the local modules above define the
shapes, so migration is a transport swap (`localStorage` → `fetch`).

### 3.1 Realtime payment capture (Module 3) — never mark paid from frontend
- `POST /api/orders` → create order + **server-side** gateway order (Razorpay
  `order_id`) using the secret key. Returns order_id to open checkout.
- `POST /api/webhooks/razorpay` → verify `X-Razorpay-Signature` =
  HMAC-SHA256(`PAYMENT`+body, webhook_secret). **Idempotent** by event id.
- On `payment.captured` → call `ERP.Documents.recordPayment(invoiceNo, {
  amount, txnId: razorpay_payment_id, method })`. Only then status → paid.
- Reconciliation job compares gateway settlements vs `gb_erp_docs` payments.
- Remove the `sig_verified_mock` fallback in `payment-service.js` once wired.

### 3.2 Server-enforced RBAC + approvals (Module 9)
- Sessions/JWT signed server-side. Every mutating endpoint checks the action
  against the same `PERMISSIONS` matrix (`erp-core.js`) before writing.
- Refund / discount override / credit-sale / invoice-correction / stock-
  adjustment require an approval row with an authorized approver role.

### 3.3 Multi-user inventory & numbering (Modules 4, 11)
- Invoice numbering = DB sequence or a locked counter row
  (`SELECT … FOR UPDATE`), not a browser counter.
- Stock movements in DB transactions with row locks / optimistic version to
  prevent overselling across devices.

### 3.4 Delivery & live GPS (Module 7)
- `POST /api/deliveries` (schedule, assign driver/vehicle),
  `PATCH /api/deliveries/:id/status` (challan → dispatched → delivered,
  with POD photo upload), `POST /api/telemetry` for device GPS pings.
- Maps: server-calls Directions API with the key (never expose key client-side).
- **No ETA/location is ever fabricated** — until a real telemetry feed exists,
  the UI shows an honest empty state (already implemented).

### 3.5 Secure documents & PDF (Module 2)
- Store documents server-side (S3/Postgres), versioned, access-controlled.
- Server renders signed PDFs (`GET /api/invoices/:no.pdf`) for legal delivery.
  Browser print (`invoice.js`) remains for previews only.

### 3.6 Financial reporting & reconciliation (Module 8)
- Aggregation endpoints (`/api/reports/*`) run SQL over the same ledger so
  charts reconcile to source rows across users. Exports become server jobs.

### 3.7 Database models (Module 11)
Suggested tables (mirror the JS shapes): `users, roles, customers, addresses,
suppliers, items, warehouses, stock_movements, documents, document_lines,
payments, credit_notes, purchase_orders, grn, expenses, audit_log`. Keyed
sequences per FY per doc type. FKs from movements→items→warehouses,
payments→documents, audit→(entity,entity_id).

---

## 4. Recommended rollout (per Module 12 phasing)
1. **Phase 1 (done):** dashboard-from-real-data + invoice/GST/quotation/
   inventory/CRM/audit local engine + CSV export, fully tested.
2. Stand up backend + DB; port `erp-core.read/write` to `fetch` behind the
   same module APIs (no UI changes needed).
3. Real gateway order + webhook verification; delete payment mock.
4. Server RBAC + approval workflows; move `can()` checks server-side.
5. Inventory concurrency (transactions/locks) + multi-device numbering.
6. Purchasing → GRN → valuation; delivery + GPS telemetry; bank/gateway
   reconciliation; server PDF.

## 5. Credentials / config still required (block production)
Razorpay key **secret** + webhook secret, real Google OAuth server flow,
Google Maps API key (server-side), DB + hosting, SMTP for document delivery,
and a configured GST/tax regime validated by a CA before any live invoicing.

> Nothing in this phase is "production-ready" as a multi-user accounting
> system. It is a tested, honest local-first foundation plus the exact contract
> to finish it on a backend.
