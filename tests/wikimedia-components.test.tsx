/**
 * 画像コンポーネントのテスト。
 *
 * 最重要は「クレジットの無い画像を描画できないこと」です。
 * 呼び出し側がクレジットを外せないことも、ここで固定します。
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", async () => (await import("./helpers/next-mocks")).imageMock());

import { WikimediaImage, WikimediaCardImage } from "@/wikimedia/components/WikimediaImage";
import { ImageAttribution } from "@/wikimedia/components/ImageAttribution";
import { FallbackVisual } from "@/wikimedia/components/FallbackVisual";
import type { WikimediaAsset } from "@/wikimedia/types";

function asset(overrides: Partial<WikimediaAsset> = {}): WikimediaAsset {
  return {
    id: "test-asset",
    fileName: "File:Test.jpg",
    title: "Test",
    originalUrl: "https://upload.wikimedia.org/test.jpg",
    commonsPageUrl: "https://commons.wikimedia.org/wiki/File:Test.jpg",
    mimeType: "image/jpeg",
    width: 2400,
    height: 1350,
    aspectRatio: 2400 / 1350,
    authorName: "Jane Doe",
    authorUrl: "https://commons.wikimedia.org/wiki/User:JaneDoe",
    licenseCode: "CC-BY-SA-4.0",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    commercialUseAllowed: true,
    derivativeWorksAllowed: true,
    shareAlikeRequired: true,
    isPublicDomain: false,
    isModified: false,
    retrievedAt: "2026-01-01T00:00:00.000Z",
    verificationStatus: "approved",
    usageStatus: "in_use",
    rightsRisks: [],
    altText: { ja: "テスト画像", en: "Test image" },
    ...overrides,
  };
}

const base = {
  locale: "ja",
  fallbackSeed: "seed",
  fallbackAccent: "#22d3ee",
};

describe("WikimediaImage", () => {
  it("承認済みの画像は、クレジットと一緒に描画される", () => {
    render(<WikimediaImage {...base} asset={asset()} />);
    expect(screen.getByAltText("テスト画像")).toBeInTheDocument();
    // 画像とクレジットは常に同伴します
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("CC BY-SA 4.0")).toBeInTheDocument();
    expect(screen.getByText("Wikimedia Commons")).toBeInTheDocument();
  });

  it("asset が無ければ画像を描画しない", () => {
    const { container } = render(<WikimediaImage {...base} asset={undefined} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("ライセンス不明の画像は描画しない", () => {
    const { container } = render(
      <WikimediaImage {...base} asset={asset({ licenseCode: "UNKNOWN" })} />,
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("作者が取得できていない CC BY 画像は描画しない", () => {
    const { container } = render(
      <WikimediaImage
        {...base}
        asset={asset({ licenseCode: "CC-BY-4.0", authorName: undefined })}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("商用不可・改変不可の画像は描画しない", () => {
    for (const code of ["CC-BY-NC", "CC-BY-ND", "FAIR_USE"] as const) {
      const { container } = render(
        <WikimediaImage {...base} asset={asset({ licenseCode: code })} />,
      );
      expect(container.querySelector("img"), code).toBeNull();
    }
  });

  it("未承認の画像は描画しない", () => {
    const { container } = render(
      <WikimediaImage {...base} asset={asset({ verificationStatus: "needs_review" })} />,
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("カード用でもクレジットは画像のそばに出る（記事末尾送りにしない）", () => {
    render(<WikimediaCardImage {...base} asset={asset()} />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("装飾指定でも alt を空にするだけで、クレジットは消えない", () => {
    render(<WikimediaImage {...base} asset={asset()} decorative />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });
});

describe("ImageAttribution", () => {
  it("作者・出典・ライセンスをそれぞれリンクにする", () => {
    render(<ImageAttribution asset={asset()} locale="ja" />);
    expect(screen.getByRole("link", { name: "Jane Doe" })).toHaveAttribute(
      "href",
      "https://commons.wikimedia.org/wiki/User:JaneDoe",
    );
    expect(screen.getByRole("link", { name: "Wikimedia Commons" })).toHaveAttribute(
      "href",
      "https://commons.wikimedia.org/wiki/File:Test.jpg",
    );
    expect(screen.getByRole("link", { name: "CC BY-SA 4.0" })).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by-sa/4.0/",
    );
  });

  it("固有名詞を機械翻訳させない", () => {
    const { container } = render(<ImageAttribution asset={asset()} locale="ko" />);
    expect(container.querySelector("[translate='no']")).not.toBeNull();
  });

  it("詳細表示には取得日を含む", () => {
    render(<ImageAttribution asset={asset()} locale="ja" variant="full" />);
    expect(screen.getByText("2026-01-01")).toBeInTheDocument();
  });
});

describe("FallbackVisual", () => {
  it("装飾なので読み上げ対象から外す", () => {
    const { container } = render(<FallbackVisual seed="tennis" accent="#22d3ee" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("同じ種なら同じ SVG になる", () => {
    const first = render(<FallbackVisual seed="tennis" accent="#22d3ee" />).container.innerHTML;
    const second = render(<FallbackVisual seed="tennis" accent="#22d3ee" />).container.innerHTML;
    expect(first).toBe(second);
  });
});
