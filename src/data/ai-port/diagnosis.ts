/**
 * AI PORT — AI診断。
 *
 * ■ 仕組み
 *   質問の選択肢が「軸（axis）」にスコアを足していきます。
 *   全問終わったら、もっとも高い軸の結果カードを出します。
 *   採点は純粋関数（src/lib/ai-port/diagnosis.ts）に切り出してあり、テストがあります。
 *
 * ■ 結果は必ず「根拠 → 次の一手」の順で書きます
 *   占いではなく、次に何をすればいいかを示すのが目的です。
 *
 * ⚠ 結果カードで紹介するツールは `tools.ts` の slug で参照します。
 *   存在しない slug を書くとビルド時のテストで落ちます。
 */

export type DiagnosisChoice = {
  id: string;
  label: string;
  /** 軸ID → 加点 */
  scores: Record<string, number>;
};

export type DiagnosisQuestion = {
  id: string;
  text: string;
  /** 補足（任意） */
  help?: string;
  choices: DiagnosisChoice[];
};

export type DiagnosisResult = {
  /** 軸ID */
  id: string;
  title: string;
  /** 一言まとめ */
  catch: string;
  /** なぜこの結果になったのか */
  description: string;
  /** 具体的な次の一手 */
  actions: string[];
  /** 紹介するツール（tools.ts の slug） */
  toolSlugs: string[];
  accent: "cyan" | "blue" | "violet" | "pink" | "mint" | "amber";
};

export type Diagnosis = {
  slug: string;
  title: string;
  /** 一覧カードの見出し下 */
  lead: string;
  /** メタディスクリプション */
  description: string;
  /** 所要時間の目安（問題数から自動計算しない。表示の約束として持つ） */
  minutes: number;
  questions: DiagnosisQuestion[];
  results: DiagnosisResult[];
  accent: DiagnosisResult["accent"];
};

/* ============================================================
   1. あなたに合うAIツール診断
   ============================================================ */
