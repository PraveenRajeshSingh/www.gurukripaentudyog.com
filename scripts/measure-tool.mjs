import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const VIEWPORTS = [
  { w: 360, h: 740, mobile: true },
  { w: 768, h: 1024, mobile: true },
  { w: 1024, h: 768, mobile: false },
  { w: 1366, h: 768, mobile: false },
  { w: 1920, h: 1080, mobile: false },
];

const SECTIONS = [
  { id: 'header', selector: 'header.nav' },
  { id: 'home', selector: '#home' },
  { id: 'ticker', selector: '.trust-strip' },
  { id: 'categories', selector: '#categories' },
  { id: 'price-list', selector: '#price-list' },
  { id: 'products', selector: '#products' },
  { id: 'calculator', selector: '#calculator' },
  { id: 'about', selector: '#about' },
  { id: 'gallery', selector: '#gallery' },
  { id: 'testimonials', selector: '#testimonials' },
  { id: 'cta-banner', selector: '.cta-banner' },
  { id: 'cities', selector: '#cities' },
  { id: 'nearby-bhatta', selector: '#nearby-bhatta' },
  { id: 'faq', selector: '#faq' },
  { id: 'contact', selector: '#contact' },
  { id: 'footer', selector: '#siteFooter' }
];

function startServer(port = 4173) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0].replace(/^\/+/, '');
      if (!reqPath || reqPath === 'www.gurukripaentudyog.com') reqPath = 'index.html';
      if (reqPath.startsWith('www.gurukripaentudyog.com/')) reqPath = reqPath.slice('www.gurukripaentudyog.com/'.length);
      const filePath = path.join(ROOT, reqPath);
      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        return res.end('Not found: ' + reqPath);
      }
      const ext = path.extname(filePath);
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2'
      };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(port, () => resolve(server));
  });
}

