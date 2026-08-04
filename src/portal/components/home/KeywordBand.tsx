import { keywordRows } from "@/portal/data/keywords";

/**
 * 斜めに流れるキーワードの帯。
 *
 * ■ 何のためにあるか
 *   このサイトが何を扱っているかを、読まなくても伝えるための装飾です。
 *   情報を持たせていないので、支援技術からは丸ごと隠します
 *   （同じ語はナビゲーションと検索から辿れます）。
 *
 * ■ 継ぎ目を出さないために
 *   同じ並びを2組つなぎ、1組ぶん（-50%）進んだところで原点へ戻します。
 *   1組だけだと、末尾が抜けるときに空白が見えます。
 *
 * ■ 行ごとに向きと角度を変えています
 *   全部同じ向きだと平行線が流れるだけで、奥行きが出ません。
 *   1行おきに逆向き（`--kw-direction: reverse`）にして交差させます。
 *
 * ■ 斜めのはみ出しは `.kw-band` が刈り取ります
 *   回転した帯は本来の箱からはみ出すため、外側で `overflow: hidden` します。
 *   これが無いと横スクロールバーが出ます（スマホで顕著です）。
 */
export function KeywordBand() {
  return (
    <section className="kw-band" aria-hidden="true">
      {keywordRows.map((row, index) => (
        <div
          key={index}
          className="kw-row"
          data-variant={index % 2 === 1 ? "outline" : "solid"}
          style={{
            ["--kw-angle" as string]: row.angle,
            ["--kw-direction" as string]: index % 2 === 1 ? "reverse" : "normal",
            ["--marquee-duration" as string]: row.duration,
          }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="kw-track">
              {row.words.map((word) => (
                <span key={`${copy}-${word}`} className="kw-item">
                  <span translate="no">{word}</span>
                  <span className="kw-dot" />
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