const toolMatch: Diagnosis = {
  slug: "tool-match",
  title: "あなたに合うAIツール診断",
  lead: "6つの質問で、いま最初に入れるべき1つを決めます。",
  description:
    "仕事の内容と使い方の好みから、最初に導入すべきAIツールの方向性を診断します。全6問・約1分。結果ではツールの候補と、最初の1週間でやることまで示します。",
  minutes: 1,
  accent: "cyan",
  questions: [
    {
      id: "q1",
      text: "いちばん時間を取られている作業はどれですか？",
      choices: [
        { id: "a", label: "文章を書く・整える", scores: { writing: 3, chat: 1 } },
        { id: "b", label: "資料やスライドを作る", scores: { deck: 3, writing: 1 } },
        { id: "c", label: "調べもの・情報収集", scores: { research: 3, chat: 1 } },
        { id: "d", label: "コードを書く・直す", scores: { coding: 3 } },
        { id: "e", label: "画像や動画をつくる", scores: { creative: 3 } },
      ],
    },
    {
      id: "q2",
      text: "AIに何を任せたいですか？",
      choices: [
        { id: "a", label: "たたき台を作ってほしい", scores: { writing: 2, deck: 2 } },
        { id: "b", label: "根拠つきで調べてほしい", scores: { research: 3 } },
        { id: "c", label: "手順まるごと自動でやってほしい", scores: { agent: 3 } },
        { id: "d", label: "自分の作業を横で補助してほしい", scores: { coding: 2, writing: 1 } },
      ],
    },
    {
      id: "q3",
      text: "扱う情報に、社外に出せないものは含まれますか？",
      help: "含まれる場合は、データの取り扱い方針を確認できるサービスを優先します。",
      choices: [
        { id: "a", label: "含まれる（機密・個人情報がある）", scores: { agent: 2, research: 1 } },
        { id: "b", label: "ほとんど含まれない", scores: { chat: 1, creative: 1 } },
        { id: "c", label: "わからない", scores: { chat: 1 } },
      ],
    },
    {
      id: "q4",
      text: "コードを書くことに抵抗はありますか？",
      choices: [
        { id: "a", label: "書ける／書きたい", scores: { coding: 3, agent: 1 } },
        { id: "b", label: "できれば書きたくない", scores: { deck: 1, writing: 1, creative: 1 } },
        { id: "c", label: "まったく書けない", scores: { chat: 2, deck: 1 } },
      ],
    },
    {
      id: "q5",
      text: "成果物はどんな形が多いですか？",
      choices: [
        { id: "a", label: "文章（記事・メール・企画書）", scores: { writing: 3 } },
        { id: "b", label: "スライド・提案書", scores: { deck: 3 } },
        { id: "c", label: "画像・動画・音楽", scores: { creative: 3 } },
        { id: "d", label: "アプリ・システム", scores: { coding: 3 } },
        { id: "e", label: "調査レポート", scores: { research: 3 } },
      ],
    },
    {
      id: "q6",
      text: "予算の考え方に近いのは？",
      choices: [
        { id: "a", label: "まず無料で試したい", scores: { chat: 2, research: 1 } },
        {
          id: "b",
          label: "成果が出るなら個人で払う",
          scores: { writing: 1, coding: 1, creative: 1 },
        },
        { id: "c", label: "会社としてチーム導入したい", scores: { agent: 2, deck: 1 } },
      ],
    },
  ],
  results: [
    {
      id: "chat",
      title: "まずは汎用チャットAIから",
      catch: "1つに絞るなら、汎用のチャットAIが最短です。",
      description:
        "用途が広く、特定の作業に偏っていないタイプです。この場合は多機能な専用ツールより、汎用のチャットAIを1つ決めて毎日触るほうが伸びます。無料枠から始めて、足りなくなった時点で有料化を検討してください。",
      actions: [
        "汎用チャットAIを1つだけ選び、他は入れない",
        "今週やった作業のうち3つを、そのまま同じAIに投げ直してみる",
        "うまくいった指示文をメモに残し、次から使い回す",
      ],
      toolSlugs: ["chatgpt", "claude", "gemini"],
      accent: "cyan",
    },
    {
      id: "writing",
      title: "ライティング支援型",
      catch: "書く時間を半分にするのが、いちばん効きます。",
      description:
        "文章を書く・整える工程に時間を取られています。文章系は「ゼロから書かせる」より「自分の下書きを直させる」ほうが品質が安定します。社内文書を参照できるタイプなら、さらに手戻りが減ります。",
      actions: [
        "下書きは自分で3行だけ書き、その先をAIに続けさせる",
        "自社の文体サンプルを渡してから書かせる",
        "社内ドキュメントを参照できるツールを検討する",
      ],
      toolSlugs: ["claude", "notion-ai", "deepl"],
      accent: "amber",
    },
    {
      id: "deck",
      title: "資料作成型",
      catch: "構成はAI、判断はあなた。",
      description:
        "スライドや提案書に時間がかかっています。資料生成AIは「体裁を整える」のが得意で、「何を言うか」は不得意です。構成案を出させて選び、中身を差し替える使い方が最も速くなります。",
      actions: [
        "伝えたい結論を1文で書いてから生成させる",
        "生成されたスライドは構成だけ使い、数字と事例は自分で入れる",
        "図解が必要な箇所だけ、図解生成ツールを併用する",
      ],
      toolSlugs: ["gamma", "canva", "napkin"],
      accent: "violet",
    },
    {
      id: "research",
      title: "リサーチ型",
      catch: "出典が出るAIだけを使ってください。",
      description:
        "調べものが中心です。この用途では、出典リンクを必ず返すAI検索を使うことが前提になります。出典が出ないAIの回答をそのまま資料に載せると、事実誤認がそのまま残ります。",
      actions: [
        "出典リンクを返すAI検索を既定の入口にする",
        "重要な数字は必ず一次情報（公式サイト・官公庁）まで辿る",
        "手元の資料に限定して答えさせたい時は、資料限定型のツールを使う",
      ],
      toolSlugs: ["perplexity", "notebooklm", "felo"],
      accent: "blue",
    },
    {
      id: "coding",
      title: "コーディング型",
      catch: "補完から、エージェントへ。",
      description:
        "開発が中心です。まずはIDEの補完から始め、慣れたらリポジトリ全体を扱えるエージェント型に進むのが失敗しにくい順序です。いきなりエージェントに任せると、レビューが追いつかなくなります。",
      actions: [
        "まずIDEの補完を1週間使い、受け入れ率を体感する",
        "テストがある部分から、エージェントに任せてみる",
        "生成コードは必ず差分レビューしてからマージする",
      ],
      toolSlugs: ["cursor", "claude-code", "github-copilot"],
      accent: "mint",
    },
    {
      id: "creative",
      title: "クリエイティブ型",
      catch: "権利の確認まで含めて「使える」かを見ます。",
      description:
        "画像・動画・音楽の制作が中心です。生成物の品質だけでなく、商用利用の可否と学習データの方針まで確認してから選んでください。制作物を納品する仕事なら、この確認は避けて通れません。",
      actions: [
        "商用利用条件を公式の利用規約で確認する",
        "作風を固定したい場合は参照画像の機能があるものを選ぶ",
        "納品物には生成AIを使った旨を先方と合意しておく",
      ],
      toolSlugs: ["adobe-firefly", "midjourney", "runway"],
      accent: "pink",
    },
    {
      id: "agent",
      title: "AIエージェント型",
      catch: "作業ではなく、手順ごと預ける段階です。",
      description:
        "定型の手順が固まっていて、それをまるごと任せたい状態です。この段階では、単発のチャットではなくワークフローを組めるツールが向きます。機密情報を扱うなら、自社サーバーに設置できるものを候補に入れてください。",
      actions: [
        "いちばん頻度の高い手順を1つだけ選び、文章で書き出す",
        "その手順をワークフローとして組み、まず人が確認する形で回す",
        "問題がなければ確認を減らし、段階的に自動化する",
      ],
      toolSlugs: ["dify", "n8n", "zapier"],
      accent: "cyan",
    },
  ],
};

