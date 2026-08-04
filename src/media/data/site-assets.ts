/**
 * Wikimedia 以外の画像素材の出所台帳。
 *
 * ============================================================
 * ⚠ ライセンスが自由な素材でも、条件はあります。
 *   MIT は「著作権表示と許諾表示を複製物に含めること」が条件です。
 *   条件を満たしているかを人が確認できるよう、
 *   作者・出典・ライセンス・全文の置き場所をここに残します。
 *
 * ⚠ 推測を書きません。
 *   出所を確認できていないものは `verifiedAt: null` とし、
 *   「未確認」であることをそのまま画面に出します。
 *   出所不明を「自作」と書くと、記録として意味を失います。
 * ============================================================
 *
 * Wikimedia Commons から取得した画像はここに入りません。
 * そちらは `src/media/data/assets.ts` が唯一の情報源です
 * （取得日・検証日をスクリプトが管理するため、手書きと混ぜません）。
 */

export type SiteAssetOrigin =
  /** このリポジトリで生成・撮影したもの */
  | "first-party"
  /** 他者の素材を、ライセンスに従って使っているもの */
  | "third-party"
  /** 出所の記録が無く、確認が必要なもの */
  | "unverified";

export type SiteAssetCredit = {
  id: string;
  /** 画面に出す名前 */
  label: string;
  origin: SiteAssetOrigin;
  /** 素材の置き場所（リポジトリ内のパス） */
  path: string;
  fileCount: number;

  /* --- 作者・出典 --- */
  authorName: string | null;
  authorUrl: string | null;
  sourceName: string | null;
  sourceUrl: string | null;

  /* --- ライセンス --- */
  licenseCode: string;
  licenseName: string;
  licenseUrl: string | null;
  /**
   * ライセンス全文をサイト内に置いた場所。
   * MIT のように「著作権表示と許諾表示の保持」が条件のものは必須です。
   */
  licenseTextPath: string | null;

  /* --- 改変 --- */
  isModified: boolean;
  modificationDescription: string | null;

  /* --- 使用箇所と確認 --- */
  usedOn: string[];
  /** 確認日（YYYY-MM-DD）。null は未確認。 */
  verifiedAt: string | null;
  /** 何をもって確認としたか。未確認なら、何が分かっていないかを書きます。 */
  verificationNote: string;
};

