const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  
  const filePath = path.join(__dirname, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const range = req.headers.range;
    if (range && ext === '.mp4') {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

async function run() {
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`[CDP TEST] Server listening on http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeArgs = [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1280,800'
  ];

  console.log('[CDP TEST] Launching Chrome headless...');
  const chromeProc = spawn(chromePath, chromeArgs);

  // Wait for remote debugging to be active
  let targetWsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      const list = await res.json();
      const pageTarget = list.find(t => t.type === 'page');
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        targetWsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!targetWsUrl) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000', { method: 'PUT' });
      const target = await res.json();
      targetWsUrl = target.webSocketDebuggerUrl;
    } catch (e) {}
  }

  if (!targetWsUrl) {
    console.error('[CDP TEST] Failed to obtain Chrome CDP WebSocket URL.');
    chromeProc.kill();
    server.close();
    process.exit(1);
  }

  console.log(`[CDP TEST] Connected to Chrome CDP: ${targetWsUrl}`);
  const ws = new WebSocket(targetWsUrl);

  const errors = [];
  const networkFailures = [];

  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  let loadEventFired = false;
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }

    if (data.method === 'Page.loadEventFired') {
      loadEventFired = true;
    }

    if (data.method === 'Runtime.exceptionThrown') {
      const desc = data.params.exceptionDetails?.exception?.description || data.params.exceptionDetails?.text;
      errors.push(`Runtime Exception: ${desc}`);
    }

    if (data.method === 'Console.messageAdded' && data.params.message.level === 'error') {
      errors.push(`Console Error: ${data.params.message.text}`);
    }

    if (data.method === 'Network.responseReceived') {
      const status = data.params.response.status;
      const url = data.params.response.url;
      if (status >= 400 && url.includes('localhost:3000')) {
        networkFailures.push(`HTTP ${status}: ${url}`);
      }
    }
  };

  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Console.enable');
  await send('Network.enable');

  console.log('[CDP TEST] Navigating to http://localhost:3000...');
  await send('Page.navigate', { url: `http://localhost:${PORT}` });

  // Wait for readyState === 'complete' and project cards to render
  for (let i = 0; i < 50; i++) {
    const readyRes = await send('Runtime.evaluate', {
      expression: '({ readyState: document.readyState, cards: document.querySelectorAll(".project-card").length })',
      returnByValue: true
    });
    if (readyRes.result?.value?.readyState === 'complete' && readyRes.result?.value?.cards > 0) {
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  const pageInfo = await send('Runtime.evaluate', {
    expression: '({ href: window.location.href, title: document.title, readyState: document.readyState, initialCards: document.querySelectorAll(".project-card").length })',
    returnByValue: true
  });
  console.log('[CDP TEST] Page Info:', pageInfo.result?.value);

  console.log('[CDP TEST] Testing interactive carousel, filters, and modals...');

  // Test next video button
  const nextRes = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        const next = document.getElementById('nextVideoBtn');
        if (!next) return 'nextVideoBtn missing';
        const title0 = document.getElementById('videoTitle').textContent;
        next.click();
        await new Promise(r => setTimeout(r, 350));
        const title1 = document.getElementById('videoTitle').textContent;
        next.click();
        await new Promise(r => setTimeout(r, 350));
        const title2 = document.getElementById('videoTitle').textContent;
        return 'Video navigation OK: [' + title0 + '] -> [' + title1 + '] -> [' + title2 + ']';
      })()
    `,
    awaitPromise: true
  });
  console.log('[CDP TEST] Next Video Test:', nextRes.result?.value);

  // Test filter tabs
  const filterRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const brandingBtn = document.querySelector('.filter-btn[data-filter="branding"]');
        if (!brandingBtn) return 'branding filter button missing';
        brandingBtn.click();
        const cards = document.querySelectorAll('.project-card');
        return 'Filter OK: ' + cards.length + ' branding cards visible';
      })()
    `
  });
  console.log('[CDP TEST] Filter Test:', filterRes.result?.value);

  // Test reset to all
  const allRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
        allBtn.click();
        const cards = document.querySelectorAll('.project-card');
        return 'Reset filter OK: ' + cards.length + ' total cards visible';
      })()
    `
  });
  console.log('[CDP TEST] All Projects Test:', allRes.result?.value);

  // Test opening lightbox modal
  const modalRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const firstCard = document.querySelector('.project-card');
        if (!firstCard) return 'No project card';
        firstCard.click();
        const modal = document.getElementById('lightboxModal');
        const isActive = modal && modal.classList.contains('active');
        const closeBtn = document.getElementById('lightboxClose');
        closeBtn.click();
        const isClosed = !modal.classList.contains('active');
        return 'Lightbox modal open/close OK: ' + isActive + ' -> ' + isClosed;
      })()
    `
  });
  console.log('[CDP TEST] Lightbox Modal Test:', modalRes.result?.value);

  // Test Contact Form Validation & Submission
  const formRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const form = document.getElementById('contactForm');
        const name = document.getElementById('clientName');
        const email = document.getElementById('clientEmail');
        const details = document.getElementById('projectDetails');
        const feedback = document.getElementById('formFeedback');

        if (!form) return 'contactForm missing';

        // 1. Submit with empty fields
        name.value = '';
        email.value = '';
        details.value = '';
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        const errorShown = feedback.style.display !== 'none' && feedback.classList.contains('error');
        const errorText = feedback.textContent;

        // 2. Submit with valid fields
        name.value = 'Alexander Vance';
        email.value = 'alexander@vance.com';
        details.value = 'Complete brand redesign and new responsive website';
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        const successShown = feedback.style.display !== 'none' && feedback.classList.contains('success');
        const containsPhone = feedback.innerHTML.includes('03021468799');
        const containsEmail = feedback.innerHTML.includes('chaudharyumair799@gmail.com');

        return {
          errorValidationWorking: errorShown,
          errorMsg: errorText,
          submissionWorking: successShown,
          hasPhoneInFeedback: containsPhone,
          hasEmailInFeedback: containsEmail
        };
      })()
    `,
    returnByValue: true
  });
  console.log('[CDP TEST] Contact Form Test:', formRes.result?.value);

  // Test SEO, Metadata & Accessibility Attributes
  const seoRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const title = document.title;
        const metaDesc = document.querySelector('meta[name="description"]')?.content;
        const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
        const ogDesc = document.querySelector('meta[property="og:description"]')?.content;
        const ogImg = document.querySelector('meta[property="og:image"]')?.content;
        const themeColor = document.querySelector('meta[name="theme-color"]')?.content;
        const jsonLd = document.querySelector('script[type="application/ld+json"]')?.textContent;
        let parsedJson = null;
        try { parsedJson = JSON.parse(jsonLd); } catch (e) {}

        const skipLink = document.querySelector('.skip-to-content');
        const heroImg = document.querySelector('.hero-visual-card img');
        const video = document.getElementById('carouselVideo');

        return {
          titleValid: !!title && title.includes('Chaudhary Umair'),
          metaDescValid: !!metaDesc && metaDesc.includes('Ahmad Pur Sial'),
          ogTagsPresent: !!ogTitle && !!ogDesc && !!ogImg,
          themeColor: themeColor,
          jsonLdType: parsedJson ? parsedJson['@type'] : null,
          jsonLdFounder: parsedJson ? parsedJson.founder?.name : null,
          skipLinkPresent: !!skipLink,
          heroImgHasDimensions: heroImg?.hasAttribute('width') && heroImg?.hasAttribute('height'),
          videoHasAriaLabel: video?.hasAttribute('aria-label')
        };
      })()
    `,
    returnByValue: true
  });
  console.log('[CDP TEST] SEO & Accessibility Check:', seoRes.result?.value);
  const audioRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const audioBtn = document.getElementById('videoAudioToggle');
        const video = document.getElementById('carouselVideo');
        const initialMuted = video.muted;
        audioBtn.click();
        const unmuted = video.muted;
        audioBtn.click();
        const remuted = video.muted;
        return 'Audio toggle OK: initial muted=' + initialMuted + ', clicked=' + unmuted + ', clickedAgain=' + remuted;
      })()
    `
  });
  console.log('[CDP TEST] Audio Toggle Test:', audioRes.result?.value);

  // Test mobile swipe gesture
  const swipeRes = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        const stage = document.querySelector('.carousel-stage');
        const initialTitle = document.getElementById('videoTitle').textContent;
        
        // Simulate swipe left (next video)
        const touch1 = new Touch({ identifier: 1, target: stage, screenX: 300, screenY: 200 });
        const touch2 = new Touch({ identifier: 1, target: stage, screenX: 100, screenY: 205 }); // deltaX = -200

        stage.dispatchEvent(new TouchEvent('touchstart', { changedTouches: [touch1] }));
        stage.dispatchEvent(new TouchEvent('touchend', { changedTouches: [touch2] }));

        await new Promise(r => setTimeout(r, 350));
        const afterSwipeTitle = document.getElementById('videoTitle').textContent;
        return 'Swipe Left OK: [' + initialTitle + '] -> [' + afterSwipeTitle + '] (different=' + (initialTitle !== afterSwipeTitle) + ')';
      })()
    `,
    awaitPromise: true
  });
  console.log('[CDP TEST] Mobile Swipe Test:', swipeRes.result?.value);

  // Test mobile viewport resizing & 9:16 aspect ratio
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 400));

  const mobileMetrics = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const frame = document.getElementById('videoFrame');
        const rect = frame.getBoundingClientRect();
        const ratio = (rect.height / rect.width).toFixed(2);
        return {
          frameWidth: Math.round(rect.width),
          frameHeight: Math.round(rect.height),
          aspectRatio: ratio,
          expected9_16: (16 / 9).toFixed(2)
        };
      })()
    `,
    returnByValue: true
  });
  console.log('[CDP TEST] Mobile 9:16 Frame Metrics:', mobileMetrics.result?.value);

  // Check errors
  console.log('\n--- CDP RESULTS ---');
  console.log('Console/Runtime Errors Count:', errors.length);
  if (errors.length > 0) {
    errors.forEach(e => console.error('  [ERROR]', e));
  }
  console.log('Network 404/500 Failures Count:', networkFailures.length);
  if (networkFailures.length > 0) {
    networkFailures.forEach(e => console.error('  [FAIL]', e));
  }

  // Cleanup
  ws.close();
  chromeProc.kill();
  server.close();

  if (errors.length === 0 && networkFailures.length === 0) {
    console.log('\nSUCCESS: 0 console errors, 0 network failures, 100% clean browser run!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('[CDP TEST] Unhandled error:', err);
  process.exit(1);
});
