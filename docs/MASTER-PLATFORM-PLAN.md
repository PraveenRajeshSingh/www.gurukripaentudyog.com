# Master Platform Plan — Gurukripa Bricks Industry

**Date:** 2026-11-07  
**Rule:** Improve existing modules. No duplicate auth, no fake payments/GPS, phase-by-phase delivery.

---

## Architecture (current)

| Layer | Location | Notes |
|-------|----------|-------|
| Production storefront | Root static PWA (`src/`, `index.html`, Capacitor) | Primary delivery surface today |
| Next.js client | `apps/web` | CI / preview path |
| Platform API | `backend/src/platform` | Nest JWT + role guards; in-memory store (+ Postgres migrations present) |
| Shared math/catalog | `packages/api-contracts` | GST 5%, estimator formulas |
| Docs | `docs/PLATFORM-API.md`, `ARCHITECTURE.md`, `API.md` | Authoritative contracts |

---

## Capability inventory

| # | Capability | Status | Where it lives |
|---|------------|--------|----------------|
| 1 | Product search / category / price / sort | **PARTIAL** | `main.js` nav search, `products.js`, sidebar (some checkboxes inert) |
| 1b | Suggestions, history, recently viewed, size/availability filters | **MISSING → Phase 1** | — |
| 2 | Cart, GST, coupons, checkout, WA handoff | **EXISTS** | `cart.js`, `checkout.js`, `payment-service.js` (honest: no fake gateway success) |
| 2b | Live payment gateway | **BLOCKED** | Needs merchant credentials |
| 3 | Wishlist | **EXISTS** | `wishlist-drawer.js`, profile hub |
| 3b | Product comparison table | **MISSING → Phase 1** | — |
| 4 | Order history / status / invoice / reorder hook | **PARTIAL** | `invoice.js`, `tracker.js`, API `/me/orders` |
| 4b | Full status timeline + staff updates | **PARTIAL** | Staff `POST /staff/orders/:id/status`; UI timeline basic |
| 5 | Pincode delivery check | **PARTIAL** | `pincodeChecker.js` — zone rules, not live maps distance |
| 5b | Maps routing + admin transport tariffs | **MISSING → Phase 2** | Needs Maps API key |
| 6 | Dealer/contractor register + sites | **PARTIAL** | `/auth/dealer-register`, `/me/dealer/*`, bulk RFQ modal |
| 6b | Full contractor dashboard / account pricing | **MISSING → Phase 3** | |
| 7 | Quotation RFQ + admin send | **PARTIAL** | QuotationService + staff quotation routes |
| 7b | Branded quotation PDF | **PARTIAL** | ERP invoice PDF stronger than RFQ PDF |
| 8 | 3-in-1 estimator | **EXISTS** | `calculator.js`, `erp-calculators.js`, contracts package |
| 8b | BOQ PDF / estimate compare / convert to quote | **PARTIAL → Phase 2** | Save estimates exist offline |
| 9 | Construction project management | **MISSING → Phase 2** | Saved sites ≠ full projects |
| 10 | Site expense manager | **MISSING → Phase 2** | |
| 11 | Notifications | **PARTIAL** | `/me/notifications`, push SW, `erp-notify.js` |
| 12 | Chat assistant | **PARTIAL** | `chatbot.js` — extend with catalog facts only |
| 13 | Reviews system (submit/moderate) | **MISSING → Phase 3** | Static rating display only |
| 14 | Reorder | **PARTIAL** | `reorderTrolley` — must use **current** catalogue prices |
| 15 | Coupons | **PARTIAL** | Local `COUPONS` in `data.js`; no admin loyalty |
| 16 | PWA | **EXISTS** | SW, manifest, offline store |
| 17 | Admin / ops portal | **PARTIAL** | `admin-portal.js` + ERP modules; staff API for enquiries/orders |
| 18 | Auth / RBAC | **EXISTS** | JWT `/auth/*`, guards, storefront session harden (prior pass) |
| 19 | i18n | **PARTIAL** | `hi` + `en`; Marathi scaffold later |
| 20 | DB entities | **PARTIAL** | Platform store + migrations; extend carefully |

---

## Phased roadmap (execution order)

### Phase 1 — Core e-commerce discovery (this sprint)
1. Unified catalog filter pipeline (category + price + stock + query + sort).
2. Search suggestions + search history.
3. Recently viewed products.
4. Product comparison (up to 3) responsive table.
5. Wire sidebar availability filters (remove dead checkboxes).
6. Fix reorder to reprice from current `PRODUCTS`.
7. Tests + rebuild + report.

### Phase 2 — Construction tools
Transport estimate (labelled estimates), BOQ PDF/share, projects, site expenses, estimate→enquiry.

### Phase 3 — Business automation
Delivery workflow UX, payment when credentials exist, contractor portal polish, coupons/loyalty admin, reviews with moderation, notifications prefs.

### Phase 4 — Advanced
Assistant grounded on catalog, recommendations, analytics, QR inventory.

---

## Integrations needing external credentials

| Integration | Status |
|-------------|--------|
| Platform API `gb-api-base` | Optional meta tag |
| Google OAuth | Optional meta |
| Razorpay / UPI gateway | Not configured — checkout stays COD/WA |
| Maps distance matrix | Not configured — pincode zones only |
| SMS / WhatsApp Business API | WA deep-links only |
| Push VAPID | Partial SW support |

---

## Non-negotiables (enforced)

- No fake payment success, live GPS, or invented stock/prices.
- No second authentication system.
- Backend authorization remains source of truth for `/me/*` and `/staff/*`.
- Do not mark a module complete without a tested workflow.
