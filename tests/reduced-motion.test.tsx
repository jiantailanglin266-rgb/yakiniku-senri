import { render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/image", async () => (await import("./helpers/next-mocks")).imageMock());
vi.mock("next/link", async () => (await import("./helpers/next-mocks")).linkMock());
vi.mock("next/navigation", async () => (await import("./helpers/next-mocks")).navigationMock("/"));

import { enableReducedMotion } from "./helpers/next-mocks";
import { BrandMovie } from "@/components/home/BrandMovie";
import { Reveal } from "@/components/ui/Reveal";
import { LoadingScreen } from "@/components/effects/LoadingScreen";
import { PageTransition } from "@/components/effects/PageTransition";

enableReducedMotion();

describe("prefers-reduced-motion: reduce", () => {
  beforeAll(() => {
    enableReducedMotion();
  });

  it("Reveal はアニメーションなしで即時表示する", () => {
    const { container } = render(
      <Reveal className="test-reveal">
        <p>本文が読める</p>
      </Reveal>,
    );
    expect(screen.getByText("本文が読める")).toBeVisible();

    const wrapper = container.querySelector(".test-reveal") as HTMLElement;
    expect(wrapper).toBeTruthy();
    // framer-motion の初期スタイル（opacity:0 など）が付かないこと
    expect(wrapper.style.opacity).toBe("");
    expect(wrapper.style.transform).toBe("");
  });

  it("ローディング画面を表示しない", () => {
    render(<LoadingScreen />);
    expect(screen.queryByRole("status", { name: "読み込み中" })).not.toBeInTheDocument();
  });

  it("PageTransition は子要素をそのまま描画する", () => {
    render(
      <PageTransition>
        <p>ページ本文</p>
      </PageTransition>,
    );
    expect(screen.getByText("ページ本文")).toBeVisible();
  });

  it("ブランドムービーを自動再生せず、操作バーを出す", async () => {
    class ImmediateObserver {
      root = null;
      rootMargin = "";
      thresholds: number[] = [];
      constructor(private readonly callback: IntersectionObserverCallback) {}
      observe(target: Element) {
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

    try {
      render(<BrandMovie />);
      const video = await waitFor(() => {
        const element = document.querySelector("video");
        expect(element).toBeTruthy();
        return element as HTMLVideoElement;
      });
      expect(video).not.toHaveAttribute("autoplay");
      expect(video).toHaveAttribute("controls");
      // 枠の大きさは変わらないため、レイアウトは同じです
      expect(video.className).toContain("absolute inset-0");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
