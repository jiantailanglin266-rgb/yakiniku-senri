import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", async () => (await import("./helpers/next-mocks")).imageMock());
vi.mock("next/link", async () => (await import("./helpers/next-mocks")).linkMock());
vi.mock("next/navigation", async () => (await import("./helpers/next-mocks")).navigationMock("/"));

import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { BrandMovie } from "@/components/home/BrandMovie";
import { GalleryModal } from "@/components/home/GalleryModal";
import { LoadingScreen } from "@/components/effects/LoadingScreen";
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

/**
 * IntersectionObserver を「観測した瞬間に交差した」と通知する実装に差し替えます。
 * setup.ts の既定スタブは通知しないため、遅延読み込みの前後を別々に検証できます。
 */
function observeImmediately() {
  class ImmediateObserver {
    root = null;
    rootMargin = "";
    thresholds: number[] = [];
    constructor(private readonly callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      // 同期で呼ぶと effect 内の setState になるため、次のタスクで通知します
      setTimeout(() => {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }, 0);
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", ImmediateObserver);
}

afterEach(() => {
  document.body.style.overflow = "";
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
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
  it("動画が未設定なら準備中の案内だけを出す", () => {
    render(<BrandMovie movie={movieWithoutSource} />);
    expect(screen.getByText("ブランドムービーは準備中です。")).toBeInTheDocument();
    expect(document.querySelector("video")).toBeNull();
  });

  it("枠が画面に入るまで動画を読み込まない", () => {
    // setup.ts の IntersectionObserver スタブは交差を通知しません
    render(<BrandMovie movie={movieWithSource} />);
    expect(document.querySelector("video")).toBeNull();
  });

  it("再生ボタンを押さずに消音でループ再生する", async () => {
    observeImmediately();
    render(<BrandMovie movie={movieWithSource} />);

    const video = await waitFor(() => {
      const element = document.querySelector("video");
      expect(element).toBeTruthy();
      return element as HTMLVideoElement;
    });

    // 自動再生はミュートかつインライン再生でなければブラウザが許可しません
    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("playsinline");
    expect(video.muted || video.hasAttribute("muted")).toBe(true);

    // 再生ボタンもモーダルも出さない＝再生してもページの表示は変わりません
    expect(
      screen.queryByRole("button", { name: "ブランドムービーを再生する" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
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

describe("オープニング（サイトの入り口）", () => {
  it("動画を1回だけ再生する（ループしない）", () => {
    render(<LoadingScreen />);

    const video = document.querySelector("video");
    expect(video).toBeTruthy();
    // 自動再生はミュートかつインライン再生でなければブラウザが許可しません
    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("playsinline");
    expect(video!.muted || video!.hasAttribute("muted")).toBe(true);
    // 入り口の演出なので繰り返しません
    expect(video).not.toHaveAttribute("loop");
    // 切り抜かず、拡大しすぎない指定であること
    expect(video!.className).toContain("object-contain");
  });

  it("再生が終わったらサイトへ入る", async () => {
    render(<LoadingScreen />);
    fireEvent.ended(document.querySelector("video")!);

    await waitFor(() => {
      expect(screen.queryByRole("status", { name: "読み込み中" })).not.toBeInTheDocument();
    });
    expect(document.body.style.overflow).toBe("");
  });

  it("動画が読み込めなければ文字のオープニングへ切り替える", async () => {
    render(<LoadingScreen />);
    fireEvent.error(document.querySelector("video")!);

    // 入り口で止まらず、店名の演出に差し替わること
    await waitFor(() => expect(document.querySelector("video")).toBeNull());
    expect(screen.getByText(store.name)).toBeInTheDocument();
  });

  it("スキップできる", async () => {
    const user = userEvent.setup();
    render(<LoadingScreen />);

    await user.click(screen.getByRole("button", { name: /オープニングをとばして/ }));
    await waitFor(() => {
      expect(screen.queryByRole("status", { name: "読み込み中" })).not.toBeInTheDocument();
    });
    // 同じセッションでは二度と出しません
    expect(window.sessionStorage.getItem("senri:loaded")).toBe("1");
  });

  it("一度表示したセッションでは出さない", () => {
    window.sessionStorage.setItem("senri:loaded", "1");
    render(<LoadingScreen />);
    expect(screen.queryByRole("status", { name: "読み込み中" })).not.toBeInTheDocument();
  });
});

describe("オープニングの映り込み防止", () => {
  it("サーバー側の描画でも黒幕が出る（JS を待つあいだサイトを見せない）", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const html = renderToStaticMarkup(<LoadingScreen />);

    // 黒幕そのものは初期HTMLに含まれること
    expect(html).toContain("opening-screen");
    // ただし中身（動画・スキップ）は含めないこと。
    // 2回目以降の訪問で黒幕がCSSで消えていても、動画を読みに行ってしまうため
    expect(html).not.toContain("<video");
    expect(html).not.toContain("Skip");
  });

  it("黒幕は最前面でページ全体を覆う", async () => {
    render(<LoadingScreen />);
    const overlay = document.querySelector(".opening-screen");
    expect(overlay).toBeTruthy();
    // 位置と重なり順は CSS 側（globals.css）で指定しています
    expect(overlay).toHaveAttribute("role", "status");
  });
});