/* ============================================================
   2. 仕事効率化診断
   ============================================================ */
const efficiency: Diagnosis = {
  slug: "efficiency",
  title: "仕事効率化診断",
  lead: "どの工程をAIに渡すと、いちばん時間が浮くかを特定します。",
  description:
    "1日の仕事の流れから、AIに任せるべき工程を特定する診断です。全6問・約1分。結果では削減できる工程と、その順番を示します。",
  minutes: 1,
  accent: "amber",
  questions: [
    {
      id: "q1",
      text: "1日のうち、いちばん長い時間を占めるのは？",
      choices: [
        { id: "a", label: "会議・打ち合わせ", scores: { meeting: 3 } },
        { id: "b", label: "メール・チャットの返信", scores: { comms: 3 } },
        { id: "c", label: "資料づくり", scores: { docs: 3 } },
        { id: "d", label: "データの転記・集計", scores: { ops: 3 } },
        { id: "e", label: "調べもの", scores: { research: 3 } },
      ],
    },
    {
      id: "q2",
      text: "「毎回ほぼ同じことをしている」と感じる作業はありますか？",
      choices: [
        { id: "a", label: "ある。手順も決まっている", scores: { ops: 3 } },
        { id: "b", label: "ある。ただし毎回少しずつ違う", scores: { docs: 2, comms: 1 } },
        { id: "c", label: "ほとんどない", scores: { research: 1, meeting: 1 } },
      ],
    },
    {
      id: "q3",
      text: "会議のあと、議事録やタスク整理にどれくらいかかりますか？",
      choices: [
        { id: "a", label: "30分以上かかる", scores: { meeting: 3 } },
        { id: "b", label: "10分程度", scores: { meeting: 1 } },
        { id: "c", label: "作っていない", scores: { comms: 1 } },
      ],
    },
    {
      id: "q4",
      text: "同じ内容を何度も説明していると感じますか？",
      choices: [
        { id: "a", label: "よくある", scores: { comms: 3, docs: 1 } },
        { id: "b", label: "たまにある", scores: { comms: 1 } },
        { id: "c", label: "ない", scores: { ops: 1 } },
      ],
    },
    {
      id: "q5",
      text: "ツール間のコピー＆ペーストは1日に何回くらい？",
      choices: [
        { id: "a", label: "10回以上", scores: { ops: 3 } },
        { id: "b", label: "数回", scores: { ops: 1 } },
        { id: "c", label: "ほぼしない", scores: { docs: 1 } },
      ],
    },
    {
      id: "q6",
      text: "情報が見つからず探し回ることはありますか？",
      choices: [
        { id: "a", label: "毎日ある", scores: { research: 3, docs: 1 } },
        { id: "b", label: "週に数回", scores: { research: 1 } },
        { id: "c", label: "ほぼない", scores: { meeting: 1 } },
      ],
    },
  ],
  results: [
    {
      id: "meeting",
      title: "会議の後処理から削る",
      catch: "議事録の作成時間が、そのまま浮きます。",
      description:
        "会議そのものより、そのあとの記録づくりが負担になっています。ここは自動化の効果が最もはっきり出る領域です。文字起こしを自動化し、要約とタスク抽出まで一気通貫にすると、会議1本あたり20〜30分が戻ってきます。",
      actions: [
        "会議に自動で同席して記録するツールを入れる",
        "要約テンプレート（決定事項／宿題／期限）を固定する",
        "タスクは会議終了から10分以内に配る運用にする",
      ],
      toolSlugs: ["fireflies", "notion-ai", "claude"],
      accent: "violet",
    },
    {
      id: "comms",
      title: "返信と説明を型にする",
      catch: "同じ説明を、二度としないための仕組みを作ります。",
      description:
        "説明と返信に時間を取られています。この場合、AIに文章を書かせる前に「よく聞かれること」を1か所にまとめるのが先です。まとまった文書があれば、AIはそれを参照して答えられるようになります。",
      actions: [
        "よく聞かれる質問の上位10件を書き出す",
        "回答を1つのドキュメントにまとめる",
        "そのドキュメントを参照して返信を下書きさせる",
      ],
      toolSlugs: ["notion-ai", "claude", "chatgpt"],
      accent: "cyan",
    },
    {
      id: "docs",
      title: "資料の初稿をAIに書かせる",
      catch: "ゼロから書く時間を、直す時間に変えます。",
      description:
        "資料づくりが中心です。白紙から書き始める時間が最大のロスなので、初稿を必ずAIに作らせてください。人の仕事は「直す」と「決める」に集中させます。",
      actions: [
        "資料の型（結論→根拠→次の行動）をテンプレート化する",
        "その型に沿って初稿を生成させる",
        "数字と固有名詞だけは必ず自分で入れる",
      ],
      toolSlugs: ["gamma", "claude", "canva"],
      accent: "amber",
    },
    {
      id: "ops",
      title: "転記と集計を自動化する",
      catch: "AIより先に、ワークフロー自動化が効きます。",
      description:
        "手順が固まった単純作業に時間が溶けています。この領域は生成AIより、まずアプリ連携の自動化が効きます。自動化の途中にAIを挟むのは、判断が必要な箇所だけで十分です。",
      actions: [
        "毎日発生している転記作業を1つ選ぶ",
        "アプリ連携ツールで、その1つだけを自動化する",
        "分類や要約が必要な部分にだけAIを挟む",
      ],
      toolSlugs: ["n8n", "zapier", "dify"],
      accent: "mint",
    },
    {
      id: "research",
      title: "探す時間をなくす",
      catch: "情報の置き場所を決めるのが先です。",
      description:
        "情報を探す時間が積み上がっています。検索AIを入れる前に、探す対象を1か所に集めてください。集約されていない状態でAIを入れても、探す場所が1つ増えるだけです。",
      actions: [
        "資料の保存先を1か所に決める",
        "その保存先を横断検索できるAIを入れる",
        "見つからなかった検索語を記録し、ドキュメントを足す",
      ],
      toolSlugs: ["notebooklm", "perplexity", "notion-ai"],
      accent: "blue",
    },
  ],
};

