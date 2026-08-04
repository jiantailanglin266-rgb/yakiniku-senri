/**
 * 画像コンポーネントの描画。
 *
 * 守っているのは次の2点です。
 *   1. 画像とクレジットを分離しない（クレジットだけ外して画像を出せない）
 *   2. ライセンス情報が揃っていない画像は、そもそも描画されない
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", async () => (await import("./helpers/next-mocks")).imageMock());

import { FallbackVisual } from "@/media/components/FallbackVisual";
import { ImageSourceDetails } from "@/media/components/ImageSourceDetails";
import { MediaSlot } from "@/media/components/MediaSlot";
import { WikimediaImage } from "@/media/components/WikimediaImage";
import { getMediaLabels } from "@/media/i18n/labels";
import type { WikimediaAsset } from "@/media/types";

function makeAsset(overrides: Partial<WikimediaAsset> = {}): WikimediaAsset {
  return {
    id: "test-asset",
    commonsPageId: 1,
    wikidataEntityId: null,
    fileName: "Example.jpg",
    title: "File:Example.jpg",
    description: null,
    originalUrl: "https://upload.wikimedia.org/example.jpg",
    thumbnailUrl: null,
    commonsPageUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
    localPath: null,
    mimeType: "image/jpeg",
    width: 2000,
    height: 1200,
    aspectRatio: 2000 / 1200,
    authorName: "Example Author",
    authorUrl: "https://commons.wikimedia.org/wiki/User:Example",
    sourceName: null,
    sourceUrl: null,
    licenseCode: "CC-BY-SA-4.0",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    licenseVersion: "4.0",
    attributionText: null,
    copyrightStatus: null,
    commercialUseAllowed: true,
    derivativeWorksAllowed: true,
    shareAlikeRequired: true,
    isPublicDomain: false,
    publicDomainRationale: null,
    isModified: false,
    modificationDescription: null,
    retrievedAt: "2026-01-01T00:00:00.000Z",
    verifiedAt: "2026-01-02T00:00:00.000Z",
    verificationStatus: "approved",
    verificationNotes: [],
    rightsRisks: [],
    usageStatus: "in_use",
    objectPosition: "center",
    metadataRaw: null,
    ...overrides,
  };
}

const labels = getMediaLabels("ja");

describe("WikimediaImage", () => {
  it("画像とクレジットを同じ figure の中に描画する", () => {
    const { container } = render(
      <WikimediaImage asset={makeAsset()} alt="決済端末" slot="card" labels={labels} />,
    );

    const figure = container.querySelector("figure");
    expect(figure).not.toBeNull();
    expect(screen.getByAltText("決済端末")).toBeTruthy();
    // クレジットは画像と同じ figure の中にあります
    expect(figure?.textContent).toContain("Example Author");
    expect(figure?.textContent).toContain("Wikimedia Commons");
    expect(figure?.textContent).toContain("CC BY-SA 4.0");
  });

  it('作者名・出典名・ライセンス名は翻訳させない（translate="no"）', () => {
    render(<WikimediaImage asset={makeAsset()} alt="決済端末" slot="card" labels={labels} />);

    for (const text of ["Example Author", "Wikimedia Commons", "CC BY-SA 4.0"]) {
      const node = screen.getByText(text);
      expect(node.getAttribute("translate")).toBe("no");
    }
  });

  it("クレジットが視認できる大きさで描画される（隠さない）", () => {
    const { container } = render(
      <WikimediaImage asset={makeAsset()} alt="決済端末" slot="card" labels={labels} />,
    );
    const credit = container.querySelector("figure p");
    expect(credit).not.toBeNull();
    // sr-only や hidden でクレジットを隠していないこと
    expect(credit?.className).not.toContain("sr-only");
    expect(credit?.className).not.toContain("hidden");
    expect(credit?.className).toContain("text-[0.68rem]");
  });

  it("承認されていない画像は描画しない", () => {
    for (const status of [
      "pending",
      "needs_review",
      "license_unknown",
      "rights_risk",
      "rejected",
    ] as const) {
      const { container } = render(
        <WikimediaImage
          asset={makeAsset({ verificationStatus: status })}
          alt="決済端末"
          slot="card"
          labels={labels}
        />,
      );
      expect(container.querySelector("figure")).toBeNull();
      expect(container.querySelector("img")).toBeNull();
    }
  });

  it("ライセンス情報が無い画像は描画しない", () => {
    const { container } = render(
      <WikimediaImage
        asset={makeAsset({ licenseCode: "UNKNOWN" })}
        alt="決済端末"
        slot="card"
        labels={labels}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("作者表示が必要なのに作者が無い画像は描画しない", () => {
    const { container } = render(
      <WikimediaImage
        asset={makeAsset({ authorName: null })}
        alt="決済端末"
        slot="card"
        labels={labels}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("加工した画像はその旨を明示する", () => {
    render(
      <WikimediaImage
        asset={makeAsset({ isModified: true })}
        alt="決済端末"
        slot="card"
        labels={labels}
      />,
    );
    expect(screen.getByText(labels.modified)).toBeTruthy();
  });
});

describe("ImageSourceDetails", () => {
  it("作者・出典・ライセンス・ファイル名を出す", () => {
    render(<ImageSourceDetails asset={makeAsset()} labels={labels} />);
    expect(screen.getByText("Example Author")).toBeTruthy();
    expect(screen.getByText("Example.jpg").getAttribute("translate")).toBe("no");
    expect(screen.getByText(labels.detailsLabel)).toBeTruthy();
  });

  it("作者が取得できない場合も『作者不明』と断定しない", () => {
    render(<ImageSourceDetails asset={makeAsset({ authorName: null })} labels={labels} />);
    expect(screen.getByText(labels.notProvided)).toBeTruthy();
  });

  it("ライセンスだけで権利問題が解決しない旨を必ず併記する", () => {
    render(<ImageSourceDetails asset={makeAsset()} labels={labels} />);
    expect(screen.getByText(labels.disclaimer)).toBeTruthy();
  });
});

describe("MediaSlot", () => {
  it("画像が無い枠では装飾を出し、外部画像を読み込まない", () => {
    const { container } = render(
      <MediaSlot pageKey="cardport:news:not-assigned" slot="thumbnail" locale="ja" theme="news" />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});

describe("FallbackVisual", () => {
  it("装飾なので支援技術には読ませない", () => {
    const { container } = render(<FallbackVisual theme="card" />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("外部素材を参照しない", () => {
    const { container } = render(<FallbackVisual theme="crypto" seed={3} />);
    expect(container.innerHTML).not.toContain("http");
  });
});
