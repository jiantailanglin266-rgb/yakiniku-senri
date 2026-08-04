import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { hasPhoto, photoCount, photoPath } from "@/data/ai-port/photos";

/* ============================================================
   AI PORT のライセンス未確認の写真（AGENTS.md §5 の例外）。

   この経路は src/media/ の判定を通りません。
   「未確認であることを隠さない」ことが、この例外を許す条件です。
   その3つの条件が外れたらテストで落とします。
   ============================================================ */

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("写真の一覧", () => {
  it("一覧に無いスラッグはパスを返さない", () => {
    expect(photoPath("topic-does-not-exist")).toBeNull();
    expect(hasPhoto("topic-does-not-exist")).toBe(false);
  });

  it("点数と一覧の内容が食い違わない", () => {
    const source = read("src/data/ai-port/photos.ts");
    const entries = source.match(/^\s{2}"[^"]+",$/gm) ?? [];
    expect(entries.length).toBe(photoCount);
  });

  it("マニフェストのスラッグが重複していない", () => {
    const manifest = JSON.parse(read("scripts/wikipedia-photo-manifest.json")) as {
      slug: string;
      lang: string;
      titles: string[];
    }[];

    const slugs = manifest.map((entry) => entry.slug);
    expect(new Set(slugs).size, "同じスラッグが2回登録されています").toBe(slugs.length);

    for (const entry of manifest) {
      expect(entry.titles.length, entry.slug).toBeGreaterThan(0);
      expect(entry.lang, entry.slug).toMatch(/^[a-z]{2}$/);
    }
  });
});

describe("未確認であることを隠さない（AGENTS.md §5 の例外の条件）", () => {
  it("出典ページに「ライセンス未確認」の節がある", () => {
    const page = read("src/app/ai-port/image-credits/page.tsx");

    expect(page).toContain("ライセンス未確認の写真");
    expect(page).toContain("作者・ライセンス・出典を確認していません");
    // 権利者が連絡できる導線
    expect(page).toContain("お問い合わせ");
  });

  it("確認済みの画像を、未確認の写真より優先する", () => {
    const component = read("src/components/ai-port/media/AiMediaBackdrop.tsx");

    // resolveImage が真なら未確認の写真は返しません
    expect(component).toContain("if (resolveImage(");
    expect(component).toContain("return null;");
  });

  it("取得スクリプトが、確認していないことを自ら書いている", () => {
    for (const path of [
      "scripts/wikipedia-photos.mjs",
      "scripts/wikipedia-photos.ps1",
      "scripts/wikipedia-photos-resize.ps1",
    ]) {
      const source = read(path);
      expect(source, path).toMatch(
        /ライセンス確認をしていません|does NOT verify|not verify licences/,
      );
    }
  });

  it("未確認の写真は装飾として出す（本文の意味を持たせない）", () => {
    const component = read("src/components/ai-port/media/AiMediaBackdrop.tsx");
    // alt="" と aria-hidden。読み上げ環境に意味のない画像を読ませません
    expect(component).toContain('alt=""');
    expect(component).toContain('aria-hidden="true"');
  });
});
