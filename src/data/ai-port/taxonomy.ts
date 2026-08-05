/**
 * AI PORT — 分類（トピック / ツールカテゴリー / ベンダー）。
 *
 * ここが内部リンク構造とサイトマップの土台です。
 * カテゴリーを増やすときはこのファイルだけを編集すれば、
 * 一覧ページ・ハブページ・サイトマップ・パンくずがすべて追従します。
 */

/** グラデーションの系統。カードやバッジの色分けに使います。 */
export type Accent = "cyan" | "blue" | "violet" | "pink" | "mint" | "amber";

export const accentClass: Record<Accent, string> = {
  cyan: "from-ai-cyan to-ai-sky",
  blue: "from-ai-sky to-ai-blue",
  violet: "from-ai-blue to-ai-violet",
  pink: "from-ai-purple to-ai-pink",
  mint: "from-ai-mint to-ai-cyan",
  amber: "from-ai-amber to-ai-pink",
};

export const accentText: Record<Accent, string> = {
  cyan: "text-ai-cyan",
  blue: "text-ai-sky",
  violet: "text-ai-violet",
  pink: "text-ai-pink",
  mint: "text-ai-mint",
  amber: "text-ai-amber",
};

/* ------------------------------------------------------------
   トピック — 下層のハブページ（/ai-port/topics/<slug>）
   ------------------------------------------------------------ */

export type Topic = {
  slug: string;
  name: string;
  /** 見出しの英字表記 */
  nameEn: string;
  accent: Accent;
  /** そのトピックが何を扱うか。メタディスクリプションとハブ冒頭に使います。 */
  summary: string;
  /** ニュース収集に使う検索語 */
  queries: string[];
  /** 関連するツールカテゴリー（/ai-port/tools?category=... へ繋ぎます） */
  toolCategories: string[];
  /** AEO用 — このトピックで実際に検索される質問 */
  questions: string[];
  group: "ai" | "industry" | "web3";
};

