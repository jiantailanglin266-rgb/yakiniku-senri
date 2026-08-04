import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", async () => (await import("./helpers/next-mocks")).imageMock());
vi.mock("next/link", async () => (await import("./helpers/next-mocks")).linkMock());

import { HeroLogoVideo } from "@/components/ai-port/home/HeroLogoVideo";
import { PORTAL_LOGO_VIDEO } from "@/components/ai-port/layout/PortalLogo";

/* ============================================================
   AI PORT のファーストビューにある動くロゴ。

   `loop` 属性だけでは、最終フレームから先頭へ飛ぶ瞬間に映像が途切れます。
   同じ動画を2枚重ねて入れ替える仕組みが壊れていないことを確かめます。
   ============================================================ */

/** 「残りわずか」の状態を作れるようにします（jsdom は再生しないため） */
function primeVideos(videos: HTMLVideoElement[], currentTime: number) {
  for (const video of videos) {
    Object.defineProperty(video, "duration", { value: 5.062, configurable: true });
    video.play = () => Promise.resolve();
  }
  Object.defineProperty(videos[0], "currentTime", { value: currentTime, configurable: true });
}

const allVideos = () => [...document.querySelectorAll("video")] as HTMLVideoElement[];

describe("ファーストビューの動くロゴ", () => {
  it("継ぎ目を作らないため、動画を2枚重ねている", () => {
    render(<HeroLogoVideo />);
    expect(allVideos()).toHaveLength(2);
  });

  it("ヘッダーのロゴと同じ動画ファイルを指す", () => {
    // パスを2か所に書くと、差し替えたときに片方だけ古いままになります
    render(<HeroLogoVideo />);
    for (const video of allVideos()) {
      expect(video.getAttribute("src")).toContain(PORTAL_LOGO_VIDEO);
    }
  });

  it("終わりが近づくと、もう1枚へ入れ替わる（継ぎ目のないループ）", () => {
    render(<HeroLogoVideo />);
    const videos = allVideos();

    // 再生中は1枚目が前面
    expect(videos[0].className).toContain("opacity-100");
    expect(videos[1].className).toContain("opacity-0");

    // 残り 0.26 秒（CROSSFADE_SEC = 0.7 より内側）
    primeVideos(videos, 4.8);
    fireEvent.timeUpdate(videos[0]);

    const after = allVideos();
    expect(after[1].className).toContain("opacity-100");
    expect(after[0].className).toContain("opacity-0");
  });

  it("まだ終わりでなければ入れ替えない", () => {
    render(<HeroLogoVideo />);
    const videos = allVideos();

    primeVideos(videos, 1.0);
    fireEvent.timeUpdate(videos[0]);

    expect(allVideos()[0].className).toContain("opacity-100");
  });

  it("音の出ない自動再生になっている", () => {
    // muted でない自動再生は、多くのブラウザが止めます。
    // この動画は音声トラックを持っているため、消音は必須です。
    render(<HeroLogoVideo />);
    const videos = allVideos();
    for (const video of videos) {
      expect(video.muted).toBe(true);
      expect(video.getAttribute("playsinline")).not.toBeNull();
    }
    expect(videos[0].getAttribute("autoplay")).not.toBeNull();
  });

  it("読み込みに失敗したら、何も残さない", () => {
    // ここは装飾です。すぐ下の «AI PORT — AI / WEB3 PORTAL» と見出しが
    // サイトの名乗りを担うため、空の枠を残すより消すほうが崩れません。
    render(<HeroLogoVideo />);
    fireEvent.error(allVideos()[0]);
    expect(allVideos()).toHaveLength(0);
  });

  it("読み上げ対象にしない（見出しと二重にならないように）", () => {
    const { container } = render(<HeroLogoVideo />);
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });
});
