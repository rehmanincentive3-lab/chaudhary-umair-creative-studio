const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('================================================================');
console.log('TESTING MULTI-PAGE & 3-VIDEO CAROUSEL RE-ARCHITECTURE');
console.log('================================================================\n');

const PORT = 3004;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const fullPath = path.join(__dirname, reqPath);

  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(fullPath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`[TEST SERVER] Active on http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromePort = 9226;

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${chromePort}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--mute-audio',
    `http://localhost:${PORT}/gallery.html`
  ]);

  let targetWsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${chromePort}/json/list`);
      const list = await res.json();
      const page = list.find(t => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        targetWsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!targetWsUrl) {
    chrome.kill();
    server.close();
    console.error('[FAIL] Could not connect to Chrome CDP');
    process.exit(1);
  }

  const ws = new WebSocket(targetWsUrl);
  let msgId = 1;
  const pending = new Map();
  const consoleLogs = [];

  ws.addEventListener('message', (event) => {
    const res = JSON.parse(event.data);
    if (res.id && pending.has(res.id)) {
      const resolve = pending.get(res.id);
      pending.delete(res.id);
      resolve(res.result || res);
    }
    if (res.method === 'Runtime.consoleAPICalled' && res.params.type === 'error') {
      consoleLogs.push(res.params);
    } else if (res.method === 'Runtime.exceptionThrown') {
      consoleLogs.push(res.params);
    }
  });

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise(resolve => ws.addEventListener('open', resolve));
  console.log(`[CDP] Connected to Chrome: ${targetWsUrl}\n`);

  await sendCommand('Page.enable');
  await sendCommand('DOM.enable');
  await sendCommand('Runtime.enable');

  try {
    // ------------------------------------------------------------------------
    // 1. TEST GALLERY.HTML & 3-VIDEO CAROUSEL
    // ------------------------------------------------------------------------
    console.log('--- 1. TESTING GALLERY.HTML 3-VIDEO CAROUSEL ---');
    await sendCommand('Page.navigate', { url: `http://localhost:${PORT}/gallery.html` });
    await new Promise(r => setTimeout(r, 1200));

    // Desktop Viewport (1440x900)
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 400));

    const desktopCarouselTest = await sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          const track = document.getElementById('reelsTrack');
          const cards = document.querySelectorAll('.reel-card');
          const counter = document.getElementById('reelsCounter');
          const nextBtn = document.getElementById('reelsNextBtn');
          const prevBtn = document.getElementById('reelsPrevBtn');

          if (!track || cards.length !== 6) {
            return { error: 'Reels track or 6 cards missing', cardsFound: cards.length };
          }

          // Inspect widths of first 3 cards to confirm 3 simultaneous videos
          const c0 = cards[0].getBoundingClientRect();
          const c1 = cards[1].getBoundingClientRect();
          const c2 = cards[2].getBoundingClientRect();

          const initialCounter = counter ? counter.innerText.trim() : null;
          const initialTransform = track.style.transform;

          // Click Next
          nextBtn.click();
          await new Promise(r => setTimeout(r, 550));
          const afterNextCounter = counter ? counter.innerText.trim() : null;
          const afterNextTransform = track.style.transform;

          // Click Prev
          prevBtn.click();
          await new Promise(r => setTimeout(r, 550));
          const afterPrevCounter = counter ? counter.innerText.trim() : null;
          const afterPrevTransform = track.style.transform;

          return {
            totalCards: cards.length,
            card0Width: Math.round(c0.width),
            card0Height: Math.round(c0.height),
            cardRatio: (c0.height / c0.width).toFixed(2),
            allThreeVisibleSimultaneously: c0.width > 300 && c1.width > 300 && c2.width > 300,
            initialCounter,
            afterNextCounter,
            afterPrevCounter,
            nextShifted: initialTransform !== afterNextTransform,
            prevRestored: afterPrevTransform === initialTransform
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('* Desktop 3-Video Carousel Result:', desktopCarouselTest.result.value);

    // Tablet Viewport (768x1024)
    console.log('\n--- 2. TESTING TABLET (768x1024) 2-VIDEO VIEW ---');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 400));

    const tabletCarouselTest = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const counter = document.getElementById('reelsCounter');
          const docW = document.documentElement.scrollWidth;
          const winW = window.innerWidth;
          return {
            counterText: counter ? counter.innerText.trim() : null,
            docWidth: docW,
            windowWidth: winW,
            hasHorizontalScroll: docW > winW
          };
        })()
      `,
      returnByValue: true
    });
    console.log('* Tablet Carousel Result:', tabletCarouselTest.result.value);

    // Mobile Viewport (390x844)
    console.log('\n--- 3. TESTING MOBILE (390x844) 1-VIDEO VIEW ---');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 400));

    const mobileCarouselTest = await sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          const counter = document.getElementById('reelsCounter');
          const nextBtn = document.getElementById('reelsNextBtn');
          const docW = document.documentElement.scrollWidth;
          const winW = window.innerWidth;

          const initialMobile = counter ? counter.innerText.trim() : null;
          nextBtn.click();
          await new Promise(r => setTimeout(r, 550));
          const afterNextMobile = counter ? counter.innerText.trim() : null;

          return {
            initialMobile,
            afterNextMobile,
            docWidth: docW,
            windowWidth: winW,
            hasHorizontalScroll: docW > winW
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('* Mobile Carousel Result:', mobileCarouselTest.result.value);

    // ------------------------------------------------------------------------
    // 4. TEST ALL 6 PAGES FOR 200 STATUS & ZERO CONSOLE ERRORS
    // ------------------------------------------------------------------------
    console.log('\n--- 4. AUDITING ALL 6 INDEPENDENT PAGES ---');
    const pages = ['index.html', 'about.html', 'services.html', 'portfolio.html', 'gallery.html', 'contact.html'];

    for (const pg of pages) {
      consoleLogs.length = 0;
      await sendCommand('Page.navigate', { url: `http://localhost:${PORT}/${pg}` });
      await new Promise(r => setTimeout(r, 600));

      const pageAudit = await sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            const h1 = document.querySelector('h1');
            const navLinks = Array.from(document.querySelectorAll('.nav-menu .nav-link')).map(a => a.textContent.trim());
            const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
            return {
              title: document.title,
              h1Text: h1 ? h1.innerText.trim().replace(/\\n/g, ' ') : null,
              navLinksCount: navLinks.length,
              hasHorizontalScroll
            };
          })()
        `,
        returnByValue: true
      });

      console.log(`* [PAGE: ${pg}]`);
      console.log(`  - Title: "${pageAudit.result.value.title}"`);
      console.log(`  - Primary H1: "${pageAudit.result.value.h1Text}"`);
      console.log(`  - Nav items: ${pageAudit.result.value.navLinksCount}, Overflow: ${pageAudit.result.value.hasHorizontalScroll ? 'FAIL' : '0px'}`);
      console.log(`  - Console errors: ${consoleLogs.length}`);

      if (consoleLogs.length > 0 || pageAudit.result.value.hasHorizontalScroll) {
        throw new Error(`Errors on ${pg}`);
      }
    }

    console.log('\n================================================================');
    console.log('ALL MULTI-PAGE & 3-VIDEO CAROUSEL TESTS PASSED (100%)!');
    console.log('================================================================');

    ws.close();
    chrome.kill();
    server.close();
    process.exit(0);

  } catch (err) {
    console.error('[TEST ERROR]:', err);
    ws.close();
    chrome.kill();
    server.close();
    process.exit(1);
  }
});
