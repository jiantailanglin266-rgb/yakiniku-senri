/**
 * Wikimedia API クライアント。
 *
 * ■ 落ちない
 *   1件の失敗で全体を止めません。失敗は数えて、最後にまとめて報告します。
 *   取得できなかった枠は、装飾表示のまま残るだけです。
 *
 * ■ Wikimedia の作法に従う
 *   - 連絡先を含む User-Agent（API ポリシーの要求事項）
 *   - 429 は Retry-After に従って待つ
 *   - 5xx / ネットワークエラーは指数バックオフで再試行
 *   - 403 は再試行しない（プロキシ・ポリシーによる遮断のことが多く、
 *     繰り返しても通りません。ログに残して次へ進みます）
 *
 * ■ JSON 以外が返ることがあります
 *   プロキシのエラーページ（HTML）が 200 で返ることもあるため、
 *   Content-Type と本文の先頭を見て JSON かどうかを確かめます。
 */

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

const DEFAULT_USER_AGENT =
  "AiPortMediaSync/1.0 (https://github.com/jiantailanglin266-rgb/ai-port; contact via repository issues)";

export function getClientConfig() {
  return {
    userAgent: process.env.MEDIA_SYNC_USER_AGENT || DEFAULT_USER_AGENT,
    intervalMs: Number(process.env.MEDIA_SYNC_INTERVAL_MS ?? 1200),
    timeoutMs: Number(process.env.MEDIA_SYNC_TIMEOUT_MS ?? 20000),
    maxRetries: Number(process.env.MEDIA_SYNC_MAX_RETRIES ?? 4),
  };
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 呼び出し結果の集計。最後に成功・失敗・保留を出すために使います */
export function createStats() {
  return {
    requests: 0,
    ok: 0,
    failed: 0,
    retried: 0,
    blocked403: 0,
    rateLimited: 0,
    errors: [],
  };
}

export class WikimediaError extends Error {
  constructor(message, { status = null, retryable = false } = {}) {
    super(message);
    this.name = "WikimediaError";
    this.status = status;
    this.retryable = retryable;
  }
}

/**
 * JSON を取得します。失敗しても例外を投げますが、
 * 呼び出し側（`safeCall`）が受け止めて処理を続けます。
 */
async function fetchJsonOnce(url, config, stats) {
  // タイムアウトはここで必ず切ります。応答しないホストで止まらないようにするためです
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": config.userAgent,
        Accept: "application/json",
        "Accept-Encoding": "gzip",
      },
      signal: controller.signal,
    });

    if (response.status === 429) {
      stats.rateLimited += 1;
      const retryAfter = Number(response.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 30000;
      throw new WikimediaError(`429 Too Many Requests（${waitMs}ms 待機）`, {
        status: 429,
        retryable: true,
        waitMs,
      });
    }

    if (response.status === 403) {
      stats.blocked403 += 1;
      // 403 は再試行しません。ネットワークポリシーによる遮断のことが多いためです
      throw new WikimediaError(
        "403 Forbidden — ネットワークポリシーで遮断されている可能性があります。GitHub Actions 上で実行してください。",
        { status: 403, retryable: false },
      );
    }

    if (response.status >= 500) {
      throw new WikimediaError(`${response.status} ${response.statusText}`, {
        status: response.status,
        retryable: true,
      });
    }

    if (!response.ok) {
      throw new WikimediaError(`${response.status} ${response.statusText}`, {
        status: response.status,
        retryable: false,
      });
    }

    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();
    const looksJson = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");

    if (!contentType.includes("json") && !looksJson) {
      // プロキシのエラーページが 200 で返ることがあります
      throw new WikimediaError(
        `JSON ではない応答が返りました（content-type: ${contentType || "なし"}, 先頭: ${text.slice(0, 60).replace(/\s+/g, " ")}）`,
        { status: response.status, retryable: false },
      );
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new WikimediaError("JSON として解釈できませんでした", {
        status: response.status,
        retryable: false,
      });
    }
  } finally {
    clearTimeout(timer);
  }
}

/** 指数バックオフつきの取得 */
export async function fetchJson(url, config, stats) {
  stats.requests += 1;
  let lastError = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    try {
      const json = await fetchJsonOnce(url, config, stats);
      stats.ok += 1;
      return json;
    } catch (error) {
      lastError = error;

      const retryable =
        error instanceof WikimediaError
          ? error.retryable
          : // AbortError やネットワークエラーは再試行の価値があります
            error?.name === "AbortError" || error?.name === "TypeError";

      if (!retryable || attempt === config.maxRetries) break;

      stats.retried += 1;
      const waitMs = error?.waitMs ?? Math.min(30000, 1000 * 2 ** attempt);
      await sleep(waitMs);
    }
  }

  stats.failed += 1;
  stats.errors.push({ url: String(url), message: lastError?.message ?? "不明なエラー" });
  throw lastError ?? new WikimediaError("不明なエラー");
}

