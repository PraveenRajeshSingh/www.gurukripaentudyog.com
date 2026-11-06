# Production Launch Checklist

Use this gate before calling a release “live.” Check boxes only when verified.

---

## A. Secrets & config

- [ ] No real secrets committed; `.env*` examples contain placeholders only
- [ ] Production `JWT_SECRET` set (≥ 32 random bytes)
- [ ] Production `DATABASE_URL` uses TLS and a non-superuser role
- [ ] `CORS_ORIGINS` lists only real frontend origins
- [ ] Razorpay / Maps keys restricted; live payment keys only after test mode
- [ ] Android upload keystore backed up offline; not in git
- [ ] Apple distribution cert / profiles managed in developer account only

---

## B. Database

- [ ] Staging DB migrated successfully with `001` + `002`
- [ ] Production migration plan reviewed
- [ ] Backup taken before migrate
- [ ] Restore drill performed on staging
- [ ] App role can read/write required tables only

---

## C. Backend API

- [ ] `NODE_ENV=production`
- [ ] Process starts; `/health` returns `ok: true`
- [ ] HTTPS terminated (reverse proxy / LB)
- [ ] Auth login/register smoke tested
- [ ] Rate limits observed under light load
- [ ] Logs do not print passwords or full JWTs

---

## D. Web

- [ ] `npm run www` succeeds
- [ ] GitHub Pages serves current `www/`
- [ ] `https://www.gurukripaentudyog.com` loads over HTTPS
- [ ] Estimator, catalog, contact, cart WhatsApp flow manually checked
- [ ] If Next.js preview used: `BACKEND_API_URL` set; apex still Pages until cutover

---

## E. Android

- [ ] Chosen package ID registered in Play Console
- [ ] Signed AAB uploaded to internal track
- [ ] Data safety + privacy policy complete
- [ ] Device install smoke test (phone + tablet)
- [ ] Deep links / assetlinks validated if used

---

## F. iOS

- [ ] Bundle ID registered in App Store Connect
- [ ] Archive uploaded; TestFlight install OK
- [ ] Privacy nutrition labels accurate
- [ ] Permission strings match actual features
- [ ] iPhone + iPad smoke test

---

## G. Monitoring

- [ ] Uptime check on `/health` and homepage
- [ ] Error log destination known
- [ ] On-call contact for kiln ops documented
- [ ] Rollback owner named

---

## H. Business honesty

- [ ] No mock orders presented as real kiln orders
- [ ] WhatsApp checkout clearly does not charge cards in-app
- [ ] Tracker does not show fabricated GPS points
