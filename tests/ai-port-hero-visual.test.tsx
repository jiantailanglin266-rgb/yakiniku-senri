import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeroVisual, HERO_VIDEO } from "@/components/ai-port/home/HeroVisual";

/* ============================================================
   ヒーロー右側の3Dグラフィック。

   `loop` 属性だけでは、最終フレームから先頭へ飛ぶ瞬間に映像が途切れます。
   2枚重ねて入れ替える仕組みと、出せないときの逃げ道を確かめます。
   ============================================================ */

const allVideos = () => [...document.querySelectorAll("video")] as HTMLVideoElement[];

function primeVideos(videos: HTMLVideoElement[], currentTime: number) {
  for (const video of videos) {
    Object.defineProperty(video, "duration", { value: 5.062, configurable: true });
    video.play = () => Promise.resolve();
  }
  Object.defineProperty(videos[0], "currentTime", { value: currentTime, configurable: true });
}

describe("ヒーローの3Dグラフィック", () => {
  it("継ぎ目を作らないため、動画を2枚重ねている", () => {
    render(<HeroVisual />);
    expect(allVideos()).toHaveLength(2);
  });

  it("差し替え用の動画を指す", () => {
    render(<HeroVisual />);
    for (const video of allVideos()) {
      expect(video.getAttribute("src")).toContain(HERO_VIDEO);
    }
  });

  it("終わりが近づくと、もう1枚へ入れ替わる", () => {
    render(<HeroVisual />);
    const videos = allVideos();
    expect(videos[0].className).toContain("opacity-100");

    primeVideos(videos, 4.8);
    fireEvent.timeUpdate(videos[0]);

    const after = allVideos();
    expect(after[1].className).toContain("opacity-100");
    expect(after[0].className).toContain("opacity-0");
  });

  it("まだ終わりでなければ入れ替えない", () => {
    render(<HeroVisual />);
    const videos = allVideos();
    primeVideos(videos, 1.0);
    fireEvent.timeUpdate(videos[0]);
    expect(allVideos()[0].className).toContain("opacity-100");
  });

  it("音の出ない自動再生になっている", () => {
    render(<HeroVisual />);
    const videos = allVideos();
    for (const video of videos) {
      expect(video.muted).toBe(true);
      expect(video.getAttribute("playsinline")).not.toBeNull();
    }
    expect(videos[0].getAttribute("autoplay")).not.toBeNull();
  });

  it("読み込みに失敗したら、元の球体グラフィックに戻す", () => {
    // ここを空にすると右カラムだけ穴が開き、レイアウトが崩れて見えます
    const { container } = render(<HeroVisual />);
    fireEvent.error(allVideos()[0]);

    expect(allVideos()).toHaveLength(0);
    expect(container.querySelector(".ai-orb")).not.toBeNull();
  });

  it("枠の比率を固定している（読み込みで高さが動かない）", () => {
    const { container } = render(<HeroVisual />);
    expect(container.firstElementChild?.className).toContain("aspect-[864/496]");
  });
});