/* ============================================================
   3. AIレベル診断
   ============================================================ */
const level: Diagnosis = {
  slug: "level",
  title: "AIレベル診断",
  lead: "いまの習熟度と、次に越えるべき壁がわかります。",
  description:
    "生成AIの使い方がどの段階にあるかを判定する診断です。全6問・約1分。結果では現在地と、次の段階へ進むための具体的な課題を示します。",
  minutes: 1,
  accent: "blue",
  questions: [
    {
      id: "q1",
      text: "生成AIをどのくらいの頻度で使っていますか？",
      choices: [
        { id: "a", label: "ほとんど使っていない", scores: { starter: 3 } },
        { id: "b", label: "週に数回", scores: { user: 3 } },
        { id: "c", label: "ほぼ毎日", scores: { power: 2, builder: 1 } },
      ],
    },
    {
      id: "q2",
      text: "指示文（プロンプト）を保存して使い回していますか？",
      choices: [
        { id: "a", label: "していない", scores: { starter: 2, user: 1 } },
        { id: "b", label: "たまにメモしている", scores: { user: 2 } },
        { id: "c", label: "テンプレートとして管理している", scores: { power: 3 } },
      ],
    },
    {
      id: "q3",
      text: "AIの出力が間違っていたとき、どうしますか？",
      choices: [
        { id: "a", label: "そのまま使うか、諦める", scores: { starter: 3 } },
        { id: "b", label: "言い方を変えて聞き直す", scores: { user: 3 } },
        { id: "c", label: "情報源や手順を与えて直させる", scores: { power: 3 } },
        { id: "d", label: "評価用のテストを用意して検証する", scores: { builder: 3 } },
      ],
    },
    {
      id: "q4",
      text: "APIを使ったことはありますか？",
      choices: [
        { id: "a", label: "ない／わからない", scores: { starter: 2, user: 1 } },
        { id: "b", label: "試したことがある", scores: { power: 2 } },
        { id: "c", label: "業務システムに組み込んでいる", scores: { builder: 3 } },
      ],
    },
    {
      id: "q5",
      text: "社内の資料をAIに参照させていますか？",
      choices: [
        { id: "a", label: "していない", scores: { starter: 1, user: 2 } },
        { id: "b", label: "手動で貼り付けている", scores: { power: 2 } },
        { id: "c", label: "検索できる形で連携している（RAG）", scores: { builder: 3 } },
      ],
    },
    {
      id: "q6",
      text: "AIの利用ルールはありますか？",
      choices: [
        { id: "a", label: "特にない", scores: { starter: 2 } },
        { id: "b", label: "個人で気をつけている", scores: { user: 2, power: 1 } },
        { id: "c", label: "組織のガイドラインがある", scores: { builder: 2, power: 1 } },
      ],
    },
  ],
  results: [
    {
      id: "starter",
      title: "Lv.1 スターター",
      catch: "まず「毎日ひらく」ところから。",
      description:
        "生成AIにまだ触れる習慣がない段階です。この段階で機能を比較しても意味がありません。1つのツールを決めて、いま目の前にある仕事をそのまま投げる回数を増やすことだけが次の課題です。",
      actions: [
        "チャットAIを1つだけブックマークする",
        "1日1回、その日の作業をそのまま相談する",
        "うまくいかなかった質問文をメモに残す",
      ],
      toolSlugs: ["chatgpt", "gemini", "claude"],
      accent: "cyan",
    },
    {
      id: "user",
      title: "Lv.2 ユーザー",
      catch: "次の壁は「聞き方」ではなく「渡す材料」です。",
      description:
        "日常的に使い始めていますが、出力の質が指示の言い回しに左右されている段階です。ここから伸びるかどうかは、AIに渡す材料（既存資料・過去の成果物・前提条件）を用意できるかで決まります。",
      actions: [
        "指示の前に、前提・読み手・分量を必ず書く",
        "手元の資料を添付してから書かせる",
        "よく使う指示を5つテンプレート化する",
      ],
      toolSlugs: ["claude", "notebooklm", "perplexity"],
      accent: "blue",
    },
    {
      id: "power",
      title: "Lv.3 パワーユーザー",
      catch: "個人の効率化から、仕組み化へ。",
      description:
        "テンプレートを持ち、出力の直し方も分かっている段階です。次の課題は、自分だけが速い状態を、チームで再現できる形に落とすことです。手順を文章にし、他人が同じ結果を出せるかで確かめてください。",
      actions: [
        "自分のテンプレートをチームで共有する",
        "同僚に同じ手順を試してもらい、差分を潰す",
        "繰り返す処理をワークフローとして組む",
      ],
      toolSlugs: ["dify", "n8n", "notion-ai"],
      accent: "violet",
    },
    {
      id: "builder",
      title: "Lv.4 ビルダー",
      catch: "作れる段階。次は「評価」を持つことです。",
      description:
        "APIやRAGまで扱える段階です。この先で差がつくのは、作る力ではなく評価する力です。出力の良し悪しを毎回人間が見ている限り、規模は増やせません。評価用のデータセットを用意してください。",
      actions: [
        "代表的な入力と期待する出力の組を20件用意する",
        "モデルやプロンプトを変えたとき、その20件で必ず比較する",
        "コストと精度の両方を記録し、判断根拠を残す",
      ],
      toolSlugs: ["openrouter", "hugging-face", "dify"],
      accent: "mint",
    },
  ],
};

