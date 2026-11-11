# GURUKRIPA BRICKS INDUSTRY — PHOTOGRAPHY & SHOT LIST

This document catalogs repository imagery, visual quality assessments, scaling status, and recommendations for replacement or reshoots.

---

## Existing Repo Imagery Audit

| File Path | Dimensions | File Size | Usage | Quality Assessment & Notes |
|:---|:---|:---|:---|:---|
| `src/assets/images/redbrick1.jpg` | 1920×1080 | 1,068 KB | Hero Banner (`hero-1200.jpg`, `hero-1600.jpg`) | **Sharp.** Genuine kiln stack photo. High natural resolution. Scaled down cleanly via bicubic downsampling to 1600w, 1200w, 768w, 480w. |
| `src/assets/images/hero-banner.png` | 1200×675 | 870 KB | Hero fallback | **Moderate.** Slightly soft when viewed on high-DPI displays above 1440px wide. |
| `src/assets/images/brick_product_1.png` | 800×600 | 635 KB | Product 1 (Awwal Bricks) | **Good.** Transparent cut-out of individual brick sample. Clear edge definition. |
| `src/assets/images/brick_product_2.png` | 800×600 | 703 KB | Product 2 (Laal Peti / Premium) | **Good.** Authentic clay texture visible. |
| `src/assets/images/brick_product_3.png` | 800×600 | 655 KB | Product 3 (Shiv Eent Grade-A) | **Good.** Close-up featuring kiln stamp imprint. |
| `src/assets/images/trolley_brick.png` | 1024×768 | 1,086 KB | Trolley order hero / Estimator | **Good.** Authentic tractor-trolley load (4,000 bricks). |
| `src/assets/images/redbricks.jpg` | 640×480 | 78 KB | Standard bricks thumbnail | **Soft / Low Resolution.** Natural width is only 640px. Acceptable on mobile cards up to 320px width, but shows slight interpolation artifacting if expanded to desktop detail views. |
| `src/assets/images/jaunpurPul.jpg` | 500×375 | 38 KB | Cities delivery (Jaunpur landmark) | **Soft.** Legacy photo of Shahi Bridge. Recompressed multiple times. |
| `src/assets/images/jalalpur.jpg` | 640×480 | 98 KB | Delivery coverage (Jalalpur) | **Moderate.** Sufficient for thumbnail display. |
| `src/assets/images/trilochan.jpg` | 800×600 | 130 KB | Delivery coverage (Trilochan) | **Good.** Natural resolution adequate for small landmark cards. |

---

## Priority Reshoot & Replacement List

1. **Standard Red Clay Brick (Single Sample Close-up)**
   - *Target File:* `src/assets/images/redbricks.jpg`
   - *Desired Spec:* 1600×1200px or higher, RAW/lossless PNG, photographed under natural daylight against neutral background.
   - *Reason:* Current 640×480 JPEG exhibits softness when viewed in full-screen modal comparisons.

2. **Kiln Stack with High-Contrast SHIV Imprint**
   - *Target File:* Dedicated hero inset card
   - *Desired Spec:* 1200×900px macro close-up of the "SHIV" kiln manufacturer stamp pressed into freshly baked Grade-A brick.
   - *Reason:* Allows dual-composition hero display (wide kiln yard panorama + crisp macro stamp badge).

3. **Jaunpur District Landmark / Transit Photography**
   - *Target File:* `src/assets/images/jaunpurPul.jpg`
   - *Desired Spec:* 1200×800px modern landscape photo of Jaunpur Shahi Pul or highway transit route.
   - *Reason:* Replace legacy 38 KB thumbnail with high-contrast, modern landmark imagery matching the premium brand palette.
