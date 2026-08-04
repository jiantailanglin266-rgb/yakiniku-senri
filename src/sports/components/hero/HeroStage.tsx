"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * ファーストビューの立体ステージ。
 *
 * ■ なぜ WebGL を使わないか
 *   スタジアム・光の粒子・浮遊するスコアカードという要求に対して、
 *   CSS 3D + Canvas 2D で十分な密度が出せる一方、
 *   WebGL ランタイム（three.js 系で 150KB 超）は初期表示を確実に重くします。
 *   このページの主役はスコアなので、描画開始の速さを優先しました。
 *   より重い演出が必要になったら、この 1 コンポーネントを差し替えるだけで済みます。
 *
 * ■ 端末に応じた減量
 *   - prefers-reduced-motion: アニメーションを止め、静止状態で描画します
 *   - 画面幅が狭い / CPU コアが少ない端末: 粒子数を減らします
 *   - タブが非表示のとき: 描画ループを止めます
 */
export function HeroStage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // framer-motion の useReducedMotion は内部で useSyncExternalStore を使っており、
  // effect 内で setState する必要がありません。
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    // 端末性能に合わせて粒子数を決めます（低スペック端末で描画を落とさないため）
    const cores = navigator.hardwareConcurrency ?? 4;
    const narrow = window.innerWidth < 768;
    const count = reduced ? 26 : narrow ? 42 : cores <= 4 ? 70 : 110;

    type Particle = { x: number; y: number; z: number; speed: number; hue: number };
    let particles: Particle[] = [];

    const palette = [188, 220, 262, 292, 26];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = Array.from({ length: count }, (_, index) => ({
        // 決定的に配置します（乱数だと再描画のたびに配置が飛ぶため）
        x: ((index * 61) % 100) / 100,
        y: ((index * 37) % 100) / 100,
        z: 0.25 + (((index * 23) % 100) / 100) * 0.75,
        speed: 0.15 + (((index * 17) % 100) / 100) * 0.55,
        hue: palette[index % palette.length],
      }));
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let frame = 0;
    let last = 0;

    const draw = (time: number) => {
      const delta = last ? Math.min((time - last) / 1000, 0.05) : 0;
      last = time;
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        if (!reduced) {
          particle.y -= particle.speed * delta * 0.08;
          if (particle.y < -0.05) particle.y = 1.05;
        }
        const size = particle.z * 2.2;
        const alpha = 0.16 + particle.z * 0.44;
        context.beginPath();
        context.fillStyle = `hsl(${particle.hue} 92% 68% / ${alpha})`;
        context.arc(particle.x * width, particle.y * height, size, 0, Math.PI * 2);
        context.fill();
      }

      if (!reduced) frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);

    // 非表示のタブでは描画を止めます
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
      } else if (!reduced) {
        last = 0;
        frame = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* 光の粒子 */}
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />

      {/* スタジアムのリング（CSS 3D） */}
      <div
        className="absolute top-1/2 left-1/2 hidden size-[42rem] -translate-x-1/2 -translate-y-1/2 md:block"
        style={{ perspective: "60rem" }}
      >
        <div
          className={`absolute inset-0 ${reduced ? "" : "sp-anim-orbit"}`}
          style={{ transform: "rotateX(72deg)", transformStyle: "preserve-3d" }}
        >
          {[0, 1, 2].map((ring) => (
            <div
              key={ring}
              className="absolute inset-0 rounded-full border"
              style={{
                borderColor: [
                  "rgba(34,211,238,0.28)",
                  "rgba(99,102,241,0.22)",
                  "rgba(217,70,239,0.16)",
                ][ring],
                transform: `scale(${1 - ring * 0.16}) translateZ(${ring * 2.2}rem)`,
              }}
            />
          ))}
          {/* 観客席の光 */}
          {Array.from({ length: 24 }, (_, index) => (
            <div
              key={index}
              className="absolute top-1/2 left-1/2 size-1.5 rounded-full"
              style={{
                background: index % 3 === 0 ? "rgba(34,211,238,0.8)" : "rgba(148,163,184,0.45)",
                transform: `rotate(${index * 15}deg) translateX(20rem)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* 立体的なボール（複数競技） */}
      <div className="absolute inset-0 hidden lg:block">
        {/*
          配置は「本文の外側」に限定します。
          見出し・CTA・スコアの上に重ねると、装飾が読字の邪魔になります。
        */}
        {[
          { glyph: "⚽", top: "5%", left: "45%", size: "3rem", delay: "0s" },
          { glyph: "🏀", top: "88%", left: "31%", size: "2.5rem", delay: "-6s" },
          { glyph: "⚾", top: "8%", left: "90%", size: "2.25rem", delay: "-12s" },
          { glyph: "🏈", top: "85%", left: "82%", size: "2.75rem", delay: "-3s" },
        ].map((ball) => (
          <span
            key={ball.glyph}
            className="absolute grid place-items-center rounded-full"
            style={{
              top: ball.top,
              left: ball.left,
              fontSize: ball.size,
              filter: "drop-shadow(0 0 1.5rem rgba(34,211,238,0.35))",
              opacity: 0.85,
              animation: reduced
                ? undefined
                : `sp-drift 14s ${ball.delay} ease-in-out infinite alternate`,
            }}
          >
            {ball.glyph}
          </span>
        ))}
      </div>
    </div>
  );
}
