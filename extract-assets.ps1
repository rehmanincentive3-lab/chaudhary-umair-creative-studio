Add-Type -AssemblyName System.Drawing
$sourcePath = 'C:\Users\Al-Wajid Laptops\Downloads\Umair Creative Studio Portfolio.png'
$bmp = [System.Drawing.Bitmap]::FromFile($sourcePath)
Write-Host "Source image dimensions: $($bmp.Width) x $($bmp.Height)"

# Create assets folder
$assetsDir = 'C:\Users\Al-Wajid Laptops\Downloads\umair creative studio\assets'
if (!(Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
}

# 1. Crop Hero Image (Umair at desk with monitor and camera)
# Hero Umair area: x: 500 to 1480, y: 70 to 515 (approx 980 x 445)
$heroRect = New-Object System.Drawing.Rectangle(585, 68, 895, 447)
$heroTarget = New-Object System.Drawing.Bitmap($heroRect.Width, $heroRect.Height)
$g = [System.Drawing.Graphics]::FromImage($heroTarget)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($bmp, 0, 0, $heroRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$heroTarget.Save("$assetsDir\hero-umair.png", [System.Drawing.Imaging.ImageFormat]::Png)
$heroTarget.Dispose()
Write-Host "Hero image extracted to $assetsDir\hero-umair.png"

# 2. Extract Logo monogram
$logoRect = New-Object System.Drawing.Rectangle(75, 12, 230, 48)
$logoTarget = New-Object System.Drawing.Bitmap($logoRect.Width, $logoRect.Height)
$g2 = [System.Drawing.Graphics]::FromImage($logoTarget)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.DrawImage($bmp, 0, 0, $logoRect, [System.Drawing.GraphicsUnit]::Pixel)
$g2.Dispose()
$logoTarget.Save("$assetsDir\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$logoTarget.Dispose()
Write-Host "Logo extracted to $assetsDir\logo.png"

# 3. Extract 6 project cards from the master design reference
# The cards are at the bottom:
# Total width 1536. 6 cards across.
# Let's inspect the exact card boundaries.
$yStart = 835
$cardHeight = 90
# 6 cards horizontally:
# Card 1: x: 80 to 305
# Card 2: x: 330 to 555
# Card 3: x: 580 to 805
# Card 4: x: 830 to 1055
# Card 5: x: 1080 to 1305
# Card 6: x: 1330 to 1460

$cards = @(
    @{ Name = "project-technova.png"; X = 84; Y = 835; W = 224; H = 84 },
    @{ Name = "project-luxury-furniture.png"; X = 334; Y = 835; W = 224; H = 84 },
    @{ Name = "project-travel-promo.png"; X = 584; Y = 835; W = 224; H = 84 },
    @{ Name = "project-iphone-ad.png"; X = 834; Y = 835; W = 224; H = 84 },
    @{ Name = "project-shoe-store.png"; X = 1084; Y = 835; W = 224; H = 84 },
    @{ Name = "project-business-branding.png"; X = 1334; Y = 835; W = 180; H = 84 }
)

foreach ($c in $cards) {
    $cRect = New-Object System.Drawing.Rectangle($c.X, $c.Y, $c.W, $c.H)
    $cTarget = New-Object System.Drawing.Bitmap($c.W, $c.H)
    $gC = [System.Drawing.Graphics]::FromImage($cTarget)
    $gC.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gC.DrawImage($bmp, 0, 0, $cRect, [System.Drawing.GraphicsUnit]::Pixel)
    $gC.Dispose()
    $cTarget.Save("$assetsDir\$($c.Name)", [System.Drawing.Imaging.ImageFormat]::Png)
    $cTarget.Dispose()
    Write-Host "Card $($c.Name) extracted"
}

$bmp.Dispose()
Write-Host "Extraction completed successfully."
