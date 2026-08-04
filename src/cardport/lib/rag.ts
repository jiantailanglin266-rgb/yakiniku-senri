/**
 * AIカードコンシェルジュの検索基盤（RAG のうち Retrieval 部分）。
 *
 * ■ なぜ生成モデルを直接呼ばないか
 *   このサイトは静的エクスポートで配信でき、APIキー無しでも全機能が動くことを要件にしています。
 *   そのため既定では、掲載データから作った索引をブラウザ内で検索し、
 *   「掲載データにある文だけ」を根拠つきで返します。事実に無い内容を生成しません。
 *
 * ■ 生成モデルを使う場合
 *   `NEXT_PUBLIC_CHAT_API_URL` を設定すると、同じ検索結果を文脈として
 *   サーバー側のエンドポイントへ渡す構成に切り替えられます（README 参照）。
 *   その場合も、ここで組み立てた根拠つきの文脈だけを渡してください。
 */
import { cards } from "@/cardport/data/cards";
import { campaigns } from "@/cardport/data/campaigns";
import { faqs } from "@/cardport/data/faqs";
import { news } from "@/cardport/data/news";
import { videos } from "@/cardport/data/videos";
import { financialTools } from "@/cardport/data/tools";
import { web3Services } from "@/cardport/data/web3";
import { guides } from "@/cardport/data/guides";
import { diagnoses } from "@/cardport/data/diagnoses";
import { simulators } from "@/cardport/data/simulators";
import { paymentServices } from "@/cardport/data/payments";
import { pick, pickList } from "@/cardport/i18n/localized";
import type { Locale } from "@/cardport/i18n/locales";
import { routes } from "./routes";

export type KnowledgeKind =
  | "card"
  | "campaign"
  | "faq"
  | "news"
  | "video"
  | "tool"
  | "web3"
  | "guide"
  | "diagnosis"
  | "simulator"
  | "payment";

export type KnowledgeDoc = {
  id: string;
  kind: KnowledgeKind;
  title: string;
  /** 回答としてそのまま提示できる本文 */
  body: string;
  href: string;
  /** 情報確認日・更新日。回答に必ず添えます */
  verifiedOn?: string;
  keywords: string[];
};

/** 掲載データから索引を作ります（言語ごとにキャッシュ） */
const indexCache = new Map<Locale, KnowledgeDoc[]>();

export function buildIndex(locale: Locale): KnowledgeDoc[] {
  const cached = indexCache.get(locale);
  if (cached) return cached;

  const docs: KnowledgeDoc[] = [];

  for (const card of cards) {
    const name = pick(card.name, locale);
    docs.push({
      id: `card:${card.id}`,
      kind: "card",
      title: name,
      body: [
        pick(card.summary, locale),
        `年会費: ${card.annualFee === 0 ? "無料" : `${card.annualFee.toLocaleString("ja-JP")}円`} / 基本還元率: ${card.baseRate}% / 最大還元率: ${card.maxRate}%`,
        `発行まで最短${card.issueDays}日 / 海外事務手数料 ${card.fxFee}%`,
        ...pickList(card.pros, locale).slice(0, 2),
      ].join("\n"),
      href: routes.card(locale, card.slug),
      verifiedOn: card.verifiedOn,
      keywords: [
        name,
        card.slug,
        card.rank,
        ...card.categories,
        ...card.brands,
        pick(card.pointName, locale),
        card.annualFee === 0 ? "年会費無料" : "年会費",
        card.mileRate > 0 ? "マイル" : "",
        card.lounges.ja.length > 0 ? "空港ラウンジ" : "",
        card.business ? "法人カード" : "",
        card.crypto ? "暗号資産" : "",
      ].filter(Boolean),
    });
  }

  for (const campaign of campaigns) {
    docs.push({
      id: `campaign:${campaign.id}`,
      kind: "campaign",
      title: pick(campaign.title, locale),
      body: [
        `対象: ${pick(campaign.target, locale)}`,
        `掲載期限: ${campaign.endsOn}`,
        "条件:",
        ...pickList(campaign.conditions, locale).map((line) => `・${line}`),
      ].join("\n"),
      href: routes.campaigns(locale),
      verifiedOn: campaign.endsOn,
      keywords: ["キャンペーン", "入会特典", campaign.cardId, pick(campaign.title, locale)],
    });
  }

  for (const faq of faqs) {
    docs.push({
      id: `faq:${faq.id}`,
      kind: "faq",
      title: pick(faq.question, locale),
      body: pick(faq.answer, locale),
      href: routes.faq(locale),
      keywords: ["FAQ", "よくある質問", pick(faq.question, locale)],
    });
  }

  for (const article of news) {
    docs.push({
      id: `news:${article.id}`,
      kind: "news",
      title: pick(article.title, locale),
      body: pick(article.summary, locale),
      href: routes.newsArticle(locale, article.slug),
      verifiedOn: article.updatedAt,
      keywords: ["ニュース", article.category, ...article.tags],
    });
  }

  for (const video of videos) {
    docs.push({
      id: `video:${video.id}`,
      kind: "video",
      title: pick(video.title, locale),
      body: pickList(video.aiSummary, locale).join("\n"),
      href: routes.video(locale, video.slug),
      verifiedOn: video.publishedAt,
      keywords: [
        "動画",
        "YouTube",
        video.isShort ? "ショート" : "",
        pick(video.title, locale),
      ].filter(Boolean),
    });
  }

  for (const tool of financialTools) {
    docs.push({
      id: `tool:${tool.id}`,
      kind: "tool",
      title: pick(tool.name, locale),
      body: `${pick(tool.summary, locale)}\n料金: ${pick(tool.pricing, locale)}`,
      href: routes.tools(locale),
      keywords: ["ツール", tool.category, pick(tool.name, locale)],
    });
  }

  for (const service of web3Services) {
    docs.push({
      id: `web3:${service.id}`,
      kind: "web3",
      title: pick(service.name, locale),
      body: [
        pick(service.summary, locale),
        `リスク: ${pickList(service.risks, locale)[0] ?? ""}`,
      ].join("\n"),
      href: routes.web3Service(locale, service.slug),
      keywords: [
        "Web3",
        "暗号資産",
        service.category,
        ...service.cryptoAssets,
        pick(service.name, locale),
      ],
    });
  }

  for (const service of paymentServices) {
    docs.push({
      id: `payment:${service.id}`,
      kind: "payment",
      title: pick(service.name, locale),
      body: pick(service.summary, locale),
      href: routes.payments(locale),
      keywords: ["キャッシュレス", "決済", service.type, pick(service.name, locale)],
    });
  }

  for (const guide of guides) {
    docs.push({
      id: `guide:${guide.id}`,
      kind: "guide",
      title: pick(guide.title, locale),
      body: pickList(guide.sections[0]?.body ?? { ja: [] }, locale).join("\n"),
      href: routes.guide(locale, guide.slug),
      verifiedOn: guide.updatedOn,
      keywords: ["ガイド", "初心者", guide.level, pick(guide.title, locale)],
    });
  }

  for (const diagnosis of diagnoses) {
    docs.push({
      id: `diagnosis:${diagnosis.id}`,
      kind: "diagnosis",
      title: pick(diagnosis.title, locale),
      body: pick(diagnosis.lead, locale),
      href: routes.diagnosis(locale, diagnosis.slug),
      keywords: ["診断", "おすすめ", pick(diagnosis.title, locale)],
    });
  }

  for (const simulator of simulators) {
    docs.push({
      id: `simulator:${simulator.id}`,
      kind: "simulator",
      title: pick(simulator.title, locale),
      body: pick(simulator.lead, locale),
      href: routes.simulator(locale, simulator.slug),
      keywords: ["シミュレーター", "計算", pick(simulator.title, locale)],
    });
  }

  indexCache.set(locale, docs);
  return docs;
}

