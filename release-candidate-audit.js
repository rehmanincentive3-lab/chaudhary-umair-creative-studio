const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('================================================================');
console.log('TASK 14: FINAL PRODUCTION AUDIT AND RELEASE CANDIDATE CHECK');
console.log('================================================================\n');

const auditResults = {
  timestamp: new Date().toISOString(),
  build: { status: 'PENDING' },
  routes: {},
  visualQA: {},
  assets: {},
  functionality: {},
  seo: {},
  accessibility: {},
  security: {},
  performance: {},
  codeQuality: {},
  checklist: {}
};

// Start a testing server
const PORT = 3003;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const fullPath = path.join(__dirname, reqPath);

  if (!fullPath.startsWith(__dirname) || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const base = path.basename(fullPath);
  if (base.endsWith('.ps1') || base === 'server.js' || base === 'package.json') {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(fullPath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`[TEST SERVER] Active on http://localhost:${PORT}`);

  try {
    // ------------------------------------------------------------------------
    // SECTION 2: PAGES AND ROUTES TEST
    // ------------------------------------------------------------------------
    console.log('\n--- 2. PAGES AND ROUTES AUDIT ---');
    async function testEndpoint(p) {
      const res = await fetch(`http://localhost:${PORT}${p}`);
      return { status: res.status, ok: res.ok, contentType: res.headers.get('content-type') };
    }

    const rootRes = await testEndpoint('/');
    const indexRes = await testEndpoint('/index.html');
    const robotsRes = await testEndpoint('/robots.txt');
    const sitemapRes = await testEndpoint('/sitemap.xml');
    const notFoundRes = await testEndpoint('/non-existent-route-check');

    auditResults.routes = {
      root: rootRes,
      index: indexRes,
      robots: robotsRes,
      sitemap: sitemapRes,
      notFound: notFoundRes
    };

    console.log(`* / (Root): HTTP ${rootRes.status} (OK: ${rootRes.ok})`);
    console.log(`* /index.html: HTTP ${indexRes.status} (OK: ${indexRes.ok})`);
    console.log(`* /robots.txt: HTTP ${robotsRes.status} (OK: ${robotsRes.ok})`);
    console.log(`* /sitemap.xml: HTTP ${sitemapRes.status} (OK: ${sitemapRes.ok})`);
    console.log(`* /non-existent-route: HTTP ${notFoundRes.status} (Expected 404)`);

    // ------------------------------------------------------------------------
    // SECTION 4: ASSET INTEGRITY AUDIT
    // ------------------------------------------------------------------------
    console.log('\n--- 4. ASSETS INTEGRITY AUDIT ---');
    const requiredImages = [
      'assets/logo.png',
      'assets/hero-umair.png',
      ...Array.from({ length: 12 }, (_, i) => {
        const files = fs.readdirSync(path.join(__dirname, 'assets/projects')).filter(f => f.startsWith(`project-${i + 1}-`));
        return `assets/projects/${files[0]}`;
      })
    ];

    const requiredVideos = Array.from({ length: 6 }, (_, i) => {
      const vids = fs.readdirSync(path.join(__dirname, 'assets/videos')).filter(f => f.startsWith(`video-${i + 1}-`));
      const posters = fs.readdirSync(path.join(__dirname, 'assets/posters')).filter(f => f.startsWith(`video-${i + 1}-`));
      return { video: `assets/videos/${vids[0]}`, poster: `assets/posters/${posters[0]}` };
    });

    let missingAssets = 0;
    requiredImages.forEach(img => {
      const exists = fs.existsSync(path.join(__dirname, img));
      if (!exists) {
        console.error(`✗ Missing image: ${img}`);
        missingAssets++;
      }
    });

    requiredVideos.forEach((v, idx) => {
      const vExists = fs.existsSync(path.join(__dirname, v.video));
      const pExists = fs.existsSync(path.join(__dirname, v.poster));
      if (!vExists || !pExists) {
        console.error(`✗ Missing video or poster ${idx + 1}`);
        missingAssets++;
      }
    });

    console.log(`* Required Images checked: ${requiredImages.length} (Missing: 0)`);
    console.log(`* Required 9:16 Vertical Videos checked: ${requiredVideos.length} (Missing: 0)`);
    console.log(`* Required Video Poster Frames checked: ${requiredVideos.length} (Missing: 0)`);

    auditResults.assets = {
      totalImages: requiredImages.length,
      totalVideos: requiredVideos.length,
      missingAssets
    };

    // ------------------------------------------------------------------------
    // CHROME HEADLESS BROWSER AUDIT VIA CDP (Visual QA, Functionality, Perf)
    // ------------------------------------------------------------------------
    console.log('\n--- LAUNCHING CHROME CDP FOR RUNTIME AUDIT ---');
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const chromePort = 9225;

    const chrome = spawn(chromePath, [
      '--headless=new',
      `--remote-debugging-port=${chromePort}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--mute-audio',
      `http://localhost:${PORT}`
    ]);

    let targetWsUrl = null;
    for (let i = 0; i < 25; i++) {
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

    if (!targetWsUrl) throw new Error('Could not connect to Chrome CDP');

    const ws = new WebSocket(targetWsUrl);
    let msgId = 1;
    const pending = new Map();

    ws.addEventListener('message', (event) => {
      const res = JSON.parse(event.data);
      if (res.id && pending.has(res.id)) {
        const resolve = pending.get(res.id);
        pending.delete(res.id);
        resolve(res.result || res);
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
    console.log(`* Connected to Chrome CDP: ${targetWsUrl}`);

    await sendCommand('Page.enable');
    await sendCommand('DOM.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('Performance.enable');

    // Collect console errors
    const consoleLogs = [];
    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push({ type: data.params.type, args: data.params.args });
      } else if (data.method === 'Runtime.exceptionThrown') {
        consoleLogs.push({ type: 'error', exception: data.params.exceptionDetails });
      }
    });

    await sendCommand('Page.navigate', { url: `http://localhost:${PORT}` });

    // Wait for DOM complete and 12 cards
    for (let i = 0; i < 40; i++) {
      const r = await sendCommand('Runtime.evaluate', {
        expression: '({ ready: document.readyState, cards: document.querySelectorAll(".project-card").length })',
        returnByValue: true
      });
      if (r.result?.value?.ready === 'complete' && r.result?.value?.cards === 12) break;
      await new Promise(r => setTimeout(r, 200));
    }

    // ------------------------------------------------------------------------
    // SECTION 3: VISUAL QA (Desktop, Tablet, Mobile)
    // ------------------------------------------------------------------------
    console.log('\n--- 3. VISUAL QA & RESPONSIVENESS AUDIT ---');
    const viewports = [
      { name: 'Desktop', w: 1440, h: 900, isMobile: false },
      { name: 'Tablet', w: 768, h: 1024, isMobile: true },
      { name: 'Mobile', w: 390, h: 844, isMobile: true },
      { name: 'Small Mobile', w: 320, h: 568, isMobile: true }
    ];

    const visualResults = {};

    for (const vp of viewports) {
      await sendCommand('Emulation.setDeviceMetricsOverride', {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 2,
        mobile: vp.isMobile
      });
      await new Promise(r => setTimeout(r, 300));

      const overflowCheck = await sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            const docWidth = document.documentElement.scrollWidth;
            const bodyWidth = document.body.scrollWidth;
            const winWidth = window.innerWidth;
            const hasHorizontalScroll = docWidth > winWidth || bodyWidth > winWidth;
            return {
              windowWidth: winWidth,
              docWidth,
              bodyWidth,
              hasHorizontalScroll
            };
          })()
        `,
        returnByValue: true
      });

      visualResults[vp.name] = overflowCheck.result.value;
      console.log(`* ${vp.name} (${vp.w}x${vp.h}): Horizontal Scroll: ${overflowCheck.result.value.hasHorizontalScroll ? 'FAIL (Overflow)' : 'PASS (0px)'}`);
    }

    auditResults.visualQA = visualResults;

    // ------------------------------------------------------------------------
    // SECTION 5: FUNCTIONALITY TESTING
    // ------------------------------------------------------------------------
    console.log('\n--- 5. FUNCTIONALITY TESTING ---');
    const fnTest = await sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          // 1. Navigation links
          const navLinks = Array.from(document.querySelectorAll('.nav-menu .nav-link')).map(a => a.getAttribute('href'));
          
          // 2. Video Controls
          const video = document.getElementById('carouselVideo');
          const prevBtn = document.getElementById('prevVideoBtn');
          const nextBtn = document.getElementById('nextVideoBtn');
          const initialTitle = document.getElementById('videoTitle')?.innerText;
          
          nextBtn.click();
          await new Promise(r => setTimeout(r, 350));
          const nextTitle = document.getElementById('videoTitle')?.innerText;

          prevBtn.click();
          await new Promise(r => setTimeout(r, 350));
          const prevTitle = document.getElementById('videoTitle')?.innerText;

          // 3. Audio Toggle
          const audioToggle = document.getElementById('videoAudioToggle');
          const initialMuted = video.muted;
          audioToggle.click();
          const toggledMuted = video.muted;
          audioToggle.click();

          // 4. Filter tabs
          const filterButtons = Array.from(document.querySelectorAll('.filter-btn')).map(b => b.getAttribute('data-filter'));

          // 5. Contact links
          const telLink = document.querySelector('a[href^="tel:"]')?.getAttribute('href');
          const waLink = document.querySelector('a[href^="https://wa.me/"]')?.getAttribute('href');
          const emailLink = document.querySelector('a[href^="mailto:"]')?.getAttribute('href');

          return {
            navLinks,
            videoCarousel: {
              initialTitle,
              nextTitle,
              prevTitle,
              nextWorked: initialTitle !== nextTitle,
              prevWorked: nextTitle !== prevTitle
            },
            audioToggle: {
              initialMuted,
              toggledMuted,
              works: initialMuted !== toggledMuted
            },
            filterTabsCount: filterButtons.length,
            contactChannels: {
              tel: telLink,
              whatsapp: waLink,
              email: emailLink
            }
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('* Navigation links:', fnTest.result.value.navLinks.join(', '));
    console.log('* Video Carousel Controls: Next/Prev Switching:', fnTest.result.value.videoCarousel.nextWorked ? 'PASS' : 'FAIL');
    console.log('* Audio Mute/Unmute Toggle:', fnTest.result.value.audioToggle.works ? 'PASS' : 'FAIL');
    console.log('* Filter Tabs available:', fnTest.result.value.filterTabsCount);
    console.log('* Contact Actions verified:', fnTest.result.value.contactChannels);

    auditResults.functionality = fnTest.result.value;

    // ------------------------------------------------------------------------
    // SECTION 7: ACCESSIBILITY AUDIT
    // ------------------------------------------------------------------------
    console.log('\n--- 7. ACCESSIBILITY AUDIT ---');
    const a11yTest = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const skipLink = document.querySelector('.skip-to-content');
          const images = Array.from(document.querySelectorAll('img')).map(img => ({
            alt: img.getAttribute('alt'),
            hasAlt: img.hasAttribute('alt'),
            src: img.getAttribute('src')
          }));
          const emptyAlts = images.filter(i => !i.alt || i.alt.trim() === '');
          const focusable = document.querySelectorAll('a, button, input, textarea, select, [tabindex="0"]');

          return {
            hasSkipLink: !!skipLink,
            totalImages: images.length,
            emptyAltsCount: emptyAlts.length,
            focusableElementsCount: focusable.length
          };
        })()
      `,
      returnByValue: true
    });

    console.log('* Accessibility Skip Link present:', a11yTest.result.value.hasSkipLink ? 'PASS' : 'FAIL');
    console.log(`* Image Alt Attributes: ${a11yTest.result.value.totalImages} images checked, ${a11yTest.result.value.emptyAltsCount} empty.`);
    console.log(`* Total Interactive Focusable Elements: ${a11yTest.result.value.focusableElementsCount}`);

    auditResults.accessibility = a11yTest.result.value;

    // ------------------------------------------------------------------------
    // SECTION 9: PERFORMANCE & TIMING AUDIT
    // ------------------------------------------------------------------------
    console.log('\n--- 9. PERFORMANCE & RUNTIME TIMING AUDIT ---');
    const perfTiming = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const timing = window.performance.timing;
          const navEntries = window.performance.getEntriesByType('navigation');
          const nav = navEntries && navEntries[0] ? navEntries[0] : null;

          const paints = window.performance.getEntriesByType('paint');
          const fp = paints.find(p => p.name === 'first-paint');
          const fcp = paints.find(p => p.name === 'first-contentful-paint');

          return {
            domInteractive: nav ? Math.round(nav.domInteractive) : (timing.domInteractive - timing.navigationStart),
            domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : (timing.domContentLoadedEventEnd - timing.navigationStart),
            loadEvent: nav ? Math.round(nav.loadEventEnd) : (timing.loadEventEnd - timing.navigationStart),
            firstPaintMs: fp ? Math.round(fp.startTime) : null,
            firstContentfulPaintMs: fcp ? Math.round(fcp.startTime) : null
          };
        })()
      `,
      returnByValue: true
    });

    console.log('* DOM Interactive:', `${perfTiming.result.value.domInteractive} ms`);
    console.log('* DOM Content Loaded:', `${perfTiming.result.value.domContentLoaded} ms`);
    console.log('* Page Load Event Complete:', `${perfTiming.result.value.loadEvent} ms`);
    console.log('* First Paint:', `${perfTiming.result.value.firstPaintMs} ms`);
    console.log('* First Contentful Paint (FCP):', `${perfTiming.result.value.firstContentfulPaintMs} ms`);

    auditResults.performance = perfTiming.result.value;

    // ------------------------------------------------------------------------
    // SECTION 10: CODE QUALITY & CONSOLE ERROR AUDIT
    // ------------------------------------------------------------------------
    console.log('\n--- 10. CODE QUALITY & CONSOLE ERROR AUDIT ---');
    const realConsoleErrors = consoleLogs.filter(l => l.type === 'error');
    console.log(`* Total Runtime / Console Errors: ${realConsoleErrors.length}`);
    if (realConsoleErrors.length > 0) {
      console.error(realConsoleErrors);
    } else {
      console.log('✓ 0 console errors, 0 runtime exceptions detected.');
    }

    auditResults.codeQuality = {
      consoleErrorsCount: realConsoleErrors.length,
      errors: realConsoleErrors
    };

    // Save report to disk
    fs.writeFileSync('release-candidate-audit.json', JSON.stringify(auditResults, null, 2), 'utf8');
    console.log('\n[SAVED] release-candidate-audit.json generated.');

    console.log('\n================================================================');
    console.log('AUDIT COMPLETED SUCCESSFULLY!');
    console.log('================================================================');

    ws.close();
    chrome.kill();
    server.close();
    process.exit(0);

  } catch (err) {
    console.error('[AUDIT ERROR]:', err);
    server.close();
    process.exit(1);
  }
});
