"use client";

import { useEffect, useRef } from "react";

/**
 * ニューラルネットワーク風のパーティクル背景（Canvas 2D）。
 *
 * ■ なぜ WebGL / Three.js ではないのか
 *   この表現に必要なのは「点」「線」「発光」だけです。Canvas 2D で十分に描けます。
 *   3Dライブラリを入れると初回ロードに数百KB増え、
 *   このサイトが最重視している表示速度（Core Web Vitals）を確実に悪化させます。
 *   立体感はCSSのぼかしとグラデーションの重ねで作っています。
 *
 * ■ 負荷を上げない工夫
 *   - 画面に入っていないときはアニメーションを止めます（IntersectionObserver）
 *   - タブが非表示のときも止めます
 *   - 端末の画素密度は最大2倍までに制限します
 *   - 粒子数は画面幅から決めます（スマートフォンでは少なく）
 *   - prefers-reduced-motion では1フレームだけ描いて止めます
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
};

const LINK_DISTANCE = 132;
const POINTER_RADIUS = 190;

export function NeuralField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame = 0;
    let visible = true;
    const pointer = { x: -9999, y: -9999, active: false };

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      const ratio = dpr();
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      // 面積あたりの密度で決めます。上限を置いて、大画面でも重くしません。
      const count = Math.min(Math.round((width * height) / 13000), 110);

      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        radius: Math.random() * 1.5 + 0.6,
        // シアン〜パープルの範囲だけを使い、色が散らからないようにします
        hue: 178 + Math.random() * 108,
      }));
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 画面外に出たら反対側から戻します
        if (particle.x < -20) particle.x = width + 20;
        if (particle.x > width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = height + 20;
        if (particle.y > height + 20) particle.y = -20;
      }

      // 近い点どうしを結びます（総当たりですが、粒子数の上限が低いので十分に軽い）
      for (let i = 0; i < particles.length; i += 1) {
        const a = particles[i];

        for (let j = i + 1; j < particles.length; j += 1) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);
          if (distance > LINK_DISTANCE) continue;

          const strength = 1 - distance / LINK_DISTANCE;
          context.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 92%, 68%, ${strength * 0.2})`;
          context.lineWidth = 0.6;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }

        // カーソルの周りだけ、線と光を強めます
        if (pointer.active) {
          const distance = Math.hypot(a.x - pointer.x, a.y - pointer.y);
          if (distance < POINTER_RADIUS) {
            const strength = 1 - distance / POINTER_RADIUS;
            context.strokeStyle = `hsla(${a.hue}, 100%, 74%, ${strength * 0.42})`;
            context.lineWidth = 0.8;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(pointer.x, pointer.y);
            context.stroke();
          }
        }

        context.fillStyle = `hsla(${a.hue}, 100%, 76%, 0.85)`;
        context.beginPath();
        context.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        context.fill();
      }
    };

    const loop = () => {
      if (!visible) return;
      draw();
      frame = window.requestAnimationFrame(loop);
    };

    const start = () => {
      if (frame) return;
      visible = true;
      frame = window.requestAnimationFrame(loop);
    };

    const stop = () => {
      visible = false;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };

    const onResize = () => {
      build();
      if (reduceMotion) draw();
    };

    build();

    if (reduceMotion) {
      // 動かさず、静止画として1枚だけ描きます
      draw();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    observer.observe(canvas);

    const onVisibilityChange = () => (document.hidden ? stop() : start());

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
