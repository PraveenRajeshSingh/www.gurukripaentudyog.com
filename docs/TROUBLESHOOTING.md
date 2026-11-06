# Troubleshooting

## Web / GitHub Pages

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Site not updating after merge | Actions failed / Pages cache | Check `deploy.yml` run; hard-refresh; wait for CDN |
| Blank page after deploy | `www/` incomplete | Run `npm run www` locally; confirm `www/index.html` |
| CSS looks unstyled | Asset path / cache | Confirm `prepare-www.js` staged `src/styles` correctly |
| Service worker sticky | Old `sw.js` | Bump cache version in `sw.js` if you change assets |

## Next.js (`apps/web`)

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Login / enquiry 503 | `BACKEND_API_URL` unset | Set in `.env.local` / Vercel env |
| CORS errors in browser to Nest | Origin not allow-listed | Add exact origin to `CORS_ORIGINS` |
| `next/font` Google fetch fails | Network blocked at build | Use CSS `<link>` fonts (current layout approach) |
| Build fails on types | Stale contracts | `npm run build:contracts` then rebuild |

## Backend

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Exits immediately in production | Missing `JWT_SECRET` | Set secret; restart |
| `/health` connection refused | Process down / wrong port | Check `PORT`, firewall, Compose logs |
| DB connection errors | Bad `DATABASE_URL` | Verify host, SSL mode, credentials |
| Migrations no-op / fail | Dist not built / SQL error | `npm run build` then `npm run migrate`; read SQL error |

```bash
cd backend
npm run build
node dist/src/main.js
curl -v http://127.0.0.1:3000/health
```

## Docker Compose

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Postgres unhealthy | Password/volume clash | `docker compose logs postgres`; reset volume only if disposable |
| Backend can't resolve `postgres` | Not on Compose network | Use service name `postgres` inside Compose; `127.0.0.1` from host |
| Healthcheck fails on Alpine node fetch | Image without fetch | Inspect logs; wait `start_period` |

## Android (Capacitor)

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Old UI in APK | Forgot `npm run www` / sync | Re-run `www` + `npx cap sync android` |
| Cleartext blocked | HTTP API | Use HTTPS; keep `allowMixedContent: false` |
| Camera denied | Permission | Grant at runtime; check Manifest |

## Android (Compose `apps/android`)

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Gradle fail | JDK ≠ 17 | Set JDK 17 |
| Unsigned AAB rejected by Play | Expected for CI artifact | Sign locally with upload keystore |

## iOS

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Signing error | No team / expired profile | Xcode → Signing & Capabilities |
| Rejected for missing usage string | New plugin without Info.plist key | Add accurate purpose string |
| Stale WebView | No sync | `npm run www && npx cap sync ios` |

## DNS / SSL

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Domain not resolving | DNS TTL / wrong CNAME | Check registrar; wait propagation |
| Mixed content | API on HTTP | Serve API on HTTPS |

## Payments / Maps

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Razorpay fails | Test vs live keys / webhook secret | Match mode; verify webhook signature server-side |
| Maps blank | Key restriction / billing | Enable APIs; allow referrer |
