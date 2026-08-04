/**
 * AI PORT — AIチャットのモデル接続。
 *
 * ■ なぜ各社のSDKを入れないのか
 *   このチャットは「OpenAI / Claude / Gemini / OpenRouter を切り替えられること」が要件です。
 *   4社分のSDKを入れるとサーバーバンドルが大きく膨らみ、
 *   Core Web Vitals とコールドスタートに影響します。
 *   使うのは「メッセージを送ってストリームで受け取る」1機能だけなので、
 *   各社の SSE をそのまま fetch で扱っています。
 *   ⚠ 1社に絞る場合は、公式SDKへ置き換えるほうが保守が楽になります。
 *
 * ■ 鍵が1つもないとき
 *   例外にはしません。呼び出し側（route.ts）がサイト内検索の結果だけで
 *   回答を組み立てるフォールバックに切り替えます。
 */

export type ProviderId = "anthropic" | "openai" | "google" | "openrouter";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ProviderConfig = {
  id: ProviderId;
  label: string;
  /** 表示用のモデル名 */
  model: string;
  available: boolean;
};

/** 既定モデル。環境変数で上書きできます。 */
const MODELS: Record<ProviderId, string> = {
  // Claude は Opus 5 を既定にします（モデルIDに日付サフィックスは付けません）
  anthropic: process.env.AI_PORT_ANTHROPIC_MODEL || "claude-opus-5",
  openai: process.env.AI_PORT_OPENAI_MODEL || "gpt-4.1-mini",
  google: process.env.AI_PORT_GOOGLE_MODEL || "gemini-2.0-flash",
  openrouter: process.env.AI_PORT_OPENROUTER_MODEL || "anthropic/claude-sonnet-5",
};

const LABELS: Record<ProviderId, string> = {
  anthropic: "Claude",
  openai: "OpenAI",
  google: "Gemini",
  openrouter: "OpenRouter",
};

function apiKey(provider: ProviderId): string | undefined {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "google":
      return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    case "openrouter":
      return process.env.OPENROUTER_API_KEY;
  }
}

/** 画面のプロバイダー切り替えUIに渡す一覧。鍵の有無だけを公開します（鍵そのものは出しません）。 */
export function listProviders(): ProviderConfig[] {
  return (Object.keys(MODELS) as ProviderId[]).map((id) => ({
    id,
    label: LABELS[id],
    model: MODELS[id],
    available: Boolean(apiKey(id)),
  }));
}

export function resolveProvider(requested?: string): ProviderId | null {
  const providers = listProviders();
  const wanted = providers.find((provider) => provider.id === requested && provider.available);
  if (wanted) return wanted.id;
  return providers.find((provider) => provider.available)?.id ?? null;
}

/* ------------------------------------------------------------
   SSE の共通処理
   ------------------------------------------------------------ */

/** ReadableStream を行単位に割って、`data:` の中身だけを流します。 */
async function* sseLines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // イベントは空行で区切られますが、行単位で処理すれば十分です
      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        newlineIndex = buffer.indexOf("\n");

        if (line.startsWith("data:")) {
          const payload = line.slice(5).trim();
          if (payload && payload !== "[DONE]") yield payload;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parse(payload: string): Record<string, unknown> | null {
  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    // 途中で切れた行は捨てます（次のチャンクで完全な行が来ます）
    return null;
  }
}

export type StreamOptions = {
  provider: ProviderId;
  system: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
};

/**
 * 回答テキストを少しずつ返します。
 * どのプロバイダーでも同じ形（文字列の非同期イテレータ）に揃えます。
 */
export async function* streamCompletion(options: StreamOptions): AsyncGenerator<string> {
  const key = apiKey(options.provider);
  if (!key) throw new Error("APIキーが設定されていません");

  switch (options.provider) {
    case "anthropic":
      yield* streamAnthropic(key, options);
      return;
    case "google":
      yield* streamGoogle(key, options);
      return;
    case "openai":
    case "openrouter":
      yield* streamOpenAiCompatible(key, options);
      return;
  }
}

/* ------------------------------------------------------------
   Anthropic Messages API
   ------------------------------------------------------------ */

async function* streamAnthropic(key: string, options: StreamOptions): AsyncGenerator<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    signal: options.signal,
    body: JSON.stringify({
      model: MODELS.anthropic,
      // サイト案内の応答なので、長すぎない上限にします
      max_tokens: 1200,
      system: options.system,
      messages: options.messages,
      stream: true,
      // 思考の深さの指定。案内用途なので浅めにします。
      // ⚠ temperature / top_p は現行モデルでは受け付けられません（400になります）
      output_config: { effort: "low" },
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Anthropic API エラー (${response.status})`);
  }

  for await (const payload of sseLines(response.body)) {
    const event = parse(payload);
    if (!event) continue;

    if (event.type === "content_block_delta") {
      const delta = event.delta as { type?: string; text?: string } | undefined;
      if (delta?.type === "text_delta" && delta.text) yield delta.text;
    }

    if (event.type === "error") {
      const error = event.error as { message?: string } | undefined;
      throw new Error(error?.message ?? "Anthropic API エラー");
    }
  }
}

/* ------------------------------------------------------------
   OpenAI / OpenRouter（Chat Completions 互換）
   ------------------------------------------------------------ */

async function* streamOpenAiCompatible(
  key: string,
  options: StreamOptions,
): AsyncGenerator<string> {
  const isOpenRouter = options.provider === "openrouter";
  const endpoint = isOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(isOpenRouter ? { "X-Title": "AI PORT" } : {}),
    },
    signal: options.signal,
    body: JSON.stringify({
      model: isOpenRouter ? MODELS.openrouter : MODELS.openai,
      max_tokens: 1200,
      stream: true,
      messages: [{ role: "system", content: options.system }, ...options.messages],
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`${LABELS[options.provider]} API エラー (${response.status})`);
  }

  for await (const payload of sseLines(response.body)) {
    const event = parse(payload);
    const choices = event?.choices as { delta?: { content?: string } }[] | undefined;
    const text = choices?.[0]?.delta?.content;
    if (text) yield text;
  }
}

/* ------------------------------------------------------------
   Google Gemini
   ------------------------------------------------------------ */

async function* streamGoogle(key: string, options: StreamOptions): AsyncGenerator<string> {
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.google}` +
    `:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: options.signal,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: options.system }] },
      contents: options.messages.map((message) => ({
        // Gemini は assistant を "model" と呼びます
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      generationConfig: { maxOutputTokens: 1200 },
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Gemini API エラー (${response.status})`);
  }

  for await (const payload of sseLines(response.body)) {
    const event = parse(payload);
    const candidates = event?.candidates as
      { content?: { parts?: { text?: string }[] } }[] | undefined;
    const parts = candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.text) yield part.text;
    }
  }
}
