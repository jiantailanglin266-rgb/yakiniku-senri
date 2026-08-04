/**
 * AI PORT — AI求人・AI副業・AIスクール。
 *
 * ⚠⚠ 個別の求人票・スクールの料金・受講生数・就職率は載せません。
 *   これらは変動が激しく、裏取りなしに載せると優良誤認になります。
 *   このサイトが提供するのは「探し方」と「選ぶ基準」です。
 *   実際の募集要項・料金は、必ず各サービスの公式サイトで確認してもらいます。
 *
 * ■ 将来、提携先の求人・スクールを掲載する場合
 *   `JobBoard` / `School` に `sponsored: true` を付け、
 *   UI 側で「PR」表示を必ず出してください（ステマ規制対応）。
 *   表示ロジックは components/ai-port/careers/ にあります。
 */

/* ------------------------------------------------------------
   職種ガイド
   ------------------------------------------------------------ */

export type AiRole = {
  id: string;
  name: string;
  /** どんな仕事か */
  summary: string;
  /** 求められること（求人票で共通して問われる観点） */
  requirements: string[];
  /** 未経験から入る場合の現実的な順路 */
  entryPath: string;
  /** 関連するツール（tools.ts の slug） */
  toolSlugs: string[];
};

export const aiRoles: AiRole[] = [
  {
    id: "ai-engineer",
    name: "AIエンジニア / LLMアプリ開発",
    summary:
      "LLMを組み込んだアプリケーションを設計・実装する職種。RAG・エージェント・評価基盤の構築までを担います。",
    requirements: [
      "Web アプリケーション開発の実務経験",
      "API 連携と非同期処理の設計ができること",
      "出力品質を評価する仕組みを作れること",
    ],
    entryPath:
      "既存のWeb開発経験があれば最短です。まず自分の業務課題を解くLLMアプリを1本作り、評価方法まで含めて公開すると実績になります。",
    toolSlugs: ["dify", "openrouter", "cursor"],
  },
  {
    id: "prompt-ops",
    name: "AI活用推進 / プロンプトオペレーション",
    summary:
      "社内の業務にAIを組み込み、ガイドライン整備・教育・効果測定まで回す職種。事業部門側に置かれることが多い役割です。",
    requirements: [
      "業務プロセスを分解して書き出せること",
      "セキュリティ・法務との調整経験",
      "効果を数字で示せること",
    ],
    entryPath:
      "本業の業務知識がそのまま武器になります。自部署の業務を1つAIで自動化し、削減時間を記録するところから始めます。",
    toolSlugs: ["notion-ai", "n8n", "chatgpt"],
  },
  {
    id: "data",
    name: "データエンジニア / MLOps",
    summary:
      "学習・推論を支えるデータ基盤とパイプラインを構築・運用する職種。生成AI導入では前処理と権限管理が主戦場になります。",
    requirements: [
      "SQL とデータ基盤の設計経験",
      "クラウドインフラの運用経験",
      "個人情報・権限設計の理解",
    ],
    entryPath:
      "バックエンドやインフラの経験からの移行が現実的です。RAG のためのデータ整備は入口として需要があります。",
    toolSlugs: ["hugging-face", "alchemy", "n8n"],
  },
  {
    id: "creative",
    name: "AIクリエイティブ / 映像・デザイン",
    summary:
      "生成AIを制作フローに組み込み、広告・映像・デザインを量産する職種。品質管理と権利確認が価値の中心です。",
    requirements: [
      "既存の制作ツールでの実務経験",
      "商用利用条件を判断できること",
      "作風を一貫させる技術",
    ],
    entryPath:
      "デザイン・映像の経験者が生成AIを足す形が一般的です。同一トーンで複数案を出せる状態を作ると強くなります。",
    toolSlugs: ["adobe-firefly", "runway", "midjourney"],
  },
];

/* ------------------------------------------------------------
   求人を探す場所
   ------------------------------------------------------------ */

export type JobBoard = {
  id: string;
  name: string;
  url: string;
  /** どんな求人が多いか */
  focus: string;
  region: "jp" | "global";
  /** 提携掲載の場合は true。UI で「PR」を出します。 */
  sponsored?: boolean;
};