/* ============================================================
   4. AI副業診断
   ============================================================ */
const sideBusiness: Diagnosis = {
  slug: "side-business",
  title: "AI副業診断",
  lead: "いまのスキルで、いちばん早く形になる方向を出します。",
  description:
    "スキル・使える時間・得意分野から、AIを使った副業の方向性を診断します。全6問・約1分。⚠ 収入を保証するものではありません。",
  minutes: 1,
  accent: "pink",
  questions: [
    {
      id: "q1",
      text: "週に副業へ使える時間は？",
      choices: [
        { id: "a", label: "5時間未満", scores: { content: 2, consult: 1 } },
        { id: "b", label: "5〜10時間", scores: { creative: 2, content: 1 } },
        { id: "c", label: "10時間以上", scores: { dev: 2, automation: 2 } },
      ],
    },
    {
      id: "q2",
      text: "いちばん得意なのは？",
      choices: [
        { id: "a", label: "文章を書くこと", scores: { content: 3 } },
        { id: "b", label: "絵・映像・音楽をつくること", scores: { creative: 3 } },
        { id: "c", label: "仕組みを作ること", scores: { dev: 3, automation: 1 } },
        { id: "d", label: "人に教えること", scores: { consult: 3 } },
        { id: "e", label: "業務の段取りを整えること", scores: { automation: 3 } },
      ],
    },
    {
      id: "q3",
      text: "実績として見せられるものはありますか？",
      choices: [
        { id: "a", label: "ない", scores: { content: 2, creative: 1 } },
        { id: "b", label: "本業の経験がある", scores: { consult: 2, automation: 2 } },
        { id: "c", label: "公開できる制作物がある", scores: { creative: 2, dev: 2 } },
      ],
    },
    {
      id: "q4",
      text: "対価の受け取り方で近いのは？",
      choices: [
        { id: "a", label: "1件ごとの納品で受け取りたい", scores: { creative: 2, content: 2 } },
        { id: "b", label: "継続の契約にしたい", scores: { automation: 3, consult: 2 } },
        { id: "c", label: "作ったものを売り続けたい", scores: { dev: 3 } },
      ],
    },
    {
      id: "q5",
      text: "顔や名前を出すことに抵抗はありますか？",
      choices: [
        { id: "a", label: "抵抗がある", scores: { dev: 2, automation: 2 } },
        { id: "b", label: "問題ない", scores: { consult: 3, content: 1 } },
      ],
    },
    {
      id: "q6",
      text: "本業の業界知識は深いですか？",
      choices: [
        { id: "a", label: "特定業界にかなり詳しい", scores: { consult: 3, automation: 2 } },
        { id: "b", label: "ふつう", scores: { content: 1, creative: 1 } },
        { id: "c", label: "特にない", scores: { creative: 2, content: 2 } },
      ],
    },
  ],
  results: [
    {
      id: "content",
      title: "コンテンツ制作型",
      catch: "書く仕事は、量より「検証できること」で選ばれます。",
      description:
        "文章を軸にした方向が向いています。AIで量産できる時代なので、単価はAIが書けない部分（一次情報・体験・検証）に付きます。自分で確かめた事実を1つ入れられるかが分かれ目です。",
      actions: [
        "得意分野を1つに絞り、そこだけで10本書く",
        "AIには構成と推敲を任せ、事実確認は自分でやる",
        "納品時に、出典と確認方法を添える",
      ],
      toolSlugs: ["claude", "perplexity", "deepl"],
      accent: "amber",
    },
    {
      id: "creative",
      title: "クリエイティブ制作型",
      catch: "権利まわりを説明できる人が、選ばれます。",
      description:
        "画像・動画・音楽の制作が向いています。生成品質だけでは差がつかないため、商用利用の条件を説明でき、修正指示に応えられることが受注の条件になります。",
      actions: [
        "使うツールの商用利用条件を読み、要点を書き出す",
        "同じ作風で3パターン出せる状態を作る",
        "制作事例を公開できる形で1つ用意する",
      ],
      toolSlugs: ["adobe-firefly", "runway", "suno"],
      accent: "pink",
    },
    {
      id: "dev",
      title: "プロダクト開発型",
      catch: "小さく作って、公開まで持っていけます。",
      description:
        "自分で作れる方向です。AI開発ツールを使えば、個人でも公開まで到達できます。最初の1本は収益より「完成させて公開する」ことを目標にしてください。",
      actions: [
        "自分が毎週困っていることを1つ選ぶ",
        "1週間で動く最小版を作って公開する",
        "使ってくれた人の声を聞いてから作り込む",
      ],
      toolSlugs: ["cursor", "lovable", "bolt"],
      accent: "mint",
    },
    {
      id: "automation",
      title: "業務自動化・受託型",
      catch: "本業の知識が、そのまま単価になります。",
      description:
        "業務の段取りを理解している強みが活きます。AI自動化の受託では、ツールの操作より「どの工程を自動化すべきか見極める力」に対価が付きます。業界知識があるほど有利です。",
      actions: [
        "本業でいちばん無駄な手順を1つ自動化する",
        "その事例を、数字（削減時間）付きでまとめる",
        "同じ業界の小規模事業者に提案する",
      ],
      toolSlugs: ["n8n", "dify", "zapier"],
      accent: "cyan",
    },
    {
      id: "consult",
      title: "教える・伴走型",
      catch: "使い方より、「使えない理由」を解ける人が求められています。",
      description:
        "人に教える方向が向いています。AI導入がうまくいかない原因の多くはツールではなく運用側にあるため、現場に入って一緒に回す形の需要があります。顔を出せることが強みになります。",
      actions: [
        "自分の職種に絞った導入手順書を1本作る",
        "知り合いの会社で無償で1件伴走し、事例にする",
        "つまずいた箇所を記録し、教材にする",
      ],
      toolSlugs: ["chatgpt", "notion-ai", "gamma"],
      accent: "violet",
    },
  ],
};

