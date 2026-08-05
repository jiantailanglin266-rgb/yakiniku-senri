import { SeamlessVideo } from "@/components/ai-port/effects/SeamlessVideo";
import { HeroOrb } from "./HeroOrb";

/**
 * ヒーロー右側の3Dグラフィック。
 *
 * ■ 動画で描いています
 *   以前は CSS だけで作った球体（HeroOrb）を出していました。
 *   表現の作り込みに限界があったため、3Dの動画に差し替えています。
 *
 * ■ 出せないときは HeroOrb に戻します
 *   動きを抑える設定・読み込み失敗・動画未対応のときです。
 *   ここを空にすると右カラムだけ穴が開き、レイアウトが崩れて見えます。
 *   HeroOrb は動きを抑える設定では ai-port.css 側で回転が止まるため、
 *   静止したグラフィックとして成立します。
 *
 * ■ 枠の比率は動画に合わせています（864:496）
 *   ここを固定しておかないと、読み込みの前後で高さが動きます（CLS）。
 */

/** 3Dグラフィックの置き場所。差し替えるときはこのファイルを上書きしてください */
export const HERO_VIDEO = "/videos/ai-port-hero.mp4";

export function HeroVisual() {
  return (
    <SeamlessVideo
      src={HERO_VIDEO}
      className="mx-auto aspect-[864/496] w-full max-w-[34rem] overflow-hidden rounded-2xl"
      videoClassName="object-contain"
      fallback={<HeroOrb />}
    />
  );
}
