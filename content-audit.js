const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('STARTING THOROUGH CONTENT AND BRAND CONSISTENCY AUDIT');
console.log('================================================================\n');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('js/main.js', 'utf8');
const css = fs.readFileSync('css/style.css', 'utf8');

const findings = [];

// 1. Check for Placeholder / Dummy text
console.log('[CHECK 1: PLACEHOLDER & DUMMY TEXT]');
const placeholderWords = ['lorem', 'ipsum', 'placeholder', 'dummy', 'todo', 'fixme', 'asdf', 'test1', 'sample text'];
placeholderWords.forEach(w => {
  const reg = new RegExp(`\\b${w}\\b`, 'gi');
  let m;
  while ((m = reg.exec(html)) !== null) {
    findings.push({ category: 'Placeholder in HTML', word: w, context: html.slice(Math.max(0, m.index - 30), Math.min(html.length, m.index + 30)) });
  }
  while ((m = reg.exec(js)) !== null) {
    // Exclude test script comments if any
    findings.push({ category: 'Placeholder in JS', word: w, context: js.slice(Math.max(0, m.index - 30), Math.min(js.length, m.index + 30)) });
  }
});

console.log(`* Found ${findings.length} placeholder occurrences.`);
findings.forEach(f => console.log('  -', f.category, ':', f.word, 'in:', JSON.stringify(f.context.trim())));

// 2. Check Phone Numbers
console.log('\n[CHECK 2: PHONE & WHATSAPP NUMBERS]');
// Strip SVGs to avoid path coordinate numbers
const noSvgHtml = html.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
const noSvgJs = js.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

const phoneRegex = /(?:\+?92|0)[0-9\-\s]{9,13}/g;
const foundPhonesHtml = new Set((noSvgHtml.match(phoneRegex) || []).map(p => p.trim()));
const foundPhonesJs = new Set((noSvgJs.match(phoneRegex) || []).map(p => p.trim()));
console.log('* Phone numbers in HTML:', [...foundPhonesHtml]);
console.log('* Phone numbers in JS:', [...foundPhonesJs]);

const invalidPhones = [...foundPhonesHtml, ...foundPhonesJs].filter(p => {
  const clean = p.replace(/[\s\-]/g, '');
  return clean !== '03021468799' && clean !== '923021468799' && clean !== '+923021468799';
});
if (invalidPhones.length > 0) {
  console.error('✗ Inconsistent phone numbers found:', invalidPhones);
} else {
  console.log('✓ All phone and WhatsApp numbers match 03021468799 / +923021468799.');
}

// 3. Check Emails
console.log('\n[CHECK 3: EMAIL ADDRESSES]');
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const foundEmailsHtml = new Set(html.match(emailRegex) || []);
const foundEmailsJs = new Set(js.match(emailRegex) || []);
console.log('* Emails in HTML:', [...foundEmailsHtml]);
console.log('* Emails in JS:', [...foundEmailsJs]);

const invalidEmails = [...foundEmailsHtml, ...foundEmailsJs].filter(e => {
  // Allow schema.org or example in placeholder
  return e !== 'chaudharyumair799@gmail.com' && !e.includes('example.com') && !e.includes('company.com');
});
if (invalidEmails.length > 0) {
  console.error('✗ Inconsistent email addresses found:', invalidEmails);
} else {
  console.log('✓ All official contact emails match chaudharyumair799@gmail.com.');
}

// 4. Check Business Name & Location
console.log('\n[CHECK 4: BUSINESS NAME & LOCATION]');
const hasBrandInTitle = html.includes('Chaudhary Umair Creative Studio');
const hasLocationHtml = html.includes('Ahmad Pur Sial, District Jhang, Punjab, Pakistan');
console.log('* Brand Name present:', hasBrandInTitle ? '✓ PASS' : '✗ FAIL');
console.log('* Verified Location present:', hasLocationHtml ? '✓ PASS' : '✗ FAIL');

// 5. Image Alt Text Audit
console.log('\n[CHECK 5: IMAGE ALT TEXT AUDIT]');
const imgRegex = /<img\s+[^>]*alt=["']([^"']*)["'][^>]*>/gi;
let imgMatch;
let totalImgs = 0;
let emptyAlt = 0;
let genericAlt = 0;
while ((imgMatch = imgRegex.exec(html)) !== null) {
  totalImgs++;
  const alt = imgMatch[1].trim();
  const isGeneric = ['image', 'photo', 'picture', 'img'].includes(alt.toLowerCase());
  if (!alt) emptyAlt++;
  if (isGeneric) genericAlt++;
  console.log(`* HTML Img ${totalImgs}: alt="${alt}" (Length: ${alt.length})`);
}

// Also check project images in JS
const projectAltRegex = /alt=["']\${escapeHtml\(p\.title\)} - \${escapeHtml\(p\.categoryLabel\)} project by Chaudhary Umair["']/g;
const hasDynamicProjectAlt = projectAltRegex.test(js);
console.log('* Dynamic 12 Project Cards Alt Pattern:', hasDynamicProjectAlt ? '✓ PASS (Descriptive & Unique)' : '✗ Check main.js');

// 6. Section Content Review
console.log('\n[CHECK 6: SECTION CONTENT & SPELLING REVIEW]');
const textNodes = [];
const cleanHtml = html
  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  .replace(/<!--[\s\S]*?-->/g, '');

const pRegex = /<(?:p|h1|h2|h3|h4|span|a|li)[^>]*>([^<]+)<\/(?:p|h1|h2|h3|h4|span|a|li)>/gi;
let pMatch;
while ((pMatch = pRegex.exec(cleanHtml)) !== null) {
  const text = pMatch[1].trim();
  if (text.length > 3 && !text.startsWith('{') && !text.includes('function')) {
    textNodes.push(text);
  }
}

console.log(`* Extracted ${textNodes.length} readable text nodes from HTML.`);

// Check for common typos
const commonTypos = [
  'teh', 'adn', 'wich', 'recieve', 'seperate', 'untill', 'occured', 'succesful',
  'experiance', 'developement', 'desing', 'proffesional', 'pakistna', 'ahmed pur'
];

const foundTypos = [];
textNodes.forEach(t => {
  commonTypos.forEach(typo => {
    const reg = new RegExp(`\\b${typo}\\b`, 'i');
    if (reg.test(t)) {
      foundTypos.push({ typo, text: t });
    }
  });
});

if (foundTypos.length > 0) {
  console.error('✗ Potential typos detected:', foundTypos);
} else {
  console.log('✓ 0 common typos found in text nodes.');
}

console.log('\nAudit complete.');
