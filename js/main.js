/**
 * CHAUDHARY UMAIR CREATIVE STUDIO - MAIN APPLICATION SCRIPT
 * Master Reference Standard
 * Features:
 * 1. Premium 9:16 Vertical Video Carousel (Single-view centered 9:16, left/right arrows, touch/swipe, play overlay & native controls)
 * 2. 12 Image Projects Gallery with Title, Category, Description, and View Project button
 * 3. 8 Professional Category Filters (All, Graphic Design, Web Development, UI/UX Design, AI Video, Branding, E-Commerce, Social Media)
 * 4. Interactive Lightbox Modal
 * 5. Performance optimization & lazy video initialization
 */

document.addEventListener('DOMContentLoaded', () => {

  // Defensive HTML sanitization helper
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ==========================================================================
  // 1. VIDEO CAROUSEL DATA (6 ORIGINAL 9:16 VERTICAL VIDEOS)
  // ==========================================================================
  const videosData = [
    {
      id: 1,
      title: "Cinematic AI Commercial & Creative Production",
      category: "AI Video Creation",
      desc: "Cinematic AI-powered videos and creative visual content designed for modern brands, products and digital campaigns.",
      src: "assets/videos/video-1-cinematic-ai.mp4",
      poster: "assets/posters/video-1-cinematic-ai.jpg",
      tag: "9:16 Vertical Reel"
    },
    {
      id: 2,
      title: "Complete Brand Identity Solutions",
      category: "Branding & Brand Identity",
      desc: "Complete brand identity solutions that bring together logos, visual systems and professional brand presentation.",
      src: "assets/videos/video-2-brand-identity.mp4",
      poster: "assets/posters/video-2-brand-identity.jpg",
      tag: "9:16 Vertical Reel"
    },
    {
      id: 3,
      title: "Creative & Professional Visual Designs",
      category: "Graphic Design",
      desc: "Creative and professional visual designs created to give brands a strong and memorable identity.",
      src: "assets/videos/video-3-visual-design.mp4",
      poster: "assets/posters/video-3-visual-design.jpg",
      tag: "9:16 Vertical Reel"
    },
    {
      id: 4,
      title: "Engaging Social Media Visuals & Promo Content",
      category: "Social Media Design",
      desc: "Engaging social media visuals and promotional content designed to help businesses communicate professionally online.",
      src: "assets/videos/video-4-social-media.mp4",
      poster: "assets/posters/video-4-social-media.jpg",
      tag: "9:16 Vertical Reel"
    },
    {
      id: 5,
      title: "Modern, Responsive & User-Focused Websites",
      category: "Website Development",
      desc: "Modern, responsive and user-focused websites designed to create a premium digital presence for businesses.",
      src: "assets/videos/video-5-responsive-websites.mp4",
      poster: "assets/posters/video-5-responsive-websites.jpg",
      tag: "9:16 Vertical Reel"
    },
    {
      id: 6,
      title: "Professional Online Store Experiences",
      category: "E-Commerce / Online Store",
      desc: "Professional online store experiences designed to showcase products and create a smooth digital shopping journey.",
      src: "assets/videos/video-6-ecommerce-store.mp4",
      poster: "assets/posters/video-6-ecommerce-store.jpg",
      tag: "9:16 Vertical Reel"
    }
  ];

  let currentVideoIndex = 0;
  let isTransitioning = false;

  const videoElement = document.getElementById('carouselVideo');
  const playOverlay = document.getElementById('playOverlay');
  const prevBtn = document.getElementById('prevVideoBtn');
  const nextBtn = document.getElementById('nextVideoBtn');
  const videoCategory = document.getElementById('videoCategory');
  const videoTitle = document.getElementById('videoTitle');
  const videoDesc = document.getElementById('videoDesc');
  const videoCounter = document.getElementById('videoCounter');
  const videoAudioToggle = document.getElementById('videoAudioToggle');
  const carouselDotsContainer = document.getElementById('carouselDots');
  const videoFrame = document.getElementById('videoFrame');
  const videoInfoCard = document.querySelector('.video-info-card');

  // Build dots
  if (carouselDotsContainer) {
    carouselDotsContainer.innerHTML = '';
    videosData.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to video reel ${index + 1}`);
      dot.addEventListener('click', () => switchVideo(index));
      carouselDotsContainer.appendChild(dot);
    });
  }

  function updateVideoView(index) {
    currentVideoIndex = index;
    const data = videosData[currentVideoIndex];

    // Pause, remove native controls, and reset source
    if (videoElement) {
      videoElement.pause();
      videoElement.controls = false;
      videoElement.src = data.src;
      videoElement.poster = data.poster;
      videoElement.load();
    }

    if (playOverlay) {
      playOverlay.classList.remove('hidden');
    }

    if (videoCategory) videoCategory.textContent = data.category;
    if (videoTitle) videoTitle.textContent = data.title;
    if (videoDesc) videoDesc.textContent = data.desc;
    if (videoCounter) videoCounter.textContent = `0${currentVideoIndex + 1} / 0${videosData.length}`;

    // Update dots
    const dots = carouselDotsContainer ? carouselDotsContainer.querySelectorAll('.carousel-dot') : [];
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentVideoIndex);
    });
  }

  function switchVideo(newIndex) {
    if (isTransitioning) return;
    isTransitioning = true;

    if (newIndex < 0) {
      newIndex = videosData.length - 1;
    } else if (newIndex >= videosData.length) {
      newIndex = 0;
    }

    // Trigger smooth slide/fade transition
    if (videoFrame) videoFrame.classList.add('slide-transition');
    if (videoInfoCard) videoInfoCard.classList.add('fade-out');

    if (videoElement) {
      videoElement.pause();
      videoElement.controls = false;
    }

    setTimeout(() => {
      updateVideoView(newIndex);
      if (videoFrame) videoFrame.classList.remove('slide-transition');
      if (videoInfoCard) videoInfoCard.classList.remove('fade-out');
      isTransitioning = false;
    }, 240);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => switchVideo(currentVideoIndex - 1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => switchVideo(currentVideoIndex + 1));
  }

  // Play / Pause handling with native controls on play
  if (videoFrame && videoElement) {
    videoFrame.addEventListener('click', (e) => {
      if (e.target.closest('#videoAudioToggle')) return;
      if (e.target === videoElement && videoElement.controls) return;

      if (videoElement.paused) {
        videoElement.controls = true;
        videoElement.play().then(() => {
          if (playOverlay) playOverlay.classList.add('hidden');
        }).catch(err => {
          console.warn("Playback error or autoplay restriction:", err);
        });
      } else {
        videoElement.pause();
        videoElement.controls = false;
        if (playOverlay) playOverlay.classList.remove('hidden');
      }
    });

    videoElement.addEventListener('play', () => {
      videoElement.controls = true;
      if (playOverlay) playOverlay.classList.add('hidden');
    });

    videoElement.addEventListener('pause', () => {
      if (videoElement.currentTime === 0 || videoElement.currentTime >= videoElement.duration - 0.5) {
        videoElement.controls = false;
        if (playOverlay) playOverlay.classList.remove('hidden');
      }
    });

    videoElement.addEventListener('ended', () => {
      videoElement.controls = false;
      videoElement.currentTime = 0;
      if (playOverlay) playOverlay.classList.remove('hidden');
    });
  }

  // Audio Toggle & Sync
  function updateAudioButton() {
    if (!videoAudioToggle || !videoElement) return;
    videoAudioToggle.innerHTML = videoElement.muted 
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
    videoAudioToggle.title = videoElement.muted ? "Unmute Audio" : "Mute Audio";
  }

  if (videoAudioToggle && videoElement) {
    videoAudioToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      videoElement.muted = !videoElement.muted;
      updateAudioButton();
    });

    videoElement.addEventListener('volumechange', updateAudioButton);
  }

  // Mobile Touch & Swipe Handling (Smooth swipe detection preventing accidental vertical scroll triggers)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const swipeStage = document.querySelector('.carousel-stage') || videoFrame;
  if (swipeStage) {
    swipeStage.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }
    }, { passive: true });

    swipeStage.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
      }
    }, { passive: true });
  }

  function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const threshold = 40;
    // Only trigger if horizontal swipe is clearly dominant over vertical scrolling
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        switchVideo(currentVideoIndex + 1); // Swiped left -> Next
      } else {
        switchVideo(currentVideoIndex - 1); // Swiped right -> Previous
      }
    }
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (e.key === 'ArrowLeft') {
      switchVideo(currentVideoIndex - 1);
    } else if (e.key === 'ArrowRight') {
      switchVideo(currentVideoIndex + 1);
    }
  });

  // Initial video setup
  updateVideoView(0);


  // ==========================================================================
  // 2. THE 12 IMAGE PROJECTS GALLERY (PRESERVED & COMPLETE)
  // Each card displays: Title, Category, Description, and View Project button
  // ==========================================================================
  const projectsData = [
    {
      id: 1,
      title: "TechNova",
      category: "branding",
      categoryLabel: "BRANDING",
      subtitle: "Branding • Logo Design",
      image: "assets/projects/project-1-technova.png",
      desc: "TechNova premium gold-embossed brand identity system, including custom monogram geometry, luxury packaging design, and brand guideline documentation.",
      objective: "Establish an authoritative, high-prestige visual identity for an enterprise software consulting firm.",
      approach: "Constructed a mathematical geometric monogram combining gold-foil letterforms with minimal Swiss typography and dark slate background.",
      deliverables: ["Vector Monogram & Mark", "Brand Identity Guidelines", "Luxury Stationery & Mockups"]
    },
    {
      id: 2,
      title: "Luxury Furniture",
      category: "web-development",
      categoryLabel: "WEB DEVELOPMENT",
      subtitle: "Web Development • UI/UX",
      image: "assets/projects/project-2-luxury-furniture.png",
      desc: "An architectural interior and luxury furniture digital presence featuring high-performance responsive web layouts, interactive room showcases, and refined typography.",
      objective: "Create an architectural digital showcase for a bespoke handcrafted interior furnishing studio.",
      approach: "Engineered high-performance editorial layouts with responsive grid scaling, fluid room navigation, and sub-second load times.",
      deliverables: ["Responsive Web Architecture", "Interactive Room Catalog", "Performance Optimization"]
    },
    {
      id: 3,
      title: "Travel Promo",
      category: "ai-video",
      categoryLabel: "AI VIDEO",
      subtitle: "AI Video • Motion Graphics",
      image: "assets/projects/project-3-travel-promo.png",
      desc: "Cinematic landscape motion visuals generated using state-of-the-art AI video synthesis and color graded for modern digital promotional campaigns.",
      objective: "Produce cinematic video teaser visuals for a premium expedition travel agency.",
      approach: "Choreographed high-dynamic AI landscape synthesis with precision temporal consistency and golden-hour color grading.",
      deliverables: ["9:16 Vertical Reel Master", "Cinematic AI Prompts", "Color Graded Assets"]
    },
    {
      id: 4,
      title: "Product Ad Design",
      category: "social-media",
      categoryLabel: "SOCIAL MEDIA",
      subtitle: "Graphic Design • Social Media",
      image: "assets/projects/project-4-product-ad.png",
      desc: "High-impact social media advertising suite for flagship mobile devices, structured with clean hierarchy, dark charcoal backdrops, and gold accent styling.",
      objective: "Drive conversion and engagement for a flagship smartphone digital ad campaign.",
      approach: "Designed high-contrast dark-mode graphics with glowing champagne gold lighting accents and bold feature typography.",
      deliverables: ["Multi-Platform Ad Creatives", "Social Story Formats", "Vector Feature Badges"]
    },
    {
      id: 5,
      title: "Shoe Store",
      category: "ecommerce",
      categoryLabel: "E-COMMERCE",
      subtitle: "Web Development • E-commerce",
      image: "assets/projects/project-5-shoe-store.png",
      desc: "Full-scale modern digital storefront featuring intuitive shopping navigation, product catalog filters, smooth checkout flows, and responsive mobile architecture.",
      objective: "Develop a seamless mobile-first e-commerce interface for a designer athletic footwear boutique.",
      approach: "Streamlined customer purchase flow with instant product filtering, sticky cart triggers, and accessible checkout ergonomics.",
      deliverables: ["E-Commerce Storefront UI", "Product Catalog Grid", "Cart & Checkout Flow"]
    },
    {
      id: 6,
      title: "Business Branding",
      category: "branding",
      categoryLabel: "BRANDING",
      subtitle: "Logo Design • Brand Identity",
      image: "assets/projects/project-6-business-branding.png",
      desc: "Comprehensive executive branding suite for corporate leadership, integrating bespoke stationery, business cards, foil badges, and consistent digital brand direction.",
      objective: "Design a cohesive executive identity suite for a boutique corporate management consultancy.",
      approach: "Paired bespoke geometric typography with foil-stamped business cards, letterheads, and corporate presentation templates.",
      deliverables: ["Executive Stationery Suite", "Print-Ready Vector Files", "Digital Presentation Deck"]
    },
    {
      id: 7,
      title: "AURA Digital Luxury",
      category: "web-development",
      categoryLabel: "WEB DEVELOPMENT",
      subtitle: "Bespoke Web Development • UI/UX",
      image: "assets/projects/project-7-aura-digital.jpg",
      desc: "Aura bespoke digital luxury platform engineered with fluid animations, micro-interactions, dark aesthetic architecture, and gold typography.",
      objective: "Craft an immersive web experience for an avant-garde digital luxury and lifestyle agency.",
      approach: "Implemented smooth micro-interactions, dark aesthetic architecture, custom typography hierarchies, and mobile touch optimization.",
      deliverables: ["Interactive Portfolio UI", "Custom CSS Micro-Animations", "Full-Stack Deployment"]
    },
    {
      id: 8,
      title: "MAISON Luxury Fragrance",
      category: "ecommerce",
      categoryLabel: "E-COMMERCE",
      subtitle: "E-Commerce • Luxury Fragrance",
      image: "assets/projects/project-8-maison-store.jpg",
      desc: "High-end bespoke e-commerce boutique for artisanal fragrances, crafted with seamless cart transitions, multi-device layouts, and refined product storytelling.",
      objective: "Build an artisanal online boutique celebrating sensory storytelling and limited-edition perfumery.",
      approach: "Created an editorial product catalog with ingredient narratives, atmospheric background gradients, and frictionless checkout.",
      deliverables: ["Bespoke E-Commerce UI", "Fragrance Storytelling Layouts", "Mobile-Optimized Cart"]
    },
    {
      id: 9,
      title: "Corporate Brand Identity",
      category: "branding",
      categoryLabel: "BRANDING",
      subtitle: "Brand Guidelines • Stationery Suite",
      image: "assets/projects/project-9-brand-identity.jpg",
      desc: "An elaborate corporate identity suite consisting of tactile embossed stationery, letterheads, packaging envelopes, and luxury gold-stamped guidelines book.",
      objective: "Deliver a comprehensive institutional visual system for a high-growth financial technology firm.",
      approach: "Formulated a unified brand book encompassing typography rules, color accessibility standards, stationery, and packaging assets.",
      deliverables: ["40-Page Brand Guideline Book", "Stationery & Packaging System", "Digital Asset Library"]
    },
    {
      id: 10,
      title: "Social Media Campaign Design",
      category: "social-media",
      categoryLabel: "SOCIAL MEDIA",
      subtitle: "Creative Direction • Campaign Design",
      image: "assets/projects/project-10-social-campaign.jpg",
      desc: "Curated editorial social campaign design for luxury fashion labels, establishing consistent visual grids, carousel templates, and responsive story formats.",
      objective: "Elevate digital engagement and brand coherence across multi-channel social feeds for a fashion brand.",
      approach: "Developed reusable editorial templates, carousel post frameworks, and high-engagement promotional banners.",
      deliverables: ["Editorial Carousel Templates", "Stories & Reels Graphics", "Social Asset Toolkit"]
    },
    {
      id: 11,
      title: "AURUM Timeless Spaces",
      category: "ui-ux",
      categoryLabel: "UI/UX DESIGN",
      subtitle: "Architecture • Digital Experience",
      image: "assets/projects/project-11-aurum-architecture.jpg",
      desc: "Editorial architectural showcase website highlighting interior spaces, high-resolution photography, bespoke curation, and multi-display responsive design.",
      objective: "Present luxury architectural and interior residential spaces through a gallery-style digital experience.",
      approach: "Leveraged minimalist typography, full-bleed photography grids, and smooth transitions to highlight material craftsmanship.",
      deliverables: ["Architectural Gallery UI", "Responsive Touch Lightbox", "SEO Metadata Optimization"]
    },
    {
      id: 12,
      title: "Executive Creative Studio Suite",
      category: "graphic-design",
      categoryLabel: "GRAPHIC DESIGN",
      subtitle: "Studio Workspace • Visual Systems",
      image: "assets/projects/project-12-creative-workstation.jpg",
      desc: "Pan-system visual direction showcasing comprehensive digital branding systems, multi-screen responsive testing, and studio creative workflows.",
      objective: "Establish a comprehensive studio workspace and multi-disciplinary visual design framework.",
      approach: "Unified print, digital, and motion workflows with standardized color spaces, asset management, and client review systems.",
      deliverables: ["Integrated Design System", "Multi-Screen Quality Checks", "Production Pipeline Setup"]
    }
  ];

  const galleryGrid = document.getElementById('galleryGrid');
  const filterBtns = document.querySelectorAll('.filter-btn');

  function renderProjects(filter = 'all') {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';

    const filtered = filter === 'all' 
      ? projectsData 
      : projectsData.filter(p => p.category === filter);

    filtered.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.setAttribute('data-category', p.category);
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `View project details for ${escapeHtml(p.title)} (${escapeHtml(p.categoryLabel)})`);
      card.innerHTML = `
        <div class="project-thumbnail">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)} - ${escapeHtml(p.categoryLabel)} project by Chaudhary Umair" width="400" height="225" loading="lazy">
          <div class="project-overlay"></div>
        </div>
        <div class="project-meta">
          <div class="project-details">
            <span class="project-category">${escapeHtml(p.categoryLabel)}</span>
            <h3 class="project-title">${escapeHtml(p.title)}</h3>
            <span class="project-subtitle">${escapeHtml(p.subtitle)}</span>
            <p class="project-desc">${escapeHtml(p.desc)}</p>
            <div class="project-specs">
              <div class="project-spec-item"><span class="project-spec-label">Objective:</span> <span class="project-spec-val">${escapeHtml(p.objective)}</span></div>
              <div class="project-spec-item"><span class="project-spec-label">Approach:</span> <span class="project-spec-val">${escapeHtml(p.approach)}</span></div>
              <div class="project-deliverables-pills">
                ${(p.deliverables || []).map(d => `<span class="project-deliv-tag">${escapeHtml(d)}</span>`).join('')}
              </div>
            </div>
          </div>
          <div class="project-footer">
            <span class="project-view-btn">
              View Project
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </span>
            <div class="project-arrow-btn" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="7 7 17 7 17 17"/>
              </svg>
            </div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => openLightbox(p));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(p);
        }
      });
      galleryGrid.appendChild(card);
    });
  }

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetCategory = btn.getAttribute('data-filter');

      // If AI Video is selected, smoothly focus the 9:16 Video Showcase
      if (targetCategory === 'ai-video') {
        const videoShowcase = document.getElementById('videoShowcase');
        if (videoShowcase) {
          videoShowcase.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      renderProjects(targetCategory);
    });
  });

  // Initial gallery render
  renderProjects('all');


  // ==========================================================================
  // 3. LIGHTBOX MODAL
  // ==========================================================================
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCategory = document.getElementById('lightboxCategory');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDesc = document.getElementById('lightboxDesc');
  const lightboxSpecs = document.getElementById('lightboxSpecs');
  const lightboxClose = document.getElementById('lightboxClose');

  let activeLightboxProject = null;

  function openLightbox(project) {
    if (!lightboxModal) return;
    activeLightboxProject = project;
    lightboxImage.src = project.image;
    lightboxImage.alt = project.title;
    lightboxCategory.textContent = project.categoryLabel;
    lightboxTitle.textContent = project.title;
    lightboxDesc.textContent = project.desc;

    if (lightboxSpecs) {
      lightboxSpecs.innerHTML = `
        <div class="lightbox-spec-row">
          <strong>Objective:</strong>
          <span>${escapeHtml(project.objective)}</span>
        </div>
        <div class="lightbox-spec-row">
          <strong>Approach:</strong>
          <span>${escapeHtml(project.approach)}</span>
        </div>
        <div class="lightbox-spec-row">
          <strong>Scope:</strong>
          <div class="lightbox-deliv-list">
            ${(project.deliverables || []).map(d => `<span class="project-deliv-tag">${escapeHtml(d)}</span>`).join('')}
          </div>
        </div>
      `;
    }

    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  const lightboxInquireBtn = document.getElementById('lightboxInquireBtn');
  if (lightboxInquireBtn) {
    lightboxInquireBtn.addEventListener('click', () => {
      const categoryToSelect = activeLightboxProject ? activeLightboxProject.category : null;
      closeLightbox();
      const serviceSelect = document.getElementById('serviceType');
      if (serviceSelect) {
        if (categoryToSelect) {
          const match = Array.from(serviceSelect.options).find(opt => opt.value === categoryToSelect);
          if (match) {
            serviceSelect.value = match.value;
          }
        }
      } else {
        if (categoryToSelect) {
          window.location.href = `contact.html?service=${encodeURIComponent(categoryToSelect)}`;
        } else {
          window.location.href = 'contact.html';
        }
      }
    });
  }

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('active')) {
      closeLightbox();
    }
  });


  // ==========================================================================
  // 4. HEADER SCROLL & MOBILE NAVIGATION
  // ==========================================================================
  const header = document.querySelector('.site-header');
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.querySelector('.nav-menu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }, { passive: true });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const isOpen = navMenu.classList.contains('open');
      mobileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      mobileToggle.innerHTML = isOpen 
        ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
        : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
    });

    navMenu.querySelectorAll('.nav-link, .mobile-menu-cta').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
      });
    });
  }

  // Enforce active nav link matching current page URL in multi-page architecture
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else if (href && !href.startsWith('#')) {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });

  // Contact form submission with real validation and honest delivery
  const contactForm = document.getElementById('contactForm');
  const formFeedback = document.getElementById('formFeedback');

  if (contactForm) {
    function showFeedback(message, type = 'success') {
      if (!formFeedback) return;
      formFeedback.innerHTML = message;
      formFeedback.className = `form-feedback ${type}`;
      formFeedback.style.display = 'block';
      formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('clientName');
      const emailInput = document.getElementById('clientEmail');
      const serviceSelect = document.getElementById('serviceType');
      const budgetSelect = document.getElementById('projectBudget');
      const detailsInput = document.getElementById('projectDetails');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const serviceValue = serviceSelect ? serviceSelect.value : '';
      const serviceText = serviceSelect && serviceSelect.selectedOptions[0] ? serviceSelect.selectedOptions[0].text : serviceValue;
      const budgetValue = budgetSelect ? budgetSelect.value : '';
      const budgetText = budgetSelect && budgetSelect.selectedOptions[0] && budgetSelect.value ? budgetSelect.selectedOptions[0].text : 'To Be Discussed';
      const details = detailsInput ? detailsInput.value.trim() : '';

      // Field Validation
      if (!name || name.length < 2) {
        showFeedback('Please enter your full name (minimum 2 characters).', 'error');
        nameInput?.focus();
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showFeedback('Please enter a valid email address (e.g. name@company.com).', 'error');
        emailInput?.focus();
        return;
      }

      if (budgetSelect && !budgetValue) {
        showFeedback('Please select your target project budget tier.', 'error');
        budgetSelect?.focus();
        return;
      }

      if (!details || details.length < 5) {
        showFeedback('Please enter your project overview (minimum 5 characters).', 'error');
        detailsInput?.focus();
        return;
      }

      // Prepare direct delivery channels (WhatsApp: 03021468799, Email: chaudharyumair799@gmail.com)
      const messageText = `Hello Chaudhary Umair,\n\nMy name is ${name} (${email}).\nI am interested in your ${serviceText} services.\nTarget Budget: ${budgetText}\n\nProject Overview:\n${details}`;
      const whatsappUrl = `https://wa.me/923021468799?text=${encodeURIComponent(messageText)}`;
      const mailtoUrl = `mailto:chaudharyumair799@gmail.com?subject=${encodeURIComponent(`Project Inquiry: ${serviceText} - ${name}`)}&body=${encodeURIComponent(messageText)}`;

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send Project Inquiry';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Connecting to WhatsApp...</span>`;
      }

      showFeedback(
        `✦ Inquiry prepared! Opening WhatsApp (03021468799)...<br>` +
        `If WhatsApp does not open automatically, <a href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener noreferrer">click here to send via WhatsApp</a> or <a href="${escapeHtml(mailtoUrl)}">send via Direct Email</a>.`,
        'success'
      );

      // Trigger direct WhatsApp reach
      try {
        window.open(whatsappUrl, '_blank');
      } catch (err) {
        console.log("Direct reach link available in feedback container.", err);
      }

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }, 3000);
    });
  }

  // ==========================================================================
  // 5. 3-VIDEO SIMULTANEOUS VERTICAL REELS CAROUSEL CONTROLLER
  // Desktop: 3 videos simultaneously (View 1: 1-3, View 2: 4-6)
  // Tablet: 2 videos simultaneously
  // Mobile: 1 video at a time with swipe/arrow controls
  // ==========================================================================
  function initReelsMultiCarousel() {
    const track = document.getElementById('reelsTrack');
    const viewport = document.getElementById('reelsViewport');
    const prevBtn = document.getElementById('reelsPrevBtn');
    const nextBtn = document.getElementById('reelsNextBtn');
    const counter = document.getElementById('reelsCounter');
    const cards = track ? Array.from(track.querySelectorAll('.reel-card')) : [];

    if (!track || cards.length === 0) return;

    let currentView = 0;

    function getItemsPerView() {
      const w = window.innerWidth;
      if (w > 1024) return 3;
      if (w >= 768) return 2;
      return 1;
    }

    function getTotalViews() {
      const itemsPerView = getItemsPerView();
      return Math.ceil(cards.length / itemsPerView);
    }

    function updateCarouselPosition() {
      const itemsPerView = getItemsPerView();
      const totalViews = getTotalViews();
      if (currentView >= totalViews) currentView = totalViews - 1;
      if (currentView < 0) currentView = 0;

      const gapPx = 24;
      const viewportWidth = viewport ? viewport.clientWidth : window.innerWidth;
      const cardWidth = (viewportWidth - (itemsPerView - 1) * gapPx) / itemsPerView;
      const shiftPx = currentView * (viewportWidth + gapPx);

      track.style.transform = `translateX(-${shiftPx}px)`;

      if (counter) {
        if (itemsPerView === 3) {
          counter.textContent = currentView === 0 ? '01-03 / 06' : '04-06 / 06';
        } else if (itemsPerView === 2) {
          const start = currentView * 2 + 1;
          const end = Math.min(start + 1, cards.length);
          counter.textContent = `0${start}-0${end} / 0${cards.length}`;
        } else {
          counter.textContent = `0${currentView + 1} / 0${cards.length}`;
        }
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const totalViews = getTotalViews();
        currentView = (currentView - 1 + totalViews) % totalViews;
        updateCarouselPosition();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const totalViews = getTotalViews();
        currentView = (currentView + 1) % totalViews;
        updateCarouselPosition();
      });
    }

    window.addEventListener('resize', updateCarouselPosition);

    // Reel frame play/pause/audio logic
    cards.forEach(card => {
      const frame = card.querySelector('.reel-frame');
      const video = card.querySelector('.reel-video');
      const playOverlay = card.querySelector('.reel-play-overlay');
      const audioBtn = card.querySelector('.reel-audio-btn');

      if (!frame || !video) return;

      frame.addEventListener('click', (e) => {
        if (e.target.closest('.reel-audio-btn')) return;
        if (e.target === video && video.controls) return;

        if (video.paused) {
          // Pause all other videos
          document.querySelectorAll('.reel-video, #carouselVideo').forEach(otherVideo => {
            if (otherVideo !== video) {
              otherVideo.pause();
              otherVideo.controls = false;
              const otherOverlay = otherVideo.closest('.reel-frame')?.querySelector('.reel-play-overlay') || document.getElementById('playOverlay');
              if (otherOverlay) otherOverlay.classList.remove('hidden');
            }
          });

          video.controls = true;
          video.play().then(() => {
            if (playOverlay) playOverlay.classList.add('hidden');
          }).catch(err => {
            console.warn('Playback error:', err);
          });
        } else {
          video.pause();
          video.controls = false;
          if (playOverlay) playOverlay.classList.remove('hidden');
        }
      });

      video.addEventListener('play', () => {
        video.controls = true;
        if (playOverlay) playOverlay.classList.add('hidden');
      });

      video.addEventListener('pause', () => {
        if (video.currentTime === 0 || video.currentTime >= video.duration - 0.5) {
          video.controls = false;
          if (playOverlay) playOverlay.classList.remove('hidden');
        }
      });

      video.addEventListener('ended', () => {
        video.controls = false;
        video.currentTime = 0;
        if (playOverlay) playOverlay.classList.remove('hidden');
      });

      if (audioBtn) {
        audioBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          video.muted = !video.muted;
          audioBtn.innerHTML = video.muted 
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
        });
      }
    });

    // Touch swipe support for multi-carousel
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    viewport?.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        startX = e.changedTouches[0].screenX;
        startY = e.changedTouches[0].screenY;
      }
    }, { passive: true });

    viewport?.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        endX = e.changedTouches[0].screenX;
        endY = e.changedTouches[0].screenY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
          const totalViews = getTotalViews();
          if (deltaX < 0) {
            currentView = (currentView + 1) % totalViews;
          } else {
            currentView = (currentView - 1 + totalViews) % totalViews;
          }
          updateCarouselPosition();
        }
      }
    }, { passive: true });

    updateCarouselPosition();
  }

  initReelsMultiCarousel();

  // Query parameter support for contact page
  const urlParams = new URLSearchParams(window.location.search);
  const requestedService = urlParams.get('service');
  if (requestedService) {
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
      const match = Array.from(serviceSelect.options).find(opt => opt.value === requestedService);
      if (match) {
        serviceSelect.value = requestedService;
      }
    }
  }

});

