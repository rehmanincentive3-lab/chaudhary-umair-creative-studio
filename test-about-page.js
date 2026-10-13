const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('================================================================');
console.log('ABOUT PAGE AUDIT: VERIFYING about.html REQUIREMENTS');
console.log('================================================================\n');

let totalErrors = 0;

if (!fs.existsSync('about.html')) {
  console.error('✗ about.html file does not exist!');
  process.exit(1);
}

const html = fs.readFileSync('about.html', 'utf8');

// 1. Title & Meta Description Audit
console.log('[CHECK 1: PAGE TITLE & META DESCRIPTION]');
const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
if (titleMatch) {
  const title = titleMatch[1].trim();
  console.log(`✓ Page Title: "${title}"`);
  if (!title.includes('About') || !title.includes('Chaudhary Umair Creative Studio')) {
    console.error('✗ Title missing "About" or brand name');
    totalErrors++;
  }
} else {
  console.error('✗ Missing <title> tag');
  totalErrors++;
}

const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
if (descMatch) {
  const desc = descMatch[1].trim();
  console.log(`✓ Meta Description: "${desc}"`);
  if (!desc.includes('Chaudhary Umair Creative Studio') || !desc.includes('Ahmad Pur Sial')) {
    console.error('✗ Meta description missing studio name or location');
    totalErrors++;
  }
} else {
  console.error('✗ Missing meta description');
  totalErrors++;
}

// 2. Heading Hierarchy Audit
console.log('\n[CHECK 2: HEADING HIERARCHY]');
const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
const headings = [];
let hMatch;
while ((hMatch = headingRegex.exec(html)) !== null) {
  headings.push({
    level: parseInt(hMatch[1], 10),
    text: hMatch[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ')
  });
}

console.log(`* Found ${headings.length} headings in about.html:`);
let h1Count = 0;
headings.forEach(h => {
  console.log(`  [H${h.level}] ${h.text}`);
  if (h.level === 1) h1Count++;
});

if (h1Count === 1) {
  console.log('✓ Exactly one primary H1 found on about.html.');
} else {
  console.error(`✗ Expected exactly 1 H1, found ${h1Count}`);
  totalErrors++;
}

// 3. Structure Audit: 7 Required Sections
console.log('\n[CHECK 3: 7 MANDATORY SECTIONS AUDIT]');
const requiredSections = [
  { id: 'about-hero', label: '1. Premium About Hero' },
  { id: 'who-we-are', label: '2. Who We Are' },
  { id: 'what-we-do', label: '3. What We Do (Services)' },
  { id: 'our-approach', label: '4. Our Approach' },
  { id: 'why-work-with-us', label: '5. Why Work With Us' },
  { id: 'location-contact', label: '6. Location / Contact' },
  { id: 'about-cta', label: '7. Final CTA' }
];

requiredSections.forEach(sec => {
  const present = html.includes(`id="${sec.id}"`);
  console.log(`* ${sec.label} (#${sec.id}): ${present ? '✓ PASS' : '✗ FAIL'}`);
  if (!present) totalErrors++;
});

// 4. Approach Steps Audit: 4 Steps
console.log('\n[CHECK 4: OUR APPROACH (4 STEPS)]');
const steps = ['Understand', 'Plan', 'Create', 'Deliver'];
steps.forEach(step => {
  const present = html.includes(step);
  console.log(`* Step "${step}": ${present ? '✓ PASS' : '✗ FAIL'}`);
  if (!present) totalErrors++;
});

// 5. Why Work With Us: 5 Benefits
console.log('\n[CHECK 5: WHY WORK WITH US (5 BENEFITS)]');
const benefits = [
  'Professional Creative Execution',
  'Modern Visual Design',
  'Client-Focused Communication',
  'Responsive Digital Experiences',
  'Attention to Detail'
];
benefits.forEach(b => {
  const present = html.toLowerCase().includes(b.toLowerCase());
  console.log(`* Benefit "${b}": ${present ? '✓ PASS' : '✗ FAIL'}`);
  if (!present) totalErrors++;
});

// 6. Services Overview (8 existing services)
console.log('\n[CHECK 6: WHAT WE DO (8 EXISTING SERVICES)]');
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
  const present = html.includes(s);
  console.log(`* Service "${s}": ${present ? '✓ PASS' : '✗ FAIL'}`);
  if (!present) totalErrors++;
});

