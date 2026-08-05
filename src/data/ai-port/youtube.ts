/**
 * AI PORT — YouTube。
 *
 * ■ 取得方法（2段構え）
 *   1. `YOUTUBE_API_KEY` があれば Data API v3 を使います（再生数まで取れます）
 *   2. なければ YouTube 公式の RSS（`feeds/videos.xml`）を使います。キー不要です。
 *   RSS には再生数が含まれないため、UIでは「再生数」を表示しません。
 *   ⚠ 取得できない数字を推測で表示しないでください。
 *
 * ■ channelId について
 *   RSS は channelId（UC…）が必要です。分かっているものは直接書き、
 *   分からないものは handle からサーバー側で1度だけ解決してキャッシュします。
 *   解決に失敗したチャンネルは、単に一覧から外れます（全体は壊れません）。
 */

export type YoutubeChannel = {
  id: string;
  /** 表示名 */
  name: string;
  /** @つきのハンドル（URLに使います） */
  handle: string;
  /** 分かっていれば UC… を直接指定します */
  channelId?: string;
  description: string;
  lang: "ja" | "en";
};

export const youtubeChannels: YoutubeChannel[] = [
  {
    id: "openai",
    name: "OpenAI",
    handle: "OpenAI",
    description: "モデル発表やデモの一次情報。",
    lang: "en",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    handle: "anthropic-ai",
    description: "Claude の使い方と研究の解説。",
    lang: "en",
  },
  {
    id: "deepmind",
    name: "Google DeepMind",
    handle: "googledeepmind",
    description: "研究成果とモデルの技術解説。",
    lang: "en",
  },
  {
    id: "nvidia",
    name: "NVIDIA",
    handle: "NVIDIA",
    description: "GPU・AIインフラの発表と基調講演。",
    lang: "en",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    handle: "Microsoft",
    description: "Copilot と Azure の製品情報。",
    lang: "en",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    handle: "HuggingFace",
    description: "公開モデルの解説とチュートリアル。",
    lang: "en",
  },
];

export function channelUrl(channel: YoutubeChannel): string {
  return `https://www.youtube.com/@${channel.handle}`;
}
