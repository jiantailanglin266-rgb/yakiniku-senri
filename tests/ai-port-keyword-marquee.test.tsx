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

    const words = [...container.querySelectorAll(".ai-marquee span")].map((node) =>
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
    const words = [...(row?.querySelectorAll("span") ?? [])].map(
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

describe("描画コスト", () => {
  /*
    1つの帯に約200個のピルが並びます。1個あたりの負荷がそのまま200倍になるため、
    重い指定が紛れ込んでいないことを機械的に確かめます。
    実際に backdrop-blur でスクロールが重くなりました。
  */
  it("ピルに背景ぼかし・グラデーション文字・影を使わない", () => {
    const { container } = render(<KeywordMarquee />);
    const pills = [...container.querySelectorAll(".ai-marquee span")];
    expect(pills.length).toBeGreaterThan(50);

    for (const pill of pills) {
      const cls = pill.className;
      expect(cls, "backdrop-blur は 200 個ぶんの負荷になります").not.toContain("backdrop-blur");
      expect(cls, "bg-clip-text は要素ごとに合成レイヤーを作ります").not.toContain("bg-clip-text");
      expect(cls, "影のぼかしも要素数ぶん効きます").not.toMatch(/\bshadow-/);
      expect(cls, "filter は要素数ぶん効きます").not.toMatch(/\bblur-/);
    }
  });

  it("詰めた版は行数を減らす（ピルの総数を減らす）", () => {
    const { container: full } = render(<KeywordMarquee />);
    const { container: compact } = render(<KeywordMarquee compact />);
    const rows = (c: HTMLElement) => c.querySelectorAll(".ai-marquee").length;
    expect(rows(compact)).toBeLessThan(rows(full));
  });

  it("傾きの向きを変えられる（同じページに2本置いても使い回しに見えない）", () => {
    const { container: left } = render(<KeywordMarquee />);
    const { container: right } = render(<KeywordMarquee tilt="right" />);
    expect(left.firstElementChild?.className).not.toContain("ai-diagonal-right");
    expect(right.firstElementChild?.className).toContain("ai-diagonal-right");
  });
});
