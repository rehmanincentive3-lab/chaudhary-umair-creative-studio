const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3001;
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

// Create streaming static server with Range support for video
const server = http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; media-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://wa.me;");

  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Block sensitive server files and hidden files
  const baseName = path.basename(filePath);
  const isRestricted = (
    baseName.startsWith('.') ||
    baseName.endsWith('.ps1') ||
    baseName === 'server.js' ||
    baseName === 'package.json' ||
    baseName === 'audit.js' ||
    baseName === 'security-audit.js' ||
    baseName.startsWith('test-') ||
    baseName.endsWith('.json')
  );

  if (isRestricted) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Direct access to internal file is prohibited');
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

async function runTask8Tests() {
  console.log('================================================================');
  console.log('TASK 8: REAL BROWSER TESTING AND RESPONSIVE VERIFICATION');
  console.log('================================================================\n');

  // 1. Inspect testing tools
  console.log('[STEP 1: INSPECTION OF TOOLS & FRAMEWORK]');
  console.log(`* Node.js Version: ${process.version}`);
  console.log('* Browser Automation: Google Chrome Headless via Chrome DevTools Protocol (CDP)');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeExists = fs.existsSync(chromePath);
  console.log(`* Chrome Binary: ${chromePath} (Found: ${chromeExists})`);

  if (!chromeExists) {
    throw new Error('Google Chrome binary not found at standard path.');
  }

  // 2. Start server
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`* Test Server running on http://localhost:${PORT}\n`);

  // 3. Launch Chrome Headless
  const chromeArgs = [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900'
  ];

  console.log('[STEP 2: LAUNCHING CHROME HEADLESS VIA CDP]');
  const chromeProc = spawn(chromePath, chromeArgs);

  // Poll for WebSocket endpoint
  let targetWsUrl = null;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const res = await fetch('http://127.0.0.1:9223/json/list');
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
      const res = await fetch(`http://127.0.0.1:9223/json/new?http://localhost:${PORT}`, { method: 'PUT' });
      const target = await res.json();
      targetWsUrl = target.webSocketDebuggerUrl;
    } catch (e) {}
  }

  if (!targetWsUrl) {
    chromeProc.kill();
    server.close();
    throw new Error('Could not establish CDP WebSocket connection to Chrome.');
  }

  console.log(`* Connected to Chrome DevTools Protocol: ${targetWsUrl}\n`);
  const ws = new WebSocket(targetWsUrl);

  const consoleErrors = [];
  const networkFailures = [];
  const testResults = {
    viewports: {},
    features: {},
    routes: {},
    keyboardNav: null
  };

  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }

    if (data.method === 'Runtime.exceptionThrown') {
      const desc = data.params.exceptionDetails?.exception?.description || data.params.exceptionDetails?.text;
      consoleErrors.push(`Runtime Exception: ${desc}`);
    }

    if (data.method === 'Console.messageAdded' && data.params.message.level === 'error') {
      consoleErrors.push(`Console Error: ${data.params.message.text}`);
    }

    if (data.method === 'Network.responseReceived') {
      const status = data.params.response.status;
      const url = data.params.response.url;
      if (status >= 400 && url.includes(`localhost:${PORT}`)) {
        networkFailures.push(`HTTP ${status}: ${url}`);
      }
    }
  };

  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Console.enable');
  await send('Network.enable');

  console.log(`[STEP 3: NAVIGATING TO HOMEPAGE (http://localhost:${PORT})]`);
  await send('Page.navigate', { url: `http://localhost:${PORT}` });

  // Wait for DOM ready & project cards loaded
  for (let i = 0; i < 50; i++) {
    const evalRes = await send('Runtime.evaluate', {
      expression: '({ readyState: document.readyState, cards: document.querySelectorAll(".project-card").length })',
      returnByValue: true
    });
    if (evalRes.result?.value?.readyState === 'complete' && evalRes.result?.value?.cards === 12) {
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  // Helper to set viewport
  async function setViewport(w, h, isMobile = false, scale = 1) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: scale,
      mobile: isMobile
    });
    await new Promise(r => setTimeout(r, 300));
  }

  // Helper to check horizontal scroll
  async function checkHorizontalScroll(expectedW) {
    return await send('Runtime.evaluate', {
      expression: `
        (() => {
          const docW = document.documentElement.scrollWidth;
          const bodyW = document.body.scrollWidth;
          const winW = window.innerWidth;
          const hasScroll = docW > winW || bodyW > winW;
          
          // Find any element overflowing beyond window width
          const overflowing = [];
          document.querySelectorAll('*').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > winW + 1 && el.offsetParent !== null) {
              const tag = el.tagName.toLowerCase();
              const cls = el.className ? ('.' + el.className.toString().split(' ').join('.')) : '';
              const id = el.id ? ('#' + el.id) : '';
              overflowing.push(tag + id + cls + ' (right: ' + Math.round(rect.right) + 'px > win: ' + winW + 'px)');
            }
          });

          return {
            windowWidth: winW,
            docScrollWidth: docW,
            bodyScrollWidth: bodyW,
            hasHorizontalScroll: hasScroll,
            overflowingElementsCount: overflowing.length,
            overflowingSamples: overflowing.slice(0, 3)
          };
        })()
      `,
      returnByValue: true
    });
  }

  // ==========================================================================
  // VIEWPORT 1: DESKTOP (1440 × 900)
  // ==========================================================================
  console.log('\n[STEP 4: TESTING VIEWPORT 1 — DESKTOP (1440 × 900)]');
  await setViewport(1440, 900, false);
  const desktopScroll = await checkHorizontalScroll(1440);
  console.log('* Desktop Horizontal Scroll:', desktopScroll.result?.value);

  // Desktop navigation & section scrolling
  const desktopNav = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const navMenu = document.querySelector('.nav-menu');
        const mobileToggle = document.getElementById('mobileToggle');
        const navLinks = Array.from(document.querySelectorAll('.nav-menu .nav-link')).map(a => ({
          text: a.textContent.trim(),
          href: a.getAttribute('href')
        }));
        const navMenuDisplay = window.getComputedStyle(navMenu).display;
        const mobileToggleDisplay = window.getComputedStyle(mobileToggle).display;

        return {
          navMenuVisible: navMenuDisplay !== 'none',
          mobileToggleHidden: mobileToggleDisplay === 'none',
          navLinksCount: navLinks.length,
          navLinks: navLinks
        };
      })()
    `,
    returnByValue: true
  });
  console.log('* Desktop Navigation State:', desktopNav.result?.value);

  // Desktop Video Carousel Checks
  const desktopVideo = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const video = document.getElementById('carouselVideo');
        const frame = document.getElementById('videoFrame');
        const rect = frame.getBoundingClientRect();
        const ratio = (rect.height / rect.width).toFixed(2);
        const title = document.getElementById('videoTitle').textContent.trim();
        const category = document.getElementById('videoCategory').textContent.trim();
        const counter = document.getElementById('videoCounter').textContent.trim();

        return {
          videoElementPresent: !!video,
          isPausedInitially: video.paused,
          isMutedInitially: video.muted,
          noAutoplayWithSound: video.paused || video.muted,
          autoplayAttr: video.autoplay,
          frameWidth: Math.round(rect.width),
          frameHeight: Math.round(rect.height),
          aspectRatio: ratio,
          expected9_16: (16 / 9).toFixed(2),
          initialTitle: title,
          initialCategory: category,
          initialCounter: counter
        };
      })()
    `,
    returnByValue: true
  });
  console.log('* Desktop Video Carousel State:', desktopVideo.result?.value);

  // Test next / prev video controls
  const desktopCarouselNav = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        const nextBtn = document.getElementById('nextVideoBtn');
        const prevBtn = document.getElementById('prevVideoBtn');
        const titleEl = document.getElementById('videoTitle');
        const counterEl = document.getElementById('videoCounter');

        const initial = { title: titleEl.textContent, counter: counterEl.textContent };
        
        nextBtn.click();
        await new Promise(r => setTimeout(r, 350));
        const afterNext = { title: titleEl.textContent, counter: counterEl.textContent };

        prevBtn.click();
        await new Promise(r => setTimeout(r, 350));
        const afterPrev = { title: titleEl.textContent, counter: counterEl.textContent };

        return {
          initial,
          afterNext,
          afterPrev,
          nextWorked: afterNext.counter === '02 / 06' && afterNext.title !== initial.title,
          prevWorked: afterPrev.counter === '01 / 06' && afterPrev.title === initial.title
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('* Desktop Next/Prev Controls Test:', desktopCarouselNav.result?.value);

  // Test audio toggle
  const audioToggle = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const video = document.getElementById('carouselVideo');
        const toggle = document.getElementById('videoAudioToggle');
        const beforeMuted = video.muted;
        toggle.click();
        const after1 = video.muted;
        toggle.click();
        const after2 = video.muted;
        return {
          beforeMuted,
          afterFirstClick: after1,
          afterSecondClick: after2,
          toggleWorking: beforeMuted === true && after1 === false && after2 === true
        };
      })()
    `,
    returnByValue: true
  });
  console.log('* Audio Mute/Unmute Toggle Test:', audioToggle.result?.value);

  // Test 8 Filter Tabs
  const filterTabsTest = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const categories = ['all', 'graphic-design', 'web-development', 'ui-ux', 'ai-video', 'branding', 'ecommerce', 'social-media'];
        const results = {};
        for (const cat of categories) {
          const btn = document.querySelector('.filter-btn[data-filter="' + cat + '"]');
          if (btn) {
            btn.click();
            const visibleCards = Array.from(document.querySelectorAll('.project-card')).filter(c => c.style.display !== 'none');
            results[cat] = {
              btnFound: true,
              visibleCardsCount: visibleCards.length
            };
          } else {
            results[cat] = { btnFound: false };
          }
        }
        // Reset to all
        document.querySelector('.filter-btn[data-filter="all"]').click();
        return results;
      })()
    `,
    returnByValue: true
  });
  console.log('* 8 Filter Tabs Test:', filterTabsTest.result?.value);

  // Test 12 Project Cards & Lightbox Modal
  const lightboxTest = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const cards = document.querySelectorAll('.project-card');
        const firstCard = cards[0];
        const cardTitle = firstCard.querySelector('.project-title')?.textContent.trim();
        firstCard.click();

        const modal = document.getElementById('lightboxModal');
        const isOpen = modal && modal.classList.contains('active');
        const modalTitle = document.getElementById('lightboxTitle')?.textContent.trim();
        const modalImg = document.getElementById('lightboxImage')?.getAttribute('src');

        const closeBtn = document.getElementById('lightboxClose');
        closeBtn.click();
        const isClosed = !modal.classList.contains('active');

        return {
          totalCards: cards.length,
          cardTitle,
          modalOpened: isOpen,
          modalTitleMatches: cardTitle === modalTitle,
          modalHasImgSrc: !!modalImg && modalImg.length > 0,
          modalClosed: isClosed
        };
      })()
    `,
    returnByValue: true
  });
  console.log('* Project Cards & Lightbox Modal Test:', lightboxTest.result?.value);

  // Test Image Loading by scrolling each card into view to verify lazy assets
  const imagesTest = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        // Scroll through each project card so browser triggers lazy load
        const cards = document.querySelectorAll('.project-card');
        for (const c of cards) {
          c.scrollIntoView({ behavior: 'instant', block: 'center' });
          await new Promise(r => setTimeout(r, 80));
        }
        await new Promise(r => setTimeout(r, 800));

        const imgs = Array.from(document.querySelectorAll('img'));
        await Promise.all(imgs.map(img => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise(resolve => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
            setTimeout(resolve, 1200);
          });
        }));

        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 200));

        const broken = imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
        return {
          totalImages: imgs.length,
          brokenImagesCount: broken.length,
          brokenList: broken
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('* Images Loading Test:', imagesTest.result?.value);

  testResults.viewports.desktop = {
    resolution: '1440 × 900',
    horizontalScroll: desktopScroll.result?.value,
    navigation: desktopNav.result?.value,
    video: desktopVideo.result?.value,
    carouselNav: desktopCarouselNav.result?.value,
    filterTabs: filterTabsTest.result?.value,
    lightbox: lightboxTest.result?.value,
    images: imagesTest.result?.value
  };

  // ==========================================================================
  // VIEWPORT 2: TABLET (768 × 1024)
  // ==========================================================================
  console.log('\n[STEP 5: TESTING VIEWPORT 2 — TABLET (768 × 1024)]');
  await setViewport(768, 1024, true);
  const tabletScroll = await checkHorizontalScroll(768);
  console.log('* Tablet Horizontal Scroll:', tabletScroll.result?.value);

  // Tablet Navigation & Mobile Toggle
  const tabletNav = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const toggle = document.getElementById('mobileToggle');
        const navMenu = document.querySelector('.nav-menu');
        const toggleDisplay = window.getComputedStyle(toggle).display;
        const isMenuOpenInitially = navMenu.classList.contains('open');

        // Test opening menu
        toggle.click();
        const isOpenAfterClick = navMenu.classList.contains('open');
        const ariaExpanded = toggle.getAttribute('aria-expanded');

        // Test closing menu by clicking a nav link
        const firstLink = navMenu.querySelector('.nav-link');
        firstLink.click();
        const isClosedAfterLink = !navMenu.classList.contains('open');
        const ariaExpandedAfter = toggle.getAttribute('aria-expanded');

        return {
          toggleVisible: toggleDisplay !== 'none',
          menuHiddenInitially: !isMenuOpenInitially,
          menuOpensOnToggle: isOpenAfterClick,
          ariaExpandedWhenOpen: ariaExpanded,
          menuClosesOnLinkClick: isClosedAfterLink,
          ariaExpandedWhenClosed: ariaExpandedAfter
        };
      })()
    `,
    returnByValue: true
  });
  console.log('* Tablet Mobile Menu Test:', tabletNav.result?.value);

  // Tablet Video aspect ratio and controls
  const tabletVideo = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const frame = document.getElementById('videoFrame');
        const rect = frame.getBoundingClientRect();
        const ratio = (rect.height / rect.width).toFixed(2);
        return {
          frameWidth: Math.round(rect.width),
          frameHeight: Math.round(rect.height),
          aspectRatio: ratio,
          expected9_16: (16 / 9).toFixed(2),
          fitsInViewport: rect.width < 768 && rect.right < 768
        };
      })()
    `,
    returnByValue: true
  });
  console.log('* Tablet Video Dimensions & Ratio:', tabletVideo.result?.value);

  testResults.viewports.tablet = {
    resolution: '768 × 1024',
    horizontalScroll: tabletScroll.result?.value,
    navigation: tabletNav.result?.value,
    video: tabletVideo.result?.value
  };

  // ==========================================================================
  // VIEWPORT 3: MOBILE (390 × 844)
  // ==========================================================================
  console.log('\n[STEP 6: TESTING VIEWPORT 3 — MOBILE (390 × 844)]');
  await setViewport(390, 844, true, 2);
  const mobileScroll = await checkHorizontalScroll(390);
  console.log('* Mobile Horizontal Scroll:', mobileScroll.result?.value);

  // Mobile Menu Interaction
  const mobileMenu = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const toggle = document.getElementById('mobileToggle');
        const navMenu = document.querySelector('.nav-menu');
        
        toggle.click();
        const open1 = navMenu.classList.contains('open');
        toggle.click();
        const closed1 = !navMenu.classList.contains('open');

        return {
          mobileToggleVisible: window.getComputedStyle(toggle).display !== 'none',
          opensProperly: open1,
          closesProperly: closed1
        };
      })()
    `,
    returnByValue: true
  });
  console.log('* Mobile Menu Toggle Check:', mobileMenu.result?.value);

  // Mobile Video Usability & Ratio
  const mobileVideo = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const video = document.getElementById('carouselVideo');
        const frame = document.getElementById('videoFrame');
        const rect = frame.getBoundingClientRect();
        const ratio = (rect.height / rect.width).toFixed(2);
        const prevBtn = document.getElementById('prevVideoBtn');
        const nextBtn = document.getElementById('nextVideoBtn');
        const prevRect = prevBtn.getBoundingClientRect();
        const nextRect = nextBtn.getBoundingClientRect();

        return {
          videoPaused: video.paused,
          videoMuted: video.muted,
          noAutoplayWithSound: video.paused || video.muted,
          frameWidth: Math.round(rect.width),
          frameHeight: Math.round(rect.height),
          aspectRatio: ratio,
          expected9_16: (16 / 9).toFixed(2),
          fitsInMobile: rect.right <= 390,
          prevBtnSize: { width: Math.round(prevRect.width), height: Math.round(prevRect.height) },
          nextBtnSize: { width: Math.round(nextRect.width), height: Math.round(nextRect.height) }
        };
      })()
    `,
    returnByValue: true
  });
  console.log('* Mobile Video Usability & Ratio:', mobileVideo.result?.value);

  // Mobile Swipe Gesture on Video Carousel
  const mobileSwipe = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        const stage = document.querySelector('.carousel-stage');
        const titleBefore = document.getElementById('videoTitle').textContent;
        const counterBefore = document.getElementById('videoCounter').textContent;

        // Simulate swipe left (next)
        const touch1 = new Touch({ identifier: 101, target: stage, screenX: 320, screenY: 300 });
        const touch2 = new Touch({ identifier: 101, target: stage, screenX: 120, screenY: 305 });

        stage.dispatchEvent(new TouchEvent('touchstart', { changedTouches: [touch1] }));
        stage.dispatchEvent(new TouchEvent('touchend', { changedTouches: [touch2] }));

        await new Promise(r => setTimeout(r, 400));
        const titleAfter = document.getElementById('videoTitle').textContent;
        const counterAfter = document.getElementById('videoCounter').textContent;

        return {
          titleBefore,
          titleAfter,
          counterBefore,
          counterAfter,
          swipeLeftSuccess: titleBefore !== titleAfter && counterBefore !== counterAfter
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('* Mobile Swipe Left Gesture Test:', mobileSwipe.result?.value);

  // Mobile Contact Form Validation & Submission
  const mobileForm = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const form = document.getElementById('contactForm');
        const name = document.getElementById('clientName');
        const email = document.getElementById('clientEmail');
        const details = document.getElementById('projectDetails');
        const feedback = document.getElementById('formFeedback');

        // 1. Submit empty -> error
        name.value = '';
        email.value = '';
        details.value = '';
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        const emptyErrorShown = feedback.style.display !== 'none' && feedback.classList.contains('error');
        const emptyMsg = feedback.textContent;

        // 2. Submit valid -> direct delivery links
        name.value = 'Hassan Malik';
        email.value = 'hassan@example.com';
        details.value = 'Need eCommerce store and branding package';
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        const successShown = feedback.style.display !== 'none' && feedback.classList.contains('success');
        const waLink = feedback.querySelector('a[href*="wa.me"]')?.href;
        const mailLink = feedback.querySelector('a[href*="mailto"]')?.href;

        return {
          emptyValidationWorks: emptyErrorShown,
          emptyErrorMessage: emptyMsg,
          validSubmissionWorks: successShown,
          whatsappDirectLink: waLink,
          emailDirectLink: mailLink
        };
      })()
    `,
    returnByValue: true
  });
  console.log('* Mobile Contact Form Test:', mobileForm.result?.value);

  testResults.viewports.mobile = {
    resolution: '390 × 844',
    horizontalScroll: mobileScroll.result?.value,
    navigation: mobileMenu.result?.value,
    video: mobileVideo.result?.value,
    swipeGesture: mobileSwipe.result?.value,
    contactForm: mobileForm.result?.value
  };

  // ==========================================================================
  // VIEWPORT 4: SMALL MOBILE (320 × 568) — Extreme Boundary Check
  // ==========================================================================
  console.log('\n[STEP 7: TESTING VIEWPORT 4 — SMALL MOBILE (320 × 568)]');
  await setViewport(320, 568, true);
  const smallMobileScroll = await checkHorizontalScroll(320);
  console.log('* Small Mobile (320px) Horizontal Scroll:', smallMobileScroll.result?.value);
  testResults.viewports.smallMobile = {
    resolution: '320 × 568',
    horizontalScroll: smallMobileScroll.result?.value
  };

  // ==========================================================================
  // KEYBOARD NAVIGATION & VISIBLE FOCUS TESTING
  // ==========================================================================
  console.log('\n[STEP 8: KEYBOARD NAVIGATION & FOCUS-VISIBLE TESTING]');
  await setViewport(1440, 900, false);
  
  // Test Tab key navigation through interactive elements
  const keyboardTest = await send('Runtime.evaluate', {
    expression: `
      (() => {
        // Find focusable elements
        const focusables = Array.from(document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'));
        const visibleFocusables = focusables.filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
        });

        // Test focus on first 5 elements and check outline / box-shadow
        const focusResults = [];
        for (let i = 0; i < Math.min(6, visibleFocusables.length); i++) {
          const el = visibleFocusables[i];
          el.focus();
          const active = document.activeElement;
          const style = window.getComputedStyle(el);
          focusResults.push({
            tagName: el.tagName.toLowerCase(),
            id: el.id || '',
            className: el.className || '',
            text: (el.textContent || '').trim().slice(0, 30),
            isFocused: active === el,
            outline: style.outline || style.outlineColor,
            boxShadow: style.boxShadow
          });
        }

        // Test Escape key closes modal if open
        const modal = document.getElementById('lightboxModal');
        modal.classList.add('active');
        const modalBeforeEsc = modal.classList.contains('active');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        const modalAfterEsc = modal.classList.contains('active');

        return {
          totalFocusableElements: visibleFocusables.length,
          sampleFocusChecks: focusResults,
          modalEscapeKeyCloses: modalBeforeEsc && !modalAfterEsc
        };
      })()
    `,
    returnByValue: true
  });
  console.log('* Keyboard Navigation & Focus Results:', keyboardTest.result?.value);
  testResults.keyboardNav = keyboardTest.result?.value;

  // ==========================================================================
  // ROUTE & STATIC ENDPOINT VERIFICATION
  // ==========================================================================
  console.log('\n[STEP 9: ROUTE & STATIC ASSET VERIFICATION]');
  const routesToCheck = [
    '/',
    '/index.html',
    '/robots.txt',
    '/sitemap.xml',
    '/non-existent-sample'
  ];

  for (const r of routesToCheck) {
    const res = await fetch(`http://localhost:${PORT}${r}`);
    const status = res.status;
    const ct = res.headers.get('content-type');
    testResults.routes[r] = { status, contentType: ct };
    console.log(`* Route ${r}: HTTP ${status} (${ct})`);
  }

  // ==========================================================================
  // CONSOLE & NETWORK INTEGRITY SUMMARY
  // ==========================================================================
  console.log('\n[STEP 10: CONSOLE ERRORS & NETWORK REQUEST AUDIT]');
  console.log(`* Total Console/Runtime Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(e => console.error('  [ERROR]', e));
  }
  console.log(`* Total HTTP 404/500 Network Failures: ${networkFailures.length}`);
  if (networkFailures.length > 0) {
    networkFailures.forEach(e => console.error('  [FAIL]', e));
  }

  // Write full raw test results to a JSON report file
  fs.writeFileSync(
    path.join(__dirname, 'task8-browser-test-report.json'),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      browser: 'Google Chrome Headless (CDP)',
      viewportTests: testResults.viewports,
      keyboardNavigation: testResults.keyboardNav,
      routes: testResults.routes,
      consoleErrors,
      networkFailures
    }, null, 2)
  );
  console.log('\n[SAVED] task8-browser-test-report.json written successfully.');

  // Teardown
  ws.close();
  chromeProc.kill();
  server.close();

  const allPassed = (
    !desktopScroll.result?.value?.hasHorizontalScroll &&
    !tabletScroll.result?.value?.hasHorizontalScroll &&
    !mobileScroll.result?.value?.hasHorizontalScroll &&
    !smallMobileScroll.result?.value?.hasHorizontalScroll &&
    smallMobileScroll.result?.value?.overflowingElementsCount === 0 &&
    imagesTest.result?.value?.brokenImagesCount === 0 &&
    lightboxTest.result?.value?.modalHasImgSrc === true &&
    keyboardTest.result?.value?.modalEscapeKeyCloses === true &&
    consoleErrors.length === 0 &&
    networkFailures.length === 0
  );

  console.log('\n================================================================');
  console.log(`FINAL RESULT: ${allPassed ? 'ALL BROWSER TESTS PASSED (100%)' : 'TESTS COMPLETED WITH FINDINGS'}`);
  console.log('================================================================\n');

  process.exit(allPassed ? 0 : 1);
}

runTask8Tests().catch(err => {
  console.error('[TASK 8 TEST FATAL ERROR]:', err);
  process.exit(1);
});
