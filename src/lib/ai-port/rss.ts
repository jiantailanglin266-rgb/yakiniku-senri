/**
 * 依存ライブラリなしの RSS / Atom パーサー。
 *
 * ■ なぜ自前なのか
 *   XMLパーサーを1つ入れるとサーバーバンドルが数十KB増えます。
 *   ここで扱うのは RSS 2.0 と Atom の、しかも決まったタグだけなので、
 *   厳密なXMLパーサーは要りません。壊れた入力は「その項目を捨てる」で足ります。
 *
 * ■ 設計方針
 *   - 例外を投げない。読めなかったものは結果から落とす
 *   - HTMLタグは必ず落とす（配信元の description には広告リンクが入ることがある）
 *   - 日付が読めない項目は捨てる（並び順が壊れるため）
 */

export type FeedItem = {
  title: string;
  link: string;
  /** ISO文字列。パースできなかった項目は取り込みません。 */
  isoDate: string;
  /** 本文の要約（タグを除去済み・最大240文字） */
  summary: string;
  /** 配信元の名前（Googleニュースは <source> を持ちます） */
  source?: string;
  /** サムネイル（Atom の media:thumbnail など） */
  image?: string;
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#39": "'",
  "#8217": "’",
  "#8211": "–",
  "#8212": "—",
};

/** 実体参照を戻します。数値参照にも対応します。 */
export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, code: string) => {
    const known = ENTITIES[code];
    if (known) return known;
    if (code.startsWith("#x") || code.startsWith("#X")) {
      const value = Number.parseInt(code.slice(2), 16);
      return Number.isFinite(value) ? String.fromCodePoint(value) : match;
    }
    if (code.startsWith("#")) {
      const value = Number.parseInt(code.slice(1), 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : match;
    }
    return match;
  });
}

/**
 * タグを除去して、連続する空白を1つにまとめます。
 *
 * ■ 先に実体参照を戻してから、タグを落とします
 *   RSS の <description> は HTML をエスケープして入れる配信元が多く
 *   （例: `&lt;p&gt;本文&lt;/p&gt;`）、
 *   先にタグを落とすと `&lt;p&gt;` が生き残り、あとで復号されて
 *   画面に `<p>` がそのまま出てしまいます。
 *   復号 → タグ除去 → 復号（二重エスケープの後始末）の順で処理します。
 */
export function stripTags(input: string): string {
  const withoutTags = decodeEntities(input)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ");

  return decodeEntities(withoutTags).replace(/\s+/g, " ").trim();
}

function unwrapCdata(value: string): string {
  const match = value.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return match ? match[1] : value;
}

/** 最初に見つかった <tag> の中身を返します。 */
function pickTag(xml: string, tag: string): string | undefined {
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(pattern);
  return match ? unwrapCdata(match[1]) : undefined;
}

/** 属性値を1つ取り出します。 */
function pickAttribute(xml: string, tag: string, attribute: string): string | undefined {
  const pattern = new RegExp(`<${tag}\\b[^>]*\\b${attribute}=["']([^"']+)["']`, "i");
  const match = xml.match(pattern);
  return match ? decodeEntities(match[1]) : undefined;
}

/** Atom の <link rel="alternate" href="..."> を優先して取り出します。 */
function pickAtomLink(entry: string): string | undefined {
  const alternate = entry.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i);
  if (alternate) return decodeEntities(alternate[1]);

  const hrefOnly = entry.match(/<link\b[^>]*href=["']([^"']+)["']/i);
  if (hrefOnly) return decodeEntities(hrefOnly[1]);

  const textLink = pickTag(entry, "link");
  return textLink ? decodeEntities(textLink.trim()) : undefined;
}

function toIsoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const time = Date.parse(value.trim());
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined;
}

function truncate(value: string, max = 240): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

/**
 * RSS 2.0 / Atom のどちらでも読み込みます。
 * 壊れた項目は黙って捨てます（1件のせいで全体が落ちないように）。
 */
export function parseFeed(xml: string): FeedItem[] {
  if (!xml || xml.length < 32) return [];

  const blocks = [
    ...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi),
    ...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi),
  ].map((match) => match[1]);

  const items: FeedItem[] = [];

  for (const block of blocks) {
    const rawTitle = pickTag(block, "title");
    if (!rawTitle) continue;

    const title = stripTags(rawTitle);
    if (!title) continue;

    const link = pickAtomLink(block);
    if (!link || !/^https?:\/\//i.test(link)) continue;

    const isoDate =
      toIsoDate(pickTag(block, "pubDate")) ??
      toIsoDate(pickTag(block, "published")) ??
      toIsoDate(pickTag(block, "updated")) ??
      toIsoDate(pickTag(block, "dc:date"));
    if (!isoDate) continue;

    const rawSummary =
      pickTag(block, "description") ??
      pickTag(block, "summary") ??
      pickTag(block, "media:description") ??
      "";

    items.push({
      title,
      link,
      isoDate,
      summary: truncate(stripTags(rawSummary)),
      source: pickTag(block, "source")?.trim() || undefined,
      image:
        pickAttribute(block, "media:thumbnail", "url") ?? pickAttribute(block, "enclosure", "url"),
    });
  }

  return items;
}

/**
 * Googleニュースの見出しは「記事タイトル - 媒体名」の形で届きます。
 * 媒体名は別に表示するので、見出しからは取り除きます。
 */
export function splitGoogleNewsTitle(title: string, source?: string): string {
  if (!source) return title;
  const suffix = ` - ${source}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}
