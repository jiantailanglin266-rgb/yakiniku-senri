# Resize downloaded photos to 1280px JPEG q82 into public/images/ai-port/photos (ASCII-only)
#
#   powershell -ExecutionPolicy Bypass -File scripts\wikipedia-photos-resize.ps1
#
# WARNING: these images come from the unverified path — it does NOT verify licences.
#   No author / licence / source was captured for them. See docs/ai-port/wikipedia-photos.md
#
# Same shape as mountain-peak-demo/tools/resize-photos.ps1.
# Run wikipedia-photos.ps1 first, then this, then:
#   node scripts/wikipedia-photos.mjs --index-only
# to regenerate src/data/ai-port/photos.ts.

Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$srcDir = Join-Path $env:TEMP "aiportphotos"
$outDir = Join-Path $root "public\images\ai-port\photos"
New-Item -ItemType Directory -Force $outDir | Out-Null

$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)

$ok = 0; $fail = 0; $total = 0

foreach ($f in Get-ChildItem $srcDir -Filter *.jpg) {
  $dest = Join-Path $outDir $f.Name
  if (Test-Path $dest) { continue }
  try {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    $scale = [Math]::Min(1.0, 1280.0 / [Math]::Max($img.Width, $img.Height))
    $w = [Math]::Max(1, [int]($img.Width * $scale)); $h = [Math]::Max(1, [int]($img.Height * $scale))
    $bmp = New-Object System.Drawing.Bitmap([int]$w, [int]$h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $w, $h); $g.Dispose()
    $bmp.Save($dest, $enc, $ep)
    $bmp.Dispose(); $img.Dispose()
    $ok++; $total += (Get-Item $dest).Length
  } catch { $fail++; Write-Output "RESIZE-FAIL $($f.Name): $($_.Exception.Message)" }
}

Write-Output "RESIZE DONE ok=$ok fail=$fail total=$([Math]::Round($total/1MB,1))MB"
Write-Output ""
Write-Output "Next: node scripts/wikipedia-photos.mjs --index-only"