export const siteAssetCredits: SiteAssetCredit[] = [
  {
    id: "cryptoport-page-visuals",
    label: "CRYPTO PORT の各ページのイメージ画像（10点）",
    origin: "first-party",
    path: "public/images/portal/pages/",
    fileCount: 10,
    authorName: "サイト運営者",
    authorUrl: null,
    sourceName: "運営者が生成AIで作成し、提供を受けたもの",
    sourceUrl: null,
    licenseCode: "自作",
    licenseName: "サイト運営者が権利を持つ素材",
    licenseUrl: null,
    licenseTextPath: null,
    isModified: true,
    modificationDescription: "掲載サイズに合わせ、幅1600pxの WebP へ変換（リサイズと形式変換のみ）",
    usedOn: [
      "CRYPTO PORT 通貨一覧 / ニュース / 取引所 / ウォレット / Web3ツール / 動画 / 診断 / キャンペーン / FAQ",
      "CRYPTO PORT トップページの急上昇ニュース",
    ],
    verifiedAt: "2026-08-04",
    verificationNote:
      "運営者から提供された画像です。画面デザインのイメージであり、画像内に描かれている価格・評価・手数料・キャンペーン金額は実際のデータではありません。実在の取引所名・ウォレット名が描かれているため、数値として読まれないよう、掲載箇所には必ず注記（PageVisual の figcaption）を添えています。",
  },
  {
    id: "cryptoport-coin-banners",
    label: "CRYPTO PORT トップの銘柄バナー（10点）",
    origin: "first-party",
    path: "public/images/portal/marquee/",
    fileCount: 10,
    authorName: "サイト運営者",
    authorUrl: null,
    sourceName: "運営者が生成AIで作成し、提供を受けたもの",
    sourceUrl: null,
    licenseCode: "自作",
    licenseName: "サイト運営者が権利を持つ素材",
    licenseUrl: null,
    licenseTextPath: null,
    isModified: true,
    modificationDescription:
      "元素材は横長のバナーで、右側に上昇チャートと英語のキャッチコピー" +
      "（「THE STANDARD FOR GLOBAL VALUE」「BUILD・TRADE・EARN」「THE PEOPLE'S COIN」等）が" +
      "入っていました。値上がりの示唆・運営者による推奨と読まれるため、" +
      "コイン部分だけを正方形（800×800）で切り出した WebP に差し替えています" +
      "（切り出し・リサイズ・形式変換のみ）。",
    usedOn: ["CRYPTO PORT トップページ上部の銘柄バナー（CoinMarquee）"],
    verifiedAt: "2026-08-04",
    verificationNote:
      "運営者から提供された画像です。公式のロゴファイルではなく、生成AIによる描写です。" +
      "上昇チャートとキャッチコピーは切り落としてあり、価格・順位・将来の値動きを示す用途では" +
      "使っていません（装飾のみ）。画像内の文字は読み上げに乗らないため alt は空にし、" +
      "リンク名は銘柄名で与えています。" +
      "⚠ 実在する銘柄の商標（Bitcoin / Ethereum / XRP / Solana / BNB / Cardano / Dogecoin / " +
      "Chainlink / Sui / TRON）が描かれています。CRYPTO PORT はこれらの銘柄を解説し銘柄名も" +
      "掲載しているサイトであるため説明目的の使用にあたりますが、商標の可否は著作権とは別に" +
      "各権利者への確認が必要です（未確認）。また Dogecoin の画像には柴犬（Kabosu）の意匠が" +
      "含まれます。元写真には著作権があり、生成画像がその派生にあたるかは確認できていません。",
  },
  {
    id: "flag-icons",
    label: "言語切り替えの国旗（42点）",
    origin: "third-party",
    path: "public/images/flags/",
    fileCount: 42,
    authorName: "Panayiotis Lipiridis",
    authorUrl: "https://github.com/lipis",
    sourceName: "flag-icons",
    sourceUrl: "https://github.com/lipis/flag-icons",
    licenseCode: "MIT",
    licenseName: "The MIT License (MIT)",
    licenseUrl: "https://github.com/lipis/flag-icons/blob/main/LICENSE",
    licenseTextPath: "/licenses/flag-icons-LICENSE.txt",
    isModified: true,
    modificationDescription:
      "表示サイズに合わせ、SVG を 48×36 の WebP へ変換（リサイズと形式変換のみ。意匠は変更していません）",
    usedOn: [
      "焼肉 千里 の全ページ（言語切り替え）",
      "AI PORT の全ページ（言語切り替え）",
      "CARD PORT の全ページ（言語切り替え）",
      "SPORTS PORT の全ページ（言語切り替え）",
      "ポータルの全ページ（言語切り替え）",
    ],
    verifiedAt: "2026-08-04",
    verificationNote:
      "リポジトリの履歴（コミット 27f0552）に flag-icons を変換した記録があり、配布元の LICENSE 原文を取得して著作権者名と本文を照合しました。全文は /licenses/flag-icons-LICENSE.txt に掲載しています。",
  },
  {
    id: "cardport-generated",
    label: "CARD PORT の OGP・アイコン",
    origin: "first-party",
    path: "public/images/cardport/",
    fileCount: 6,
    authorName: "サイト運営者",
    authorUrl: null,
    sourceName: "自作（scripts/generate-cardport-assets.mjs で生成）",
    sourceUrl: null,
    licenseCode: "自作",
    licenseName: "サイト運営者が権利を持つ素材",
    licenseUrl: null,
    licenseTextPath: null,
    isModified: false,
    modificationDescription: null,
    usedOn: ["CARD PORT の各ページ", "SNS シェア時のサムネイル"],
    verifiedAt: "2026-08-04",
    verificationNote:
      "生成スクリプトがリポジトリ内にあり、同じ出力を再現できます。外部素材・外部フォントを含みません。",
  },
  {
    id: "sports-portal-generated",
    label: "SPORTS PORT・ポータルの OGP",
    origin: "first-party",
    path: "public/images/sports/, public/images/portal/",
    fileCount: 2,
    authorName: "サイト運営者",
    authorUrl: null,
    sourceName: "自作（scripts/generate-sports-assets.mjs ほかで生成）",
    sourceUrl: null,
    licenseCode: "自作",
    licenseName: "サイト運営者が権利を持つ素材",
    licenseUrl: null,
    licenseTextPath: null,
    isModified: false,
    modificationDescription: null,
    usedOn: ["SPORTS PORT・ポータルの各ページ", "SNS シェア時のサムネイル"],
    verifiedAt: "2026-08-04",
    verificationNote:
      "生成スクリプトがリポジトリ内にあり、同じ出力を再現できます。外部素材・外部フォントを含みません。",
  },
  {
    id: "ai-port-brand",
    label: "AI PORT のロゴ・OGP",
    origin: "first-party",
    path: "public/images/ai-port/",
    fileCount: 2,
    authorName: "サイト運営者",
    authorUrl: null,
    sourceName: "自作（このリポジトリで作成した SVG）",
    sourceUrl: null,
    licenseCode: "自作",
    licenseName: "サイト運営者が権利を持つ素材",
    licenseUrl: null,
    licenseTextPath: null,
    isModified: false,
    modificationDescription: null,
    usedOn: ["AI PORT の各ページ", "SNS シェア時のサムネイル"],
    verifiedAt: "2026-08-04",
    verificationNote: "外部素材・外部フォントを含まない、手書きの SVG です。",
  },
  {
    id: "ai-port-section-banners",
    label: "AI PORT のセクション見出し画像（9点）",
    origin: "first-party",
    path: "public/images/ai-port/sections/",
    fileCount: 9,
    authorName: "サイト運営者",
    authorUrl: null,
    sourceName: "サイト運営者が ChatGPT（画像生成）で作成",
    sourceUrl: null,
    licenseCode: "自作",
    licenseName: "サイト運営者が権利を持つ素材",
    licenseUrl: null,
    licenseTextPath: null,
    isModified: true,
    modificationDescription:
      "9点のうち5点（youtube / events / guides / topics / faq）は下部を切り落としています。" +
      "元素材の下部に「サイトの画面らしきUI」が描き込まれており、そこに実在しない数字と固有名詞" +
      "（架空の再生数・架空の更新日・サイトが扱っていないイベント名・実在しない質問）が" +
      "含まれていたためです。実データの一覧のすぐ上に並ぶと読者が実データと読み違えます。" +
      "見出しと説明文は切っていません。ほかに JPEG への変換のみ（意匠は変更していません）",
    usedOn: ["AI PORT トップページのセクション見出し（9箇所）"],
    verifiedAt: "2026-08-04",
    verificationNote:
      "サイト運営者から提供された生成画像です。生成AIの出力のため、実在の人物を写した写真ではありません" +
      "（肖像権の確認対象となる被写体はいません）。画像内の文字は画面に表示している見出し・説明文と" +
      "一致することを確認済みです。切り落とした範囲は上記のとおりです。",
  },
  {
    id: "senri-photos",
    label: "焼肉 千里 の写真・図版",
    origin: "unverified",
    path: "public/images/（access, brand, commitment, common, gallery, hero, menu, movie, news, owner, story, takeout）",
    fileCount: 38,
    authorName: null,
    authorUrl: null,
    sourceName: null,
    sourceUrl: null,
    licenseCode: "未確認",
    licenseName: "未確認",
    licenseUrl: null,
    licenseTextPath: null,
    isModified: false,
    modificationDescription: null,
    usedOn: ["焼肉 千里 の各ページ"],
    // ⚠ 「店舗の素材だろう」は推測です。推測を記録に書くと、記録の意味が無くなります。
    verifiedAt: null,
    verificationNote:
      "撮影者・提供元・撮影日の記録がありません。一部は scripts/generate-placeholders.mjs が生成した仮画像ですが、どれが本番写真でどれが仮画像かの記録が無いため、まとめて未確認としています。店舗への確認が必要です。",
  },
];

/** 他者の素材だけを返します（クレジット表示が必要なもの）。 */
export function getThirdPartyCredits(): SiteAssetCredit[] {
  return siteAssetCredits.filter((credit) => credit.origin === "third-party");
}

/** ライセンス全文の保持が条件になっている素材。 */
export function getCreditsRequiringLicenseText(): SiteAssetCredit[] {
  return siteAssetCredits.filter((credit) => credit.licenseTextPath !== null);
}

/** 出所が確認できていない素材（棚卸しの残件）。 */
export function getUnverifiedCredits(): SiteAssetCredit[] {
  return siteAssetCredits.filter((credit) => credit.origin === "unverified");
}
