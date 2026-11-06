# Environment Configuration

Placeholder files only. Real secrets belong in local files (gitignored), host secret stores, or CI encrypted secrets.

---

## File map

| File | Purpose |
| --- | --- |
| `.env.example` | Root Maps / Razorpay / kiln HQ placeholders |
| `.env.development.example` | Dev-oriented copy of root placeholders |
| `.env.production.example` | Production-oriented placeholders + Docker hints |
| `backend/.env.example` | NestJS + Postgres + JWT + CORS |
| `apps/web/.env.example` | Next.js `BACKEND_API_URL` (server-only) |

Copy examples to `.env` / `.env.local` as needed. Those real files must remain untracked.

---

## Backend (`backend/.env`)

| Variable | Required | Notes |
| --- | --- | --- |
| `PORT` | No (default 3000) | HTTP listen port |
| `NODE_ENV` | Prod: `production` | Enables JWT hard-fail |
| `DATABASE_URL` or `DB_*` | Prod recommended | Postgres connection |
| `JWT_SECRET` | **Required in production** | Process exits if missing when `NODE_ENV=production` |
| `JWT_EXPIRATION` | No | Default `12h` |
| `CORS_ORIGINS` | Yes for browsers | Comma-separated exact origins |
| `BOOTSTRAP_ADMIN_*` | Optional | First admin seed — remove after use |
| `PUSH_WEBHOOK_*` | Optional | Push relay |
| `RAZORPAY_*` | Optional until payments | Never expose secret to frontend |

---

## Next.js (`apps/web/.env.local`)

| Variable | Client visible? | Notes |
| --- | --- | --- |
| `BACKEND_API_URL` | **No** | Nest base URL for server proxies |
| `NEXT_PUBLIC_ANALYTICS_ID` | Yes | Optional |
| `NEXT_PUBLIC_SITE_URL` | Yes | Optional metadata override |

Unset `BACKEND_API_URL` → `/api/login`, `/api/me/*`, `/api/enquiries` return **503**.

---

## Root / static PWA tooling

Used by Maps / payment integrations in the legacy client when wired:

- `GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_SERVER_KEY`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `BHATTA_LAT`, `BHATTA_LNG`, `DELIVERY_*`
- `WHATSAPP_BUSINESS_PHONE`, `SUPPORT_EMAIL`

Browser keys must be HTTP-referrer restricted in Google Cloud.

---

## Docker Compose

Compose reads optional env for `POSTGRES_*`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, `BACKEND_PORT`. Defaults are **local-dev-only** strings — replace before any shared deployment.

---

## Startup validation behaviour

| Component | Behaviour |
| --- | --- |
| NestJS production | Fails closed without `JWT_SECRET` |
| NestJS production | Warns if no `DATABASE_URL` / `DB_HOST` |
| Next.js proxies | Honest 503 if backend URL missing |
| Legacy PWA | Client features degrade when keys missing (no invented payments) |

---

## Vercel / CI secrets (optional)

For a Next.js **preview** project only:

- `BACKEND_API_URL`

GitHub Pages deploy needs **no** API secrets (static bundle).

Android signing (Compose CI does not sign): store keystore passwords as GitHub Actions secrets if you add a signing job later — never as plaintext in YAML.
