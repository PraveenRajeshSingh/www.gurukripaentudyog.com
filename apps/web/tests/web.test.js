const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Next.js Web Application File & Route Verification', () => {
  const webSrc = path.join(__dirname, '..', 'src');

  it('Root layout, homepage, and core pages exist', () => {
    assert.ok(fs.existsSync(path.join(webSrc, 'app', 'layout.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'app', 'page.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'app', 'products', 'page.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'app', 'about', 'page.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'app', 'services', 'page.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'app', 'contact', 'page.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'app', 'tracker', 'page.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'app', 'profile', 'page.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'app', 'privacy', 'page.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'app', 'terms', 'page.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'app', 'sitemap.ts')));
    assert.ok(fs.existsSync(path.join(webSrc, 'app', 'robots.ts')));
    assert.ok(fs.existsSync(path.join(webSrc, 'app', 'not-found.tsx')));
  });

  it('All interactive feature components exist', () => {
    assert.ok(fs.existsSync(path.join(webSrc, 'features', 'EstimatorStudio.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'features', 'CartDrawer.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'features', 'OrderTracker.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'components', 'layout', 'Navbar.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'components', 'layout', 'Footer.tsx')));
    assert.ok(fs.existsSync(path.join(webSrc, 'components', 'ui', 'Modal.tsx')));
  });

  it('Public assets & manifest exist', () => {
    const pub = path.join(__dirname, '..', 'public');
    assert.ok(fs.existsSync(path.join(pub, 'manifest.webmanifest')));
    assert.ok(fs.existsSync(path.join(pub, 'images')));
  });
});
