/**
 * 管理画面が表示する在庫と健全性チェック。
 *
 * ■ いまの実装範囲
 *   コンテンツは TypeScript のデータファイルで管理しているため、
 *   この画面は **読み取り専用の点検ダッシュボード** です。
 *   「何が未検証か」「どのリンクが切れうるか」「どの翻訳が欠けているか」を
 *   一覧化し、編集すべき箇所を特定するために使います。
 *
 * ■ 書き込みを足すとき
 *   Supabase（docs/DATABASE.md のスキーマ）へ移したうえで、
 *   認証・権限・監査ログを先に入れてください。
 *   認証なしで書き込み口を公開してはいけません。
 */

import { coins } from "@/portal/data/coins";
import { DATASET_STATUS, exchanges } from "@/portal/data/exchanges";
import { NEWS_DATASET_STATUS, news } from "@/portal/data/news";
import { wallets } from "@/portal/data/wallets";
import { tools } from "@/portal/data/tools";
import { videos } from "@/portal/data/videos";
import { learnArticles } from "@/portal/data/learn";
import { diagnoses } from "@/portal/data/diagnoses";
import { legalPages } from "@/portal/data/legal";
import { campaigns } from "@/portal/data/site-content";
import { affiliateLinks, resolveLink } from "./affiliate";
import { locales } from "@/portal/i18n/config";
import { hasAuthoredDictionary } from "@/portal/i18n/dictionaries";
import { marketSource } from "./market";

export type InventoryRow = { label: string; count: number; path: string };

export function contentInventory(): InventoryRow[] {
  return [
    { label: "仮想通貨", count: coins.length, path: "/coins" },
    { label: "ニュース", count: news.length, path: "/news" },
    { label: "取引所", count: exchanges.length, path: "/exchanges" },
    { label: "ウォレット", count: wallets.length, path: "/wallets" },
    { label: "Web3ツール", count: tools.length, path: "/tools" },
    { label: "動画", count: videos.length, path: "/videos" },
    { label: "学習記事", count: learnArticles.length, path: "/learn" },
    { label: "診断", count: diagnoses.length, path: "/diagnosis" },
    { label: "キャンペーン", count: campaigns.length, path: "/campaigns" },
    { label: "固定ページ", count: legalPages.length, path: "/legal/about" },
  ];
}

export type HealthIssue = {
  severity: "high" | "medium" | "low";
  area: string;
  message: string;
  /** 直すべきファイル */
  file: string;
};

/**
 * 健全性チェック。
 * 「気づかないまま公開されると困るもの」を優先度順に並べます。
 */
export function healthIssues(): HealthIssue[] {
  const issues: HealthIssue[] = [];

  // --- 事実性 -------------------------------------------------------------
  const unverifiedExchanges = exchanges.filter((exchange) => !exchange.checkedAt);
  if (unverifiedExchanges.length > 0) {
    issues.push({
      severity: "high",
      area: "事実性",
      message: `情報確認日が未設定の取引所が ${unverifiedExchanges.length} 件あります（${unverifiedExchanges
        .map((exchange) => exchange.name)
        .join(", ")}）。手数料等を確認したうえで checkedAt を設定してください。`,
      file: "src/portal/data/exchanges.ts",
    });
  }

  if (DATASET_STATUS === "sample") {
    issues.push({
      severity: "high",
      area: "事実性",
      message:
        "取引所データがサンプル状態です。数値は「公式サイトで要確認」と表示されています。実測値へ差し替えたら DATASET_STATUS を verified にしてください。",
      file: "src/portal/data/exchanges.ts",
    });
  }

  if (NEWS_DATASET_STATUS === "sample") {
    issues.push({
      severity: "medium",
      area: "コンテンツ",
      message: "ニュースがサンプル記事です。RSS / ニュースAPIからの取得に切り替えてください。",
      file: "src/portal/data/news.ts",
    });
  }

  const unverifiedWallets = wallets.filter((wallet) => !wallet.checkedAt);
  const unverifiedTools = tools.filter((tool) => !tool.checkedAt);
  if (unverifiedWallets.length + unverifiedTools.length > 0) {
    issues.push({
      severity: "medium",
      area: "事実性",
      message: `情報確認日が未設定のウォレット ${unverifiedWallets.length} 件 / ツール ${unverifiedTools.length} 件があります。`,
      file: "src/portal/data/wallets.ts, src/portal/data/tools.ts",
    });
  }

  // --- 収益導線 -----------------------------------------------------------
  const unconfigured = affiliateLinks.filter(
    (link) => !resolveLink(link.id, link.fallbackUrl).sponsored,
  );
  if (unconfigured.length > 0) {
    issues.push({
      severity: "medium",
      area: "収益導線",
      message: `アフィリエイトリンクが未設定のプログラムが ${unconfigured.length} 件あります（${unconfigured
        .map((link) => link.envKey)
        .join(", ")}）。未設定のあいだは公式サイトへの通常リンクとして動作し、PR表記も出ません。`,
      file: ".env.local",
    });
  }

  const expired = affiliateLinks.filter(
    (link) => link.endsAt && Date.parse(link.endsAt) < Date.now(),
  );
  if (expired.length > 0) {
    issues.push({
      severity: "high",
      area: "収益導線",
      message: `掲載期間が終了したアフィリエイトリンクが ${expired.length} 件あります。通常リンクに切り替わっています。`,
      file: "src/portal/lib/affiliate.ts",
    });
  }

  // --- コンテンツ ---------------------------------------------------------
  const missingVideoIds = videos.filter((video) => !video.youtubeId);
  if (missingVideoIds.length > 0) {
    issues.push({
      severity: "medium",
      area: "コンテンツ",
      message: `YouTube 動画IDが未設定の動画が ${missingVideoIds.length} 件あります。埋め込みと VideoObject が出力されません。`,
      file: "src/portal/data/videos.ts",
    });
  }

  // --- 翻訳 ---------------------------------------------------------------
  const missingDictionaries = locales.filter((locale) => !hasAuthoredDictionary(locale.code));
  if (missingDictionaries.length > 0) {
    issues.push({
      severity: "low",
      area: "翻訳",
      message: `UI辞書が未整備の言語が ${missingDictionaries.length} 件あります（${missingDictionaries
        .map((locale) => locale.labelJa)
        .join(", ")}）。現在は英語へフォールバックしています。`,
      file: "src/portal/i18n/dictionaries.ts",
    });
  }

  // --- データ取得 ---------------------------------------------------------
  if (marketSource() === "mock") {
    issues.push({
      severity: "medium",
      area: "データ取得",
      message:
        "市場データがモックです。MARKET_DATA_SOURCE=coingecko と COINGECKO_API_KEY を設定すると実データに切り替わります。",
      file: ".env.local",
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** 外部リンクの一覧。リンク切れ検知バッチの入力に使います。 */
export function outboundLinks(): { label: string; url: string; kind: string }[] {
  return [
    ...exchanges.map((entry) => ({ label: entry.name, url: entry.officialUrl, kind: "exchange" })),
    ...wallets.map((entry) => ({ label: entry.name, url: entry.officialUrl, kind: "wallet" })),
    ...tools.map((entry) => ({ label: entry.name, url: entry.officialUrl, kind: "tool" })),
    ...coins.flatMap((coin) =>
      Object.entries(coin.links)
        .filter(([, url]) => Boolean(url))
        .map(([key, url]) => ({
          label: `${coin.symbol} ${key}`,
          url: url as string,
          kind: "coin",
        })),
    ),
  ];
}
