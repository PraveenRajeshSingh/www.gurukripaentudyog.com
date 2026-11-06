# Web Deployment

## Authoritative production host

**GitHub Pages** serves `https://www.gurukripaentudyog.com` from the **legacy** `www/` bundle.

Workflow: `.github/workflows/deploy.yml`  
Build: `node scripts/build.js && node scripts/prepare-www.js` (`npm run www`)

Vercel is **not** production for the apex domain. See `docs/DEPLOYMENT.md`.

---

## 1. Legacy static PWA (production)

### Prerequisites

- Node 20+
- Push access to `main` (or ability to run `workflow_dispatch`)

### Build locally

```bash
npm ci
npm run www
```

**Expected:** `./www/index.html` exists; `prepare-www.js` prints staged file count.

### What gets published

Only the contents of `www/` (no `android/`, `backend/`, `docs/`, raw `src/pages` partials).

### Headers / caching

Root `vercel.json` documents header intent for static hosting experiments. GitHub Pages uses repository Pages settings; deep-link files live in `.well-known/`.

### Custom domain

1. GitHub → Settings → Pages → Custom domain → `www.gurukripaentudyog.com`
2. DNS CNAME `www` → `YOUR_ORG.github.io` (or Pages instructions for your account)
3. Enforce HTTPS in Pages settings

### Verification

```bash
curl -I https://www.gurukripaentudyog.com/
curl -I https://www.gurukripaentudyog.com/sw.js
```

SPA-style deep links are mostly hash/overlay based on the legacy site; `404.html` / `500.html` exist at repo root for error chrome.

---

## 2. Next.js app (`apps/web`) — CI + optional preview

### Local production build

```bash
cp apps/web/.env.example apps/web/.env.local
# Set BACKEND_API_URL=http://127.0.0.1:3000
npm run build:web
npm run start:web
```

### Environment

| Variable | Scope | Purpose |
| --- | --- | --- |
| `BACKEND_API_URL` | Server only | NestJS base URL for `/api/*` proxies |
| `NEXT_PUBLIC_ANALYTICS_ID` | Optional public | Enables analytics consent path when set |

Missing `BACKEND_API_URL` → proxies return **503** with an honest message (no fake data).

### Optional Vercel preview

1. Import repo in Vercel
2. **Root Directory** = `apps/web`
3. Set `BACKEND_API_URL` for Production/Preview
4. Deploy — **do not** point `www.gurukripaentudyog.com` here until GitHub Pages `deploy.yml` is retired

Config: `apps/web/vercel.json` (security headers including HSTS).

### Cutover to Next.js on the apex (future)

Documented in `docs/DEPLOYMENT.md` — requires DNS change, Pages retire, and re-issue of `.well-known` asset links for native shells.

---

## 3. CI verification

`.github/workflows/web-ci-deploy.yml` on every PR/push to `main`:

1. `npm ci`
2. `npm run build:contracts` + `test:contracts`
3. `npm run test:web`
4. `npm test` (legacy)
5. `npm run www`
6. `npm run build:web`

No auto-deploy of Next.js from this workflow.
