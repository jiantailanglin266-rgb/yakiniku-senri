# 技術SEO / LLMO・GEO 監査と実装｜焼肉 千里

**監査対象**：本リポジトリのソースコード（推測ではなく実装を読んで判定）

---

## 1. 監査結果サマリー

| 項目                     | 監査前                             | 対応                                 |
| ------------------------ | ---------------------------------- | ------------------------------------ |
| title / description      | ✅ 全ページ設定済み                | 地域KWを補強（実装済み）             |
| canonical                | ✅ 全ページ設定済み                | —                                    |
| robots メタ              | ✅ index,follow                    | —                                    |
| OGP / Twitter Card       | ✅ 設定済み                        | —                                    |
| robots.txt               | ✅ 生成済み                        | —                                    |
| sitemap.xml              | ⚠️ lastModified が毎ビルド現在時刻 | **修正済み**                         |
| favicon                  | ✅ ico / png / apple-touch         | —                                    |
| **manifest**             | ❌ **なし**                        | **新規作成**                         |
| Hタグ                    | ✅ 各ページ h1 は1つ               | —                                    |
| パンくず                 | ✅ UI + BreadcrumbList             | —                                    |
| 404                      | ✅ not-found.tsx                   | —                                    |
| alt属性                  | ✅ media.ts で一元管理             | —                                    |
| 画像最適化               | ✅ next/image、WebP                | —                                    |
| LazyLoad                 | ✅ next/image 既定                 | FVの非表示パネルも遅延化（実装済み） |
| CLS                      | ✅ 全画像に width/height           | —                                    |
| **Restaurant の geo**    | ❌ **なし**                        | **枠を実装（値は要確認）**           |
| **priceRange**           | ❌ なし                            | 同上                                 |
| **image / logo**         | ❌ なし                            | **実装済み**                         |
| **Menu 構造化データ**    | ❌ **なし**                        | **実装済み（7カテゴリー18品目）**    |
| Speakable                | ❌ なし                            | **実装済み**                         |
| AggregateRating / Review | ❌ なし                            | **意図的に実装しない**（後述）       |

---

## 2. ⚠️ 最重要の警告：AggregateRating / Review を捏造しないでください

ご依頼に `Review` `AggregateRating` の設計が含まれていましたが、**実装していません。**

### ■改善理由

Googleの構造化データポリシーは、**サイト運営者が自ら生成したレビュー・評価をマークアップすることを明確に禁止**しています。
存在しない口コミ数・星評価を出力した場合：

- リッチリザルトの**手動対策（ペナルティ）**
- 検索結果からの**構造化データ全削除**
- 景品表示法上の**優良誤認**に該当するおそれ

**AI検索はさらに深刻です。** ChatGPTやPerplexityが誤った評価値を引用して拡散すると、
訂正が事実上不可能になります。

### ■正しい実装

```
1. 実際の口コミを集める（GoogleビジネスプロフィールとGoogleマップ）
2. Googleマップの評価は Google 自身が持っているため、
   自社サイトでマークアップする必要がない
3. 自社サイトに載せる「お客様の声」は、
   実際にいただいた声を出典・時期つきで掲載する（Reviewマークアップなしでも
   E-E-A-Tの評価対象になります）
```

同様に、**受賞歴・メディア掲載も実績がない限り記載しないでください。**

---

## 3. 実装した改善

### 3-1. Menu / MenuSection / MenuItem / Offer

**■問題点**
`src/data/menu.ts` に18品目・価格・説明という優良なデータがありながら、構造化データに一切出力されていませんでした。

**■改善理由**
Menu構造化データは、Googleの「レストラン」リッチリザルトとAI検索の**メニュー質問への回答**に直接使われます。
「世田谷 焼肉 もみタン 値段」のような検索に対して、AIが値段を答えられるようになります。

**■実装コード**（`src/lib/structured-data.ts`）

```ts
export const menuJsonLd = {
  "@context": "https://schema.org",
  "@type": "Menu",
  "@id": `${siteUrl}/menu#menu`,
  name: `${store.name} お品書き`,
  url: `${siteUrl}/menu`,
  inLanguage: "ja",
  hasMenuSection: getPopulatedCategories()
    // 「おすすめ」は他カテゴリーの再掲なので重複を避けて除外
    .filter((category) => category.id !== "recommended")
    .map((category) => ({
      "@type": "MenuSection",
      name: category.name,
      ...(category.description ? { description: category.description } : {}),
      hasMenuItem: category.items.map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        offers: {
          "@type": "Offer",
          price: item.price,
          priceCurrency: "JPY",
          availability: "https://schema.org/InStock",
          valueAddedTaxIncluded: item.taxIncluded,
        },
      })),
    })),
};
```

`/menu` で出力し、Restaurant から `hasMenu` で参照しています。

**■期待効果**
メニュー名＋価格の検索での露出。AI検索でのメニュー質問への回答獲得。

**■検証結果**

```
Menu セクション数: 7 ／ 品目総数: 18
例: {"@type":"MenuItem","name":"もみ三種盛り合わせ",
     "offers":{"@type":"Offer","price":5600,"priceCurrency":"JPY",
     "availability":"https://schema.org/InStock","valueAddedTaxIncluded":true}}
