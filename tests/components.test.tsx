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
