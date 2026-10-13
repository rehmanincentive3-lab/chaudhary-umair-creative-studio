# Chaudhary Umair Creative Studio — Portfolio Website

Official website for **Chaudhary Umair Creative Studio** — a premium creative design, web development, and cinematic AI visual production portfolio.

---

## 1. Project Overview & Architecture

* **Framework:** Pure Vanilla HTML5, CSS3 (Custom Design System), ES6+ JavaScript.
* **Architecture:** Static single-page application (SPA) with section-based routing (`#home`, `#about`, `#services`, `#portfolio`, `#contact`).
* **Design Identity:** Master Studio Standard.
* **Strict 4-Color Palette:**
  * **Deep Charcoal:** `#171717`
  * **Champagne Gold:** `#C9A96E`
  * **Black:** `#000000`
  * **Warm White:** `#F5F1E8`
* **Local HTTP Server:** Lightweight Node.js server (`server.js`) supporting HTTP 206 Partial Content range requests for smooth MP4 video streaming.

---

## 2. Directory Structure

```text
umair creative studio/
├── index.html            # Semantic master page structure & schema markup
├── css/
│   └── style.css         # Complete design system, responsive breakpoints & a11y rules
├── js/
│   └── main.js           # 9:16 Video carousel engine, gallery filter & form handler
├── assets/
│   ├── logo.png          # Monogram & brand badge
│   ├── hero-umair.png    # High-resolution hero workstation visual (no video)
│   ├── projects/         # 12 project showcase images (16:9 cards)
│   ├── videos/           # 6 vertical 9:16 video reels (1080x1920)
│   └── posters/          # 6 high-res poster frames for instant lazy-loading
├── robots.txt            # Search crawler directives
├── sitemap.xml           # XML Sitemap
├── server.js             # Local streaming server (supports Range headers)
├── audit.js              # Compliance audit script (16 requirements)
├── test-links.js         # DOM link, ID, and asset integrity checker
├── test-browser-cdp.js   # Automated Chrome DevTools Protocol test suite
└── README.md             # Client handover documentation
```

---

## 3. Business Information & Channels

* **Studio Name:** Chaudhary Umair Creative Studio
* **Founder / Lead:** Chaudhary Umair
* **Location:** Ahmad Pur Sial, District Jhang, Punjab, Pakistan
* **Direct Phone:** `03021468799`
* **WhatsApp Direct:** `03021468799` (`https://wa.me/923021468799`)
* **Email:** `chaudharyumair799@gmail.com`

---

## 4. Key Implemented Features

1. **Header & Navigation:**
   * Glassmorphism sticky navbar with backdrop blur.
   * Responsive navigation links with scroll-spy active indicators.
   * Mobile toggle menu with auto-collapse on item click.
   * Accessible skip-to-content keyboard shortcut (`Tab`).
2. **Hero Section:**
   * Hero image artwork ([`assets/hero-umair.png`](assets/hero-umair.png)) with `loading="eager"` and `fetchpriority="high"`.
   * Live statistics counter (50+ Projects, 20+ Happy Clients, 100% Satisfaction).
   * **Strictly zero video in the Hero section.**
3. **Services (What I Do):**
   * 8 core service cards: Graphic Design, Website Development, UI/UX Design, AI Video Creation, Branding & Brand Identity, Social Media Design, E-Commerce / Online Store, Digital Creative Services.
4. **Featured Projects & Gallery:**
   * **8 Category Filter Tabs:** Interactive filtering across project domains.
   * **9:16 Vertical Video Reels Carousel:**
     * Single vertical video stage centered prominently (`← VIDEO →`).
     * Left/Right arrow navigation with smooth transitions.
     * Dynamic synchronization of Video Title, Category, and Description.
     * Reel indicator counter (`01 / 06` to `06 / 06`).
     * Touch/swipe gestures enabled with vertical scroll protection.
     * Audio toggle button synchronized with native player volume changes.
     * No autoplay with sound (starts paused with preloaded poster).
   * **12 Image Projects Showcase:**
     * All 12 image projects preserved with Title, Category, Description, and View Project button.
     * Interactive Lightbox Modal with full keyboard support (`Enter`, `Escape`) and direct "Inquire About This Service" CTA that pre-selects the category in the contact form.
5. **Contact Inquiry Form:**
   * Validates Name (min 2 chars), Email (regex), Service selection, and Overview (min 5 chars).
   * Generates direct pre-filled WhatsApp and Email delivery options.
   * Honest client-side delivery without pretending a backend API was called.
6. **Accessibility & SEO:**
   * Schema.org `ProfessionalService` JSON-LD structured data.
   * Open Graph & Twitter Cards for social previews.
   * `:focus-visible` Gold outline indicators for keyboard navigation.
   * `@media (prefers-reduced-motion: reduce)` motion tolerance.
   * Zero Cumulative Layout Shift (CLS) with explicit `width`/`height` attributes.

---

## 5. How to Run Locally

