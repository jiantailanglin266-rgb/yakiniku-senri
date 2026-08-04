import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  SECTION_BANNER_ASPECT,
  SECTION_BANNER_KEYS,
  SECTION_BANNER_SIZE,
  sectionBanner,
} from "@/data/ai-port/section-banners";

/* ============================================================
   セクション見出しの画像。

   このモジュールはクライアント側にも取り込まれるため、
   実行時にファイルの有無を確かめることができません
   （node:fs を使うとビルドが通りません）。

   そのかわり、ここで確かめます。
   キーだけ足してファイルを置き忘れると、このテストが落ちます。
   ============================================================ */

describe("セクション見出しの画像", () => {
  it("一覧に載せたキーは、実ファイルが存在する", () => {
    for (const key of SECTION_BANNER_KEYS) {
      const src = sectionBanner(key);
      expect(src, `${key} のパスが解決できません`).not.toBeNull();

      // src は public/ からの絶対パス（例: /images/ai-port/sections/news.jpg）
      const file = join(process.cwd(), "public", src!);
      expect(existsSync(file), `${src} が public/ にありません`).toBe(true);
    }
  });

  it("一覧に無いキーは null を返す（文字の見出しに戻る）", () => {
    // 画像を置き忘れたまま公開しても、表示が壊れないことの確認です。
    expect(sectionBanner("この-キーは-存在しない")).toBeNull();
  });

  it("比率と実寸が一致している", () => {
    // ここがずれると、読み込み中に高さが動きます（CLS）。
    expect(SECTION_BANNER_ASPECT).toBe(
      `aspect-[${SECTION_BANNER_SIZE.width}/${SECTION_BANNER_SIZE.height}]`,
    );
  });
});
