/**
 * 斜めキーワードマーキー。
 *
 * ■ 何を流すか
 *   このサイトが扱っている話題の名前だけです（`data/marquee.ts`）。
 *   金額・還元率・順位は流しません。条件を伴わない数字だけが
 *   目に入ると、実際の条件と食い違って読まれるためです。
 *
 * ■ 読み上げ
 *   帯ごと `aria-hidden` にしています。
 *   同じ話題はナビゲーションと各セクションの見出しから辿れるため、
 *   スクリーンリーダーに 84 語を読ませる価値がありません。
 *   リンクは1つも置いていないので、キーボード操作の妨げにもなりません。
 *
 * ■ 動き
 *   CSS だけで動かします。JS を使わないので、
 *   スクロール中でもメインスレッドを奪いません。
 *   `prefers-reduced-motion` では停止します（cardport.css）。
 *
 * ■ 色
 *   発光とグラデーションは「面」に掛け、文字には掛けません。
 *   文字色は暗い地の上で 4.5:1 を確保できるトークンだけを使います
 *   （`MarqueeAccent` の定義を参照）。
 */
import { marqueeRows } from "@/cardport/data/marquee";
import { pick } from "@/cardport/i18n/localized";
import type { Locale } from "@/cardport/i18n/locales";

/** 行ごとの流れる速さ。奇数行は逆向きに流します */
const ROW_DURATION = ["64s", "78s", "56s"];

export function KeywordMarquee({ locale }: { locale: Locale }) {
  const rows = marqueeRows(ROW_DURATION.length);

  return (
    <div className="port-kwband" aria-hidden="true">
      <span className="port-kwaurora" />
      <span className="port-kwbeam" />
      <div className="port-kwtilt">
        {rows.map((row, rowIndex) => {
          const items = row.map((keyword, index) => (
            <span
              key={`${rowIndex}-${index}-${keyword.text.ja}`}
              className={`port-kwchip port-kw-${keyword.accent}`}
            >
              <span className="port-kwdot" />
              {pick(keyword.text, locale)}
            </span>
          ));

          return (
            <div
              key={rowIndex}
              className="port-kwrow"
              style={{
                ["--port-kw-duration" as string]: ROW_DURATION[rowIndex],
                ["--port-kw-direction" as string]: rowIndex % 2 === 1 ? "reverse" : "normal",
              }}
            >
              {/* 途切れずに流すため、同じ列を2つ並べて 50% ぶん動かします */}
              <div className="port-kwtrack">{items}</div>
              <div className="port-kwtrack">{items}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
