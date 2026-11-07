# Role-Based Feature Visibility & Permission Audit

**Date:** 2026-11-07  
**Storefront module:** `src/js/role-access.js`  
**Backend (unchanged security boundary):** JWT + `RolesGuard` on `/api/v1/me/*` and `/api/v1/staff/*`

---

## Role mapping (existing Platform roles — no duplicates)

| Prompt role | Platform / storefront mapping | UI audience |
|-------------|-------------------------------|-------------|
| Guest | No session | `guest` |
| Normal / Registered Customer | `CUSTOMER` | `customer` |
| Contractor / Builder | `DEALER` **or** `buyerType: contractor` | `contractor` |
| Staff | `STAFF`, `DISPATCHER`, `WAREHOUSE_STAFF`, `DRIVER` | `staff` |
| Manager | `SALES_MANAGER` | `manager` |
| Administrator / Super Admin | `ADMIN`, `TENANT_ADMIN`, `SUPER_ADMIN` | `admin` |

---

## Feature visibility matrix

| Feature | Guest | Customer | Contractor | Staff+ | Notes |
|---------|:-----:|:--------:|:----------:|:------:|-------|
| Homepage / catalogue / search / compare | ✓ | ✓ | ✓ | ✓ | Public |
| Estimator + BOQ + print/save | ✓ | ✓ | ✓ | ✓ | No login required to calculate |
| Cart / wishlist | ✓ | ✓ | ✓ | ✓ | Device ledger |
| Login / register | ✓ | — | — | — | |
| My Dashboard / Profile / GST / Sites | | ✓ | ✓ | ✓ | Login required |
| My Orders / Invoices / Reorder | | ✓ | ✓ | ✓ | Own records only |
| Enquiries / Quotations RFQ | ✓* | ✓ | ✓ | ✓ | *Guest can open RFQ modal |
| Track delivery | ✓ | ✓ | ✓ | ✓ | Status timeline — no fake GPS |
| Notifications centre | ✓ | ✓ | ✓ | ✓ | |
| Bulk / contractor RFQ highlight | | | ✓ | | Extra nav when contractor |
| Operations / Admin portal | | | | ✓ | Hidden from customers |
| Staff order status / yard inventory | | | | ✓ | Backend `/staff/*` |

\*Guest RFQ does not need admin approval to submit.

---

## What was wrong / fixed

1. **Ops portal previously easy to confuse with “customer tools”** — yard console stays staff-only; customer equivalents surfaced in Account menu, drawer, and hub tiles (Dashboard, Estimator/BOQ, Orders, Sites, Track, Contractor Bulk).
2. **No centralized audience helper** — added `RoleAccess` with `data-audience` / `data-perm` application on auth UI updates.
3. **Role badge** — shows Customer / Contractor / Staff / Manager / Administrator via `RoleAccess.roleLabel`.
4. **DEALER never treated as staff** — cannot open Operations Portal.

---

## Permission keys (UI)

Customer (examples): `products.view`, `estimates.create`, `orders.view_own`, `sites.manage_own`, `quotations.view_own`, `wishlist.manage`, `invoices.view_own`, `tracker.view_own`  

Contractor adds: `bulk.enquire`, `dealer.overview`, `gst.manage_own`  

Staff+: `ops.orders`, `ops.enquiries`, `ops.quotations`, `ops.dispatch`, `ops.inventory`, … `ops.settings`

**Security:** Frontend keys only control chrome. Customer data isolation and staff actions remain enforced by Platform API ownership checks and role guards.

---

## Intentionally not built in this pass

| Item | Reason |
|------|--------|
| Full project PM / site expense product | Phase 2 — link to estimator + sites for now |
| DB migration for permission tables | Backend already uses role enums; avoid parallel schema |
| Configurable staff permission editor UI | Needs admin product design; ERP `can()` + Nest `@RequireRoles` remain |

---

## Testing

- `tests/role-access.test.js` — audience + permission matrix unit tests  
- Full `npm test` / `node --test tests/` after rebuild  
- Manual: sign in as CUSTOMER → Account menu shows Dashboard/Estimator/Orders; Ops button hidden. Sign in with staff role → Ops visible.