export const topics: Topic[] = [
  {
    slug: "ai-news",
    name: "AIニュース",
    nameEn: "AI NEWS",
    accent: "cyan",
    summary:
      "生成AIの新モデル・新機能・料金改定・規制動向を、公式発表と主要メディアのRSSから自動で集約しています。",
    queries: ["生成AI", "AI 最新", "LLM 発表"],
    toolCategories: ["chat"],
    questions: [
      "今週の生成AI関連の主なニュースは？",
      "AIニュースはどこで追えばいいですか？",
      "AIの新モデルが出たかどうかを毎日確認する方法は？",
    ],
    group: "ai",
  },
  {
    slug: "ai-tools",
    name: "AIツール",
    nameEn: "AI TOOLS",
    accent: "blue",
    summary:
      "用途別のAIツールを、日本語対応・API提供・無料枠の有無・法人利用の可否といった選定軸で比較できるようにまとめています。",
    queries: ["AIツール", "生成AI ツール 比較"],
    toolCategories: ["chat", "writing", "coding", "image", "video"],
    questions: [
      "自分に合うAIツールはどう選べばいいですか？",
      "無料で使える生成AIツールはありますか？",
      "日本語に対応しているAIツールは？",
    ],
    group: "ai",
  },
  {
    slug: "ai-video",
    name: "AI動画",
    nameEn: "AI VIDEO",
    accent: "violet",
    summary: "テキストや画像から動画を生成するモデルと、その活用手順・商用利用の考え方を扱います。",
    queries: ["AI 動画生成", "Sora 動画", "Runway Gen"],
    toolCategories: ["video"],
    questions: [
      "AI動画生成ツールで日本語プロンプトは使えますか？",
      "生成した動画は商用利用できますか？",
      "AI動画生成の相場はどのくらいですか？",
    ],
    group: "ai",
  },
  {
    slug: "ai-image",
    name: "AI画像",
    nameEn: "AI IMAGE",
    accent: "pink",
    summary: "画像生成モデルの比較、プロンプト設計、権利関係の注意点をまとめたハブです。",
    queries: ["AI 画像生成", "画像生成AI 比較"],
    toolCategories: ["image", "design"],
    questions: [
      "画像生成AIはどれが一番きれいですか？",
      "AI画像の著作権はどうなりますか？",
      "無料の画像生成AIはありますか？",
    ],
    group: "ai",
  },
  {
    slug: "ai-music",
    name: "AI音楽",
    nameEn: "AI MUSIC",
    accent: "mint",
    summary: "作曲・歌声合成・効果音生成など、音に関わる生成AIを扱います。",
    queries: ["AI 音楽生成", "AI 作曲"],
    toolCategories: ["music", "voice"],
    questions: ["AIで作った曲はYouTubeで使えますか？", "日本語の歌詞に対応したAI作曲サービスは？"],
    group: "ai",
  },
  {
    slug: "ai-agent",
    name: "AIエージェント",
    nameEn: "AI AGENTS",
    accent: "cyan",
    summary:
      "自律的にツールを呼び出して仕事を進めるAIエージェント。仕組み・導入手順・実務での使いどころを扱います。",
    queries: ["AIエージェント", "AI agent 自律", "MCP エージェント"],
    toolCategories: ["agent", "automation", "coding"],
    questions: [
      "AIエージェントとチャットAIは何が違いますか？",
      "AIエージェントは何ができますか？",
      "業務にAIエージェントを入れる最初の一歩は？",
    ],
    group: "ai",
  },
  {
    slug: "ai-programming",
    name: "AIプログラミング",
    nameEn: "AI CODING",
    accent: "blue",
    summary:
      "コード補完・自動リファクタ・エージェント型の開発支援まで、開発現場で使うAIを扱います。",
    queries: ["AI コーディング", "AI 開発 支援", "vibe coding"],
    toolCategories: ["coding", "agent"],
    questions: ["AIコーディングツールは無料で使えますか？", "初心者でもAIでアプリを作れますか？"],
    group: "ai",
  },
  {
    slug: "ai-sales",
    name: "AI営業",
    nameEn: "AI SALES",
    accent: "amber",
    summary: "リスト作成・商談記録・提案書作成など、営業プロセスを支えるAIの使い方をまとめます。",
    queries: ["AI 営業支援", "セールス AI 活用"],
    toolCategories: ["sales", "deck", "writing"],
    questions: ["営業でAIを使うと何が変わりますか？", "商談の議事録をAIで作れますか？"],
    group: "industry",
  },
  {
    slug: "ai-marketing",
    name: "AIマーケティング",
    nameEn: "AI MARKETING",
    accent: "pink",
    summary:
      "広告クリエイティブ・SEO・SNS運用へのAI活用と、生成AI時代の検索（LLMO / AEO / GEO）を扱います。",
    queries: ["AI マーケティング", "生成AI 広告 活用", "LLMO SEO"],
    toolCategories: ["writing", "design", "image"],
    questions: ["LLMO対策とSEOは何が違いますか？", "生成AIに引用されるにはどうすればいいですか？"],
    group: "industry",
  },
  {
    slug: "ai-realestate",
    name: "AI不動産",
    nameEn: "AI REAL ESTATE",
    accent: "amber",
    summary: "物件情報の整理、査定支援、内見体験など不動産業務におけるAI活用を扱います。",
    queries: ["不動産 AI 活用", "不動産テック AI"],
    toolCategories: ["automation", "writing"],
    questions: ["不動産業でAIはどこから使えますか？", "AI査定はどこまで信頼できますか？"],
    group: "industry",
  },
  {
    slug: "ai-medical",
    name: "AI医療",
    nameEn: "AI HEALTHCARE",
    accent: "mint",
    summary: "画像診断支援・問診・研究開発など医療分野のAI。規制と安全性の観点を必ず併記します。",
    queries: ["医療 AI", "AI 診断支援"],
    toolCategories: ["research"],
    questions: ["医療AIはどこまで実用化されていますか？", "AIに健康相談をしても大丈夫ですか？"],
    group: "industry",
  },
  {
    slug: "ai-education",
    name: "AI教育",
    nameEn: "AI EDUCATION",
    accent: "violet",
    summary: "学習支援・教材作成・校務効率化など、教育現場のAI活用を扱います。",
    queries: ["教育 AI 活用", "学校 生成AI"],
    toolCategories: ["writing", "deck"],
    questions: ["学校で生成AIを使ってよいのですか？", "AIで勉強を効率化する方法は？"],
    group: "industry",
  },
  {
    slug: "ai-investment",
    name: "AI投資",
    nameEn: "AI INVESTMENT",
    accent: "amber",
    summary: "AI関連企業の動向と、投資判断にAIを使う際の注意点。⚠ 投資助言ではありません。",
    queries: ["AI 銘柄 動向", "AI 投資 市場"],
    toolCategories: ["research"],
    questions: ["AI関連の市場動向はどこで確認できますか？", "AIに投資判断を任せてよいですか？"],
    group: "industry",
  },
  {
    slug: "web3",
    name: "Web3",
    nameEn: "WEB3",
    accent: "violet",
    summary: "分散型のプロダクトとAIの接続点。ウォレット・分散ID・オンチェーン推論などを扱います。",
    queries: ["Web3", "分散型 AI"],
    toolCategories: ["web3"],
    questions: ["Web3とは結局なんですか？", "AIとWeb3はどうつながりますか？"],
    group: "web3",
  },
  {
    slug: "nft",
    name: "NFT",
    nameEn: "NFT",
    accent: "pink",
    summary: "NFTの技術的な仕組みと、生成AIとの組み合わせ、権利まわりの整理。",
    queries: ["NFT 最新", "NFT 生成AI"],
    toolCategories: ["web3", "image"],
    questions: ["NFTは今どうなっていますか？", "AIで作った画像をNFTにできますか？"],
    group: "web3",
  },
  {
    slug: "dao",
    name: "DAO",
    nameEn: "DAO",
    accent: "cyan",
    summary: "自律分散型組織の運営・投票・トレジャリー管理と、AIエージェントの関与。",
    queries: ["DAO 運営", "DAO ガバナンス"],
    toolCategories: ["web3", "agent"],
    questions: ["DAOはどうやって意思決定しますか？", "日本でDAOを作れますか？"],
    group: "web3",
  },
  {
    slug: "metaverse",
    name: "メタバース",
    nameEn: "METAVERSE",
    accent: "blue",
    summary: "3D空間・アバター・空間コンピューティングと生成AIの接続。",
    queries: ["メタバース 最新", "空間コンピューティング"],
    toolCategories: ["video", "design"],
    questions: ["メタバースは今も伸びていますか？", "AIでアバターを作れますか？"],
    group: "web3",
  },
  {
    slug: "blockchain",
    name: "ブロックチェーン",
    nameEn: "BLOCKCHAIN",
    accent: "mint",
    summary: "台帳技術の基礎と、AIの学習データ来歴証明など実務的なユースケース。",
    queries: ["ブロックチェーン 活用", "ブロックチェーン AI"],
    toolCategories: ["web3"],
    questions: ["ブロックチェーンは何に使えますか？", "AIの学習データの出所をどう証明しますか？"],
    group: "web3",
  },
];