export const jobBoards: JobBoard[] = [
  {
    id: "hugging-face-jobs",
    name: "Hugging Face Jobs",
    url: "https://huggingface.co/jobs",
    focus: "機械学習・研究寄りの求人。海外リモートが中心です。",
    region: "global",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    url: "https://www.linkedin.com/jobs/",
    focus: "外資・グローバル企業のAI関連ポジション。",
    region: "global",
  },
  {
    id: "wantedly",
    name: "Wantedly",
    url: "https://www.wantedly.com/",
    focus: "国内スタートアップのAI関連ポジション。カジュアル面談から入れます。",
    region: "jp",
  },
  {
    id: "green",
    name: "Green",
    url: "https://www.green-japan.com/",
    focus: "国内IT・Web業界のエンジニア求人。",
    region: "jp",
  },
  {
    id: "lancers",
    name: "Lancers",
    url: "https://www.lancers.jp/",
    focus: "AIを使った制作・執筆・自動化の業務委託案件。副業向け。",
    region: "jp",
  },
  {
    id: "crowdworks",
    name: "クラウドワークス",
    url: "https://crowdworks.jp/",
    focus: "小口の制作・記事作成案件。実績づくりに向きます。",
    region: "jp",
  },
];

/* ------------------------------------------------------------
   学ぶ場所
   ------------------------------------------------------------ */

export type School = {
  id: string;
  name: string;
  provider: string;
  url: string;
  format: "online" | "online-live" | "hybrid";
  /** 無料で始められるか */
  free: boolean;
  target: string;
  summary: string;
  /** 提携掲載の場合は true。UI で「PR」を出します。 */
  sponsored?: boolean;
};

/**
 * まずは「無料で確実に学べる公式リソース」だけを掲載します。
 * 有料スクールを追加する場合は、料金・期間・返金条件を公式ページで確認し、
 * このコメントの下に確認日を書いた上で追記してください。
 */
export const schools: School[] = [
  {
    id: "google-skills-boost",
    name: "Google Cloud Skills Boost",
    provider: "Google Cloud",
    url: "https://www.cloudskillsboost.google/",
    format: "online",
    free: true,
    target: "実務でAIを使うエンジニア・企画職",
    summary: "生成AIの基礎から Vertex AI の実装まで、演習つきで学べる公式の学習プラットフォーム。",
  },
  {
    id: "microsoft-learn",
    name: "Microsoft Learn",
    provider: "Microsoft",
    url: "https://learn.microsoft.com/ja-jp/training/",
    format: "online",
    free: true,
    target: "Azure / Copilot を業務で使う人",
    summary: "日本語の学習モジュールが充実。資格試験の学習パスにもつながります。",
  },
  {
    id: "deeplearning-ai",
    name: "DeepLearning.AI",
    provider: "DeepLearning.AI",
    url: "https://www.deeplearning.ai/",
    format: "online",
    free: true,
    target: "LLMアプリを作りたい開発者",
    summary: "短時間で終わる実装講座が多く、RAGやエージェントの作り方を手を動かして学べます。",
  },
  {
    id: "hugging-face-learn",
    name: "Hugging Face Learn",
    provider: "Hugging Face",
    url: "https://huggingface.co/learn",
    format: "online",
    free: true,
    target: "モデルを自分で動かしたい人",
    summary: "Transformer の基礎からエージェント構築まで、コード中心の無料コース。",
  },
  {
    id: "kaggle-learn",
    name: "Kaggle Learn",
    provider: "Kaggle",
    url: "https://www.kaggle.com/learn",
    format: "online",
    free: true,
    target: "データ分析から入りたい人",
    summary: "短いレッスンとノートブックで、実データを触りながら学べます。",
  },
];

/** スクールを選ぶときの確認項目。比較表の行になります。 */
export const schoolChecklist: { id: string; label: string; why: string }[] = [
  {
    id: "goal",
    label: "修了時に何が作れるようになるか明示されているか",
    why: "「AIがわかる」ではなく、成果物で書かれているかが実力の目安になります。",
  },
  {
    id: "curriculum",
    label: "カリキュラムが公開されているか",
    why: "公開していない場合、内容が受講前に判断できません。",
  },
  {
    id: "instructor",
    label: "講師の実務経歴が確認できるか",
    why: "誰が教えるかで、内容の深さが大きく変わります。",
  },
  {
    id: "update",
    label: "教材の更新日が明記されているか",
    why: "生成AIは半年で状況が変わります。更新されない教材は価値が落ちます。",
  },
  {
    id: "price",
    label: "総額と返金条件が明記されているか",
    why: "分割表示のみで総額が分からない場合は、必ず総額を確認してください。",
  },
  {
    id: "support",
    label: "質問できる期間と回数",
    why: "つまずいた時に聞けるかどうかが、完走率を左右します。",
  },
];
