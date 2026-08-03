import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/image", async () => (await import("./helpers/next-mocks")).imageMock());
vi.mock("next/link", async () => (await import("./helpers/next-mocks")).linkMock());
vi.mock("next/navigation", async () => (await import("./helpers/next-mocks")).navigationMock("/"));

import { enableReducedMotion } from "./helpers/next-mocks";
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
});