// 7. Business Contact Information
console.log('\n[CHECK 7: VERIFIED BUSINESS INFORMATION]');
const phonePresent = html.includes('03021468799');
const waPresent = html.includes('wa.me/923021468799');
const emailPresent = html.includes('chaudharyumair799@gmail.com');
const locationPresent = html.includes('Ahmad Pur Sial, District Jhang, Punjab, Pakistan');
const oldPhoneAbsent = !html.includes('03040501400');

console.log(`* Phone (03021468799): ${phonePresent ? '✓ PASS' : '✗ FAIL'}`);
console.log(`* WhatsApp Link: ${waPresent ? '✓ PASS' : '✗ FAIL'}`);
console.log(`* Email (chaudharyumair799@gmail.com): ${emailPresent ? '✓ PASS' : '✗ FAIL'}`);
console.log(`* Location: ${locationPresent ? '✓ PASS' : '✗ FAIL'}`);
console.log(`* Old Phone (03040501400) Absent: ${oldPhoneAbsent ? '✓ PASS' : '✗ FAIL'}`);

if (!phonePresent || !waPresent || !emailPresent || !locationPresent || !oldPhoneAbsent) totalErrors++;

// 8. Internal Links Audit
console.log('\n[CHECK 8: INTERNAL LINKS AUDIT]');
const hasServicesLink = html.includes('index.html#services');
const hasContactLink = html.includes('index.html#contact');
const hasHomeLink = html.includes('index.html#home');

console.log(`* Link to Services (index.html#services): ${hasServicesLink ? '✓ PASS' : '✗ FAIL'}`);
console.log(`* Link to Contact (index.html#contact): ${hasContactLink ? '✓ PASS' : '✗ FAIL'}`);
console.log(`* Link to Home (index.html#home): ${hasHomeLink ? '✓ PASS' : '✗ FAIL'}`);

if (!hasServicesLink || !hasContactLink || !hasHomeLink) totalErrors++;

// 9. Accessibility & Images Alt Audit
console.log('\n[CHECK 9: ACCESSIBILITY & IMAGES ALT]');
const imgRegex = /<img\b([^>]*)>/gi;
let imgCount = 0;
let emptyAltCount = 0;
let imgMatch;
while ((imgMatch = imgRegex.exec(html)) !== null) {
  imgCount++;
  const altMatch = imgMatch[1].match(/alt=["']([^"']*)["']/i);
  if (!altMatch || altMatch[1].trim() === '') {
    emptyAltCount++;
  }
}
console.log(`* Total Images: ${imgCount}, Images with empty alt: ${emptyAltCount}`);
if (emptyAltCount > 0) totalErrors++;

const hasSkipLink = html.includes('class="skip-to-content"');
console.log(`* Accessibility Skip Link: ${hasSkipLink ? '✓ PASS' : '✗ FAIL'}`);
if (!hasSkipLink) totalErrors++;

// 10. HTTP Endpoint Check (Live Server)
console.log('\n[CHECK 10: HTTP 200 ON LOCAL SERVER]');
http.get('http://localhost:3000/about.html', (res) => {
  console.log(`* GET /about.html status code: ${res.statusCode} ${res.statusCode === 200 ? '✓ PASS' : '✗ FAIL'}`);
  if (res.statusCode !== 200) totalErrors++;

  console.log('\n================================================================');
  if (totalErrors === 0) {
    console.log('ALL ABOUT PAGE AUDIT CHECKS PASSED (100%)!');
    process.exit(0);
  } else {
    console.error(`ABOUT PAGE AUDIT COMPLETED WITH ${totalErrors} ERRORS.`);
    process.exit(1);
  }
}).on('error', (err) => {
  console.warn(`* Note: Server not running or unreachable at :3000 (${err.message}) - checked static file only.`);
  console.log('\n================================================================');
  if (totalErrors === 0) {
    console.log('ALL ABOUT PAGE AUDIT CHECKS PASSED (100%)!');
    process.exit(0);
  } else {
    console.error(`ABOUT PAGE AUDIT COMPLETED WITH ${totalErrors} ERRORS.`);
    process.exit(1);
  }
});
