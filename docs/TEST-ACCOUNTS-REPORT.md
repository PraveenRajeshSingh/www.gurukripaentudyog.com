# Test Accounts & Demo Data Report

**Confidential passwords:** see gitignored `TEST_ACCOUNTS.local.md` (never commit).  
**Regenerate:** from `backend/`, `$env:ALLOW_DEMO_SEED="1"; npm run seed:demo:reset`  
**API boot:** start backend with `ALLOW_DEMO_SEED=1` so `.demo/platform-seed-snapshot.local.json` (hashes only) is hydrated into the in-memory store.

## Latest seed run (verified)

| Metric | Count |
|---|---|
| Tenants | 2 (Gurukripa + Awadh/Demo) |
| Login-enabled test accounts | 22 |
| Guest | 1 (no account) |
| Products (incl. inactive) | 8 |
| Customers + contractors (personas) | see credentials file |
| Orders | 5 |
| Enquiries | 6 |
| Quotations | 5 |
| Saved sites / estimate projects | 4 |
| Invoice-like delivered/dispatched | ≥2 |
| Login checks | 22/22 |
| Permission checks | 4/4 |
| Cross-tenant checks | 4/4 |
| Automated `demo_accounts` tests | 8/8 |

Failed tests: **none** in the verified seed + unit suite.

## Role mapping (requested → JWT)

| Requested persona | JWT `UserRole` | Notes |
|---|---|---|
| Platform Super Admin | `SUPER_ADMIN` | Platform ops |
| Tenant Admin | `TENANT_ADMIN` | Per-tenant |
| Branch Manager | `ADMIN` | Branch via `branchName` |
| Sales Staff | `STAFF` / `SALES_MANAGER` | |
| Inventory Staff | `WAREHOUSE_STAFF` | Login OK; `/staff` denied until role wired into `STAFF_ROLES` |
| Accountant | `STAFF` + jobTitle Accountant | Dedicated role deferred |
| Delivery Driver | `DRIVER` | Login OK; `/staff` denied until wired |
| Contractor / Builder | `DEALER` (APPROVED) | |
| Normal Customer | `CUSTOMER` | |
| Guest | _(none)_ | No password — public routes only |

Login identifier: **10-digit phone** + password + optional `tenantSlug` (`gurukripa` \| `awadh-bricks`). Username column mirrors phone for tooling.

## Platform matrix (manual)

| Surface | How to use same accounts | Status |
|---|---|---|
| Desktop / mobile web | Login UI → phone + password; guest = no login | Documented; verify after seed |
| Android (Capacitor / Kotlin) | Same API `/auth/login` with Bearer token | Must be verified on device — web success ≠ mobile proof |
| iOS | Same Platform API session | Must be verified on device / simulator |

Forgot-password: not implemented as a live email provider — do not claim E2E reset until a mock mailer exists.

## Automated coverage

| Suite | Location |
|---|---|
| Demo seed + login + isolation | `backend/test/demo_accounts.test.ts` |
| Cross-tenant workflow | `backend/test/platform.test.ts` |
| Catalogue isolation | `backend/test/isolation_and_pricing.test.js` |

## Demo data marks

All seeder content is tagged **TEST DATA**. Inventory / PO / finance extras live in `.demo/demo-dataset.local.json` (gitignored) until dedicated modules expose APIs. Workflow-backed data (users, addresses, enquiries, quotations, orders, announcements, saved sites) is created in `PlatformStoreService` with bcrypt password hashes only.

## Security gates

- Refuses when `NODE_ENV=production`
- Requires `ALLOW_DEMO_SEED=1`
- `TEST_ACCOUNTS.local.md` and `.demo/` are in `.gitignore`
- Does not overwrite bootstrap admin env credentials
- Suspended / disabled accounts cannot obtain JWT
