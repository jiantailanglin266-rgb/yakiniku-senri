# Sync Wikimedia Commons photo metadata on Windows (ASCII-only script; unicode lives in JSON).
#
# WHAT THIS DOES
#   Reads  src/media/data/requests.json
#   Writes src/media/data/assets.generated.json
#
#   For each request it resolves one Commons file, then fetches that file's
#   author / licence / source from the Commons API and records them.
#
# WHAT THIS DOES NOT DO
#   - It does not download image files. Only metadata is stored.
#   - It does not mark anything as approved. Every result lands in the
#     review queue at /sports-port/<lang>/admin for a human to check.
#   - It does not guess. Missing fields stay null.
#
# WHY THE SCRIPT IS ASCII-ONLY
#   Windows PowerShell reads .ps1 files in the console codepage unless they
#   carry a BOM. Japanese article titles in the script body get mangled, so
#   they live in requests.json (UTF-8) and are read from there instead.
#
# USAGE
#   cd <repo root>
#   powershell -ExecutionPolicy Bypass -File scripts\Sync-WikimediaPhotos.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\Sync-WikimediaPhotos.ps1 -Write
#   powershell -ExecutionPolicy Bypass -File scripts\Sync-WikimediaPhotos.ps1 -Write -Only "sportsport:sport:tennis"

