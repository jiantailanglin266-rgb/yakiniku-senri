import { marqueeWords } from "../../data/marquee";

/**
 * 斜めに流れるキーワードの帯。
 *
 * ■ 装飾です
 *   `aria-hidden` で読み上げ対象から外します。
 *   ここにしか無い情報を置かないでください（読み上げ環境で欠落します）。
 *
 * ■ 継ぎ目を出さない
 *   同じ並びを2組つなげ、1組ぶん（-50%）進んだところで原点へ戻します。
 *   1組だけだと、末尾が抜けるときに空白が見えます。
 *
 * ■ 帯の向きを互い違いにする
 *   すべて同じ方向だと、斜めの縞が平行に流れて目が滑ります。
 *   奇数段を逆方向・別速度にして、視線が引っかかるようにしています。
 *
 * ■ はみ出しを閉じ込める
 *   回転させると要素が親の外へ出ます。呼び出し側で `overflow-hidden` の
 *   付いた箱に入れてください。横スクロールバーが出ます。
 *
 * ■ 動きを止める配慮
 *   `prefers-reduced-motion: reduce` では sports.css がアニメーションを
 *   止めます。止まっても文字が重ならないよう、静止時の位置は原点です。
 */
export function DiagonalMarquee({
  locale,
  rows = 3,
  className = "",
}: {
  locale: string;
  /** 帯の本数 */
  rows?: number;
  className?: string;
}) {
  const words = marqueeWords(locale);
  if (words.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{
        /*
          見出しとCTAが載る左側で薄くします。
          このリポジトリでは「読めないデータは価値がゼロ」を最優先にしており、
          装飾は文字の可読性より前に出しません。
        */
        maskImage:
          "linear-gradient(100deg, transparent 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,1) 62%)",
        WebkitMaskImage:
          "linear-gradient(100deg, transparent 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,1) 62%)",
      }}
    >
      {/* 斜めに寝かせた面。幅を広く取り、回転で端が欠けないようにします */}
      <div className="absolute top-1/2 left-1/2 w-[180%] -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] space-y-3 sm:space-y-4">
        {Array.from({ length: rows }, (_, row) => {
          const reversed = row % 2 === 1;
          // 段ごとに語をずらし、縦に同じ語が並ばないようにします
          const shifted = [...words.slice(row * 3), ...words.slice(0, row * 3)];

          return (
            <div key={row} className="flex overflow-hidden">
              <div
                className="sp-anim-marquee flex shrink-0 will-change-transform"
                style={{
                  animationDuration: `${34 + row * 11}s`,
                  animationDirection: reversed ? "reverse" : "normal",
                }}
              >
                {[0, 1].map((copy) => (
                  <ul key={copy} className="flex shrink-0 items-center">
                    {shifted.map((word, index) => (
                      <li
                        key={`${copy}-${word.text}-${index}`}
                        className="flex shrink-0 items-center gap-3 px-3 sm:gap-5 sm:px-5"
                      >
                        <span
                          className="text-[1.35rem] leading-none font-extrabold tracking-tight whitespace-nowrap sm:text-[2rem] lg:text-[2.6rem]"
                          style={{
                            // 縁取りだけの文字と塗りの文字を交互にして、密度を作ります
                            color: index % 3 === 0 ? word.accent : "transparent",
                            WebkitTextStroke:
                              index % 3 === 0
                                ? "0"
                                : `1px color-mix(in oklab, ${word.accent} 70%, transparent)`,
                            opacity: index % 3 === 0 ? 0.42 : 0.26,
                          }}
                        >
                          {word.text}
                        </span>
                        {/* 語の区切り。点そのものにも競技の色を当てます */}
                        <span
                          className="size-1.5 shrink-0 rounded-full sm:size-2"
                          style={{ background: word.accent, opacity: 0.38 }}
                        />
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
