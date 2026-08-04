import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", async () => (await import("./helpers/next-mocks")).imageMock());
vi.mock("next/link", async () => (await import("./helpers/next-mocks")).linkMock());
vi.mock("next/navigation", async () => (await import("./helpers/next-mocks")).navigationMock("/"));

import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { MobileFixedBar } from "@/components/layout/MobileFixedBar";
import { Figure } from "@/components/ui/Figure";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { MarqueeBand } from "@/components/ui/MarqueeBand";
import { marqueeTop } from "@/data/marquee";
import { MenuCard } from "@/components/menu/MenuCard";
import { store } from "@/data/store";
import { socialLinks } from "@/data/site";
import { mainNav } from "@/data/navigation";
import { recommendedItems } from "@/data/menu";

describe("GlobalHeader", () => {
  it("主要ナビゲーションのリンクをすべて描画する", () => {
    render(<GlobalHeader />);
    const nav = screen.getByRole("navigation", { name: "メインナビゲーション" });
    for (const item of mainNav) {
      expect(within(nav).getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    }
  });

  it("電話予約リンクが正しい tel: を指す", () => {
    render(<GlobalHeader />);
    const links = screen.getAllByRole("link", { name: /電話で予約する/ });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", store.phoneHref);
  });

  it("フッターと同じSNSリンクをヘッダーにも並べる", () => {
    const { container } = render(<GlobalHeader />);
    // スマートフォン用の一覧。フッターと同じ並び・同じ件数であることを確認します
    const list = container.querySelector("header ul.lg\\:hidden");
    expect(list).toBeTruthy();
    expect(Array.from(list!.querySelectorAll("a")).map((a) => a.getAttribute("href"))).toEqual(
      socialLinks.map((link) => link.href),
    );
  });

  it("電話予約ボタンをスマートフォンでは隠す", () => {
    render(<GlobalHeader />);
    const button = screen
      .getAllByRole("link", { name: /電話で予約する/ })
      .find((link) => link.closest("header"));
    // cn() は単純連結のため className の hidden が効きません。
    // ラッパー側で出し分けているので、その指定が消えていないことを確かめます
    expect(button?.parentElement?.className).toContain("hidden");
    expect(button?.parentElement?.className).toContain("md:contents");
  });
});

describe("MarqueeBand", () => {
  it("2段が逆方向で、読み上げ・翻訳の対象から外れている", () => {
    const { container } = render(<MarqueeBand rows={marqueeTop} />);
    const band = container.querySelector(".marquee-band");
    expect(band).toHaveAttribute("aria-hidden", "true");
    expect(band).toHaveAttribute("translate", "no");

    const rows = container.querySelectorAll(".marquee-x");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAttribute("data-direction", "left");
    expect(rows[1]).toHaveAttribute("data-direction", "right");
  });

  it("継ぎ目が出ないよう同じ並びを複数回描画する", () => {
    const { container } = render(<MarqueeBand rows={marqueeTop} />);
    const groups = container.querySelectorAll(".marquee-x .marquee-x-group");
    // 2段 × 繰り返し。1段あたり2回以上なければループで隙間が出ます
    expect(groups.length / 2).toBeGreaterThanOrEqual(2);

    const firstRowItems = Array.from(
      container.querySelectorAll(".marquee-x:first-child .marquee-x-group:first-child span"),
    ).map((span) => span.textContent);
    expect(firstRowItems).toEqual([...marqueeTop[0]]);
  });
});

describe("GlobalFooter", () => {
  it("店舗情報と法的ページへのリンクを描画する", () => {
    render(<GlobalFooter />);
    expect(screen.getByText(store.addressFull)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "プライバシーポリシー" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(screen.getByRole("link", { name: "特定商取引法に基づく表記" })).toHaveAttribute(
      "href",
      "/legal",
    );
    expect(screen.getByRole("link", { name: "サイトマップ" })).toHaveAttribute("href", "/sitemap");
  });
});

describe("MobileFixedBar", () => {
  it("電話・地図・お品書きの3導線を持つ", () => {
    render(<MobileFixedBar />);
    expect(screen.getByRole("link", { name: /電話予約/ })).toHaveAttribute("href", store.phoneHref);
    expect(screen.getByRole("link", { name: /お品書き/ })).toHaveAttribute("href", "/menu");
  });
});

describe("SocialLinks", () => {
  it("外部リンクが新しいタブで開き rel が設定される", () => {
    render(<SocialLinks />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(link.getAttribute("aria-label")).toContain("外部サイト");
    }
  });
});

describe("Figure", () => {
  it("画像が設定されていればレンダリングする", () => {
    render(
      <Figure
        media={{ src: "/images/hero/hero-main.webp", alt: "テスト画像", width: 100, height: 100 }}
      />,
    );
    expect(screen.getByAltText("テスト画像")).toBeInTheDocument();
  });

  it("画像が未設定でもプレースホルダーで崩れない", () => {
    const { container } = render(
      <Figure media={{ src: "", alt: "未設定", width: 100, height: 100 }} label="MENU" />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector(".media-placeholder")).toBeTruthy();
    expect(screen.getByText("MENU")).toBeInTheDocument();
  });
});

describe("MenuCard", () => {
  it("商品名・価格・おすすめラベルを表示する", () => {
    const item = recommendedItems[0];
    render(<MenuCard item={item} />);
    expect(screen.getByRole("heading", { name: item.name })).toBeInTheDocument();
    expect(screen.getByText(`¥${item.price.toLocaleString("ja-JP")}`)).toBeInTheDocument();
    expect(screen.getByText("おすすめ")).toBeInTheDocument();
  });
});

describe("オープニングの置き場所", () => {
  // PageTransition は初期表示で opacity:0 を当てます。
  // オープニングを <main> の中に置くと、JavaScript が動き出すまで黒幕が描かれず、
  // 動画の頭に背後のサイトが見えてしまいます。
  it("共通シェルが <main> の外でオープニングを描く", () => {
    const shell = readFileSync(
      path.join(process.cwd(), "src", "components", "layout", "SenriShell.tsx"),
      "utf-8",
    );
    const opening = shell.indexOf("<LoadingScreen />");
    // コメント中の <main> ではなく、実際の要素の位置と比べます
    const main = shell.indexOf('<main id="main">');
    expect(opening).toBeGreaterThan(-1);
    expect(main).toBeGreaterThan(-1);
    expect(opening).toBeLessThan(main);
  });

  it("トップページ側では二重に描かない", () => {
    const page = readFileSync(
      path.join(process.cwd(), "src", "app", "(senri)", "page.tsx"),
      "utf-8",
    );
    expect(page).not.toContain("LoadingScreen");
  });
});
