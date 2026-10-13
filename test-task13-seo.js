const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('TASK 13: ADVANCED SEO, GEO AND SEARCH READINESS AUDIT');
console.log('================================================================\n');

let totalErrors = 0;

// 1. Audit index.html Title & Description
console.log('[CHECK 1: PAGE TITLE & META DESCRIPTION]');
const html = fs.readFileSync('index.html', 'utf8');

const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
if (titleMatch) {
  const title = titleMatch[1].trim();
  console.log(`✓ Page Title (${title.length} chars): "${title}"`);
  if (!title.includes('Chaudhary Umair Creative Studio')) {
    console.error('✗ Title missing brand name');
    totalErrors++;
  }
} else {
  console.error('✗ Missing <title> tag');
  totalErrors++;
}

const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
if (descMatch) {
  const desc = descMatch[1].trim();
  console.log(`✓ Meta Description (${desc.length} chars): "${desc}"`);
  if (!desc.includes('Chaudhary Umair Creative Studio') || !desc.includes('Ahmad Pur Sial')) {
    console.error('✗ Description missing brand or location');
    totalErrors++;
  }
} else {
  console.error('✗ Missing meta description');
  totalErrors++;
}

// 2. Headings Hierarchy Audit
console.log('\n[CHECK 2: HEADING HIERARCHY (H1 - H6)]');
const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
const headings = [];
let hMatch;
while ((hMatch = headingRegex.exec(html)) !== null) {
  headings.push({
    level: parseInt(hMatch[1], 10),
    text: hMatch[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ')
  });
}

console.log(`* Found ${headings.length} headings in DOM:`);
let h1Count = 0;
let prevLevel = 1;
let hierarchyValid = true;

headings.forEach(h => {
  console.log(`  [H${h.level}] ${h.text}`);
  if (h.level === 1) h1Count++;
  if (h.level > prevLevel + 1) {
    hierarchyValid = false;
    console.error(`  ✗ Skipped heading level: from H${prevLevel} directly to H${h.level}`);
  }
  prevLevel = h.level;
});

if (h1Count === 1) {
  console.log('✓ Exactly ONE primary H1 found on page.');
} else {
  console.error(`✗ Expected exactly 1 H1, found ${h1Count}`);
  totalErrors++;
}

if (hierarchyValid) {
  console.log('✓ Heading hierarchy is strictly sequential (no skipped levels).');
} else {
  totalErrors++;
}

// 3. Semantic Landmarks & Main Content
console.log('\n[CHECK 3: SEMANTIC HTML5 LANDMARKS]');
const hasHeader = /<header\b[^>]*>/i.test(html);
const hasNav = /<nav\b[^>]*>/i.test(html);
const hasMain = /<main\b[^>]*id=["']mainContent["'][^>]*>/i.test(html);
const hasFooter = /<footer\b[^>]*>/i.test(html);

console.log(`* <header>: ${hasHeader ? '✓ PASS' : '✗ FAIL'}`);
console.log(`* <nav>: ${hasNav ? '✓ PASS' : '✗ FAIL'}`);
console.log(`* <main id="mainContent">: ${hasMain ? '✓ PASS' : '✗ FAIL'}`);
console.log(`* <footer>: ${hasFooter ? '✓ PASS' : '✗ FAIL'}`);

if (!hasHeader || !hasNav || !hasMain || !hasFooter) totalErrors++;

// 4. Geo & Local Metadata Audit
console.log('\n[CHECK 4: GEO & LOCAL SEARCH METADATA]');
const geoRegionMatch = html.match(/<meta\s+name=["']geo\.region["']\s+content=["']([^"']+)["']/i);
const geoPlaceMatch = html.match(/<meta\s+name=["']geo\.placename["']\s+content=["']([^"']+)["']/i);

if (geoRegionMatch) {
  console.log(`✓ geo.region: "${geoRegionMatch[1]}"`);
} else {
  console.error('✗ Missing geo.region');
  totalErrors++;
}

if (geoPlaceMatch) {
  console.log(`✓ geo.placename: "${geoPlaceMatch[1]}"`);
} else {
  console.error('✗ Missing geo.placename');
  totalErrors++;
}

// 5. Open Graph & Social Cards
console.log('\n[CHECK 5: OPEN GRAPH & TWITTER CARDS]');
const ogTags = ['og:site_name', 'og:type', 'og:title', 'og:description', 'og:image', 'og:image:alt', 'og:locale'];
ogTags.forEach(tag => {
  const reg = new RegExp(`<meta\\s+property=["']${tag}["']\\s+content=["']([^"']+)["']`, 'i');
  const m = html.match(reg);
  if (m) console.log(`✓ ${tag}: "${m[1]}"`);
  else {
    console.error(`✗ Missing ${tag}`);
    totalErrors++;
  }
});

const twitterTags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt'];
twitterTags.forEach(tag => {
  const reg = new RegExp(`<meta\\s+name=["']${tag}["']\\s+content=["']([^"']+)["']`, 'i');
  const m = html.match(reg);
  if (m) console.log(`✓ ${tag}: "${m[1]}"`);
  else {
    console.error(`✗ Missing ${tag}`);
    totalErrors++;
  }
});

// 6. Schema.org JSON-LD Structured Data Audit
console.log('\n[CHECK 6: SCHEMA.ORG JSON-LD STRUCTURED DATA]');
const jsonLdMatch = html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
if (jsonLdMatch) {
  try {
    const parsed = JSON.parse(jsonLdMatch[1]);
    console.log('✓ JSON-LD Syntax: Valid JSON');
    
    // Check graph items
    const graph = parsed['@graph'] || [parsed];
    const webSite = graph.find(item => item['@type'] === 'WebSite');
    const service = graph.find(item => item['@type'] === 'ProfessionalService');

    if (webSite) console.log(`✓ WebSite Schema present: "${webSite.name}"`);
    else {
      console.error('✗ Missing WebSite schema');
      totalErrors++;
    }

    if (service) {
      console.log(`✓ ProfessionalService Schema present: "${service.name}"`);
      console.log(`  - Telephone: ${service.telephone}`);
      console.log(`  - Email: ${service.email}`);
      console.log(`  - Locality: ${service.address.addressLocality}`);
      console.log(`  - Region: ${service.address.addressRegion}`);
      console.log(`  - Country: ${service.address.addressCountry}`);
      console.log(`  - Founder: ${service.founder.name} (${service.founder.jobTitle})`);
      console.log(`  - Offers: ${service.hasOfferCatalog.itemListElement.length} studio services cataloged`);

      // Verify no fake claims
      if (service.aggregateRating || service.review || service.award) {
        console.error('✗ Fake reviews/ratings/awards detected in Schema.org markup!');
        totalErrors++;
      } else {
        console.log('✓ Zero invented reviews, ratings, or awards in structured data.');
      }
    } else {
      console.error('✗ Missing ProfessionalService schema');
      totalErrors++;
    }
  } catch (err) {
    console.error('✗ JSON-LD Parse Error:', err.message);
    totalErrors++;
  }
} else {
  console.error('✗ Missing JSON-LD script tag');
  totalErrors++;
}

// 7. Sitemap & Robots.txt Audit
console.log('\n[CHECK 7: SITEMAP & ROBOTS.TXT]');
if (fs.existsSync('robots.txt')) {
  const robots = fs.readFileSync('robots.txt', 'utf8');
  console.log('✓ robots.txt exists:\n' + robots.trim().split('\n').map(l => '  ' + l).join('\n'));
} else {
  console.error('✗ robots.txt missing');
  totalErrors++;
}

if (fs.existsSync('sitemap.xml')) {
  const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
  console.log('✓ sitemap.xml exists:\n' + sitemap.trim().split('\n').map(l => '  ' + l).join('\n'));
} else {
  console.error('✗ sitemap.xml missing');
  totalErrors++;
}

// 8. Canonical Tag Check
console.log('\n[CHECK 8: CANONICAL CONFIGURATION]');
const hasCanonical = /<link\s+rel=["']canonical["']/i.test(html);
if (!hasCanonical) {
  console.log('✓ Canonical tag properly omitted until production custom domain is verified (per strict instructions).');
} else {
  console.log('* Canonical tag found in HTML.');
}

console.log('\n================================================================');
if (totalErrors === 0) {
  console.log('ALL ADVANCED SEO & GEO AUDIT CHECKS PASSED (100%)!');
} else {
  console.error(`AUDIT COMPLETED WITH ${totalErrors} ISSUES.`);
  process.exit(1);
}
console.log('================================================================');
