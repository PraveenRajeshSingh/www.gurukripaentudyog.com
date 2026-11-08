# SHOT_LIST — Product photos still needed

Do **not** recolor or fake-background existing navy studio renders. Present them on the warm CSS backdrop (`#F3ECE4`) until real daylight shots replace them.

## How to shoot (phone)

1. Daylight, no flash — cloudy-bright or soft morning sun.
2. Stand slightly above (~15–30°).
3. Neutral wall, tarp, or swept yard behind the stack.
4. Keep framing consistent across SKUs (front stack + texture close-up).
5. Export target: **1200×900** (4:3) JPEG, then we generate 240/360/480/720 widths.

## Per product (catalogue)

| Product / category | Needs new photo? | Shots | Target |
|---|---|---|---|
| Shiv Eent Grade-A | **Yes** — current PNG looks navy/studio | Front stack + texture close-up | 1200×900 |
| Awwal ईंट | **Yes** | Front stack + hand for scale | 1200×900 |
| Laal Peti | **Yes** | Front stack + single brick | 1200×900 |
| Premium Red / First Class | **Yes** | Front stack + texture | 1200×900 |
| Machine Wirecut | **Yes** | Edge detail + stack | 1200×900 |
| Standard / Hollow | **Yes** | Stack + hollow opening detail | 1200×900 |

## Extra yard shots (gallery / hero)

| Shot | Use | Target |
|---|---|---|
| Yard entrance | Hero / OG alternate | 16:9 @ 1200×675 |
| Kiln chamber (safe distance) | About / gallery | 16:9 @ 1200×675 |
| Loaded trolley | Trust / trolley chip context | 4:3 @ 1200×900 |

## Already optimized (interim)

`src/assets/images/optimized/product-*-{320,480,768}.jpg` — compressed from existing assets for card budgets (&lt;40 KB @480w where possible). Replace sources when new photos arrive, then re-run `scripts/optimize-images.ps1`.
