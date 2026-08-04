<#
.SYNOPSIS
  CRYPTO PORT の写真取得（mountain-peak 方式 / PowerShell 版）。

.DESCRIPTION
  Wikimedia Commons を検索し、上位の1枚を public\images\portal\ へ保存します。
  取得できたファイルだけを src\portal\data\photo-manifest.json に記録します。
  マニフェストに無いページは写真を出さず、生成ビジュアルのままになります。

  クレジットは画像ごとではなく、サイト共通の一括表記で表示します
  （src\portal\lib\photos.ts の PHOTO_CREDIT）。

  Node 版（scripts\portal-photos.mjs）と同じ処理です。
  実行環境から Wikimedia へ到達できるほうを使ってください。

.EXAMPLE
  # 検索だけ行い、保存はしない
  pwsh -File scripts\portal-photos.ps1 -DryRun

.EXAMPLE
  # 保存してマニフェストを更新
  pwsh -File scripts\portal-photos.ps1 -Write

.EXAMPLE
  # 1件だけ試す
  pwsh -File scripts\portal-photos.ps1 -Write -Only coin:bitcoin

.NOTES
  Windows PowerShell 5.1 / PowerShell 7 のどちらでも動きます。
  実行ポリシーで止まる場合:
    powershell -ExecutionPolicy Bypass -File scripts\portal-photos.ps1 -DryRun
#>
[CmdletBinding()]
param(
  # 保存する。付けない場合は検索結果を表示するだけ
  [switch]$Write,
  # 明示的に「保存しない」と書きたいとき用（既定の動作と同じ）
  [switch]$DryRun,
  # 対象を1件に絞る（例: coin:bitcoin）
  [string]$Only
)

$ErrorActionPreference = 'Stop'
# Windows PowerShell 5.1 は既定で TLS1.0 のことがあるため明示します
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$CommonsApi = 'https://commons.wikimedia.org/w/api.php'
$UserAgent  = 'crypto-port-photos/1.0 (https://github.com/jiantailanglin266-rgb/yakiniku-senri)'

# 横幅がこれ未満の画像は、カードやヒーローに使うと粗いので採用しません
$MinWidth     = 1000
# 1枚あたりの上限。重い画像をリポジトリへ入れないための歯止めです
$MaxBytes     = 900000
# 保存する横幅。Commons のサムネイル生成に任せます
$TargetWidth  = 1600

# スクリプトの位置からリポジトリ直下を求めます（どこから実行しても動くように）
$RepoRoot     = Split-Path -Parent $PSScriptRoot
$OutDir       = Join-Path $RepoRoot 'public\images\portal'
$TargetsPath  = Join-Path $RepoRoot 'src\portal\data\photo-targets.json'
$ManifestPath = Join-Path $RepoRoot 'src\portal\data\photo-manifest.json'

if (-not (Test-Path $TargetsPath)) {
  throw "取得対象の一覧が見つかりません: $TargetsPath"
}

$targets = Get-Content $TargetsPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($Only) { $targets = @($targets | Where-Object { $_.key -eq $Only }) }

if (-not $targets -or $targets.Count -eq 0) {
  Write-Host '対象がありません。'
  return
}

# 既存のマニフェストを読み、追記していきます（既存の記録は消しません）
$manifest = @{}
if (Test-Path $ManifestPath) {
  $existing = Get-Content $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($property in $existing.PSObject.Properties) {
    $manifest[$property.Name] = $property.Value
  }
}

$willWrite = $Write -and -not $DryRun
$suffix = if ($willWrite) { '' } else { '（保存しません）' }
Write-Host "対象 $($targets.Count) 件$suffix"

