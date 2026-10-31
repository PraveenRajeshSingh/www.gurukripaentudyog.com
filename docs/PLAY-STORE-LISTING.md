# Play Store Listing — Gurukripa Bricks Industry

Copy-ready metadata for the first Play Console release (`versionName 1.0.0`,
`versionCode 10`). Character counts are included because Play truncates
silently — a 31-character title is simply rejected at upload.

**Package:** `com.gurukripa.bricks` · **Privacy policy:** <https://www.gurukripaentudyog.com/privacy.html>

---

## 1. Store listing copy

### App name (max 30)

```
Gurukripa Bricks Jaunpur
```

24 characters. Brand first, city keyword second — "Jaunpur" is the highest
intent search term for this business.

Alternates if the ranking test does not favour it:

| Title | Chars | Note |
|---|---|---|
| `Gurukripa Bricks Industry` | 25 | Pure brand; safest if trademark confusion is a concern. |
| `Gurukripa Bricks – Jaunpur` | 26 | Adds a visual separator. |
| `Gurukripa Bricks Rate & Order` | 30 | Feature-led, but dilutes the brand. |

### Short description (max 80)

```
Grade-A bricks, kiln-direct rates & instant wall estimator. Jaunpur–Varanasi.
```

77 characters. Leads with the three deciding factors for a builder — quality
grade, price channel, and the estimator — then names the service area.

### Full description (max 4000)

```
Gurukripa Bricks Industry (गुरुकृपा ईंट उद्योग) — building Jaunpur since 1998.

Order Grade-A red clay bricks straight from our bhatta on the Jaunpur–Varanasi
highway, with trolley delivery, transparent kiln-direct rates and no broker
margin in between. This is not a reseller listing: the rate you see is the rate
at the yard that fires the brick.

━━━ WHY BUILDERS ORDER FROM US ━━━

• KILN-DIRECT PRICING — one rate card, updated from the yard, for wholesale red
  bricks by the piece or by the trolley.
• GRADE-A BRICKS — double-kiln fired, sharp edges, clear ringing sound, low
  water absorption, compliant with IS:1077 common burnt clay bricks.
• INSTANT WALL ESTIMATOR — enter wall length, height and thickness and get
  bricks, trolley loads, cement bags, sand volume and total budget in one tap.
  Full-house and boundary-wall estimators are built in too.
• TROLLEY DELIVERY — our own tractor-trolley fleet, 4,000 bricks per load,
  same-day dispatch inside Jaunpur district for orders confirmed before noon.
• ORDER ON WHATSAPP — your cart, wall dimensions, delivery pincode and payment
  preference go out as one formatted WhatsApp message. No form to re-type.

━━━ BUILT FOR REAL SITES ━━━

• WORKS OFFLINE — the app keeps your downloaded rate card and saved estimates
  on the phone, so a plot with no signal is still a plot you can quote.
• SITE INSPECTION PHOTOS — capture the access road or unloading point and
  attach it to your order so the right trolley is assigned first time.
• ORDER TRACKING — token created, loading at the yard, trolley dispatched,
  bricks unloaded. Push alerts when your load leaves the kiln.
• RATE DROP ALERTS — get notified when wholesale brick rates fall, instead of
  calling the yard to ask.
• HINDI & ENGLISH — full interface in both languages.

━━━ ASK FOR IT IN YOUR OWN WORDS ━━━

If you search for eent bhatta Jaunpur, it bhatta rate today, red brick wholesale
rate Varanasi, construction material calculator, brick quantity calculator for
wall, trolley bhori bricks, or Grade A eent ka rate — this is the app to install.

Serving Jaunpur, Jalalpur, Shahganj, Mariahu, Machhlishahr, Kerakat, Badlapur,
Varanasi, Azamgarh, Ghazipur and the wider Purvanchal region.

━━━ NEED A BULK QUOTE? ━━━

Whole-building, boundary wall, factory shed or contractor supply? Send your
requirement on WhatsApp from inside the app — the estimator already knows the
square footage you are building.

Gurukripa Bricks Industry · Jaunpur, Uttar Pradesh · Grade-A eent, direct from
the kiln, delivered by trolley.
```

Roughly 2,600 characters — well inside 4,000.

### Release notes / What's new (max 500)

```
v1.0.0 — first release.

• Order Grade-A bricks direct from our Jaunpur yard
• 3-in-1 estimator: wall, full house, boundary wall
• Works offline: saved estimates + downloadable rate card
• Order on WhatsApp with cart, dimensions and pincode pre-filled
• Order status and rate-drop alerts
• Attach site inspection photos for quicker trolley dispatch
• Hindi and English interface
```

---

## 2. Keyword placement map

Play has no keyword field (unlike the App Store), so terms must appear inside
the copy. Each high-value term is used at least twice without stuffing:

| Keyword | Where it appears |
|---|---|
| `Eent bhatta Jaunpur` / `इंट भट्टा` | Full description body + brand line |
| `wholesale red bricks` | Bullet 1 |
| `construction material calculator` | "Ask for it in your own words" block |
| `brick quantity calculator for wall` | Same block |
| `trolley delivery` / `trolley bhori bricks` | Bullet 5 + keyword block |
| `Grade A bricks` / `ISI` | Bullet 2 |
| `brick rate today` | Keyword block |
| `Varanasi` | Title of short description, service-area line |

Do not repeat a phrase more than three times — Play's spam heuristic penalises
repetition more than it rewards density.

---

## 3. Graphic assets

