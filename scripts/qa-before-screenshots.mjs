/**
 * Phase 0 — capture before screenshots into qa/before/
 * Dev-only; not shipped. Requires: npx playwright
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'qa', 'before');
fs.mkdirSync(outDir, { recursive: true });

const BASE = process.env.QA_BASE || 'http://127.0.0.1:4173';
const VIEWPORTS = [
  { w: 360, h: 740, mobile: true },
  { w: 350, h: 740, mobile: true },
  { w: 768, h: 1024, mobile: true },
  { w: 770, h: 900, mobile: false },
  { w: 890, h: 900, mobile: false },
  { w: 1024, h: 768, mobile: false },
  { w: 1366, h: 768, mobile: false },
];

const SCREENS = [
  { name: 'home', hash: '#home' },
  { name: 'products', hash: '#products' },
  { name: 'calculator', hash: '#calculator' },
  { name: 'nearby', hash: '#nearby-bhatta' },
  { name: 'contact', hash: '#contact' },
  { name: 'footer', hash: '#siteFooter', scrollFooter: true },
];

async function shot(page, file) {
  const dest = path.join(outDir, file);
  await page.screenshot({ path: dest, fullPage: false });
  console.log('wrote', path.relative(root, dest));
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
});
const page = await context.newPage();

for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.w, height: vp.h });
  for (const screen of SCREENS) {
    await page.goto(`${BASE}/${screen.hash}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(600);
    // Close any boot-open overlays if present
    await page.evaluate(() => {
      document.querySelectorAll('.modal-overlay.open, .cart-drawer.open, .wishlist-drawer.open, .drawer.open').forEach((el) => {
        el.classList.remove('open');
      });
      document.body.classList.remove('overlay-open', 'drawer-open');
    });
    if (screen.scrollFooter) {
      await page.evaluate(() => {
        const el = document.getElementById('siteFooter');
        if (el) el.scrollIntoView({ block: 'start' });
      });
      await page.waitForTimeout(200);
    }
    await shot(page, `${vp.w}-${screen.name}.png`);
  }
}

// Known defect widths: hero-focused
for (const w of [770, 890]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(`${BASE}/#home`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await shot(page, `${w}-hero-focus.png`);
}

await browser.close();
console.log('done');
