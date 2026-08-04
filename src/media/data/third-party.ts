/**
 * Wikimedia Commons 以外の第三者素材。
 *
 * ■ なぜ別ファイルなのか
 *   Commons 由来の画像は API から取得したメタデータをそのまま持ちますが、
 *   配布サイトから取り込んだ素材は、取得経路もクレジットの書き方も異なります。
 *   同じ型に押し込むと「APIで確認した情報」と「人が書き写した情報」の
 *   区別が消えるため、分けています。
 *
 * ■ ここに書いてよいのは、実際にリポジトリへ取り込んだ素材だけです
 *   使う予定の候補は書きません。掲載していない素材のクレジットを出すと、
 *   それ自体が事実と異なる表示になります。
 *
 * ■ ライセンスが要求する表示は削れません
 *   MIT のように「著作権表示とライセンス文の保持」を条件とするものは、
 *   表示を省いた時点で違反になります。テストで消えないようにしています。
 */

export type ThirdPartyAsset = {
  id: string;
  /** 素材名（原文のまま。翻訳しません） */
  name: string;
  /** サイト内での用途 */
  usage: { ja: string; en: string };
  /** ライセンス正式名称（原文のまま） */
  licenseName: string;
  licenseUrl: string;
  /** ライセンスが保持を要求する著作権表示。1文字も変えずに転記します */
  copyrightNotice: string;
  /** 配布元 */
  sourceUrl: string;
  /** 当サイトでの加工内容。無加工なら undefined */
  modification?: { ja: string; en: string };
};

export const thirdPartyAssets: ThirdPartyAsset[] = [
  {
    id: "flag-icons",
    name: "flag-icons",
    usage: {
      ja: "言語切り替えに表示している国旗（42点）。public/images/flags/ 以下に WebP へ変換して収録しています。",
      en: "The 42 flags shown in the language switcher, converted to WebP under public/images/flags/.",
    },
    licenseName: "MIT License",
    licenseUrl: "https://github.com/lipis/flag-icons/blob/main/LICENSE",
    // MIT はこの著作権表示とライセンス本文の保持を要求します。省略できません。
    copyrightNotice: "Copyright (c) 2013 Panayiotis Lipiridis",
    sourceUrl: "https://github.com/lipis/flag-icons",
    modification: {
      ja: "SVG を表示サイズ（約24×18px）の WebP へ変換しています。意匠は変更していません。",
      en: "The SVGs were converted to WebP at display size (about 24×18px). The designs are unchanged.",
    },
  },
];

export function getThirdPartyAsset(id: string): ThirdPartyAsset | undefined {
  return thirdPartyAssets.find((asset) => asset.id === id);
}
