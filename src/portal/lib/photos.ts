/**
 * CRYPTO PORT の写真（mountain-peak 方式）。
 *
 * ■ 方式
 *   Wikimedia Commons から取得した画像を `public/images/portal/` に置き、
 *   リポジトリへ直接コミットして配信します。表示時に外部ホストを参照しません。
 *   クレジットは画像ごとではなく、サイト共通の一括表記で出します。
 *
 * ■ src/media（共通メディア基盤）との関係
 *   共通基盤は「1件ずつライセンス・作者・出典を確認したものだけを出す」仕組みで、
 *   こちらは運営判断による別方式です。**混ぜません。**
 *   共通基盤で承認された画像がある枠は、そちらが優先されます。
 *   経緯は docs/portal/06-photos.md に残しています。
 *
 * ■ マニフェスト
 *   実際に保存できたファイルだけが `photo-manifest.json` に載ります。
 *   載っていないページは写真を出さず、生成ビジュアルのままにします。
 *   ファイルが無いのに <img> を出して 404 を並べないためです。
 */
import { withBasePath } from "@/lib/base-path";
import manifest from "@/portal/data/photo-manifest.json";

export type PhotoKind = "coin" | "learn" | "news";

type PhotoEntry = {
  file: string;
  commonsFile: string;
  width: number;
  height: number;
};

const entries = manifest as Record<string, PhotoEntry>;

export type PortalPhoto = {
  src: string;
  width: number;
  height: number;
  /** 元の Commons ファイル名。出所をたどるために残しています */
  commonsFile: string;
};

/** 掲載する写真。取得できていなければ null（＝生成ビジュアルのまま） */
export function portalPhoto(kind: PhotoKind, slug: string): PortalPhoto | null {
  const entry = entries[`${kind}:${slug}`];
  if (!entry) return null;
  return {
    src: withBasePath(`/images/portal/${entry.file}`),
    width: entry.width,
    height: entry.height,
    commonsFile: entry.commonsFile,
  };
}

/** 取得済みの枚数。管理画面の表示に使います */
export function portalPhotoCount(): number {
  return Object.keys(entries).length;
}

/**
 * 一括クレジットの文言。
 *
 * ライセンス名は識別子なので訳しません（`translate="no"` を付けて表示します）。
 */
export const PHOTO_CREDIT = {
  ja: "画像: Wikimedia Commons / CC BY-SA 4.0",
  en: "Images: Wikimedia Commons / CC BY-SA 4.0",
} as const;

export function photoCredit(locale: string): string {
  return locale === "ja" ? PHOTO_CREDIT.ja : PHOTO_CREDIT.en;
}
