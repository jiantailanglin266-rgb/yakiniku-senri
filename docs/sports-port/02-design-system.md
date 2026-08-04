# SPORTS PORT — デザインシステム / コンポーネント一覧

テーマは「2040年のスポーツスタジアムとデータ空間」。
ただし装飾は**背景レイヤーに閉じ込め**、データは必ず不透明な面の上に置きます。

---

## 1. カラートークン

`src/app/(sports)/sports.css` の `@theme` に定義。Tailwind のユーティリティとして使えます
（`bg-void` `text-ink` `border-edge` `text-cyan` …）。

### 面

| トークン        | 値        | 用途                                 |
| --------------- | --------- | ------------------------------------ |
| `--color-void`  | `#04060f` | ページ最下層。ほぼ黒のダークネイビー |
| `--color-abyss` | `#070b1a` | フッター・ドロワー                   |
| `--color-deep`  | `#0a1020` | 予備                                 |
| `--color-panel` | `#0e1628` | **スコアを載せる面**（不透明。必須） |
| `--color-edge`  | `#1c2842` | ボーダー・区切り線                   |

### アクセント

| トークン           | 値        | 意味                                                 |
| ------------------ | --------- | ---------------------------------------------------- |
| `--color-cyan`     | `#22d3ee` | 一次アクセント。リンク・CTA・強調                    |
| `--color-electric` | `#3b82f6` | 予備                                                 |
| `--color-indigo`   | `#6366f1` | グラデーションの中間                                 |
| `--color-violet`   | `#a855f7` | Web3.0 系                                            |
| `--color-magenta`  | `#d946ef` | グラデーション終端・動画                             |
| `--color-neon`     | `#4ade80` | 勝利・公式発表・良好                                 |
| `--color-flame`    | `#f97316` | 野球・警告未満の注意                                 |
| `--color-live`     | `#f43f5e` | **試合中・敗戦・重大な注意（この色は他に使わない）** |
| `--color-caution`  | `#f59e0b` | 未確認情報・年齢/地域制限・リスク                    |

### 文字

`--color-ink` `#f8fafc` → `--color-ink-soft` `#cbd5e1` → `--color-ink-dim` `#94a3b8` → `--color-ink-faint` `#64748b`

**スコア・チーム名は `ink` か `ink-soft` のみ。** `ink-dim` 以下は補助情報に限定します。

### 競技別アクセント

各競技が `Sport.accent` を持ち、リーグ名・アイコン・カード上端の色に使われます。
（サッカー = シアン、野球 = オレンジ、バスケ = アンバー、F1 = レッド、eスポーツ = マゼンタ …）

---

## 2. タイポグラフィ

| 用途         | フォント       | 変数                |
| ------------ | -------------- | ------------------- |
| 本文・見出し | Inter          | `--font-display-sp` |
| 数値・時刻   | JetBrains Mono | `--font-terminal`   |

**数値は必ず等幅**（`.tnum` / `.sp-mono`）。1桁→2桁でスコアが横に揺れると読み違えるためです。
`time` 要素と `[data-score]` `[data-clock]` は自動的に `tabular-nums` になります。

---

## 3. エフェクトのユーティリティ

すべて `sports.css` の `@utility` として定義。**背景レイヤー専用**です。

| クラス             | 効果                                           |
| ------------------ | ---------------------------------------------- |
| `sp-aurora`        | オーロラ／メッシュグラデーション（4層）        |
| `sp-aurora-drift`  | オーロラをゆっくり移動                         |
| `sp-grid`          | デジタルグリッド（放射状マスク付き）           |
| `sp-pitch`         | 遠近法のスタジアム床                           |
| `sp-floodlight`    | スタジアム照明（コニックグラデーション）       |
| `sp-noise`         | ノイズテクスチャ（バンディング防止）           |
| `sp-glass`         | ガラス表現（`backdrop-filter`）                |
| `sp-solid`         | **不透明パネル。スコア・順位表はこちらを使う** |
| `sp-holo`          | ホログラム的な光沢                             |
| `sp-glow-edge`     | 光るボーダー                                   |
| `sp-gradient-text` | レインボーグラデーション文字                   |
| `sp-tilt`          | ホバー時の立体傾斜（`hover: hover` のみ）      |
| `sp-scroll-x`      | 横スクロール領域（細いスクロールバー）         |
| `sp-eyebrow`       | 小見出しラベル（等幅・広い字間・大文字）       |

### アニメーション

`sp-anim-marquee`（ティッカー）/ `sp-anim-live`（LIVEドット）/ `sp-anim-flash`（得点時フラッシュ）/
`sp-anim-sheen`（グラデーション移動）/ `sp-anim-orbit`（スタジアムリング回転）

