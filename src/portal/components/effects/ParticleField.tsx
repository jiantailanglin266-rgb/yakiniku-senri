"use client";

import { useEffect, useRef } from "react";

/**
 * 背景の粒子とブロックチェーン風のネットワーク線。
 *
 * ■ なぜ Three.js ではないのか
 *   ここで必要なのは「奥行きのある点と線」だけです。
 *   2D canvas なら追加のバンドルがゼロで、低スペック端末でも
 *   フレームを落とさずに描けます。R3F を入れると初期JSが数百KB増え、
 *   トップページのLCPに直接効いてしまいます。
 *
 * ■ 負荷を上げない工夫
 *   - 端末幅で粒子数を決める（スマートフォンでは大幅に減らす）
 *   - 画面外では requestAnimationFrame を止める
 *   - prefers-reduced-motion では1フレームだけ描いて停止する
 *   - devicePixelRatio は 2 で頭打ちにする
 */
export function ParticleField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = true;

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; hue: number };
    let particles: Particle[] = [];

    function resize() {
      if (!canvas) return;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);

      // 面積あたりの密度を一定にしつつ、上限をかけます
      const count = Math.min(72, Math.round((width * height) / 16000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.4 + 0.6,
        hue: Math.random() < 0.5 ? 188 : 268,
      }));
    }

    function draw() {
      if (!context) return;
      context.clearRect(0, 0, width, height);

      // 近い粒子どうしを線でつなぎ、ネットワークらしさを出します
      const linkDistance = Math.min(140, width / 8);
      for (let i = 0; i < particles.length; i += 1) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j += 1) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);
          if (distance > linkDistance) continue;
          const alpha = (1 - distance / linkDistance) * 0.22;
          context.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 90%, 68%, ${alpha})`;
          context.lineWidth = 0.6;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }

      for (const particle of particles) {
        context.fillStyle = `hsla(${particle.hue}, 95%, 72%, 0.75)`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        context.fill();
      }
    }

    function step() {
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;
      }
      draw();
      if (running) frame = requestAnimationFrame(step);
    }

    resize();

    if (reduced) {
      // 動かさず、静止画として1枚だけ描きます
      draw();
    } else {
      frame = requestAnimationFrame(step);
    }

    const onResize = () => {
      resize();
      if (reduced) draw();
    };
    window.addEventListener("resize", onResize);

    // 画面外ではアニメーションを止めます
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (reduced) return;
        if (entry.isIntersecting && !running) {
          running = true;
          frame = requestAnimationFrame(step);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(frame);
        }
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