[CmdletBinding()]
param(
  # Without -Write nothing is saved. This is the default on purpose.
  [switch]$Write,
  # Process a single pageKey.
  [string]$Only = "",
  # Wikimedia's API policy asks for a contact address in the User-Agent.
  [string]$UserAgent = $env:MEDIA_SYNC_USER_AGENT,
  # Milliseconds between requests. Do not lower this much; you will be throttled.
  # (-Seconds takes an int in Windows PowerShell 5.1, so sub-second values need -Milliseconds.)
  [int]$IntervalMs = 1200
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if ([string]::IsNullOrWhiteSpace($UserAgent)) {
  Write-Host "MEDIA_SYNC_USER_AGENT is not set." -ForegroundColor Yellow
  Write-Host "Wikimedia asks for a contact address. Requests without one are refused." -ForegroundColor Yellow
  Write-Host 'Example: $env:MEDIA_SYNC_USER_AGENT = "YourSite/1.0 (you@example.com)"' -ForegroundColor Yellow
  exit 1
}

$root = Split-Path -Parent $PSScriptRoot
$requestPath = Join-Path $root "src\media\data\requests.json"
$outputPath = Join-Path $root "src\media\data\assets.generated.json"
$commonsApi = "https://commons.wikimedia.org/w/api.php"
$headers = @{ "User-Agent" = $UserAgent; "Accept" = "application/json" }

if (-not (Test-Path $requestPath)) {
  Write-Host "Not found: $requestPath" -ForegroundColor Red
  exit 1
}

# Read as UTF-8 explicitly so Japanese titles survive.
$requests = [System.IO.File]::ReadAllText($requestPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
if ($Only -ne "") { $requests = @($requests | Where-Object { $_.pageKey -eq $Only }) }
if ($requests.Count -eq 0) { Write-Host "No targets."; exit 0 }

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Get-PlainText([object]$value) {
  # extmetadata values contain HTML. Strip tags before storing.
  if ($null -eq $value) { return $null }
  $text = [string]$value
  $text = $text -replace "<[^>]*>", " "
  $text = $text -replace "&nbsp;", " " -replace "&amp;", "&" -replace "&quot;", '"' -replace "&#0?39;", "'"
  $text = ($text -replace "\s+", " ").Trim()
  if ($text.Length -eq 0) { return $null }
  return $text
}

function Get-FirstHref([object]$value) {
  if ($null -eq $value) { return $null }
  $m = [regex]::Match([string]$value, 'href="([^"]+)"')
  if (-not $m.Success) { return $null }
  $href = $m.Groups[1].Value
  if ($href.StartsWith("//")) { return "https:$href" }
  if ($href.StartsWith("/")) { return "https://commons.wikimedia.org$href" }
  if ($href.StartsWith("http")) { return $href }
  return $null
}

function Get-Meta($ext, [string]$key) {
  if ($null -eq $ext) { return $null }
  $node = $ext.PSObject.Properties[$key]
  if ($null -eq $node) { return $null }
  return $node.Value.value
}

# Resolve a Wikipedia article title to its lead image, as a Commons file name.
#
# IMPORTANT: originalimage.source comes in two shapes.
#   .../wikipedia/commons/...  -> a Commons file
#   .../wikipedia/ja/...       -> uploaded straight to that language edition
# The second kind has not passed Commons' free-licence requirements and can be
# non-free. Being shown in an article is not permission to reuse it, so those
# are dropped here by looking at the path.
function Resolve-LeadImage([string]$lang, [string]$title) {
  $encoded = [uri]::EscapeDataString(($title -replace " ", "_"))
  $uri = "https://$lang.wikipedia.org/api/rest_v1/page/summary/$encoded"
  try {
    $json = Invoke-RestMethod -Uri $uri -Headers $headers -TimeoutSec 30
  } catch {
    return @{ File = $null; Reason = "request failed: $($_.Exception.Message)" }
  }

  $source = $json.originalimage.source
  if ([string]::IsNullOrWhiteSpace($source)) { return @{ File = $null; Reason = "article has no lead image" } }
  if ($source -notmatch "/wikipedia/commons/") { return @{ File = $null; Reason = "not a Commons file (local upload on $lang)" } }
  if ($source -match "\.svg($|\?)") { return @{ File = $null; Reason = "SVG is out of scope" } }

  $m = [regex]::Match($source, "/wikipedia/commons/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/([^/]+)")
  if (-not $m.Success) { return @{ File = $null; Reason = "could not read file name" } }

  return @{ File = "File:" + [uri]::UnescapeDataString($m.Groups[1].Value); Reason = $null }
}

function Search-Commons([string]$query, [int]$limit) {
  $q = [uri]::EscapeDataString("$query filetype:bitmap")
  $uri = "$commonsApi`?action=query&format=json&origin=*&list=search&srsearch=$q&srnamespace=6&srlimit=$limit"
  $json = Invoke-RestMethod -Uri $uri -Headers $headers -TimeoutSec 30
  return @($json.query.search | ForEach-Object { $_.title })
}

function Get-ImageInfo([string[]]$titles) {
  $t = [uri]::EscapeDataString(($titles -join "|"))
  $uri = "$commonsApi`?action=query&format=json&origin=*&prop=imageinfo|categories&titles=$t" +
         "&iiprop=url|size|mime|extmetadata|user&cllimit=50"
  $json = Invoke-RestMethod -Uri $uri -Headers $headers -TimeoutSec 60
  if ($null -eq $json.query.pages) { return @() }
  return @($json.query.pages.PSObject.Properties | ForEach-Object { $_.Value })
}

# Same conservative rules as scripts/wikimedia-sync.mjs.
# Nothing here ever returns "approved" - that decision belongs to a person.
$blocking = @("non-?commercial", "\bnc\b", "no-?deriv", "\bnd\b", "fair\s*use", "all\s*rights\s*reserved", "non-?free")
$readable = @("^cc[\s_-]?0", "^public\s*domain", "^pd[-\s]", "^cc\s*by(-sa)?\s*\d\.\d$")

function Get-Classification($licenses, [string]$commonsPageUrl, [string]$authorName) {
  $notes = New-Object System.Collections.ArrayList

  if ($licenses.Count -eq 0) {
    [void]$notes.Add("Could not read a licence tag. Held back rather than guessed.")
    return @{ Status = "license_unknown"; Notes = $notes }
  }
  foreach ($lic in $licenses) {
    foreach ($p in $blocking) {
      if ($lic -match $p) {
        [void]$notes.Add("Licence cannot be used here: " + ($licenses -join " / "))
        return @{ Status = "rejected"; Notes = $notes }
      }
    }
  }
  $ok = $false
  foreach ($lic in $licenses) {
    foreach ($p in $readable) { if ($lic.Trim() -match $p) { $ok = $true } }
  }
  if (-not $ok) {
    [void]$notes.Add("Licence tag not machine-readable: " + ($licenses -join " / "))
    return @{ Status = "license_unknown"; Notes = $notes }
  }
  if ([string]::IsNullOrWhiteSpace($commonsPageUrl)) {
    [void]$notes.Add("No Commons file page URL.")
    return @{ Status = "needs_review"; Notes = $notes }
  }
  if ([string]::IsNullOrWhiteSpace($authorName)) {
    [void]$notes.Add("No author recorded. Check whether attribution is required.")
    return @{ Status = "needs_review"; Notes = $notes }
  }
  [void]$notes.Add("Licence is readable. Subject rights (people, trademarks, buildings) still need a human check.")
  return @{ Status = "needs_review"; Notes = $notes }
}

# ---------------------------------------------------------------------------
# Existing data - a human's approval is never rolled back by a re-run
# ---------------------------------------------------------------------------
$existing = @{}
if (Test-Path $outputPath) {
  $prev = [System.IO.File]::ReadAllText($outputPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
  foreach ($a in @($prev.assets)) { $existing[$a.id] = $a }
}
$result = [ordered]@{}
foreach ($k in $existing.Keys) { $result[$k] = $existing[$k] }

$fetched = 0; $skipped = 0; $byStatus = @{}

foreach ($request in $requests) {
  $label = if ($request.wikipedia) { "$($request.wikipedia.lang):$($request.wikipedia.titles -join ' / ')" } else { """$($request.query)""" }
  Write-Host ""
  Write-Host "> $($request.pageKey) ($($request.slot)) - $label" -ForegroundColor Cyan

  $titles = @()

  if ($request.wikipedia) {
    foreach ($articleTitle in $request.wikipedia.titles) {
      $r = Resolve-LeadImage $request.wikipedia.lang $articleTitle
      Start-Sleep -Milliseconds $IntervalMs
      if ($r.File) {
        Write-Host "  lead image: $($r.File)"
        $titles = @($r.File)
        break
      }
      Write-Host "  skipped: $($r.Reason)" -ForegroundColor DarkGray
    }
  }

  if ($titles.Count -eq 0 -and $request.query) {
    try {
      $limit = if ($request.limit) { $request.limit } else { 5 }
      $titles = Search-Commons $request.query $limit
      Start-Sleep -Milliseconds $IntervalMs
    } catch {
      Write-Host "  search failed: $($_.Exception.Message)" -ForegroundColor Red
      continue
    }
  }

  if ($titles.Count -eq 0) {
    Write-Host "  no candidate (the page keeps its generated visual)" -ForegroundColor DarkGray
    continue
  }

  try {
    $pages = Get-ImageInfo $titles
    Start-Sleep -Milliseconds $IntervalMs
  } catch {
    Write-Host "  metadata fetch failed: $($_.Exception.Message)" -ForegroundColor Red
    continue
  }

  foreach ($page in $pages) {
    $info = $page.imageinfo | Select-Object -First 1
    if ($null -eq $info) { $skipped++; continue }
    $ext = $info.extmetadata

    $fileName = ([string]$page.title) -replace "^File:", ""
    $id = "wm-" + ($fileName -replace "[^a-zA-Z0-9]+", "-").ToLower().Trim("-")
    if ($id.Length -gt 63) { $id = $id.Substring(0, 63) }

    # @( ) around the pipeline as well: a single match would otherwise come back
    # as a bare string, and .Count on it does not mean what you want.
    $licenses = @(@(
      (Get-Meta $ext "LicenseShortName"),
      (Get-Meta $ext "License"),
      (Get-Meta $ext "UsageTerms")
    ) | Where-Object { $_ })

    $authorName = Get-PlainText (Get-Meta $ext "Artist")
    $commonsPageUrl = [string]$info.descriptionurl
    $c = Get-Classification $licenses $commonsPageUrl $authorName

    $width = [int]$info.width
    $height = [int]$info.height
    $prevAsset = $existing[$id]

    $asset = [ordered]@{
      id = $id
      commonsPageId = $page.pageid
      wikidataEntityId = $request.wikidataEntityId
      fileName = $fileName
      title = [string]$page.title
      description = Get-PlainText (Get-Meta $ext "ImageDescription")
      originalUrl = [string]$info.url
      thumbnailUrl = $null
      commonsPageUrl = $commonsPageUrl
      localPath = $null
      mimeType = [string]$info.mime
      width = $width
      height = $height
      aspectRatio = if ($height -gt 0) { $width / $height } else { 0 }
      authorName = $authorName
      authorUrl = Get-FirstHref (Get-Meta $ext "Artist")
      sourceName = Get-PlainText (Get-Meta $ext "Credit")
      sourceUrl = Get-FirstHref (Get-Meta $ext "Credit")
      rawLicenses = @($licenses)
      licenseUrl = Get-PlainText (Get-Meta $ext "LicenseUrl")
      attributionText = Get-PlainText (Get-Meta $ext "Attribution")
      copyrightStatus = Get-PlainText (Get-Meta $ext "Copyrighted")
      publicDomainRationale = Get-PlainText (Get-Meta $ext "PublicDomain")
      categories = @($page.categories | ForEach-Object { ([string]$_.title) -replace "^Category:", "" })
      retrievedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'")
      metadataRaw = $ext
      # An approval made by a person survives a re-run.
      verificationStatus = if ($prevAsset -and $prevAsset.verificationStatus -eq "approved") { "approved" } else { $c.Status }
      verificationNotes = @($c.Notes)
      verifiedAt = if ($prevAsset) { $prevAsset.verifiedAt } else { $null }
      rightsRisks = if ($prevAsset) { @($prevAsset.rightsRisks) } else { @() }
      usageStatus = if ($prevAsset) { $prevAsset.usageStatus } else { "unused" }
      objectPosition = if ($prevAsset) { $prevAsset.objectPosition } else { "center" }
      isModified = if ($prevAsset) { $prevAsset.isModified } else { $false }
      modificationDescription = if ($prevAsset) { $prevAsset.modificationDescription } else { $null }
      requestedFor = @(@{ pageKey = $request.pageKey; slot = $request.slot })
    }

    $result[$id] = $asset
    $fetched++
    $byStatus[$c.Status] = 1 + $(if ($byStatus.ContainsKey($c.Status)) { $byStatus[$c.Status] } else { 0 })

    Write-Host "  - $fileName -> $($c.Status)"
    foreach ($n in $c.Notes) { Write-Host "      $n" -ForegroundColor DarkGray }
  }
}

Write-Host ""
Write-Host "=== summary ===" -ForegroundColor Cyan
Write-Host "fetched: $fetched / skipped: $skipped"
foreach ($k in $byStatus.Keys) { Write-Host "  $k : $($byStatus[$k])" }
Write-Host ""
Write-Host "Nothing is approved by this script. Approve from the admin screen." -ForegroundColor Yellow

if (-not $Write) {
  Write-Host ""
  Write-Host "-Write was not given, so no file was changed." -ForegroundColor Yellow
  exit 0
}

$payload = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'")
  assets = @($result.Values)
}
# Depth must be generous: metadataRaw is deeply nested.
$json = $payload | ConvertTo-Json -Depth 12
# UTF-8 without BOM, so the file matches what the Node script writes.
[System.IO.File]::WriteAllText($outputPath, $json + "`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Host ""
Write-Host "written: $outputPath" -ForegroundColor Green
