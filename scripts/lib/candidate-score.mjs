/**
 * 検索結果の採点。
 *
 * ■ 検索でヒットしたことは、その記事に合う画像である根拠になりません
 *   Commons の全文検索は、ファイル名・説明・カテゴリの語をゆるく拾います。
 *   そのまま採用すると、関連の薄い画像が並びます。
 *   ここで 100 点満点に換算し、**80 点未満は候補にしません**。
 *
 * ■ 描画側の関連度しきい値（src/media/lib/scoring.ts の 45）とは別物です
 *   あちらは「すでに承認済みの画像を、どの枠に出すか」を選ぶための点数。
 *   こちらは「そもそも取り込む候補にするか」の足切りで、より厳しくしています。
 *
 * ■ 減点項目は「載せてはいけない可能性」を表します
 *   人物・ロゴ・ブランド・地図・文字入り・図表・低解像度。
 *   減点で足切りできなかったものも、後段の権利判定で保留になります。
 */

export const CANDIDATE_THRESHOLD = Number(process.env.MEDIA_CANDIDATE_SCORE ?? 80);

/** 語に分割します（日本語も拾えるように文字クラスを広く取ります） */
function tokenize(text) {
  return String(text ?? "")
    .toLowerCase()
    .split(/[^a-z0-9぀-ヿ一-鿿]+/)
    .filter((token) => token.length >= 2);
}

function overlapRatio(needles, haystack) {
  if (needles.length === 0) return 0;
  const set = new Set(haystack);
  return needles.filter((token) => set.has(token)).length / needles.length;
}

/** 減点語。ファイル名・説明・カテゴリのどれかに出たら引きます */
const PENALTY_VOCABULARY = [
  {
    key: "person",
    points: 30,
    terms: [
      "portrait",
      "person",
      "man ",
      "woman ",
      "people",
      "face",
      "selfie",
      "headshot",
      "model",
    ],
  },
  { key: "logo", points: 30, terms: ["logo", "wordmark", "brandmark", "emblem", "icon set"] },
  {
    key: "brand",
    points: 25,
    terms: [
      "visa",
      "mastercard",
      "american express",
      "jcb",
      "unionpay",
      "paypal",
      "apple pay",
      "google pay",
    ],
  },
  { key: "map", points: 20, terms: ["map of", "carte", "karte", "location map"] },
  {
    key: "text",
    points: 15,
    terms: ["poster", "signage", "banner", "advertisement", "screenshot"],
  },
  { key: "diagram", points: 10, terms: ["chart", "graph", "schema", "flowchart", "infographic"] },
];

/**
 * 1件を採点します。
 *
 * @param {object} raw 取得した素のメタデータ（scripts/wikimedia-sync.mjs の toRawAsset の戻り）
 * @param {object} request requests の1行
 * @param {{usedFileNames?: Set<string>}} [context]
 * @returns {{total: number, breakdown: Record<string, number>, reasons: string[]}}
 */