| Asset | Spec | Status |
|---|---|---|
| App icon | 512 × 512 PNG, no transparency, 32-bit | ⬜ Generate from `src/assets/images/gurukripaLogo.jpg` |
| Feature graphic | 1024 × 500 PNG/JPEG | ⬜ Brand + yard photo, no text smaller than ~60 px |
| Phone screenshots | 2–8, 16:9 or 9:16, 1080 × 1920 recommended | ⬜ See shot list below |
| 7" tablet screenshots | 1–8 | Optional |
| 10" tablet screenshots | 1–8 | Optional |
| Promo video | YouTube URL | Optional |

### Screenshot shot list (capture at 1080 × 1920)

1. **Home** — hero with "Grade-A bricks, kiln-direct" and the nav bar visible.
2. **Estimator** — filled wall calculation showing bricks, trolleys and budget.
3. **Cart + WhatsApp** — cart with the green order button visible.
4. **Offline mode** — rate card open with the offline chip showing.
5. **Track orders** — status timeline at "Trolley dispatched".
6. **Site photo** — checkout step with the captured inspection photo.
7. **Alert centre** — order + rate-drop toggles enabled.

Rule of thumb for the first two shots: they are the only ones most users see in
search results, so they must show the estimator result and the price, not a
login or a splash screen.

---

## 4. Console setup checklist

1. **Create app** — Play Console → All apps → Create app; name
   `Gurukripa Bricks Industry`, default language `English (India)`, type `App`,
   `Free`.
2. **Dashboard tasks** — work top to bottom; every card must show a green tick
   before the release can be submitted.
3. **App access** — the app needs no login. Choose *All functionality is
   available without special access* and note that ordering continues on
   WhatsApp.
4. **Ads** — declare **No ads**. The app ships no ad SDK.
5. **Content rating** — questionnaire: category *Utility / Productivity /
   Communication*, no violence, no user-generated content, no data sharing,
   no gambling. Expect *Rated for 3+*.
6. **Target audience** — 18+ (business tool). Answering "under 13" pulls the app
   into Families policy compliance for no benefit.
7. **News app** — No.
8. **Data safety** — declare exactly what the app does:

   | Question | Answer |
   |---|---|
   | Does your app collect or share user data? | **Yes** |
   | Data types | *Personal info → Name, Phone number, Address*; *Photos → Photos* |
   | Collected or shared | **Shared** (only when the user taps Order on WhatsApp) |
   | Purpose | App functionality (order fulfilment) |
   | Optional or required | Required for ordering; photos optional |
   | Encrypted in transit | Yes (WhatsApp / HTTPS) |
   | Users can request deletion | Yes — phone number in the privacy policy |
   | Data sold to third parties | No |

   The cart, estimates and photos that stay in device storage are **not**
   "collected" in Play's sense — data is only collected when it leaves the
   device. Say so in the review notes if asked.

9. **Privacy policy URL** — `https://www.gurukripaentudyog.com/privacy.html`
   (deployed from `privacy.html` in the repo root).
10. **Government apps / financial features** — No to both.
11. **Store settings** — category *Shopping*, tags *Construction*, *Home
    improvement*; contact email `info@gurukripaentudyog.com`, phone
    `+91 91989 23230`, website `https://www.gurukripaentudyog.com`.

---

## 5. Release

1. **Set up App Signing** — Play Console → Setup → App signing. Let Google
   manage the app-signing key; keep your upload key offline.
2. **Copy the app-signing SHA-256** and publish it:
   `npm run assetlinks -- --fingerprint=<play-signing-fp>`
   then commit `.well-known/assetlinks.json` and deploy. Without this the app
   launches with a browser URL bar.
3. **Build the bundle** — `cd android && ./gradlew bundleRelease`
   → `android/app/build/outputs/bundle/release/app-release.aab`
   (full detail in [ANDROID-PACKAGING.md](./ANDROID-PACKAGING.md)).
4. **Create release** — Testing → Internal testing first. Add your own Gmail as
   a tester, install from the opt-in link, and smoke-test on a real phone.
5. **Promote** — Internal → Closed → Production. Production review for a new
   app typically takes a few days; the first submission also requires the
   *App content* section to be fully green.
6. **Bump versions for every later upload** — `versionCode` in
   `android/app/build.gradle` must increase; reuse is rejected.

### Pre-submission self-check

- [ ] `node scripts/assetlinks.js --check` passes (no placeholder fingerprints)
- [ ] `npm test` passes
- [ ] `npm run www` was run after the last source edit, and `npx cap sync android`
- [ ] Offline flow tested in airplane mode
- [ ] WhatsApp hand-off produces a complete message (cart + estimator + pincode + payment)
- [ ] Camera permission prompt appears once, photo lands on the order
- [ ] Notification permission prompt appears from the bell icon
- [ ] Privacy policy URL loads over HTTPS
- [ ] Icon and feature graphic contain no third-party trademarks

---

## 6. Post-launch copy bank

Small updates that keep the listing alive between feature releases. Rotate the
short description quarterly; Play treats listing freshness as a light ranking
signal.

**Short description variants (≤80):**

```
Grade-A bricks, kiln-direct rates & instant wall estimator. Jaunpur–Varanasi.
Eent bhatta rate today, wall estimator & trolley delivery. Jaunpur–Varanasi.
Wholesale red bricks direct from the kiln. Estimate, order, track — offline too.
```

**What's new template for patch releases:**

```
v1.0.x — fixes.

• Faster estimator on low-end phones
• Rate card downloads reliably on weak networks
• Order status alerts open the correct order
```