**`prefers-reduced-motion: reduce` ですべて停止**します（CSS 側で一括、加えて JS 側も
`useReducedMotion()` で粒子アニメーションと軌道回転を止めます）。

### 印刷

順位表・日程を紙で使う人がいるため、`@media print` で背景装飾をすべて消し、黒文字に切り替えます。

---

## 4. 3D 表現について

**WebGL（three.js / React Three Fiber）は採用していません。**

要求されていた「スタジアム・光の粒子・浮遊するスコアカード」は、
CSS 3D 変形 + Canvas 2D + SVG の組み合わせで実装しています（`HeroStage.tsx`）。

判断理由：

- three.js 系のランタイムは 150KB を超え、初期表示を確実に遅くします。このページの主役はスコアです
- CSS 3D で必要な密度（同心リング・観客席の光点・浮遊カード）は十分に出せました
- 端末に応じた減量（粒子数を CPU コア数と画面幅で 26〜110 に調整、非表示タブで描画停止）が単純に書けます

より重い演出が必要になった場合、差し替えるのは `HeroStage.tsx` の1ファイルだけです。

---

## 5. コンポーネント一覧

### レイアウト

| コンポーネント   | 種別   | 役割                                      |
| ---------------- | ------ | ----------------------------------------- |
| `Header`         | client | ナビ・検索・言語切替・モバイルドロワー    |
| `Footer`         | server | 法務ページ全件・広告表記・権利表記        |
| `LocaleSwitcher` | client | **国旗 + その言語での言語名**（両方必須） |

### 表示部品（`ui/primitives.tsx`）

`JsonLd` / `SectionHeading` / `StampLine`（取得時刻・情報元）/ `DataUnavailable` /
`Crest`（SVGモノグラム）/ `Badge` / `LiveDot` / `ActionLink` / `OutboundLink`（`rel="sponsored"`）/
`Breadcrumbs` / `FaqList`

### 試合（`match/MatchParts.tsx`）

`MatchCard` / `Scoreboard`（ピリオド別スコア表つき）/ `Timeline` / `StatBars` / `FormStrip` / `StatusBadge`

### その他

| コンポーネント       | 種別            | 役割                                                                               |
| -------------------- | --------------- | ---------------------------------------------------------------------------------- |
| `Hero` / `HeroStage` | server / client | ファーストビューと3Dステージ                                                       |
| `LiveTicker`         | client          | 横スクロール・ポーリング・得点フラッシュ・失敗時の明示                             |
| `StandingsTable`     | client          | 表 ⇄ カード切り替え（スマホ）。列は競技設定から生成                                |
| `StreamingTable`     | server          | 比較表。情報確認日と広告表記が必須                                                 |
| `WatchOptions`       | server          | 試合・リーグページ用のコンパクト視聴導線                                           |
| `DiagnosisRunner`    | client          | 診断の実行と結果表示                                                               |
| `SportsChat`         | client          | AIアシスタント（サイト内文書のみを参照）                                           |
| `SearchPanel`        | client          | 横断検索（表記ゆれ対応）                                                           |
| `LocalTime`          | client          | 端末タイムゾーンへの変換                                                           |
| `Reveal` / `CountUp` | client          | スクロール連動アニメーション                                                       |
| カード群             | server          | `NewsCard` `VideoCard` `SportCard` `LeagueCard` `TeamCard` `PlayerCard` `Web3Card` |

---

## 6. レスポンシブ

| 端末             | 対応                                                               |
| ---------------- | ------------------------------------------------------------------ |
| スマートフォン   | ヘッダーは「検索・言語・メニュー」のみ。順位表はカード表示に切替可 |
| タブレット       | 2カラム                                                            |
| ノートPC以上     | 3〜4カラム。3D演出とホバー傾斜が有効                               |
| ワイド／大型画面 | `max-w-[110rem]` で行長を制限（読みづらくなるため無制限にしない）  |

3D演出は `lg:` 以上でのみ描画し、モバイルでは canvas の粒子数も減らします。

---

## 7. アクセシビリティ

- スキップリンク、`aria-labelledby` を全セクションに付与
- 装飾要素はすべて `aria-hidden`
- フォーカスリング（シアン 2px）を全要素で維持
- 順位表・比較表に `<caption class="sr-only">`
- 色だけに依存しない（順位の昇降は色 + `+2` / `-1` の記号、直近成績は色 + `W/L/D` の文字）
- RTL（アラビア語）は `dir="rtl"` を `<html>` に付与。数値表は `.sp-ltr` で LTR 固定
