import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", async () => (await import("./helpers/next-mocks")).imageMock());
vi.mock("next/link", async () => (await import("./helpers/next-mocks")).linkMock());
vi.mock("next/navigation", async () => (await import("./helpers/next-mocks")).navigationMock("/"));

import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { BrandMovie } from "@/components/home/BrandMovie";
import { GalleryModal } from "@/components/home/GalleryModal";
import { store } from "@/data/store";

const galleryItems = [
  { src: "/images/gallery/gallery-01.webp", alt: "料理の写真", width: 1200, height: 900 },
  { src: "/images/gallery/gallery-02.webp", alt: "店内の写真", width: 1200, height: 900 },
];

const movieWithSource = {
  youtubeId: "",
  mp4: "/videos/brand-movie.mp4",
  poster: { src: "/images/movie/movie-poster.webp", alt: "ムービー", width: 1920, height: 1080 },
  title: "テスト",
  label: "MOVIE",
};

const movieWithoutSource = { ...movieWithSource, mp4: "" };

afterEach(() => {
  document.body.style.overflow = "";
});

describe("モバイルナビゲーション", () => {
  it("開閉できる", async () => {
    const user = userEvent.setup();
    render(<MobileNavigation />);

    const trigger = screen.getByRole("button", { name: "メニューを開く" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "サイトナビゲーション" });
    expect(dialog).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    // 背面スクロールが固定される
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getAllByRole("button", { name: "メニューを閉じる" })[0]);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("Escape キーで閉じる", async () => {
    const user = userEvent.setup();
    render(<MobileNavigation />);

    await user.click(screen.getByRole("button", { name: "メニューを開く" }));
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("電話番号リンクを含む", async () => {
    const user = userEvent.setup();
    render(<MobileNavigation />);
    await user.click(screen.getByRole("button", { name: "メニューを開く" }));

    const dialog = await screen.findByRole("dialog");
    const telLinks = Array.from(dialog.querySelectorAll('a[href^="tel:"]'));
    expect(telLinks.length).toBeGreaterThan(0);
    expect(telLinks[0]).toHaveAttribute("href", store.phoneHref);
  });
});

describe("ブランドムービー", () => {
  it("動画が設定されている場合のみ再生ボタンを表示する", () => {
    const { unmount } = render(<BrandMovie movie={movieWithoutSource} />);
    expect(
      screen.queryByRole("button", { name: "ブランドムービーを再生する" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("ブランドムービーは準備中です。")).toBeInTheDocument();
    unmount();

    render(<BrandMovie movie={movieWithSource} />);
    expect(screen.getByRole("button", { name: "ブランドムービーを再生する" })).toBeInTheDocument();
  });

  it("モーダルを開閉できる", async () => {
    const user = userEvent.setup();
    render(<BrandMovie movie={movieWithSource} />);

    await user.click(screen.getByRole("button", { name: "ブランドムービーを再生する" }));
    const dialog = await screen.findByRole("dialog", { name: "ブランドムービー" });
    expect(dialog).toBeInTheDocument();

    // 自動再生する場合はミュート必須
    const video = dialog.querySelector("video");
    expect(video).toBeTruthy();
    expect(video).toHaveAttribute("autoplay");
    expect(video?.muted ?? video?.hasAttribute("muted")).toBeTruthy();
    expect(video).toHaveAttribute("controls");

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "ブランドムービー" })).not.toBeInTheDocument(),
    );
  });
});

describe("ギャラリーモーダル", () => {
  it("開いた状態で描画され、閉じる操作が動く", async () => {
    const user = userEvent.setup();
    let closed = false;
    render(
      <GalleryModal
        items={galleryItems}
        index={0}
        onClose={() => {
          closed = true;
        }}
        onChange={() => {}}
      />,
    );

    expect(await screen.findByRole("dialog", { name: "ギャラリー 1 / 2" })).toBeInTheDocument();
    expect(screen.getByAltText("料理の写真")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ギャラリーを閉じる" }));
    expect(closed).toBe(true);
  });

  it("矢印キーで前後に移動できる", async () => {
    const user = userEvent.setup();
    const seen: number[] = [];
    render(
      <GalleryModal
        items={galleryItems}
        index={0}
        onClose={() => {}}
        onChange={(next) => seen.push(next)}
      />,
    );
    await screen.findByRole("dialog");

    await user.keyboard("{ArrowRight}");
    await user.keyboard("{ArrowLeft}");
    expect(seen).toEqual([1, 1]);
  });

  it("index が null のときは描画されない", () => {
    render(
      <GalleryModal items={galleryItems} index={null} onClose={() => {}} onChange={() => {}} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