async function runMeasurements(mode = 'before') {
  const serverPort = 4173 + Math.floor(Math.random() * 50);
  const server = await startServer(serverPort);
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.env.TEMP, `ch_measure_${Date.now()}`);
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check'
  ]);

  const wsUrl = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Timeout waiting for Chrome stderr: ' + output)), 12000);
    chrome.stderr.on('data', (d) => {
      output += d.toString();
      const m = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1].trim());
      }
    });
  });

  const wsHost = new URL(wsUrl).host;
  console.log(`Connected to Chrome DevTools on ${wsHost}`);

  const browserWs = new WebSocket(wsUrl);
  await new Promise((r) => (browserWs.onopen = r));

  let bId = 1;
  const bCb = new Map();
  browserWs.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && bCb.has(d.id)) {
      bCb.get(d.id)(d);
      bCb.delete(d.id);
    }
  };
  function bSend(method, params = {}) {
    return new Promise((res) => {
      const mid = bId++;
      bCb.set(mid, res);
      browserWs.send(JSON.stringify({ id: mid, method, params }));
    });
  }

  const outDir = path.join(ROOT, 'qa', mode);
  fs.mkdirSync(outDir, { recursive: true });

  const measurements = {};

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n=== Measuring Viewport ${vp.w}x${vp.h} (${vp.mobile ? 'Mobile' : 'Desktop'}) ===`);
      measurements[vp.w] = {};

      const target = await bSend('Target.createTarget', { url: 'about:blank' });
      const targetId = target.result.targetId;
      const pageWs = new WebSocket(`ws://${wsHost}/devtools/page/${targetId}`);
      await new Promise((r) => (pageWs.onopen = r));

      let pId = 1;
      const pCb = new Map();
      pageWs.onmessage = (m) => {
        const d = JSON.parse(m.data);
        if (d.id && pCb.has(d.id)) {
          pCb.get(d.id)(d);
          pCb.delete(d.id);
        }
      };
      function pSend(method, params = {}) {
        return new Promise((res) => {
          const mid = pId++;
          pCb.set(mid, res);
          pageWs.send(JSON.stringify({ id: mid, method, params }));
        });
      }

      await pSend('Page.enable');
      await pSend('Runtime.enable');
      await pSend('DOM.enable');

      await pSend('Emulation.setDeviceMetricsOverride', {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });

      await pSend('Page.navigate', { url: `http://127.0.0.1:${serverPort}/index.html` });
      await new Promise((r) => setTimeout(r, 2000));

      // Close open drawers/modals
      await pSend('Runtime.evaluate', {
        expression: `(() => {
          document.querySelectorAll('.modal-overlay.open, .cart-drawer.open, .wishlist-drawer.open, .drawer.open').forEach(el => el.classList.remove('open'));
          document.body.classList.remove('overlay-open', 'drawer-open');
        })()`
      });

      // Capture top viewport screenshot
      try {
        const vpShot = await pSend('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        if (vpShot?.result?.data) {
          fs.writeFileSync(path.join(outDir, `${vp.w}-viewport.png`), Buffer.from(vpShot.result.data, 'base64'));
        }
      } catch (err) {
        console.warn('VP screenshot err:', err.message);
      }

      // Check horizontal overflow
      const overflowRes = await pSend('Runtime.evaluate', {
        returnByValue: true,
        expression: `(() => {
          const vw = window.innerWidth;
          const offenders = [];
          document.querySelectorAll('body *').forEach(el => {
            if (el.closest('.trust-strip') || el.closest('#trustTrack') || el.classList.contains('trust-track') || el.closest('.cart-drawer') || el.closest('.wishlist-drawer') || el.closest('.drawer') || el.closest('.modal-overlay')) return;
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.right > vw + 1) {
              offenders.push({
                tag: el.tagName.toLowerCase(),
                id: el.id || '',
                class: (el.className && typeof el.className === 'string') ? el.className.slice(0, 40) : '',
                right: Math.round(r.right),
                overflow: Math.round(r.right - vw)
              });
            }
          });
          return offenders.slice(0, 10);
        })()`
      });
      measurements[vp.w]._overflows = overflowRes?.result?.result?.value || [];

      // Check empty blocks
      const emptyRes = await pSend('Runtime.evaluate', {
        returnByValue: true,
        expression: `(() => {
          const blocks = [];
          document.querySelectorAll('section, main > div, footer, .container, .sec').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.height >= 80) {
              const text = (el.innerText || '').trim();
              const media = el.querySelectorAll('img, svg, video, iframe, canvas').length;
              if (text.length === 0 && media === 0) {
                blocks.push({
                  selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : (el.className ? '.' + String(el.className).split(' ')[0] : '')),
                  height: Math.round(r.height),
                  width: Math.round(r.width)
                });
              }
            }
          });
          const mainStyle = window.getComputedStyle(document.getElementById('main-content') || document.body);
          return {
            blocks,
            mainPaddingBottom: mainStyle.paddingBottom,
            bodyPaddingBottom: window.getComputedStyle(document.body).paddingBottom
          };
        })()`
      });
      measurements[vp.w]._emptyBlocks = emptyRes?.result?.result?.value;

      // Measure each section
      for (const sec of SECTIONS) {
        const secRes = await pSend('Runtime.evaluate', {
          returnByValue: true,
          expression: `(() => {
            const el = document.querySelector('${sec.selector}');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            const cs = window.getComputedStyle(el);

            const container = el.querySelector('.container, .footer-studio__container, .hero-premium__grid') || (el.classList.contains('container') ? el : null);
            let cLeft = null, cRight = null, cWidth = null;
            if (container) {
              const cr = container.getBoundingClientRect();
              cLeft = Math.round(cr.left);
              cRight = Math.round(cr.right);
              cWidth = Math.round(cr.width);
            }

            const heading = el.querySelector('.text-center, .sec-title, h1, h2, .footer-brand-title');
            let hHeight = 0, hGap = 0;
            if (heading) {
              const hr = heading.getBoundingClientRect();
              hHeight = Math.round(hr.height);
              const next = heading.nextElementSibling;
              if (next) {
                const nr = next.getBoundingClientRect();
                hGap = Math.round(nr.top - hr.bottom);
              }
            }

            return {
              height: Math.round(r.height),
              paddingTop: cs.paddingTop,
              paddingBottom: cs.paddingBottom,
              hHeight,
              hGap,
              cLeft,
              cRight,
              cWidth,
              textLen: (el.innerText || '').trim().length
            };
          })()`
        });

        measurements[vp.w][sec.id] = secRes?.result?.result?.value || { height: 0, missing: true };

        // Scroll and screenshot section
        if (vp.w === 1366 || vp.w === 768 || vp.w === 360) {
          try {
            await pSend('Runtime.evaluate', {
              expression: `document.querySelector('${sec.selector}')?.scrollIntoView({ block: 'start' })`
            });
            await new Promise((r) => setTimeout(r, 200));
            const secShot = await pSend('Page.captureScreenshot', { format: 'png' });
            if (secShot?.result?.data) {
              fs.writeFileSync(path.join(outDir, `${vp.w}-sec-${sec.id}.png`), Buffer.from(secShot.result.data, 'base64'));
            }
          } catch (e) {
            console.warn(`Could not screenshot ${sec.id}:`, e.message);
          }
        }
      }

      pageWs.close();
      await bSend('Target.closeTarget', { targetId });
    }

    browserWs.close();
  } finally {
    chrome.kill();
    server.close();
  }

  return measurements;
}

const isAfter = process.argv.includes('--after');
const mode = isAfter ? 'after' : 'before';
console.log(`Starting ${mode} measurement pass...`);
const results = await runMeasurements(mode);

fs.writeFileSync(path.join(ROOT, `measurements-${mode}.json`), JSON.stringify(results, null, 2));
console.log(`\nSuccessfully wrote measurements-${mode}.json and screenshots to qa/${mode}/`);