export const topicGroups: { id: Topic["group"]; label: string; description: string }[] = [
  { id: "ai", label: "AIの基礎と最新", description: "モデル・ツール・エージェント" },
  { id: "industry", label: "業界別のAI活用", description: "営業・医療・教育・投資など" },
  { id: "web3", label: "Web3.0", description: "分散型技術とAIの接続点" },
];

export function findTopic(slug: string): Topic | undefined {
  return topics.find((topic) => topic.slug === slug);
}

/* ------------------------------------------------------------
   ツールカテゴリー — /ai-port/tools のフィルター
   ------------------------------------------------------------ */

export type ToolCategory = {
  id: string;
  name: string;
  nameEn: string;
  accent: Accent;
  description: string;
};

export const toolCategories: ToolCategory[] = [
  {
    id: "chat",
    name: "チャットAI",
    nameEn: "CHAT",
    accent: "cyan",
    description: "対話型の汎用AI。調べもの・要約・下書きの起点になります。",
  },
  {
    id: "image",
    name: "画像生成",
    nameEn: "IMAGE",
    accent: "pink",
    description: "テキストや参照画像からビジュアルを作るモデル。",
  },
  {
    id: "video",
    name: "動画生成",
    nameEn: "VIDEO",
    accent: "violet",
    description: "テキスト・画像から映像を生成、または既存映像を編集します。",
  },
  {
    id: "music",
    name: "音楽生成",
    nameEn: "MUSIC",
    accent: "mint",
    description: "作曲・BGM・歌声の生成。",
  },
  {
    id: "voice",
    name: "音声・文字起こし",
    nameEn: "VOICE",
    accent: "mint",
    description: "音声合成、書き起こし、翻訳吹き替え。",
  },
  {
    id: "coding",
    name: "コーディング",
    nameEn: "CODING",
    accent: "blue",
    description: "コード補完・レビュー・エージェント型の開発支援。",
  },
  {
    id: "agent",
    name: "AIエージェント",
    nameEn: "AGENT",
    accent: "cyan",
    description: "ツールを自律的に呼び出して作業を進めるタイプ。",
  },
  {
    id: "writing",
    name: "ライティング",
    nameEn: "WRITING",
    accent: "amber",
    description: "記事・メール・企画書などの文章作成支援。",
  },
  {
    id: "deck",
    name: "資料作成",
    nameEn: "DECK",
    accent: "amber",
    description: "スライド・図解・提案書の生成。",
  },
  {
    id: "sales",
    name: "営業AI",
    nameEn: "SALES",
    accent: "amber",
    description: "商談記録、リスト作成、CRM連携。",
  },
  {
    id: "design",
    name: "デザイン",
    nameEn: "DESIGN",
    accent: "pink",
    description: "バナー・UI・ブランド素材の制作支援。",
  },
  {
    id: "research",
    name: "検索・リサーチ",
    nameEn: "RESEARCH",
    accent: "blue",
    description: "出典つきで調べものをするAI検索。",
  },
  {
    id: "automation",
    name: "業務自動化",
    nameEn: "AUTOMATION",
    accent: "violet",
    description: "アプリ連携・ワークフロー自動化。",
  },
  {
    id: "web3",
    name: "Web3",
    nameEn: "WEB3",
    accent: "violet",
    description: "ウォレット・オンチェーンデータ・分散型インフラ。",
  },
];

export function findToolCategory(id: string): ToolCategory | undefined {
  return toolCategories.find((category) => category.id === id);
}
