import { existsSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { SECTION_BANNER_KEYS, sectionBanner } from "@/data/ai-port/section-banners";

/* ============================================================
   セクション見出しの画像。

   このモジュールはクライアント側にも取り込まれるため、
   実行時にファイルの有無を確かめることができません
   （node:fs を使うとビルドが通りません）。

   そのかわり、ここで確かめます。
   キーだけ足してファイルを置き忘れると、このテストが落ちます。
   ============================================================ */

const publicPath = (src: string) => join(process.cwd(), "public", src);

describe("セクション見出しの画像", () => {
  it("一覧に載せたキーは、実ファイルが存在する", () => {
    for (const key of SECTION_BANNER_KEYS) {
      const banner = sectionBanner(key);
      expect(banner, `${key} が解決できません`).not.toBeNull();
      expect(existsSync(publicPath(banner!.src)), `${banner!.src} が public/ にありません`).toBe(
        true,
      );
    }
  });

  it("書いてある実寸が、実ファイルと一致する", async () => {
    // ここがずれると、読み込み中に高さが動きます（CLS）。
    for (const key of SECTION_BANNER_KEYS) {
      const banner = sectionBanner(key)!;
      const meta = await sharp(publicPath(banner.src)).metadata();
      expect({ width: meta.width, height: meta.height }, `${banner.src} の実寸が違います`).toEqual({
        width: banner.width,
        height: banner.height,
      });
    }
  });

  it("一覧に無いキーは null を返す（文字の見出しに戻る）", () => {
    // 画像を置き忘れたまま公開しても、表示が壊れないことの確認です。
    expect(sectionBanner("この-キーは-存在しない")).toBeNull();
  });
});
