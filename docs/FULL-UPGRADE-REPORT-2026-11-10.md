# GURUKRIPA Full Upgrade Report — 2026-11-10

## Existing architecture inspected

| Layer | Path | Role |
|-------|------|------|
| Production storefront | `src/` → `index.html` / `www/` (GitHub Pages + Capacitor) | Primary customer surface |
| Next.js client | `apps/web` | CI / preview parity |
| Platform API | `backend/` NestJS | Auth, workflow, pricing, payments stubs→live path |
| Shared math | `packages/api-contracts` | GST / estimator / catalog helpers |

## What changed (this pass)

### Security & payments (backend)
- Added `RecaptchaService` — verifies Google reCAPTCHA v3 when `RECAPTCHA_SECRET_KEY` is set; skips when unset (rate limits still apply).
- Wired CAPTCHA into `/auth/register`, `/auth/dealer-register`, `/auth/login`, `/public/enquiries`.
- Added `RazorpayService` — live Orders API when key id + secret set; honest non-chargeable stub otherwise.
- Payment initiate uses Razorpay service; verify uses HMAC; new `POST /api/v1/webhooks/razorpay` with webhook secret.
- Security headers in `main.ts` (nosniff, frame deny, referrer, Permissions-Policy, HSTS in production).
- JWT no longer accepted from query `__at` (Authorization header only).

### Storefront (legacy PWA)
- `src/js/recaptcha.js` + meta `recaptcha-site-key`; login/register/contact/RFQ attach tokens when enabled.
- Browser language detection on first visit; persist `gb_lang`; Devanagari font stack for `html[lang=hi]`.
- Hero CTAs: Explore Products, Nearby Suppliers, Book Bricks, Contact Us.
- Nav Bookings control (bulk quote) + Categories retained.
- Checkout: duplicate-submit guard + server `cart/validate` before COD when API online.
- Admin overview RFQ table filter input.
- Env examples: `RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`, `RECAPTCHA_MIN_SCORE`.

### apps/web
- Expanded EN/HI translation keys (nearby/book/contact/cart/checkout/profile chrome).

## Tests actually executed

| Suite | Result |
|-------|--------|
| `npm test` (storefront) | **164 pass / 0 fail** |
| `npm run build` | **OK** — wrote `index.html` (4064 lines) |
| `npm --prefix backend run build` | **OK** (tsc + SQL copy) |
| Backend `npm test` | See terminal log from same verification pass (exit 0) |

## Not claimed / remaining dependencies

| Item | Status |
|------|--------|
| Live reCAPTCHA | Needs real site + secret keys in env / meta |
| Live Razorpay charging | Needs merchant keys + webhook URL pointing at API |
| Live Google Maps Places | Needs restricted browser/server keys |
| Calendar delivery-slot booking product | Not in API — booking remains trolley/quote/checkout |
| Full `apps/web` admin / nearby port | Deferred — production remains legacy PWA |
| Fabricated testimonials/stats/GPS | Intentionally not added |

## Credential checklist for production

1. `RECAPTCHA_SITE_KEY` → HTML meta `recaptcha-site-key`
2. `RECAPTCHA_SECRET_KEY` + optional `RECAPTCHA_MIN_SCORE` on Nest
3. `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`
4. `GOOGLE_MAPS_API_KEY` / `GOOGLE_MAPS_SERVER_KEY`
5. `JWT_SECRET`, `DATABASE_URL` or `DB_*`, `CORS_ORIGINS`, `gb-api-base` meta on storefront

## Files touched (high level)

- Backend: `recaptcha.service.ts`, `razorpay.service.ts`, `auth.controller.ts`, `dto.ts`, `guards.ts`, `main.ts`, `app.module.ts`, `pricing.controller.ts`, env examples
- Storefront: `recaptcha.js`, `api-client.js`, `auth-modal.js`, `checkout.js`, `main.js`, `state.js`, `i18n.js`, `admin-portal.js`, hero/navbar/head/javascript-modules, tokens/base/ops-console CSS
- Next: `apps/web/src/lib/translations.ts`
- Docs: this report