/** 日本語は空白で区切られないため、2文字以上の連続を n-gram で拾います */
function tokenize(text: string): string[] {
  const normalized = text.toLowerCase().replace(/[、。，．,.!?！？「」『』()（）]/g, " ");
  const words = normalized.split(/\s+/).filter((word) => word.length > 0);
  const grams: string[] = [];
  for (const word of words) {
    grams.push(word);
    // ASCII 以外（日本語・中国語・韓国語など）は語の区切りが無いため 2-gram に分解します
    if (/[^\u0000-\u007f]/.test(word)) {
      for (let i = 0; i < word.length - 1; i += 1) grams.push(word.slice(i, i + 2));
    }
  }
  return grams;
}

export type RetrievedDoc = KnowledgeDoc & { score: number };

/**
 * 単純な語の重なりでスコアリングします。
 * タイトル一致とキーワード一致を強めに重み付けし、短いクエリでも狙ったカードに当たるようにしています。
 */
export function retrieve(query: string, locale: Locale, limit = 4): RetrievedDoc[] {
  const docs = buildIndex(locale);
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const scored = docs.map((doc) => {
    const title = doc.title.toLowerCase();
    const keywords = doc.keywords.join(" ").toLowerCase();
    const body = doc.body.toLowerCase();

    let score = 0;
    for (const token of queryTokens) {
      if (title.includes(token)) score += 4;
      if (keywords.includes(token)) score += 2.5;
      if (body.includes(token)) score += 1;
    }
    return { ...doc, score };
  });

  return scored
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/**
 * 入力に機密情報が含まれていないかの簡易チェック。
 * カード番号らしき数字列を検出したら、回答せずに警告を返します。
 */
export function containsSensitiveInput(text: string): boolean {
  const digitsOnly = text.replace(/[\s-]/g, "");
  if (/\d{13,19}/.test(digitsOnly)) return true;
  if (/(セキュリティコード|暗証番号|cvv|cvc|pin\b)/i.test(text)) return true;
  return false;
}

/**
 * 回答を組み立てます。
 * 生成は行わず、掲載データの文をそのまま提示し、必ず出典（サイト内リンク）を添えます。
 */
export type ChatAnswer = {
  kind: "answer" | "empty" | "blocked";
  body: string;
  sources: { title: string; href: string; verifiedOn?: string }[];
};

export function answer(query: string, locale: Locale): ChatAnswer {
  if (containsSensitiveInput(query)) {
    return { kind: "blocked", body: "", sources: [] };
  }

  const docs = retrieve(query, locale);
  if (docs.length === 0) {
    return { kind: "empty", body: "", sources: [] };
  }

  return {
    kind: "answer",
    body: docs.map((doc) => `【${doc.title}】\n${doc.body}`).join("\n\n"),
    sources: docs.map((doc) => ({ title: doc.title, href: doc.href, verifiedOn: doc.verifiedOn })),
  };
}