export function scoreCandidate(raw, request, context = {}) {
  const breakdown = {};
  const reasons = [];

  const haystack = tokenize(
    [raw.fileName, raw.title, raw.description, (raw.categories ?? []).join(" ")].join(" "),
  );
  const lower = [raw.fileName, raw.title, raw.description ?? "", (raw.categories ?? []).join(" ")]
    .join(" ")
    .toLowerCase();

  const queries = [request.query, ...(request.alternateQueries ?? [])].filter(Boolean);

  /* 加点 --------------------------------------------------------- */

  // 1. 主キーワードとの一致（最大 30）
  breakdown.query = Math.round(overlapRatio(tokenize(request.query), haystack) * 30);

  // 2. 予備キーワードとの一致（最大 12）
  const alternateBest = Math.max(
    0,
    ...(request.alternateQueries ?? []).map((query) => overlapRatio(tokenize(query), haystack)),
  );
  breakdown.alternate = Math.round(alternateBest * 12);

  // 3. タイトル・ファイル名に検索語がそのまま入っている（12）
  breakdown.title = queries.some((query) => lower.includes(query.toLowerCase())) ? 12 : 0;

  // 4. 説明文に検索語の一部が入っている（最大 8）
  breakdown.description = raw.description
    ? Math.round(overlapRatio(tokenize(request.query), tokenize(raw.description)) * 8)
    : 0;

  // 5. カテゴリ一致（最大 8）
  breakdown.categories =
    (raw.categories ?? []).length > 0
      ? Math.round(
          overlapRatio(tokenize(request.query), tokenize((raw.categories ?? []).join(" "))) * 8,
        )
      : 0;

  // 6. Wikidata の一致（10）。指定が無ければ 0（減点にはしません）
  breakdown.wikidata =
    request.wikidataEntityId && raw.wikidataEntityId === request.wikidataEntityId ? 10 : 0;

  // 7. 解像度（最大 14）。必要幅の2倍で満点
  const minWidth = request.minimumWidth ?? 800;
  if (raw.width >= minWidth) {
    breakdown.resolution = Math.min(14, Math.round(((raw.width - minWidth) / minWidth) * 14) + 6);
  } else {
    breakdown.resolution = 0;
    reasons.push(`解像度が不足（${raw.width}px < ${minWidth}px）`);
  }

  // 8. 横長であること（6）。枠はほぼすべて横長です
  breakdown.landscape = raw.width > raw.height ? 6 : 0;

  // 9. 縦横比の近さ（最大 10）
  const target = request.aspectRatio ?? 16 / 9;
  const actual = raw.height > 0 ? raw.width / raw.height : 0;
  const gap = target > 0 ? Math.abs(actual - target) / target : 1;
  breakdown.aspect = Math.max(0, Math.round((1 - Math.min(1, gap)) * 10));

  // 10. ライセンスの扱いやすさ（最大 10）
  const licenseText = (raw.rawLicenses ?? []).join(" ").toLowerCase();
  if (/cc0|public domain|^pd/.test(licenseText)) breakdown.license = 10;
  else if (/cc by-sa/.test(licenseText)) breakdown.license = 5;
  else if (/cc by/.test(licenseText)) breakdown.license = 7;
  else breakdown.license = 0;

  // 11. メタデータの完全性（最大 8）
  breakdown.metadata =
    (raw.authorName ? 3 : 0) + (raw.commonsPageUrl ? 3 : 0) + (raw.licenseUrl ? 2 : 0);

  /* 減点 --------------------------------------------------------- */

  let penalty = 0;
  for (const rule of PENALTY_VOCABULARY) {
    if (rule.terms.some((term) => lower.includes(term))) {
      penalty += rule.points;
      reasons.push(`減点: ${rule.key}`);
    }
  }

  // 低解像度は二重に効かせます（枠に足りないものを拾わないため）
  if (raw.width < minWidth) {
    penalty += 25;
  }

  // すでに他のページで使っている画像は、同じものが並ばないよう下げます
  if (context.usedFileNames?.has(raw.fileName)) {
    penalty += 12;
    reasons.push("減点: 他ページで使用済み");
  }

  breakdown.penalty = -penalty;

  const total = Math.max(
    0,
    Math.min(
      100,
      Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    ),
  );

  return { total, breakdown, reasons };
}

/**
 * 候補にしてはいけない被写体。
 *
 * ■ 減点ではなく除外にしている理由
 *   実在ブランドのカード券面・企業ロゴ・人物は、点数がいくら高くても
 *   掲載できません。商標権と肖像権はライセンスと別の話で、
 *   点数の高さで埋め合わせられるものではないからです。
 *
 *   実際、実在の Visa ブランドカードの写真が 80 点を超えて
 *   「クレジットカードの基本」の候補に選ばれていました。
 *   掲載カードがすべて架空のこのサイトでは、載せてはいけない画像です。
 */
const EXCLUDED_SUBJECTS = [
  {
    key: "brand",
    terms: [
      "visa",
      "mastercard",
      "american express",
      "amex",
      "jcb",
      "unionpay",
      "paypal",
      "apple pay",
      "google pay",
      "alipay",
      "wechat pay",
    ],
  },
  { key: "logo", terms: ["logo", "wordmark", "brandmark", "trademark"] },
  { key: "person", terms: ["portrait of", "headshot", "selfie"] },
];

/** 候補から外すべき被写体を返します（空なら問題なし） */
export function detectExcludedSubjects(raw) {
  const text = [raw.fileName, raw.title, raw.description ?? "", (raw.categories ?? []).join(" ")]
    .join(" ")
    .toLowerCase();
  return EXCLUDED_SUBJECTS.filter((rule) => rule.terms.some((term) => text.includes(term))).map(
    (rule) => rule.key,
  );
}

/** 採点して、しきい値を超えたものだけを高い順に返します */
export function rankCandidates(raws, request, context = {}) {
  return raws
    .filter((raw) => detectExcludedSubjects(raw).length === 0)
    .map((raw) => ({ raw, ...scoreCandidate(raw, request, context) }))
    .filter((entry) => entry.total >= CANDIDATE_THRESHOLD)
    .sort((a, b) => b.total - a.total || a.raw.fileName.localeCompare(b.raw.fileName));
}
