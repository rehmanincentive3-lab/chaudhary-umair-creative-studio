$projectsDir = 'C:\Users\Al-Wajid Laptops\Downloads\umair creative studio\assets\projects'
if (!(Test-Path $projectsDir)) { New-Item -ItemType Directory -Path $projectsDir -Force | Out-Null }

$assetsDir = 'C:\Users\Al-Wajid Laptops\Downloads\umair creative studio\assets'
$imageDir = 'C:\Users\Al-Wajid Laptops\Downloads\umair creative studio\IMAGE'

# Project 1: TechNova
Copy-Item "$assetsDir\project-technova.png" "$projectsDir\project-1-technova.png" -Force

# Project 2: Luxury Furniture
Copy-Item "$assetsDir\project-luxury-furniture.png" "$projectsDir\project-2-luxury-furniture.png" -Force

# Project 3: Travel Promo
Copy-Item "$assetsDir\project-travel-promo.png" "$projectsDir\project-3-travel-promo.png" -Force

# Project 4: Product Ad Design
Copy-Item "$assetsDir\project-iphone-ad.png" "$projectsDir\project-4-product-ad.png" -Force

# Project 5: Shoe Store
Copy-Item "$assetsDir\project-shoe-store.png" "$projectsDir\project-5-shoe-store.png" -Force

# Project 6: Business Branding
Copy-Item "$assetsDir\project-business-branding.png" "$projectsDir\project-6-business-branding.png" -Force

# Project 7: AURA Digital Luxury
Copy-Item "$imageDir\Description User-focused interface design combining clean layouts, intuitive navigation and premium visual experiences..jpg" "$projectsDir\project-7-aura-digital.jpg" -Force

# Project 8: MAISON Luxury E-Commerce
Copy-Item "$imageDir\Description Professional social media graphics designed to communicate brand messages clearly and create a strong visual presence online..jpg" "$projectsDir\project-8-maison-store.jpg" -Force

# Project 9: Corporate Brand Identity Suite
Copy-Item "$imageDir\Description A complete business branding concept designed to create a strong, recognizable and professional company identity..jpg" "$projectsDir\project-9-brand-identity.jpg" -Force

# Project 10: Social Media & Campaign Design
Copy-Item "$imageDir\Description Creative AI-powered visual production combining cinematic storytelling, realistic visuals and modern digital creativity..jpg" "$projectsDir\project-10-social-campaign.jpg" -Force

# Project 11: AURUM Timeless Spaces
Copy-Item "$imageDir\Description A modern and responsive website experience designed to give businesses a strong, professional and engaging digital presence..jpg" "$projectsDir\project-11-aurum-architecture.jpg" -Force

# Project 12: Executive Multi-Display Creative Suite
Copy-Item "$imageDir\Description A responsive digital experience designed to work beautifully across desktop, tablet and mobile devices..jpg" "$projectsDir\project-12-creative-workstation.jpg" -Force

Write-Host "All 12 projects organized successfully in $projectsDir"