/** 失敗しても処理を止めないための包み */
export async function safeCall(label, fn, stats) {
  try {
    return await fn();
  } catch (error) {
    console.error(`  ✗ ${label}: ${error?.message ?? error}`);
    if (!stats.errors.some((entry) => entry.label === label)) {
      stats.errors.push({ label, message: error?.message ?? String(error) });
    }
    return null;
  }
}

/**
 * Commons の全文検索。
 * `srnamespace=6` はファイル名前空間で、Commons に登録されたファイルだけが対象です。
 * Wikipedia の記事に貼られているだけのローカルファイルは、ここには出てきません。
 */
export async function searchCommons(query, limit, config, stats) {
  const url = new URL(COMMONS_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("origin", "*");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", `${query} filetype:bitmap`);
  url.searchParams.set("srnamespace", "6");
  url.searchParams.set("srlimit", String(limit));

  const json = await fetchJson(url, config, stats);
  return (json?.query?.search ?? []).map((hit) => hit.title).filter(Boolean);
}

/** ファイルの詳細（サイズ・URL・extmetadata・カテゴリ） */
export async function fetchImageInfo(titles, config, stats) {
  if (titles.length === 0) return [];

  const url = new URL(COMMONS_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("origin", "*");
  url.searchParams.set("prop", "imageinfo|categories");
  url.searchParams.set("titles", titles.join("|"));
  url.searchParams.set("iiprop", "url|size|mime|extmetadata|user");
  url.searchParams.set("iiurlwidth", "1200");
  url.searchParams.set("cllimit", "50");

  const json = await fetchJson(url, config, stats);
  return json?.query?.pages ?? [];
}

/**
 * 記事タイトルから、その記事の代表画像を取ります。
 *
 * ■ なぜこの取り方をするのか
 *   全文検索は、ファイル名や説明にたまたま語が入っただけの画像を拾います。
 *   記事の代表画像は「その概念を説明するために選ばれた1枚」なので、
 *   狙った内容に当たる確率が桁違いに高くなります。
 *
 * ■ ここで返るのは「候補のファイル名」だけです
 *   Wikipedia の記事画像には、各言語版へローカルアップロードされた
 *   フェアユース画像が混ざります。
 *   **この関数の戻り値をそのまま採用してはいけません。**
 *   呼び出し側が Commons の imageinfo を引き直し、
 *   Commons に存在すること・ライセンスと作者が読めることを確認してください。
 *
 * @returns {Promise<string|null>} "File:Example.jpg" 形式のタイトル
 */
export async function fetchLeadImageTitle(lang, title, config, stats) {
  const encoded = encodeURIComponent(String(title).replace(/ /g, "_"));
  const url = new URL(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`);

  const json = await fetchJson(url, config, stats);
  const source = json?.originalimage?.source ?? json?.thumbnail?.source ?? null;
  if (!source) return null;

  // ベクター画像は写真ではないので対象外にします（図表を写真枠に入れないため）
  if (/\.svg(\?|$)/i.test(source)) return null;

  /*
    upload.wikimedia.org のURLからファイル名を取り出します。
    URL の形:
      https://upload.wikimedia.org/wikipedia/commons/a/ab/Example.jpg
      https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/640px-Example.jpg
      https://upload.wikimedia.org/wikipedia/ja/a/ab/Example.jpg  ← 各言語版ローカル（Commons ではない）
  */
  const match = String(source).match(
    /upload\.wikimedia\.org\/wikipedia\/([^/]+)\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)/,
  );
  if (!match) return null;

  const [, project, encodedName] = match;
  // Commons 以外（各言語版ローカルアップロード）はここで捨てます
  if (project !== "commons") return null;

  /*
    URL のパスはアンダースコア区切りですが、API が返すタイトルはスペース区切りです。
      URL:   .../commons/a/ab/Sceptre_Rugby_Ball.jpg
      title: "File:Sceptre Rugby Ball.jpg"
    ここを揃えないと、あとで「この候補は代表画像か」を照合できず、
    関連度の足切り免除が効きません。
  */
  const fileName = decodeURIComponent(encodedName).replace(/_/g, " ");
  return `File:${fileName}`;
}

export { COMMONS_API };
