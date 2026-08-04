# ------------------------------------------------------------------
# CARD PORT — Wikimedia 画像の取得（Windows / PowerShell から実行）
#
# mountain-peak の tools/download-photos.ps1 と同じ使い方です。
# 違いは、取得した画像のライセンス・作者・出典を必ず記録することです。
#
# ■ なぜ PowerShell 版があるのか
#   Claude Code のリモート実行環境からは Wikimedia が 403 で遮断されます。
#   あなたのPCからなら通るので、こちらで実行すれば取得できます。
#   （GitHub Actions でも取得できます。そちらは Push するだけで動きます）
#
# ■ 中身は Node のスクリプトを順番に呼ぶだけです
#   ライセンス判定を PowerShell 側にも書くと、実装が2つに分かれて
#   いつか食い違います。判定は1か所（scripts/lib/）に置いたままにします。
#
# ■ 使い方
#   PowerShell を開いてリポジトリのフォルダへ移動し、
#
#     .\scripts\media-sync.ps1                 # 取得のみ（自動承認なし）
#     .\scripts\media-sync.ps1 -AutoApprove     # PD / CC0 は自動承認
#     .\scripts\media-sync.ps1 -Limit 10        # まず10枠だけ試す
#     .\scripts\media-sync.ps1 -DryRun          # 書き込まずに確認だけ
#
#   実行が拒否される場合は、そのウィンドウだけ許可します:
#     Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# ------------------------------------------------------------------

[CmdletBinding()]
param(
  # パブリックドメインと CC0 だけを自動承認します。
  # 付けない場合、取得はしますが1件も表示されません（管理画面で承認します）。
  [switch]$AutoApprove,

  # 一度に処理する枠の数。まず少なく試すことをおすすめします。
  [int]$Limit = 0,

  # 書き込まずに、何が起きるかだけ確認します。
  [switch]$DryRun,

  # 掲載中の画像のライセンス・URL を再確認します（週次相当）。
  [switch]$Revalidate,

  # Wikimedia の API ポリシーが求める連絡先。自分のメールに変えてください。
  [string]$Contact = "jiantailanglin266@gmail.com"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "=== CARD PORT 画像同期 ===" -ForegroundColor Cyan
Write-Host "フォルダ: $repoRoot"

# ------------------------------------------------------------------
# 前提の確認
# ------------------------------------------------------------------
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host "Node.js が見つかりません。https://nodejs.org/ から v22 以上を入れてください。" -ForegroundColor Red
  exit 1
}

