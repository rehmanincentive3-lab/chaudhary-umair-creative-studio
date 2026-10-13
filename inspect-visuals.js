const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3003;
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
  
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Length': stats.size, 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

async function inspectVisuals() {
  await new Promise(r => server.listen(PORT, r));
  console.log(`Visual inspection server listening on http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeArgs = [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--no-first-run',
    '--disable-gpu',
    '--window-size=1440,900'
  ];

  const chromeProc = spawn(chromePath, chromeArgs);

  let targetWsUrl = null;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const res = await fetch('http://127.0.0.1:9224/json/list');
      const list = await res.json();
      const pageTarget = list.find(t => t.type === 'page');
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        targetWsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!targetWsUrl) {
    chromeProc.kill();
    server.close();
    throw new Error('Failed to connect to Chrome CDP.');
  }

  const ws = new WebSocket(targetWsUrl);
  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
  };

  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: `http://localhost:${PORT}` });

  // Wait for page to load fully
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n--- 1. DESKTOP (1440px) VISUAL AUDIT ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 400));

  const desktopAudit = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sections = Array.from(document.querySelectorAll('section')).map(s => {
          const style = window.getComputedStyle(s);
          const rect = s.getBoundingClientRect();
          return {
            id: s.id,
            paddingTop: style.paddingTop,
            paddingBottom: style.paddingBottom,
            marginTop: style.marginTop,
            marginBottom: style.marginBottom,
            height: Math.round(rect.height)
          };
        });

        const sectionTitles = Array.from(document.querySelectorAll('.section-title')).map(t => {
          const style = window.getComputedStyle(t);
          return {
            text: t.textContent.trim(),
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            marginBottom: style.marginBottom,
            color: style.color
          };
        });

        const serviceCards = Array.from(document.querySelectorAll('.service-card')).map((c, i) => {
          const rect = c.getBoundingClientRect();
          const style = window.getComputedStyle(c);
          return {
            index: i + 1,
            title: c.querySelector('.service-title')?.textContent.trim(),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            padding: style.padding,
            border: style.border
          };
        });

        const projectCards = Array.from(document.querySelectorAll('.project-card')).map((c, i) => {
          const rect = c.getBoundingClientRect();
          const img = c.querySelector('img');
          const imgRect = img ? img.getBoundingClientRect() : null;
          return {
            index: i + 1,
            title: c.querySelector('.project-title')?.textContent.trim(),
            cardWidth: Math.round(rect.width),
            cardHeight: Math.round(rect.height),
            imgWidth: imgRect ? Math.round(imgRect.width) : null,
            imgHeight: imgRect ? Math.round(imgRect.height) : null
          };
        });

        const buttons = Array.from(document.querySelectorAll('.btn-primary, .btn-secondary, .filter-btn, .carousel-nav-btn')).map(b => {
          const rect = b.getBoundingClientRect();
          const style = window.getComputedStyle(b);
          return {
            text: b.textContent.trim().slice(0, 25),
            className: b.className,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            fontSize: style.fontSize,
            borderRadius: style.borderRadius
          };
        });

        return {
          sections,
          sectionTitles,
          serviceCardsHeights: serviceCards.map(c => c.height),
          projectCardsHeights: projectCards.map(c => c.cardHeight),
          sampleButtons: buttons.slice(0, 8)
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Desktop Sections Rhythm:', desktopAudit.result?.value?.sections);
  console.log('Desktop Section Titles Typography:', desktopAudit.result?.value?.sectionTitles);
  console.log('Desktop Service Cards Heights:', desktopAudit.result?.value?.serviceCardsHeights);
  console.log('Desktop Project Cards Heights:', desktopAudit.result?.value?.projectCardsHeights);
  console.log('Desktop Buttons Metrics:', desktopAudit.result?.value?.sampleButtons);

  // Capture desktop screenshot
  const desktopShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('task10-desktop-1440.png', Buffer.from(desktopShot.data, 'base64'));
  console.log('Saved screenshot: task10-desktop-1440.png');

  console.log('\n--- 2. TABLET (768px) VISUAL AUDIT ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 1, mobile: true });
  await new Promise(r => setTimeout(r, 400));

  const tabletAudit = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const sections = Array.from(document.querySelectorAll('section')).map(s => {
          const style = window.getComputedStyle(s);
          return {
            id: s.id,
            paddingTop: style.paddingTop,
            paddingBottom: style.paddingBottom
          };
        });

        const serviceCards = Array.from(document.querySelectorAll('.service-card')).map(c => {
          const rect = c.getBoundingClientRect();
          return Math.round(rect.height);
        });

        const projectCards = Array.from(document.querySelectorAll('.project-card')).map(c => {
          const rect = c.getBoundingClientRect();
          return { width: Math.round(rect.width), height: Math.round(rect.height) };
        });

        return {
          sections,
          serviceCardsHeights: serviceCards,
          projectCardsSummary: {
            count: projectCards.length,
            widths: [...new Set(projectCards.map(p => p.width))],
            heights: [...new Set(projectCards.map(p => p.height))]
          }
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Tablet Sections Spacing:', tabletAudit.result?.value?.sections);
  console.log('Tablet Service Cards Heights:', tabletAudit.result?.value?.serviceCardsHeights);
  console.log('Tablet Project Cards Metrics:', tabletAudit.result?.value?.projectCardsSummary);

  const tabletShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('task10-tablet-768.png', Buffer.from(tabletShot.data, 'base64'));
  console.log('Saved screenshot: task10-tablet-768.png');

  console.log('\n--- 3. MOBILE (390px) VISUAL AUDIT ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 400));

  const mobileAudit = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const tapTargets = Array.from(document.querySelectorAll('button, a.btn-primary, a.btn-secondary, a.contact-card-item, .filter-btn, .carousel-nav-btn')).map(el => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName.toLowerCase(),
            text: el.textContent.trim().slice(0, 20),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            touchTargetAdequate: rect.width >= 40 && rect.height >= 40
          };
        });

        const textElements = Array.from(document.querySelectorAll('h1, h2, h3, p, span.section-label, .brand-name')).map(el => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName.toLowerCase(),
            text: el.textContent.trim().slice(0, 25),
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            overflowsRight: rect.right > 390
          };
        });

        const smallTapTargets = tapTargets.filter(t => !t.touchTargetAdequate);
        const overflowingText = textElements.filter(t => t.overflowsRight);

        return {
          totalInteractiveTargets: tapTargets.length,
          smallTapTargetsCount: smallTapTargets.length,
          smallTapTargetsSamples: smallTapTargets.slice(0, 5),
          overflowingTextCount: overflowingText.length,
          overflowingTextSamples: overflowingText.slice(0, 3)
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Mobile Tap Targets & Readability:', mobileAudit.result?.value);

  const mobileShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('task10-mobile-390.png', Buffer.from(mobileShot.data, 'base64'));
  console.log('Saved screenshot: task10-mobile-390.png');

  ws.close();
  chromeProc.kill();
  server.close();
  console.log('\nVisual audit completed successfully.');
}

inspectVisuals().catch(e => {
  console.error('Error during visual inspection:', e);
  process.exit(1);
});