if ($willWrite -and -not (Test-Path $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

function Invoke-CommonsApi([hashtable]$Query) {
  $Query['format'] = 'json'
  $pairs = foreach ($key in $Query.Keys) {
    '{0}={1}' -f $key, [Uri]::EscapeDataString([string]$Query[$key])
  }
  $url = '{0}?{1}' -f $CommonsApi, ($pairs -join '&')
  Invoke-RestMethod -Uri $url -Headers @{ 'User-Agent' = $UserAgent } -TimeoutSec 30
}

$saved = 0
$skipped = 0

foreach ($target in $targets) {
  $label = $target.key
  try {
    # 1) 検索してファイル名の候補を得る（名前空間6 = File:）
    $searchResult = Invoke-CommonsApi @{
      action     = 'query'
      list       = 'search'
      srsearch   = "$($target.query) filetype:bitmap"
      srnamespace = 6
      srlimit    = 8
    }
    $titles = @($searchResult.query.search | ForEach-Object { $_.title })

    if ($titles.Count -eq 0) {
      Write-Host "- $label : 該当なし（$($target.query)）"
      $skipped++
      continue
    }

    # 2) 実体URLと寸法を取得する
    $infoResult = Invoke-CommonsApi @{
      action     = 'query'
      titles     = ($titles -join '|')
      prop       = 'imageinfo'
      iiprop     = 'url|size|mime'
      iiurlwidth = $TargetWidth
    }

    # 検索の関連度順を保つため、titles の並びで見ていきます
    $picked = $null
    foreach ($title in $titles) {
      $page = $infoResult.query.pages.PSObject.Properties.Value |
        Where-Object { $_.title -eq $title } | Select-Object -First 1
      if (-not $page) { continue }
      $info = $page.imageinfo | Select-Object -First 1
      if (-not $info) { continue }

      # 縦長はカードで破綻するため使いません
      if ($info.width -lt $MinWidth) { continue }
      if ($info.width -lt $info.height) { continue }
      if ($info.mime -ne 'image/jpeg' -and $info.mime -ne 'image/png') { continue }

      $url = if ($info.thumburl) { $info.thumburl } else { $info.url }
      $picked = [pscustomobject]@{
        Title  = $title
        Width  = $info.width
        Height = $info.height
        Url    = $url
      }
      break
    }

    if (-not $picked) {
      Write-Host "- $label : 条件を満たす画像なし"
      $skipped++
      continue
    }

    Write-Host "- $label : $($picked.Title) ($($picked.Width)x$($picked.Height))"
    if (-not $willWrite) { continue }

    # 3) 保存する
    $fileName = ($target.key -replace ':', '-') + '.jpg'
    $filePath = Join-Path $OutDir $fileName

    $response = Invoke-WebRequest -Uri $picked.Url -Headers @{ 'User-Agent' = $UserAgent } `
      -TimeoutSec 60 -UseBasicParsing
    $bytes = $response.Content

    if ($bytes.Length -gt $MaxBytes) {
      Write-Host "  → サイズ超過 $([Math]::Round($bytes.Length / 1KB))KB のため見送り"
      $skipped++
      continue
    }

    [IO.File]::WriteAllBytes($filePath, $bytes)

    # 一括クレジット方式のため作者名は保持しません。
    # 元ファイル名だけは、後から出所をたどれるように残します。
    $manifest[$target.key] = [ordered]@{
      file        = $fileName
      commonsFile = $picked.Title
      width       = $picked.Width
      height      = $picked.Height
    }
    $saved++
  }
  catch {
    Write-Host "- $label : 失敗 ($($_.Exception.Message))"
    $skipped++
  }
}

if ($willWrite) {
  # キー順に並べてから書き出します（差分が読みやすくなります）
  $ordered = [ordered]@{}
  foreach ($key in ($manifest.Keys | Sort-Object)) { $ordered[$key] = $manifest[$key] }

  $json = $ordered | ConvertTo-Json -Depth 5
  # BOM なし UTF-8。BOM が付くと prettier / Next.js の JSON 読み込みで落ちます
  [IO.File]::WriteAllText($ManifestPath, $json + "`n", (New-Object Text.UTF8Encoding $false))

  Write-Host ''
  Write-Host "保存 $saved 件 / 見送り $skipped 件"
  Write-Host "マニフェスト: $ManifestPath"
  Write-Host ''
  Write-Host '次の手順:'
  Write-Host '  npm run format   # マニフェストの整形'
  Write-Host '  npm run build    # 表示確認'
  Write-Host '  git add public/images/portal src/portal/data/photo-manifest.json'
  Write-Host '  git commit -m "feat: CRYPTO PORT の写真を追加"'
  Write-Host '  git push'
}
