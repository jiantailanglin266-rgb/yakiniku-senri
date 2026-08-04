import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KeywordMarquee } from "@/components/ai-port/home/KeywordMarquee";
import { toolCategories, topics } from "@/data/ai-port/taxonomy";

/* ============================================================
   斜めのキーワード帯。

   ここで守りたいのは見た目ではなく、
   「扱っていない分野の言葉を流さないこと」です（AGENTS.md §3 事実性）。
   手書きの単語を足すと、無いページがあるように見えます。
   ============================================================ */

describe("斜めのキーワード帯", () => {
  it("流す語は、すべてサイトの実データに存在する", () => {
    const { container } = render(<KeywordMarquee />);
    const allowed = new Set([
      ...topics.map((topic) => topic.name),
      ...toolCategories.map((category) => category.nameEn),
    ]);

    const words = [...container.querySelectorAll("span.bg-clip-text")].map((node) =>
      node.textContent?.trim(),
    );

    expect(words.length).toBeGreaterThan(0);
    for (const word of words) {
      expect(allowed.has(word ?? ""), `実データに無い語です: ${word}`).toBe(true);
    }
  });

  it("トピック名をすべて流す（掲載しているのに出ない分野を作らない）", () => {
    const { container } = render(<KeywordMarquee />);
    const text = container.textContent ?? "";
    for (const topic of topics) {
      expect(text, topic.name).toContain(topic.name);
    }
  });

  it("同じ語を重ねて持たない", () => {
    const { container } = render(<KeywordMarquee />);
    // 1行ぶん（＝継ぎ目対策の複製を除いた集合）に重複が無いこと
    const row = container.querySelector(".ai-marquee > div");
    const words = [...(row?.querySelectorAll("span.bg-clip-text") ?? [])].map(
      (node) => node.textContent?.trim() ?? "",
    );
    expect(new Set(words).size).toBe(words.length);
  });

  it("継ぎ目を出さないため、各行が同じ並びを2組持つ", () => {
    const { container } = render(<KeywordMarquee />);
    for (const track of container.querySelectorAll(".ai-marquee")) {
      expect(track.children).toHaveLength(2);
    }
  });

  it("行ごとに流れる向きを変える（1枚の板に見せない）", () => {
    const { container } = render(<KeywordMarquee />);
    const tracks = [...container.querySelectorAll(".ai-marquee")];
    expect(tracks.length).toBeGreaterThan(1);
    expect(tracks.some((track) => track.classList.contains("ai-marquee-reverse"))).toBe(true);
    expect(tracks.some((track) => !track.classList.contains("ai-marquee-reverse"))).toBe(true);
  });

  it("読み上げ対象にしない（トピック一覧と二重に読まれないように）", () => {
    const { container } = render(<KeywordMarquee />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });

  it("傾きは外枠ではなく内側の行にかける（四隅に隙間を作らない）", () => {
    const { container } = render(<KeywordMarquee />);
    const frame = container.firstElementChild;
    expect(frame?.className).toContain("overflow-hidden");
    expect(frame?.className).not.toContain("ai-diagonal-rows");
    expect(container.querySelector(".ai-diagonal-rows")).not.toBeNull();
  });
});
