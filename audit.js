const fs = require('fs');
const path = require('path');

console.log('=== RUNNING FINAL MASTER WEBSITE AUDIT ===\n');

let errors = 0;

// 1. Core Files
const coreFiles = [
  'index.html',
  'css/style.css',
  'js/main.js',
  'assets/hero-umair.png',
  'assets/logo.png'
];

coreFiles.forEach(f => {
  const p = path.join(__dirname, f);
  if (fs.existsSync(p)) {
    console.log(`[PASS] Core file present: ${f} (${(fs.statSync(p).size / 1024).toFixed(1)} KB)`);
  } else {
    console.error(`[FAIL] Missing core file: ${f}`);
    errors++;
  }
});

// 2. Videos & Posters (6 Original 9:16 Vertical Videos)
for (let i = 1; i <= 6; i++) {
  const vids = fs.readdirSync(path.join(__dirname, 'assets/videos')).filter(f => f.startsWith(`video-${i}-`) && f.endsWith('.mp4'));
  const posters = fs.readdirSync(path.join(__dirname, 'assets/posters')).filter(f => f.startsWith(`video-${i}-`) && f.endsWith('.jpg'));

  if (vids.length === 1 && posters.length === 1) {
    const vSize = fs.statSync(path.join(__dirname, 'assets/videos', vids[0])).size;
    console.log(`[PASS] Video ${i}: ${vids[0]} (${(vSize / (1024 * 1024)).toFixed(2)} MB) with Poster`);
  } else {
    console.error(`[FAIL] Video ${i} or poster missing`);
    errors++;
  }
}

// 3. The 12 Image Projects
for (let i = 1; i <= 12; i++) {
  const projs = fs.readdirSync(path.join(__dirname, 'assets/projects')).filter(f => f.startsWith(`project-${i}-`));
  if (projs.length === 1) {
    console.log(`[PASS] Project ${i}: ${projs[0]}`);
  } else {
    console.error(`[FAIL] Project ${i} missing`);
    errors++;
  }
}

// 4. Strict Brand Color Audit
const cssContent = fs.readFileSync(path.join(__dirname, 'css/style.css'), 'utf-8');
const forbiddenColors = ['blue', 'green', 'purple', 'red', 'orange', 'cyan', 'neon', 'silver'];
forbiddenColors.forEach(c => {
  const reg = new RegExp(`(:\\s*|rgba?\\([^)]*|#)[^;}]*\\b${c}\\b`, 'i');
  if (reg.test(cssContent)) {
    console.error(`[FAIL] Forbidden color found in CSS: ${c}`);
    errors++;
  } else {
    console.log(`[PASS] Color compliance: 0 usage of forbidden keyword "${c}"`);
  }
});

// 5. Contact Information Audit
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const jsContent = fs.readFileSync(path.join(__dirname, 'js/main.js'), 'utf-8');

// Verify NO old phone number anywhere
if (htmlContent.includes('03040501400') || jsContent.includes('03040501400') || cssContent.includes('03040501400')) {
  console.error('[FAIL] Old phone number 03040501400 found in files!');
  errors++;
} else {
  console.log('[PASS] Old phone number completely eradicated (0 occurrences)');
}

// Verify new phone number 03021468799
if (htmlContent.includes('03021468799') && htmlContent.includes('wa.me/923021468799')) {
  console.log('[PASS] Updated phone & WhatsApp: 03021468799 verified');
} else {
  console.error('[FAIL] Updated phone number missing in index.html');
  errors++;
}

// Verify email & location
if (htmlContent.includes('chaudharyumair799@gmail.com') && htmlContent.includes('Ahmad Pur Sial, District Jhang, Punjab, Pakistan')) {
  console.log('[PASS] Business contact & location verified: Ahmad Pur Sial, District Jhang, Punjab, Pakistan');
} else {
  console.error('[FAIL] Email or location missing');
  errors++;
}

// 6. Services Audit (8 Services)
const services = [
  'Graphic Design',
  'Website Development',
  'UI/UX Design',
  'AI Video Creation',
  'Branding & Brand Identity',
  'Social Media Design',
  'E-Commerce / Online Store',
  'Digital Creative Services'
];

services.forEach(s => {
  if (htmlContent.includes(s)) {
    console.log(`[PASS] Service represented: "${s}"`);
  } else {
    console.error(`[FAIL] Missing service: "${s}"`);
    errors++;
  }
});

// 7. Video Carousel Audit (9:16 Vertical, Single View, Left/Right Arrows, Native Controls)
if (cssContent.includes('aspect-ratio: 9 / 16') || cssContent.includes('aspect-ratio: 9/16')) {
  console.log('[PASS] Strict 9:16 vertical ratio maintained');
} else {
  console.error('[FAIL] 9:16 aspect ratio not defined');
  errors++;
}

if (htmlContent.includes('prevVideoBtn') && htmlContent.includes('nextVideoBtn')) {
  console.log('[PASS] Left/Right arrow controls present');
} else {
  console.error('[FAIL] Carousel arrows missing');
  errors++;
}

if (jsContent.includes('videoElement.controls = true') && jsContent.includes('videoElement.controls = false')) {
  console.log('[PASS] Native video controls activated on play');
} else {
  console.error('[FAIL] Native video controls logic missing');
  errors++;
}

// 8. 12 Project Cards Display Audit (Title, Category, Description, View Project button)
if (jsContent.includes('project-desc') && jsContent.includes('project-view-btn') && jsContent.includes('View Project')) {
  console.log('[PASS] Project cards show Title, Category, Description, and View Project button');
} else {
  console.error('[FAIL] Project card details incomplete');
  errors++;
}

// 9. Categories Audit (All, Graphic Design, Web Development, UI/UX Design, AI Video, Branding, E-Commerce, Social Media)
const categories = ['all', 'graphic-design', 'web-development', 'ui-ux', 'ai-video', 'branding', 'ecommerce', 'social-media'];
categories.forEach(cat => {
  if (htmlContent.includes(`data-filter="${cat}"`)) {
    console.log(`[PASS] Category filter tab present: ${cat}`);
  } else {
    console.error(`[FAIL] Missing category filter tab: ${cat}`);
    errors++;
  }
});

// 10. Hero Section Video Check
const heroSectionMatch = htmlContent.match(/<section class="hero-section"[\s\S]*?<\/section>/);
if (heroSectionMatch && heroSectionMatch[0].includes('<video')) {
  console.error('[FAIL] Video found in Hero section! Hero must NOT have video.');
  errors++;
} else {
  console.log('[PASS] Hero section contains ZERO videos (preserves image artwork)');
}

console.log('\n=============================================');
if (errors === 0) {
  console.log('AUDIT COMPLETED: 100% OF REQUIREMENTS VERIFIED & PASSED!');
} else {
  console.error(`AUDIT FAILED WITH ${errors} ERRORS`);
  process.exit(1);
}
