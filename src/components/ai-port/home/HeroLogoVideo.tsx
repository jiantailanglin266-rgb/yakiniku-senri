import { SeamlessVideo } from "@/components/ai-port/effects/SeamlessVideo";
import { PORTAL_LOGO_VIDEO } from "@/components/ai-port/layout/PortalLogo";

/**
 * ファーストビュー左側の動くロゴ。
 *
 * ■ 大きさ
 *   見出しの上に、左カラムいっぱいに近い幅で置きます。
 *   幅で指定し、高さは比率（864:496）から決まるようにしています。
 *   高さで指定すると、狭い画面で横がはみ出します。
 *
 * ■ 出せないときは何も出しません
 *   動きを抑える設定・読み込み失敗・動画未対応では、この枠ごと消えます。
 *   ヘッダーのロゴと違い、ここは装飾です。
 *   すぐ下の «AI PORT — AI / WEB3 PORTAL» と見出しがサイトの名乗りを担うため、
 *   消えても FV の意味は欠けません。
 *   代わりに文字ロゴを出すと、その eyebrow と二重になります。
 *
 * ■ 動画ファイルはヘッダーのロゴと共有します
 *   パスを2か所に書くと、差し替えたときに片方だけ古いままになります。
 *   PortalLogo が持っている定数を参照します。
 *
 * ■ ループの継ぎ目
 *   `SeamlessVideo` が2枚重ねで入れ替えます（`loop` 属性だと絵が飛びます）。
 */
export function HeroLogoVideo() {
  return (
    <SeamlessVideo
      src={PORTAL_LOGO_VIDEO}
      className="mb-7 aspect-[864/496] w-full max-w-[19rem] sm:max-w-[24rem] lg:max-w-[27rem]"
      videoClassName="object-contain"
    />
  );
}