/* ============================================================
   5. AI活用度診断（組織向け）
   ============================================================ */
const adoption: Diagnosis = {
  slug: "adoption",
  title: "AI活用度診断",
  lead: "組織としてどこまで進んでいるか、次の一手はどこかを判定します。",
  description:
    "チーム・企業としての生成AI活用がどの段階にあるかを判定する診断です。全6問・約1分。結果では現在地と、次に着手すべき施策を示します。",
  minutes: 1,
  accent: "violet",
  questions: [
    {
      id: "q1",
      text: "組織として生成AIの利用は認められていますか？",
      choices: [
        { id: "a", label: "禁止／方針がない", scores: { none: 3 } },
        { id: "b", label: "個人の判断に任されている", scores: { shadow: 3 } },
        { id: "c", label: "会社契約で提供している", scores: { standard: 3 } },
      ],
    },
    {
      id: "q2",
      text: "利用ガイドラインはありますか？",
      choices: [
        { id: "a", label: "ない", scores: { none: 2, shadow: 2 } },
        { id: "b", label: "ある（入力してよい情報の範囲が決まっている）", scores: { standard: 3 } },
        { id: "c", label: "あり、監査ログも取っている", scores: { embedded: 3 } },
      ],
    },
    {
      id: "q3",
      text: "業務システムとAIは繋がっていますか？",
      choices: [
        { id: "a", label: "繋がっていない", scores: { none: 1, shadow: 2 } },
        { id: "b", label: "一部の部署で連携している", scores: { standard: 2 } },
        { id: "c", label: "基幹業務に組み込まれている", scores: { embedded: 3 } },
      ],
    },
    {
      id: "q4",
      text: "効果を数字で測っていますか？",
      choices: [
        { id: "a", label: "測っていない", scores: { none: 2, shadow: 2 } },
        { id: "b", label: "感覚的には把握している", scores: { standard: 2 } },
        { id: "c", label: "削減時間やコストを記録している", scores: { embedded: 3 } },
      ],
    },
    {
      id: "q5",
      text: "社内に相談できる担当者はいますか？",
      choices: [
        { id: "a", label: "いない", scores: { none: 2, shadow: 1 } },
        { id: "b", label: "詳しい人が個人的に対応している", scores: { shadow: 3 } },
        { id: "c", label: "担当部署がある", scores: { standard: 2, embedded: 1 } },
      ],
    },
    {
      id: "q6",
      text: "研修や勉強会は実施していますか？",
      choices: [
        { id: "a", label: "していない", scores: { none: 2, shadow: 1 } },
        { id: "b", label: "単発で実施した", scores: { standard: 2 } },
        { id: "c", label: "継続的に実施している", scores: { embedded: 3 } },
      ],
    },
  ],
  results: [
    {
      id: "none",
      title: "Phase 0 未着手",
      catch: "最初にやるのは導入ではなく、ルール作りです。",
      description:
        "組織としてまだ動いていない段階です。ここでツールを配っても、情報漏えいの懸念で止まります。先に「何を入力してよいか」の線引きを1枚にまとめるのが最短です。",
      actions: [
        "入力してよい情報／だめな情報を1枚にまとめる",
        "試験導入する部署を1つだけ決める",
        "3か月後に見直す前提で、暫定ルールとして出す",
      ],
      toolSlugs: ["chatgpt", "gemini", "copilot"],
      accent: "cyan",
    },
    {
      id: "shadow",
      title: "Phase 1 個人利用が先行",
      catch: "使っている人は、もう社内にいます。",
      description:
        "現場が個人アカウントで使い始めている状態です。禁止しても止まらないため、会社として契約し、安全に使える口を用意するほうが早く安全になります。まず実態把握から始めてください。",
      actions: [
        "匿名アンケートで、実際の利用状況を把握する",
        "会社契約のアカウントを配り、個人利用から移行させる",
        "社内で成果が出た使い方を共有する場を作る",
      ],
      toolSlugs: ["copilot", "chatgpt", "claude"],
      accent: "amber",
    },
    {
      id: "standard",
      title: "Phase 2 標準化",
      catch: "配り終えました。次は「業務に埋め込む」段階です。",
      description:
        "会社として提供し、ルールも整った段階です。ここで止まると「使う人だけ使う」状態が続きます。次は特定の業務プロセスにAIを組み込み、使わない選択肢をなくすことです。",
      actions: [
        "頻度の高い業務を1つ選び、手順にAIを組み込む",
        "社内文書を検索できる形（RAG）で整備する",
        "削減時間を計測し、次の投資判断の材料にする",
      ],
      toolSlugs: ["dify", "notion-ai", "n8n"],
      accent: "blue",
    },
    {
      id: "embedded",
      title: "Phase 3 業務組み込み",
      catch: "運用の質を、評価で担保する段階です。",
      description:
        "基幹業務に組み込み、効果測定もできている段階です。ここからの課題は品質の維持です。モデルの更新で出力は変わるため、変更を検知できる仕組みを持たないと、ある日静かに品質が落ちます。",
      actions: [
        "重要な処理について、期待出力のテストセットを持つ",
        "モデル更新時に自動で回帰確認する",
        "コスト・精度・応答時間を継続的に記録する",
      ],
      toolSlugs: ["openrouter", "dify", "hugging-face"],
      accent: "mint",
    },
  ],
};

export const diagnoses: Diagnosis[] = [toolMatch, efficiency, level, sideBusiness, adoption];

export function findDiagnosis(slug: string): Diagnosis | undefined {
  return diagnoses.find((diagnosis) => diagnosis.slug === slug);
}
