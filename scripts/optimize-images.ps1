# CHANGE: resize/compress real repo photos with System.Drawing (no new npm deps).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$imgDir = Join-Path $root 'src\assets\images'
$outDir = Join-Path $imgDir 'optimized'
$iconDir = Join-Path $outDir 'icons'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
New-Item -ItemType Directory -Force -Path $iconDir | Out-Null

function Save-Jpeg([System.Drawing.Image]$img, [string]$path, [long]$quality) {
  $jpgCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $quality)
  $img.Save($path, $jpgCodec, $ep)
  $ep.Dispose()
}

function Resize-Cover([string]$srcPath, [int]$w, [int]$h, [string]$dest, [long]$quality) {
  $src = [System.Drawing.Image]::FromFile($srcPath)
  try {
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $scale = [Math]::Max($w / [double]$src.Width, $h / [double]$src.Height)
    $nw = [int]($src.Width * $scale)
    $nh = [int]($src.Height * $scale)
    $x = [int](($w - $nw) / 2)
    $y = [int](($h - $nh) / 2)
    $g.Clear([System.Drawing.Color]::FromArgb(250, 246, 242))
    $g.DrawImage($src, $x, $y, $nw, $nh)
    Save-Jpeg $bmp $dest $quality
    $g.Dispose(); $bmp.Dispose()
  } finally { $src.Dispose() }
}

$heroSrc = Join-Path $imgDir 'redbrick1.jpg'
if (-not (Test-Path $heroSrc)) { $heroSrc = Join-Path $imgDir 'hero-banner.png' }
Resize-Cover $heroSrc 480 270 (Join-Path $outDir 'hero-480.jpg') 72
Resize-Cover $heroSrc 768 432 (Join-Path $outDir 'hero-768.jpg') 74
Resize-Cover $heroSrc 1200 675 (Join-Path $outDir 'hero-1200.jpg') 76

$products = @(
  @{ src = 'brick_product_1.png'; name = 'product-1' },
  @{ src = 'brick_product_2.png'; name = 'product-2' },
  @{ src = 'brick_product_3.png'; name = 'product-3' },
  @{ src = 'redbricks.jpg'; name = 'product-red' },
  @{ src = 'trolley_brick.png'; name = 'product-trolley' }
)
foreach ($p in $products) {
  $src = Join-Path $imgDir $p.src
  if (-not (Test-Path $src)) { continue }
  Resize-Cover $src 320 240 (Join-Path $outDir ($p.name + '-320.jpg')) 70
  Resize-Cover $src 480 360 (Join-Path $outDir ($p.name + '-480.jpg')) 72
  Resize-Cover $src 768 576 (Join-Path $outDir ($p.name + '-768.jpg')) 74
}

foreach ($gName in @('gurukripaEnt.jpg','gurukripaEnt1.png','gurukripaEnt2.png','jaunpurPul.jpg','jalalpur.jpg','trilochan.jpg','Varanasi.png')) {
  $src = Join-Path $imgDir $gName
  if (-not (Test-Path $src)) { continue }
  $base = [IO.Path]::GetFileNameWithoutExtension($gName)
  Resize-Cover $src 640 480 (Join-Path $outDir ($base + '-640.jpg')) 72
}

# OG 1200x630 from real product photo + brand panel
$og = New-Object System.Drawing.Bitmap 1200, 630
$gOg = [System.Drawing.Graphics]::FromImage($og)
$gOg.Clear([System.Drawing.Color]::FromArgb(169, 50, 38))
$brickPath = Join-Path $imgDir 'redbricks.jpg'
$brick = [System.Drawing.Image]::FromFile($brickPath)
$gOg.DrawImage($brick, 420, 40, 740, 550)
$brick.Dispose()
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(250, 246, 242))
$gOg.FillRectangle($brush, 0, 0, 400, 630)
$fontEn = New-Object System.Drawing.Font 'Segoe UI', 18, ([System.Drawing.FontStyle]::Bold)
$fontSm = New-Object System.Drawing.Font 'Segoe UI', 14, ([System.Drawing.FontStyle]::Regular)
$dark = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(123, 36, 28))
$gOg.DrawString('Gurukripa Bricks Industry', $fontEn, $dark, 36, 260)
$gOg.DrawString('Premium Red Clay Bricks', $fontEn, $dark, 36, 310)
$gOg.DrawString('Jaunpur · Varanasi · UP', $fontSm, $dark, 36, 370)
Save-Jpeg $og (Join-Path $outDir 'og-1200x630.jpg') 80
$gOg.Dispose(); $og.Dispose(); $fontEn.Dispose(); $fontSm.Dispose(); $dark.Dispose(); $brush.Dispose()

function Make-PngIcon([int]$size, [string]$path, [bool]$maskable) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(169, 50, 38))
  $pad = if ($maskable) { [int]($size * 0.2) } else { [int]($size * 0.08) }
  $inner = $size - (2 * $pad)
  $fontSize = [Math]::Max(8, [int]($inner * 0.4))
  $font = New-Object System.Drawing.Font 'Georgia', $fontSize, ([System.Drawing.FontStyle]::Bold)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF ([float]$pad, [float]($pad - $size * 0.03), [float]$inner, [float]$inner)
  $g.DrawString('GE', $font, [System.Drawing.Brushes]::White, $rect, $sf)
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $font.Dispose(); $sf.Dispose()
}

Make-PngIcon 180 (Join-Path $imgDir 'icon-180.png') $false
Make-PngIcon 192 (Join-Path $iconDir 'icon-192.png') $false
Make-PngIcon 512 (Join-Path $iconDir 'icon-512.png') $false
Make-PngIcon 192 (Join-Path $iconDir 'icon-192-maskable.png') $true
Make-PngIcon 512 (Join-Path $iconDir 'icon-512-maskable.png') $true
Make-PngIcon 32 (Join-Path $imgDir 'favicon-32.png') $false

# Sync master mark into logo-new.svg consumers (copy path already updated; keep logo-new.svg aligned)
Copy-Item (Join-Path $imgDir 'logo.svg') (Join-Path $imgDir 'logo-new.svg') -Force

Write-Output 'Done.'
Get-ChildItem $outDir -Recurse -File | Sort-Object Length -Descending | Select-Object -First 25 | ForEach-Object {
  '{0,8:N1} KB  {1}' -f ($_.Length/1KB), $_.Name
}