### Prerequisites
* [Node.js](https://nodejs.org/) v18+ (tested on Node v22.23.2).
* No external npm package installations required (uses native Node.js HTTP and FS APIs).

### Step-by-Step
1. Open PowerShell or Terminal in the project directory:
   ```powershell
   cd "c:\Users\Al-Wajid Laptops\Downloads\umair creative studio"
   ```
2. Start the local streaming server:
   ```powershell
   node server.js
   ```
3. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## 6. How to Run Automated Quality Tests

Run the three automated test suites directly in terminal:

```powershell
# 1. Check all DOM IDs, links, anchors, and asset paths:
node test-links.js

# 2. Run real Google Chrome headless automated test (CDP):
node test-browser-cdp.js

# 3. Run master 16-criteria compliance audit:
node audit.js
```

---

## 7. Deployment & Hosting Options

This website is a zero-dependency, pre-rendered static application. It can be hosted on any modern static hosting service with zero monthly server costs and automatic global CDN caching.

### Option A: Cloudflare Pages (Recommended for Video & Global Performance)
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages**.
2. Click **Create Application** > **Pages** > **Connect to Git** (or drag & drop the folder).
3. Build Settings:
   * **Framework Preset:** None (Static HTML)
   * **Build Command:** Leave blank (or `npm run build`)
   * **Build Output Directory:** `.` (root directory)
4. Click **Deploy Site**. Cloudflare will automatically read `_headers` to apply caching and security headers.

### Option B: Vercel
1. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Import the Git repository or deploy via Vercel CLI (`vercel`).
3. Vercel automatically detects `vercel.json` for caching and security headers.
4. Output Directory: `.` (root).

### Option C: Netlify
1. Log in to [Netlify](https://www.netlify.com/) and click **Add new site** > **Import an existing project** (or drag-and-drop the directory).
2. Publish directory: `.`
3. Build command: Leave blank.

### Option D: Traditional Apache / Nginx / cPanel Server
1. Upload the entire project contents to `public_html` or `/var/www/html/`.
2. Ensure Nginx or Apache has `mp4` range-request support enabled (standard in all default Nginx/Apache configurations).

---

## 8. Custom Domain & DNS Configuration Guide

When ready to link a custom domain (e.g. `chaudharyumair.com`):

1. **Purchase Domain:** Ensure the domain is registered under the client's registrar (Namecheap, GoDaddy, Cloudflare Registrar, etc.).
2. **Add Domain in Hosting Dashboard:**
   * In Cloudflare Pages / Vercel / Netlify, navigate to **Custom Domains** and add `chaudharyumair.com` and `www.chaudharyumair.com`.
3. **Configure DNS Records at Domain Registrar:**
   * **Apex Domain (`@`):**
     * If using Cloudflare: Managed automatically.
     * If using Vercel: Add `A` record pointing to `76.76.21.21`.
     * If using Netlify: Add `A` record pointing to `75.2.60.5`.
   * **Subdomain (`www`):**
     * Add `CNAME` record with Name `www` pointing to the provider's domain target (e.g. `cname.vercel-dns.com` or Cloudflare Pages alias).
4. **SSL / TLS Certificate:**
   * Automatically provisioned free of charge by Cloudflare / Vercel / Netlify via Let's Encrypt / Cloudflare Edge SSL.
5. **Update Website Files (One-time step):**
   * In `index.html`: Add `<link rel="canonical" href="https://chaudharyumair.com/">` inside `<head>`.
   * In `sitemap.xml`: Change `<loc>/</loc>` to `<loc>https://chaudharyumair.com/</loc>`.

---

## 9. Troubleshooting Guide

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **Video doesn't seek/stream smoothly** | Server lacks HTTP 206 Partial Content Range support | Use `node server.js` locally or deploy to Cloudflare Pages/Vercel/Nginx, which natively support HTTP 206 range streaming. |
| **Old cached assets appear after an update** | Browser or CDN caching active assets | Hard refresh in browser (`Ctrl + Shift + R` or `Cmd + Shift + R`). The `_headers` file configures 1-year cache on static assets; update filename query string if re-deploying modified assets (e.g. `style.css?v=2`). |
| **Mobile video doesn't play audio initially** | Browser autoplay policy blocks unmuted video | Videos start muted by design as per requirements. Users can unmute at any time via the gold sound toggle button. |
| **Horizontal scrollbar appears on narrow screens** | Elements exceeding viewport width | All elements are verified responsive down to 320px. Ensure no inline styles with fixed `width` greater than `100%` or `100vw` are added. |

---

## 10. Rollback Procedures

If an unexpected change is pushed to production:
1. **Cloudflare Pages / Vercel / Netlify:**
   * Go to **Deployments** tab in the hosting dashboard.
   * Locate the previous stable deployment.
   * Click the three dots (`...`) and select **Rollback to this deployment**.
   * Instant rollback takes effect globally in under 5 seconds.
2. **Git Rollback:**
   * Run `git revert HEAD` to cleanly reverse the latest commit.
   * Push the revert commit to automatically trigger a stable deployment.

---

## 11. Client Handover & Ownership Transfer Checklist

### Accounts & Services
* **Domain Registrar:** Registered under client's name (e.g., Namecheap / Cloudflare Registrar).
* **Hosting Provider:** Client's own free Cloudflare Pages or Vercel account.
* **Email & Inquiries:**
  * Inquiries route directly to `chaudharyumair799@gmail.com` and WhatsApp `03021468799`.
  * No third-party API subscription costs or recurring billing.

### Deliverables Transferred
* Complete semantic source code ([`index.html`](index.html), [`css/style.css`](css/style.css), [`js/main.js`](js/main.js)).
* All 12 high-resolution project images in [`assets/projects/`](assets/projects/).
* All 6 vertical 9:16 video reels in [`assets/videos/`](assets/videos/) and poster frames in [`assets/posters/`](assets/posters/).
* Studio monogram logo in [`assets/logo.png`](assets/logo.png).
* Automated test suites ([`test-links.js`](test-links.js), [`test-browser-cdp.js`](test-browser-cdp.js), [`audit.js`](audit.js)).
* Static caching & hosting configurations ([`_headers`](_headers), [`vercel.json`](vercel.json), [`package.json`](package.json)).
* SEO sitemap ([`sitemap.xml`](sitemap.xml)) and crawler rules ([`robots.txt`](robots.txt)).