$nodeVersion = (& node --version).TrimStart("v")
$nodeMajor = [int]($nodeVersion -split "\.")[0]
if ($nodeMajor -lt 22) {
  Write-Host "Node.js v22 以上が必要です（現在 v$nodeVersion）。" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path (Join-Path $repoRoot "node_modules"))) {
  Write-Host "`n依存関係を入れます（初回のみ、数分かかります）..." -ForegroundColor Yellow
  & npm ci
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# ------------------------------------------------------------------
# Wikimedia へ届くかを先に確かめます
# 届かない環境で長時間走らせても意味がないためです
# ------------------------------------------------------------------
Write-Host "`n接続を確認します..." -NoNewline
try {
  $probe = Invoke-WebRequest -Uri "https://commons.wikimedia.org/w/api.php?action=query&format=json&meta=siteinfo" `
    -Headers @{ "User-Agent" = "CardPortMediaSync/2.0 (contact: $Contact)" } `
    -TimeoutSec 20 -UseBasicParsing
  if ($probe.StatusCode -eq 200) {
    Write-Host " OK" -ForegroundColor Green
  }
} catch {
  Write-Host " 失敗" -ForegroundColor Red
  Write-Host "Wikimedia へ到達できません: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "社内プロキシや VPN が遮断している可能性があります。" -ForegroundColor Yellow
  Write-Host "GitHub Actions（media-sync.yml）を手動起動する方法もあります。" -ForegroundColor Yellow
  exit 1
}

# ------------------------------------------------------------------
# 環境変数
# ------------------------------------------------------------------
$env:MEDIA_SYNC_USER_AGENT = "CardPortMediaSync/2.0 (https://github.com/jiantailanglin266-rgb/yakiniku-senri; contact: $Contact)"
# mountain-peak と同じく、1件ごとに間隔を空けます
$env:MEDIA_SYNC_INTERVAL_MS = "1500"
$env:MEDIA_AUTO_APPROVE = if ($AutoApprove) { "true" } else { "false" }

if ($AutoApprove) {
  Write-Host "`n自動承認: 有効（パブリックドメインと CC0 のみ）" -ForegroundColor Yellow
  Write-Host "  作者表示が必要なライセンスは、管理画面での確認が必要です。"
} else {
  Write-Host "`n自動承認: 無効（取得はしますが、承認するまで表示されません）"
}

$writeFlag = if ($DryRun) { @() } else { @("--write") }

function Invoke-Step {
  param([string]$Title, [string[]]$Arguments)
  Write-Host "`n--- $Title ---" -ForegroundColor Cyan
  & npm @Arguments
  if ($LASTEXITCODE -ne 0) {
    Write-Host "$Title で失敗しました。" -ForegroundColor Red
    exit $LASTEXITCODE
  }
}

# ------------------------------------------------------------------
# 1. どのページにどんな画像が要るかを組み立てる
# ------------------------------------------------------------------
Invoke-Step "1. 画像リクエストの生成" (@("run", "media:requests", "--") + $writeFlag)

# ------------------------------------------------------------------
# 2. 記事タイトルから代表画像を取り、ライセンスを確認する
# ------------------------------------------------------------------
$syncArgs = @("run", "media:sync", "--") + $writeFlag
if ($Limit -gt 0) { $syncArgs += "--limit=$Limit" }
Invoke-Step "2. Wikimedia Commons から取得" $syncArgs

# ------------------------------------------------------------------
# 3. 掲載中の画像の再確認（指定時のみ）
# ------------------------------------------------------------------
if ($Revalidate) {
  Invoke-Step "3. 掲載中の画像を再確認" (@("run", "media:revalidate", "--") + $writeFlag)
}

# ------------------------------------------------------------------
# 4. 承認済みだけをダウンロードして最適化
# ------------------------------------------------------------------
Invoke-Step "4. 画像のダウンロードと最適化" (@("run", "media:optimize", "--") + $writeFlag)

# ------------------------------------------------------------------
# 5. 生成物の検証
# ------------------------------------------------------------------
Invoke-Step "5. 生成物の検証" @("run", "media:validate")

# ------------------------------------------------------------------
# 6. 結果の確認方法を案内する
# ------------------------------------------------------------------
Write-Host "`n=== 完了 ===" -ForegroundColor Green

if ($DryRun) {
  Write-Host "確認のみで、ファイルは更新していません。"
  Write-Host "実際に取得するには -DryRun を外して実行してください。"
  exit 0
}

Write-Host "`n次にすること:"
Write-Host "  1. 画面で確認する      npm run dev  →  http://localhost:3000/card-port/ja/"
Write-Host "  2. 出典一覧を確認する  http://localhost:3000/card-port/ja/image-credits/"
Write-Host "  3. 保留分を確認する    http://localhost:3000/card-port/ja/admin/"
Write-Host "  4. 問題なければコミット"
Write-Host "       git add src/media/data public/media"
Write-Host "       git commit -m `"chore(media): Wikimedia Commons の画像を追加`""
Write-Host "       git push"
Write-Host "`n  Push すると GitHub Pages へ自動でデプロイされます。"
Write-Host "`n注意: 承認した画像は、作者・ライセンス・出典が画像の直下に表示されます。" -ForegroundColor Yellow
Write-Host "      表示を消すと、ライセンス条件を満たさなくなります。" -ForegroundColor Yellow
