# Download article lead photos from Wikipedia (ASCII-only script; unicode lives in manifest JSON)
#
#   powershell -ExecutionPolicy Bypass -File scripts\wikipedia-photos.ps1
#
# ===========================================================================
# WARNING: This path does NOT verify image licences.
#
#   It reads `originalimage.source` from the Wikipedia REST summary API, i.e.
#   whatever image the article happens to display. That value is returned
#   regardless of licence, so the download may include:
#     - CC BY / CC BY-SA works (per-work attribution required; not shown here)
#     - fair-use images that cannot be reused at all
#     - subjects carrying rights beyond copyright (people, trademarks, buildings)
#
#   None of src/media/ runs here: no eligibility check, no credit, no review
#   queue. Do not confuse the two paths.
#
#   For the verified path use: npm run media:sync
#   See docs/ai-port/wikipedia-photos.md
# ===========================================================================
#
# Same shape as mountain-peak-demo/tools/download-photos.ps1.
# Originals land in %TEMP%\aiportphotos; run wikipedia-photos-resize.ps1 next.

$ErrorActionPreference = "SilentlyContinue"
$root = Split-Path -Parent $PSScriptRoot
$manifest = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot "wikipedia-photo-manifest.json")) | ConvertFrom-Json
$outDir = Join-Path $env:TEMP "aiportphotos"
New-Item -ItemType Directory -Force $outDir | Out-Null

# Wikimedia's user-agent policy asks for a contact address. Keep it filled in.
$ua = "AiPortPhotoBot/1.0 (https://github.com/jiantailanglin266-rgb/yakiniku-senri; jiantailanglin266@gmail.com)"

Write-Output "WARNING: this path does not verify licences. See docs/ai-port/wikipedia-photos.md"
Write-Output ""

$okCount = 0
$failList = @()
$i = 0

foreach ($entry in $manifest) {
  $i++
  $slug = $entry.slug
  $dest = Join-Path $outDir "$slug.jpg"
  if (Test-Path $dest) { $okCount++; continue }
  $got = $false

  foreach ($title in $entry.titles) {
    # Be gentle with the API: sequential requests, spaced out.
    Start-Sleep -Seconds 3
    try {
      $enc = [uri]::EscapeDataString(($title -replace " ", "_"))
      $j = Invoke-RestMethod -Uri "https://$($entry.lang).wikipedia.org/api/rest_v1/page/summary/$enc" -TimeoutSec 25 -Headers @{ "User-Agent" = $ua }
      $url = $j.originalimage.source
      if (-not $url) { continue }
      if ($url -match "\.svg") { continue }
      Start-Sleep -Seconds 2
      Invoke-WebRequest -Uri $url -OutFile $dest -TimeoutSec 120 -Headers @{ "User-Agent" = $ua } -UseBasicParsing
      if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt 5000)) { $got = $true; break }
      Remove-Item $dest -Force -ErrorAction SilentlyContinue
    } catch {
      if ("$($_.Exception.Message)" -match "429") { Start-Sleep -Seconds 20 }
    }
  }

  if ($got) { $okCount++ } else { $failList += $slug }
  if ($i % 10 -eq 0) { Write-Output "progress: $i/$($manifest.Count) ok=$okCount" }
}

Write-Output "DONE ok=$okCount fail=$($failList.Count)"
if ($failList.Count -gt 0) { Write-Output ("FAILED: " + ($failList -join ",")) }
Write-Output ""
Write-Output "Next: powershell -ExecutionPolicy Bypass -File scripts\wikipedia-photos-resize.ps1"