```

### 3-2. Restaurant の情報拡充

**■問題点**：`image` `logo` `description` `hasMenu` `currenciesAccepted` がなく、
ローカル検索で必要な `geo` `priceRange` も欠落。

**■実装コード**

```ts
export const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": restaurantId,
  name: store.name,
  alternateName: store.nameEn,
  description: `${store.founded}年創業、東京都世田谷区上馬の老舗焼肉店。…`,
  url: siteUrl,
  telephone: store.phone,
  address: postalAddress,
  image: media.hero.map((panel) => `${siteUrl}${panel.src}`),
  logo: `${siteUrl}${media.logo.src}`,
  servesCuisine: ["焼肉", "韓国料理"],
  foundingDate: String(store.founded),
  openingHoursSpecification,
  hasMap: googleMapsUrl,
  acceptsReservations: "https://schema.org/True",
  hasMenu: { "@id": `${siteUrl}/menu#menu` },
  currenciesAccepted: "JPY",
  sameAs: socialLinks.map((link) => link.href),
  // ↓ store.ts に値が入っているときだけ出力（推測値は出さない）
  ...(store.geo ? { geo: { "@type": "GeoCoordinates", ...store.geo } } : {}),
  ...(store.priceRange ? { priceRange: store.priceRange } : {}),
  ...(store.seats > 0 ? { maximumAttendeeCapacity: store.seats } : {}),
  ...(store.paymentAccepted.length > 0
    ? { paymentAccepted: store.paymentAccepted.join(", ") }
    : {}),
};
```

**■残作業（店舗確認が必要）**

`src/data/store.ts` の以下を埋めてください。埋めた瞬間に構造化データへ自動反映されます。

```ts
geo: null,            // → { latitude: 35.6xxx, longitude: 139.6xxx }
                      //    Googleマップで店舗ピンを右クリック→「この場所について」
priceRange: "",       // → 例 "¥6,000〜¥7,999"（1人あたりディナー予算）
seats: 0,             // → 例 40
paymentAccepted: [],  // → 例 ["現金", "クレジットカード", "QRコード決済"]
```

**■期待効果**
`geo` はGoogleマップ・AI検索の位置特定精度に直結します。**未設定は機会損失です。**

### 3-3. Speakable

音声アシスタント・AI検索に読み上げ対象を明示。FAQの質問・回答にクラスを付与しました。

```ts
speakable: {
  "@type": "SpeakableSpecification",
  cssSelector: [".faq-question", ".faq-answer"],
},
```

### 3-4. FAQ を 5問 → 17問へ拡充

**■問題点**：FAQが5問しかなく、AI検索の被引用機会が限定的でした。

**■改善内容**：**確認済みの事実のみ**から12問を追加（営業時間の詳細、創業年、もみシリーズ、
秘伝のタレ、おすすめ、税表記、アクセス各ルート、予約方法、メニュー構成、オーナー）。
残り83問は `03-faq-100.md` に設計済み。うち71問は店舗確認待ちです。

### 3-5. manifest（新規）

**■問題点**：Web App Manifest がありませんでした。

**■実装**：`src/app/manifest.ts` を新設。`/manifest.webmanifest` を200で配信（検証済み）。

### 3-6. sitemap の lastModified

**■問題点**

```ts
const lastModified = new Date(); // ← ビルドのたびに現在時刻
```

全URLが毎回「更新された」ことになり、クロールバジェットの配分を誤らせます。

**■改善後**

```ts
const latestNews = getNews(1)[0];
const lastModified = latestNews ? new Date(latestNews.date) : new Date(0);
```

### 3-7. ページタイトルの地域KW補強

| ページ      | 変更後（テンプレートで `                | 焼肉 千里` が付与） |
| ----------- | --------------------------------------- | ------------------- |
| /about      | 当店について｜世田谷・上馬の老舗焼肉    |
| /commitment | こだわり｜秘伝のタレともみシリーズ      |
| /menu       | お品書き｜焼肉メニューと価格            |
| /takeout    | 焼肉テイクアウト｜世田谷・上馬          |
| /owner      | オーナー紹介｜三代目 河 明樹            |
| /access     | アクセス・営業時間｜駒澤大学駅 徒歩10分 |
| /contact    | お問い合わせ・ご予約                    |

全角32文字以内に収め、検索結果での省略を避けています。

---

## 4. 未実施（実装前に判断が必要なもの）

| 項目              | 理由                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/news` のnoindex | 3記事すべて本文がプレースホルダー。**本文を入れるか、入れるまでnoindexにするかの判断が必要**。現状はindex対象で低品質判定のリスクあり |
| VideoObject       | ブランドムービーが未設定（`brandMovie` が空）のため出力対象なし                                                                       |
| ImageObject       | 現状 `image` の配列で十分。個別のImageObjectは写真にキャプション・撮影者情報を持たせる段階で追加                                      |
| HowTo             | 「焼肉の焼き方」等のブログ記事を作ってから付与                                                                                        |
| Service           | レストランでは Menu / Offer が適切。Service は不要                                                                                    |
| hreflang          | 多言語化していないため不要                                                                                                            |

---

## 5. Core Web Vitals

現状の実装で対策済みの点：

| 指標    | 対策                                                                                  |
| ------- | ------------------------------------------------------------------------------------- |
| **LCP** | FV中央パネルに `priority`、他2枚は遅延。モバイルは1枚しか読み込まない（実測確認済み） |
| **CLS** | 全画像に width/height を指定。フォントは next/font（FOUT/FOIT対策済み）               |
| **INP** | アニメーションは transform / opacity のみ。木槿レイヤーは pointer-events:none         |

実測（本番ビルド）：

```
デスクトップ            60fps / long task 0件
モバイル CPU4倍         53fps / long task 0件
モバイル CPU6倍         38fps / long task 0件
```

**⚠️ 未実施**：Lighthouse / PageSpeed Insights の実測。
この環境は外部ネットワークが遮断されているため実行できませんでした。
公開後に PageSpeed Insights で本番URLを計測してください。
