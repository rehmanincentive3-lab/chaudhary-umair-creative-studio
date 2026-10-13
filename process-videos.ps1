$videoDir = 'C:\Users\Al-Wajid Laptops\Downloads\umair creative studio\VIDEO'
$outVideoDir = 'C:\Users\Al-Wajid Laptops\Downloads\umair creative studio\assets\videos'
$posterDir = 'C:\Users\Al-Wajid Laptops\Downloads\umair creative studio\assets\posters'

if (!(Test-Path $outVideoDir)) { New-Item -ItemType Directory -Path $outVideoDir -Force | Out-Null }
if (!(Test-Path $posterDir)) { New-Item -ItemType Directory -Path $posterDir -Force | Out-Null }

$videos = Get-ChildItem -Path $videoDir -Filter '*.mp4'

$mapping = @(
    @{ Pattern = 'Cinematic AI'; Name = 'video-1-cinematic-ai'; Title = 'Cinematic AI Production'; Cat = 'AI Video & Motion Graphics'; Desc = 'Cinematic AI-powered videos and creative visual content designed for modern brands, products and digital campaigns.' },
    @{ Pattern = 'Complete brand identity'; Name = 'video-2-brand-identity'; Title = 'Complete Brand Identity'; Cat = 'Branding & Visual Systems'; Desc = 'Complete brand identity solutions that bring together logos, visual systems and professional brand presentation.' },
    @{ Pattern = 'Creative and professional'; Name = 'video-3-visual-design'; Title = 'Visual Design & Direction'; Cat = 'Graphic Design & Direction'; Desc = 'Creative and professional visual designs created to give brands a strong and memorable identity.' },
    @{ Pattern = 'Engaging social media'; Name = 'video-4-social-media'; Title = 'Social Media Campaigns'; Cat = 'Social Media & Promotional Ads'; Desc = 'Engaging social media visuals and promotional content designed to help businesses communicate professionally online.' },
    @{ Pattern = 'Modern, responsive'; Name = 'video-5-responsive-websites'; Title = 'Responsive Digital Presence'; Cat = 'Website Development & UI/UX'; Desc = 'Modern, responsive and user-focused websites designed to create a premium digital presence for businesses.' },
    @{ Pattern = 'Professional online store'; Name = 'video-6-ecommerce-store'; Title = 'E-Commerce Experience'; Cat = 'E-Commerce & Digital Stores'; Desc = 'Professional online store experiences designed to showcase products and create a smooth digital shopping journey.' }
)

foreach ($map in $mapping) {
    $found = $videos | Where-Object { $_.Name -like "*$($map.Pattern)*" } | Select-Object -First 1
    if ($found) {
        $destVid = "$outVideoDir\$($map.Name).mp4"
        Copy-Item -Path $found.FullName -Destination $destVid -Force
        $destPoster = "$posterDir\$($map.Name).jpg"
        # generate poster frame at 1s with ffmpeg
        Start-Process -FilePath "ffmpeg" -ArgumentList "-y -ss 00:00:01 -i `"$destVid`" -vframes 1 -q:v 2 `"$destPoster`"" -NoNewWindow -Wait
        Write-Host "Processed: $($map.Name) successfully"
    } else {
        Write-Host "Warning: could not find $($map.Pattern)"
    }
}
Write-Host "All videos and posters ready."
