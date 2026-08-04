import { cn } from "@/lib/utils";
import { accentText, toolCategories, topics, type Accent } from "@/data/ai-port/taxonomy";

/**
 * 斜めに流れるキーワードの帯。
 *
 * ■ 言葉はサイトの実データから作ります
 *   トピック（topics）とツールの分類（toolCategories）の名前をそのまま並べます。
 *   ここに手書きの単語を足さないでください。
 *   扱っていない分野の言葉が流れると、無いページがあるように見えます。
 *   分野を増やしたときも、この帯は自動で追随します。
 *
 * ■ 装飾です（aria-hidden）
 *   同じ言葉はトピック一覧が見出しとリンクで持っています。
 *   ここを読み上げ対象にすると、同じ単語が二度読まれます。
 *   また、斜めに動いている文字をリンクにすると押しづらいため、リンクにしていません。
 *
 * ■ 継ぎ目を出さないために
 *   各行は同じ並びを2組つなげ、1組ぶん（-50%）進んだところで原点へ戻します。
 *   1組だけだと、末尾が抜けるときに空白が見えます。
 *
 * ■ 動きを抑える設定
 *   ai-port.css 側で `.ai-marquee` `.ai-diagonal-glow` `.ai-diagonal-blob` の
 *   アニメーションを止めます。止まっても言葉は読める状態で残ります。
 *
 * ⚠ ピルに重い指定を足さないでください
 *   1つの帯に約200個のピルが並びます。1個あたりの負荷が
 *   そのまま200倍になるため、次はどれも入れないでください。
 *     - `backdrop-blur`（背景ぼかし）… 実際にこれでスクロールが重くなりました
 *     - `bg-clip-text` のグラデーション文字 … 要素ごとに合成レイヤーができます
 *     - `box-shadow` のぼかし、`filter`
 *   色は `color` だけで付けます。見た目のカラフルさは、
 *   背景のグラデーションと光3枚が担当します。
 */

/** 行の定義。速度を少しずつ変えると、同じ板に見えません */
const ROWS: { reverse: boolean; duration: number }[] = [
  { reverse: false, duration: 46 },
  { reverse: true, duration: 58 },
  { reverse: false, duration: 52 },
];

type Keyword = { label: string; accent: Accent };

/** トピックとツール分類から、重複を取り除いた語を作ります */
function buildKeywords(): Keyword[] {
  const accents: Accent[] = ["cyan", "blue", "violet", "pink", "mint", "amber"];
  const seen = new Set<string>();
  const words: Keyword[] = [];

  for (const topic of topics) {
    if (seen.has(topic.name)) continue;
    seen.add(topic.name);
    words.push({ label: topic.name, accent: topic.accent });
  }

  // 英字表記も混ぜます。日本語だけだと字面が単調になります
  for (const [index, category] of toolCategories.entries()) {
    if (seen.has(category.nameEn)) continue;
    seen.add(category.nameEn);
    words.push({ label: category.nameEn, accent: accents[index % accents.length] });
  }

  return words;
}

/** 行ごとに開始位置をずらし、同じ語が縦に揃わないようにします */
function rotate<T>(items: T[], offset: number): T[] {
  if (items.length === 0) return items;
  const shift = offset % items.length;
  return [...items.slice(shift), ...items.slice(0, shift)];
}

export function KeywordMarquee({
  /** 傾きの向き。ページ内に2本置くとき、逆向きにすると使い回しに見えません */
  tilt = "left",
  /** 高さを詰めた版。ファーストビューの直後など、主役を邪魔したくない場所で使います */
  compact = false,
}: {
  tilt?: "left" | "right";
  compact?: boolean;
} = {}) {
  const keywords = buildKeywords();
  if (keywords.length === 0) return null;

  // 詰めた版は2行。行を減らすとピルの総数も減り、描画が軽くなります
  const rows = compact ? ROWS.slice(0, 2) : ROWS;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "ai-diagonal relative overflow-hidden",
        tilt === "right" && "ai-diagonal-right",
        compact ? "py-8 sm:py-11" : "py-14 sm:py-20",
      )}
    >
      {/* 背景のグラデーション。色がゆっくり流れます */}
      <div className="ai-diagonal-glow pointer-events-none absolute inset-0 opacity-70" />

      {/* 浮かぶ光。位置と色を変えた3枚で奥行きを作ります */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ai-diagonal-blob bg-ai-cyan/25 absolute -top-16 -left-10 size-64 rounded-full blur-[70px] sm:size-96" />
        <div
          className="ai-diagonal-blob bg-ai-violet/25 absolute top-1/3 left-1/2 size-72 rounded-full blur-[80px] sm:size-[26rem]"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="ai-diagonal-blob bg-ai-pink/20 absolute -right-10 -bottom-16 size-64 rounded-full blur-[70px] sm:size-96"
          style={{ animationDelay: "-12s" }}
        />
      </div>

      {/* 上下の境目をなじませます（帯だけ浮いて見えないように） */}
      <div className="from-ai-void pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b to-transparent" />
      <div className="from-ai-void pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t to-transparent" />

      {/*
        外枠は水平のまま切り、内側の行だけを回します。
        帯ごと回すと、四隅に三角の隙間ができます。
      */}
      <div className="ai-diagonal-rows relative flex flex-col gap-3 sm:gap-4">
        {rows.map((row, rowIndex) => {
          const items = rotate(keywords, rowIndex * 5);
          return (
            <div key={rowIndex} className="relative flex overflow-hidden">
              <div
                className={cn("ai-marquee", row.reverse && "ai-marquee-reverse")}
                style={{ "--ai-marquee-duration": `${row.duration}s` } as React.CSSProperties}
              >
                {[0, 1].map((copy) => (
                  <div key={copy} className="flex shrink-0 items-center">
                    {items.map((word) => (
                      <span
                        key={`${copy}-${word.label}`}
                        className={cn(
                          "mx-1.5 shrink-0 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 font-medium whitespace-nowrap sm:mx-2 sm:px-5",
                          accentText[word.accent],
                          compact
                            ? "py-1.5 text-[0.72rem] sm:py-2 sm:text-[0.82rem]"
                            : "py-2 text-[0.8rem] sm:py-2.5 sm:text-[0.95rem]",
                        )}
                      >
                        {word.label}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
