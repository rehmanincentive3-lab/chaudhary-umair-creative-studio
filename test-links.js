const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('index.html', 'utf8');

const idRegex = /id=["']([^"']+)["']/g;
const hrefRegex = /href=["']([^"']+)["']/g;
const srcRegex = /src=["']([^"']+)["']/g;

const ids = new Set();
let match;
while ((match = idRegex.exec(html)) !== null) {
  ids.add(match[1]);
}

console.log('--- FOUND IDS (' + ids.size + ') ---');
console.log([...ids].join(', '));

console.log('\n--- CHECKING INTERNAL HREFS ---');
let hrefErrors = 0;
while ((match = hrefRegex.exec(html)) !== null) {
  const href = match[1];
  if (href.startsWith('#')) {
    const targetId = href.slice(1);
    const exists = ids.has(targetId);
    console.log((exists ? '[OK] ' : '[BROKEN] ') + href + (exists ? '' : ' NOT FOUND IN DOM!'));
    if (!exists) hrefErrors++;
  } else if (!href.startsWith('http') && !href.startsWith('tel:') && !href.startsWith('mailto:')) {
    const filePath = path.join(__dirname, href.split('#')[0].split('?')[0]);
    const exists = fs.existsSync(filePath);
    console.log((exists ? '[OK] ' : '[BROKEN] ') + href + (exists ? '' : ' FILE NOT FOUND!'));
    if (!exists) hrefErrors++;
  } else {
    console.log('[EXTERNAL/PROTOCOL] ' + href);
  }
}

console.log('\n--- CHECKING SRC ATTRIBUTES ---');
let srcErrors = 0;
while ((match = srcRegex.exec(html)) !== null) {
  const src = match[1];
  if (src && !src.startsWith('http') && !src.startsWith('data:')) {
    const filePath = path.join(__dirname, src.split('?')[0]);
    const exists = fs.existsSync(filePath);
    console.log((exists ? '[OK] ' : '[BROKEN] ') + src + (exists ? '' : ' FILE NOT FOUND!'));
    if (!exists) srcErrors++;
  }
}

// Also check JS main.js asset paths
console.log('\n--- CHECKING JS MAIN.JS ASSETS ---');
const js = fs.readFileSync('js/main.js', 'utf8');
const assetPathRegex = /assets\/[a-zA-Z0-9_\-\/]+\.(png|jpg|jpeg|mp4)/g;
let jsMatch;
const jsAssets = new Set();
while ((jsMatch = assetPathRegex.exec(js)) !== null) {
  jsAssets.add(jsMatch[0]);
}

for (const asset of jsAssets) {
  const exists = fs.existsSync(path.join(__dirname, asset));
  console.log((exists ? '[OK] ' : '[BROKEN] ') + asset + (exists ? '' : ' FILE NOT FOUND!'));
  if (!exists) srcErrors++;
}

console.log('\n--- SUMMARY ---');
console.log('HREF Errors:', hrefErrors);
console.log('SRC/Asset Errors:', srcErrors);

if (hrefErrors > 0 || srcErrors > 0) {
  console.error('[FAIL] Link or asset errors detected.');
  process.exit(1);
} else {
  console.log('[PASS] All links and assets verified successfully.\n');
}
