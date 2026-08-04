/**
 * 自動承認の判定。
 *
 * ■ 既定は「自動承認しない」
 *   `MEDIA_AUTO_APPROVE` を明示的に true にしたときだけ働きます。
 *   環境変数が未設定のリポジトリで、勝手に画像が公開されないようにするためです。
 *
 * ■ 自動承認できるのは、権利の判断が要らないものだけ
 *   パブリックドメインと CC0 に限ります。
 *   作者表示が必要なライセンス（CC BY / CC BY-SA）は、クレジットの出し方まで
 *   含めて人が確認する必要があるため、既定では自動承認しません。
 *
 * ■ ライセンスが自由でも、被写体の権利は別です
 *   人物・ロゴ・商品・ブランドの気配があるものは、点数に関係なく保留にします。
 *   ライセンスは著作権だけの話であり、肖像権・商標権を含みません。
 */

function envFlag(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1";
}

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getApprovalConfig() {
  return {
    enabled: envFlag("MEDIA_AUTO_APPROVE", false),
    licenses: (process.env.MEDIA_AUTO_APPROVE_LICENSES ?? "PD,CC0")
      .split(",")
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean),
    minScore: envNumber("MEDIA_AUTO_APPROVE_SCORE", 80),
    minWidth: envNumber("MEDIA_AUTO_APPROVE_MIN_WIDTH", 1200),
    minHeight: envNumber("MEDIA_AUTO_APPROVE_MIN_HEIGHT", 675),
  };
}

/**
 * 被写体の権利が絡む気配。1つでも当たれば自動承認しません。
 * 取りこぼしより「余分に保留へ回す」ほうが安全なので、広めに取っています。
 */
const BLOCKING_SUBJECTS = [
  {
    key: "person",
    terms: [
      "portrait",
      "person",
      "people",
      "face",
      "selfie",
      "headshot",
      "model",
      "child",
      "player",
    ],
  },
  { key: "logo", terms: ["logo", "wordmark", "brandmark", "emblem", "trademark", "™", "®"] },
  { key: "product", terms: ["product", "packaging", "box of", "bottle of"] },
  {
    key: "brand",
    terms: [
      "visa",
      "mastercard",
      "american express",
      "jcb",
      "unionpay",
      "paypal",
      "apple pay",
      "google pay",
      "alipay",
      "wechat pay",
    ],
  },
  { key: "artwork", terms: ["painting", "sculpture", "statue", "mural", "artwork"] },
];

export function detectBlockingSubjects(raw) {
  const text = [raw.fileName, raw.title, raw.description ?? "", (raw.categories ?? []).join(" ")]
    .join(" ")
    .toLowerCase();
  return BLOCKING_SUBJECTS.filter((rule) => rule.terms.some((term) => text.includes(term))).map(
    (rule) => rule.key,
  );
}

/**
 * 自動承認してよいかを判定します。
 *
 * @returns {{approved: boolean, notes: string[]}}
 *   approved が false のとき、呼び出し側は needs_review 以下のままにします。
 */
export function evaluateAutoApproval({ raw, licenseCode, score, config, viaLeadImage = false }) {
  const notes = [];

  if (!config.enabled) {
    notes.push("自動承認は無効です（MEDIA_AUTO_APPROVE）。人の確認へ回します。");
    return { approved: false, notes };
  }

  if (!config.licenses.includes(licenseCode)) {
    notes.push(
      `${licenseCode} は自動承認の対象外です（対象: ${config.licenses.join(", ")}）。作者表示の運用確認が必要です。`,
    );
    return { approved: false, notes };
  }

  /*
    関連度の点数は「検索語との文字列的な近さ」でしかありません。
    記事の代表画像は、その記事を説明するために人が選んだ1枚なので、
    点数が低くても関連性は担保されています（点数のほうが当てにならない）。
    そのため代表画像では、この足切りを適用しません。

    ■ 緩めているのは関連性の判定だけです
      ライセンス・解像度・作者・出典・被写体リスクの確認は、
      このあと同じように通します。権利に関わる条件は1つも外していません。
  */
  if (!viaLeadImage && score < config.minScore) {
    notes.push(`関連度 ${score} 点が自動承認の基準（${config.minScore} 点）に届きません。`);
    return { approved: false, notes };
  }

  if (raw.width < config.minWidth || raw.height < config.minHeight) {
    notes.push(
      `解像度 ${raw.width}×${raw.height} が自動承認の基準（${config.minWidth}×${config.minHeight}）に届きません。`,
    );
    return { approved: false, notes };
  }

  if (!raw.authorName) {
    // PD/CC0 は作者表示が必須ではありませんが、出所の記録として求めます
    notes.push("作者情報を取得できませんでした。出所を記録できないため保留します。");
    return { approved: false, notes };
  }

  if (!raw.commonsPageUrl) {
    notes.push("Commons のファイルページURLを取得できませんでした。");
    return { approved: false, notes };
  }

  if (!raw.licenseUrl) {
    notes.push("ライセンスURLを取得できませんでした。条件を参照できないため保留します。");
    return { approved: false, notes };
  }

  const subjects = detectBlockingSubjects(raw);
  if (subjects.length > 0) {
    notes.push(
      `被写体の権利確認が必要です（${subjects.join(", ")}）。ライセンスとは別の権利のため自動承認しません。`,
    );
    return { approved: false, notes };
  }

  notes.push(
    `${licenseCode}・${viaLeadImage ? "記事の代表画像" : `関連度 ${score} 点`}・解像度 ${raw.width}×${raw.height}・作者と出典あり・被写体リスクなしのため自動承認しました。`,
  );
  return { approved: true, notes };
}
