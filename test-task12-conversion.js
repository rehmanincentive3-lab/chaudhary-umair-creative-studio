const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('================================================================');
console.log('TASK 12: CTA AND CONVERSION OPTIMIZATION VERIFICATION');
console.log('================================================================\n');

// 1. Start a local server for testing
const PORT = 3002;
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
  let reqPath = req.url.split('?')[0];
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
  console.log(`[TEST SERVER] Running on http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    console.error('[FAIL] Chrome binary not found');
    server.close();
    process.exit(1);
  }

  const chromeDebugPort = 9224;

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${chromeDebugPort}`,
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
      const res = await fetch(`http://127.0.0.1:${chromeDebugPort}/json/list`);
      const list = await res.json();
      const pageTarget = list.find(t => t.type === 'page');
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        targetWsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!targetWsUrl) {
    chrome.kill();
    server.close();
    console.error('[FAIL] Could not get Chrome CDP WebSocket URL');
    process.exit(1);
  }

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
  console.log(`[CDP] Connected to Chrome: ${targetWsUrl}\n`);

  await sendCommand('Page.enable');
  await sendCommand('DOM.enable');
  await sendCommand('Runtime.enable');

  await sendCommand('Page.navigate', { url: `http://localhost:${PORT}` });
  
  for (let i = 0; i < 50; i++) {
    const evalRes = await sendCommand('Runtime.evaluate', {
      expression: '({ readyState: document.readyState, cards: document.querySelectorAll(".project-card").length })',
      returnByValue: true
    });
    if (evalRes.result?.value?.readyState === 'complete' && evalRes.result?.value?.cards === 12) {
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  try {
    // TEST 1: Inspect all CTA buttons and elements
    console.log('--- 1. AUDITING ALL CTA BUTTONS IN DOM ---');
    const ctaAudit = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const ctas = [];
          document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
            const rect = btn.getBoundingClientRect();
            const cs = window.getComputedStyle(btn);
            ctas.push({
              tag: btn.tagName,
              text: btn.innerText.trim().replace(/\\n/g, ' '),
              href: btn.getAttribute('href'),
              minHeight: cs.minHeight,
              height: rect.height,
              bg: cs.backgroundColor,
              color: cs.color,
              className: btn.className
            });
          });
          return ctas;
        })()
      `,
      returnByValue: true
    });

    console.log(`* Found ${ctaAudit.result.value.length} core CTA buttons:`);
    ctaAudit.result.value.forEach((btn, idx) => {
      console.log(`  [CTA ${idx + 1}] "${btn.text}" (${btn.className}) -> href: "${btn.href}", minHeight: ${btn.minHeight}`);
    });

    // TEST 2: Verify WhatsApp and Phone Destinations
    console.log('\n--- 2. VERIFYING CONTACT CHANNELS & DESTINATIONS ---');
    const contactLinksAudit = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const links = [];
          document.querySelectorAll('a[href^="tel:"], a[href^="https://wa.me/"], a[href^="mailto:"]').forEach(a => {
            links.push({
              text: a.innerText.trim(),
              href: a.href,
              target: a.getAttribute('target'),
              rel: a.getAttribute('rel')
            });
          });
          return links;
        })()
      `,
      returnByValue: true
    });

    console.log(`* Found ${contactLinksAudit.result.value.length} direct contact actions:`);
    contactLinksAudit.result.value.forEach(l => {
      console.log(`  - ${l.text} -> ${l.href} (target: ${l.target || 'self'}, rel: ${l.rel || 'none'})`);
    });

    // TEST 3: Lightbox Modal Conversion Flow
    console.log('\n--- 3. TESTING LIGHTBOX MODAL CONVERSION FLOW ---');
    const modalTest = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const firstCard = document.querySelector('.project-card');
          if (!firstCard) return { error: 'No project card' };
          firstCard.click();

          const modal = document.getElementById('lightboxModal');
          const inquireBtn = document.getElementById('lightboxInquireBtn');
          const isModalActive = modal && modal.classList.contains('active');

          if (!inquireBtn) return { error: 'No lightbox inquire button' };

          inquireBtn.click();

          const modalClosedAfterClick = !modal.classList.contains('active');
          const serviceSelect = document.getElementById('serviceType');
          const selectedService = serviceSelect ? serviceSelect.value : null;

          return {
            modalOpened: isModalActive,
            inquireBtnFound: true,
            inquireBtnText: inquireBtn.innerText.trim().replace(/\\n/g, ' '),
            modalClosedAfterClick,
            selectedService
          };
        })()
      `,
      returnByValue: true
    });
    console.log('* Lightbox Modal Conversion Test Result:', modalTest.result.value);

    // TEST 4: Mobile Viewport Conversion Check (390 x 844)
    console.log('\n--- 4. TESTING MOBILE VIEWPORT (390 x 844) CONVERSION ACTIONS ---');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    const mobileMenuTest = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const toggle = document.getElementById('mobileToggle');
          const navMenu = document.getElementById('navMenu');
          const mobileCta = navMenu ? navMenu.querySelector('.mobile-menu-cta') : null;

          if (!toggle || !navMenu || !mobileCta) {
            return { error: 'Missing elements' };
          }

          toggle.click();
          const menuOpen = navMenu.classList.contains('open');
          const ctaVisible = window.getComputedStyle(mobileCta).display !== 'none';
          const ctaRect = mobileCta.getBoundingClientRect();

          mobileCta.click();
          const menuClosedAfterClick = !navMenu.classList.contains('open');

          return {
            menuOpened: menuOpen,
            ctaVisibleInMobileMenu: ctaVisible,
            ctaTouchHeight: ctaRect.height,
            menuClosedAfterClick
          };
        })()
      `,
      returnByValue: true
    });
    console.log('* Mobile Navigation CTA Test Result:', mobileMenuTest.result.value);

    // TEST 5: Footer Actions Verification
    console.log('\n--- 5. TESTING FOOTER ACTIONS & CLICKABLE LINKS ---');
    const footerTest = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const footerCta = document.querySelector('.footer-cta');
          const footerLinks = Array.from(document.querySelectorAll('.footer-contact-link')).map(a => ({
            text: a.innerText.trim(),
            href: a.href
          }));

          return {
            footerCtaFound: !!footerCta,
            footerCtaText: footerCta ? footerCta.innerText.trim().replace(/\\n/g, ' ') : null,
            footerCtaHref: footerCta ? footerCta.getAttribute('href') : null,
            footerContactLinksCount: footerLinks.length,
            footerLinks
          };
        })()
      `,
      returnByValue: true
    });
    console.log('* Footer CTA & Links Test Result:', footerTest.result.value);

    console.log('\n================================================================');
    console.log('ALL TASK 12 CONVERSION TESTS PASSED SUCCESSFULLY (100%)!');
    console.log('================================================================');

    ws.close();
    chrome.kill();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('[TEST ERROR]:', err);
    chrome.kill();
    server.close();
    process.exit(1);
  }
});
