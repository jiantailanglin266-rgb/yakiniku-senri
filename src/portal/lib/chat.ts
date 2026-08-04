/**
 * AIチャットボットの検索層（RAG の R）。
 *
 * ■ APIキー無しでも動く設計
 *   既定では、サイト内のコンテンツから最も関連の高い断片を取り出し、
 *   その内容をそのまま提示します（＝抽出型）。生成モデルを通さないため、
 *   事実の捏造が構造的に起きません。
 *   `CHAT_PROVIDER=anthropic` を設定すると、ここで取り出した断片を
 *   文脈として生成モデルに渡す構成へ切り替えられます（API route 側）。
 *
 * ■ 守るべき境界
 *   - 特定銘柄の購入を勧めない / 利益を保証しない / 価格上昇を断定しない
 *   - 個別の投資助言を行わない
 *   - 秘密鍵・シードフレーズの入力を求めない（求められたら警告を返す）
 *   - 価格・キャンペーンなど変動する情報には取得日時を添える
 */

import { coins } from "@/portal/data/coins";
import { exchanges } from "@/portal/data/exchanges";
import { learnArticles } from "@/portal/data/learn";
import { siteFaq } from "@/portal/data/site-content";
import { tools } from "@/portal/data/tools";
import { wallets } from "@/portal/data/wallets";
import { normalize } from "./search-index";
import { t, tList } from "./format";

export type ChatPassage = {
  id: string;
  /** 出典の見出し */
  title: string;
  /** 回答に使う本文 */
  text: string;
  /** 参照先（言語プレフィックスなし） */
  path: string;
  kind: "learn" | "coin" | "exchange" | "wallet" | "tool" | "faq";
};

/** 断片コーパス。言語ごとに組み立てます。 */
export function buildCorpus(locale: string): ChatPassage[] {
  const passages: ChatPassage[] = [];

  for (const article of learnArticles) {
    passages.push({
      id: `learn:${article.id}`,
      title: t(article.title, locale),
      text: [t(article.conclusion, locale), ...tList(article.keyPoints, locale)].join(" / "),
      path: `/learn/${article.slug}`,
      kind: "learn",
    });
    passages.push({
      id: `learn-def:${article.id}`,
      title: `${t(article.title, locale)}（定義）`,
      text: t(article.definition, locale),
      path: `/learn/${article.slug}`,
      kind: "learn",
    });
  }

  for (const coin of coins) {
    passages.push({
      id: `coin:${coin.id}`,
      title: `${t(coin.name, locale)}（${coin.symbol}）`,
      text: `${t(coin.summary, locale)} ${t(coin.description, locale)}`,
      path: `/coins/${coin.slug}`,
      kind: "coin",
    });
  }

  for (const exchange of exchanges) {
    passages.push({
      id: `exchange:${exchange.id}`,
      title: exchange.name,
      text: `${t(exchange.summary, locale)} ${tList(exchange.pros, locale).join(" / ")}`,
      path: `/exchanges/${exchange.slug}`,
      kind: "exchange",
    });
  }

  for (const wallet of wallets) {
    passages.push({
      id: `wallet:${wallet.id}`,
      title: wallet.name,
      text: `${t(wallet.summary, locale)} ${tList(wallet.security, locale).join(" / ")}`,
      path: `/wallets/${wallet.slug}`,
      kind: "wallet",
    });
  }

  for (const tool of tools) {
    passages.push({
      id: `tool:${tool.id}`,
      title: tool.name,
      text: `${t(tool.summary, locale)} ${t(tool.description, locale)}`,
      path: `/tools/${tool.slug}`,
      kind: "tool",
    });
  }

  siteFaq.forEach((item, index) => {
    passages.push({
      id: `faq:${index}`,
      title: t(item.q, locale),
      text: t(item.a, locale),
      path: "/faq",
      kind: "faq",
    });
  });

  return passages;
}

/**
 * 質問に近い断片を返します。
 * 語をまたいだ一致数で採点する素朴な方式です（形態素解析なしで日本語も拾えるよう、
 * 2文字のn-gramも併用します）。
 */
export function retrieve(question: string, locale: string, limit = 3): ChatPassage[] {
  const needle = normalize(question);
  if (needle.length === 0) return [];

  // 空白区切りの語 + 2文字n-gram
  const terms = new Set<string>();
  for (const word of question.split(/[\s、。,.?？!！]+/)) {
    const token = normalize(word);
    if (token.length >= 2) terms.add(token);
  }
  for (let i = 0; i < needle.length - 1; i += 1) terms.add(needle.slice(i, i + 2));

  return buildCorpus(locale)
    .map((passage) => {
      const haystack = normalize(`${passage.title} ${passage.text}`);
      let score = 0;
      for (const term of terms) {
        if (!haystack.includes(term)) continue;
        // 長い一致ほど強く評価します（2文字n-gramの偶然一致に埋もれないように）
        score += term.length >= 3 ? term.length * 3 : 1;
      }
      if (normalize(passage.title).includes(needle)) score += 40;
      // FAQ と学習記事は「質問に答える」ために書かれているため、わずかに優先します
      if (passage.kind === "faq" || passage.kind === "learn") score *= 1.15;
      return { passage, score };
    })
    .filter((entry) => entry.score > 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.passage);
}

/** 秘密鍵・シードフレーズに関する入力を検出します */
const SECRET_PATTERNS = [
  "シードフレーズ",
  "シードフレーズを",
  "秘密鍵",
  "リカバリーフレーズ",
  "seedphrase",
  "seedphrases",
  "recoveryphrase",
  "privatekey",
  "mnemonic",
];

export function mentionsSecrets(question: string): boolean {
  const needle = normalize(question);
  return SECRET_PATTERNS.some((pattern) => needle.includes(normalize(pattern)));
}

/** 投資判断を求める質問かどうか（断定を避けた回答に切り替えます） */
const ADVICE_PATTERNS = [
  "買うべき",
  "買ったほうがいい",
  "上がりますか",
  "上がる",
  "下がりますか",
  "儲かる",
  "おすすめの銘柄",
  "shouldibuy",
  "willitgoup",
  "pricepredict",
  "moon",
];

export function asksForAdvice(question: string): boolean {
  const needle = normalize(question);
  return ADVICE_PATTERNS.some((pattern) => needle.includes(normalize(pattern)));
}

export type ChatAnswer = {
  /** 回答本文（段落ごと） */
  paragraphs: string[];
  /** 参照した断片。UI では「関連ページ」として出します */
  sources: ChatPassage[];
  /** 事実か推測かの区別。抽出型では常に "site-content" */
  basis: "site-content" | "guardrail" | "none";
};

/**
 * 抽出型の回答生成。
 * サイト内に根拠がある内容だけを返し、無ければ「見つからなかった」と正直に返します。
 */
export function answer(question: string, locale: string): ChatAnswer {
  if (mentionsSecrets(question)) {
    return {
      paragraphs: [
        locale === "ja"
          ? "秘密鍵とシードフレーズは、当サイトを含むいかなるサービスにも入力しないでください。これらを尋ねてくる相手は、公式サポートを名乗っていても例外なく詐欺です。"
          : "Never enter a private key or seed phrase into any service, including this site. Anyone asking for one is running a scam, even if they claim to be official support.",
        locale === "ja"
          ? "すでに入力してしまった場合は、新しいウォレットを作成し、資産をそちらへ移してください。"
          : "If you have already entered one somewhere, create a new wallet and move your assets to it now.",
      ],
      sources: retrieve("セキュリティ 詐欺 ウォレット", locale, 2),
      basis: "guardrail",
    };
  }

  const passages = retrieve(question, locale);

  if (asksForAdvice(question)) {
    return {
      paragraphs: [
        locale === "ja"
          ? "個別の銘柄について、購入の可否や将来の価格をお答えすることはできません。価格は需要と供給で決まり、将来を予測できる方法は存在しないためです。"
          : "I cannot tell you whether to buy a particular asset or where its price is going. Prices are set by supply and demand and no method reliably predicts them.",
        locale === "ja"
          ? "判断材料としてお使いいただける情報であれば、仕組み・リスク・取引所の比較といった形でご案内できます。以下のページが参考になります。"
          : "What I can do is lay out the mechanics, the risks and the comparisons so you can decide for yourself. These pages are a good place to start.",
      ],
      sources: passages.length > 0 ? passages : retrieve("仮想通貨とは リスク", locale, 2),
      basis: "guardrail",
    };
  }

  if (passages.length === 0) {
    return { paragraphs: [], sources: [], basis: "none" };
  }

  return {
    paragraphs: passages.map((passage) => passage.text),
    sources: passages,
    basis: "site-content",
  };
}

/** 初期表示に出す質問例 */
export function suggestions(locale: string): string[] {
  return locale === "ja"
    ? [
        "仮想通貨とは何ですか？",
        "販売所と板取引の違いは？",
        "ウォレットはどれを選べばいい？",
        "ガス代はなぜ変わるの？",
        "税金はどうなりますか？",
      ]
    : [
        "What is a crypto asset?",
        "Brokerage or order book — what's the difference?",
        "Which wallet should I use?",
        "Why do gas fees change?",
        "How is crypto taxed in Japan?",
      ];
}
