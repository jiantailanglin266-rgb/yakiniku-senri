"use client";

/**
 * 光の粒子とデータストリーム（Canvas）。
 *
 * ■ WebGL を使わない理由
 *   この表現に必要なのは点と線だけです。Three.js を積むと初期バンドルが数百KB増え、
 *   Lighthouse の目標（Performance 90+）と両立しません。2D Canvas なら数KBで済みます。
 *
 * ■ 端末への配慮
 *   - `prefers-reduced-motion` では描画自体を行いません
 *   - 画面幅と `devicePixelRatio` から粒子数を決め、スマートフォンでは自動的に減らします
 *   - 画面外・非表示タブでは停止します
 */
import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; vx: number; vy: number; r: number; hue: number };

export function ParticleField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame = 0;
    let running = true;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 面積に比例させつつ上限を設けます（広い画面でも重くならないように）
      const count = Math.min(90, Math.round((width * height) / 16000));
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 0.6 + Math.random() * 1.6,
        // 決済ネットワークの色（シアン〜バイオレット〜マゼンタ）に寄せます
        hue: 185 + ((index * 37) % 130),
      }));
    };

    const draw = () => {
      if (!running) return;
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        context.beginPath();
        context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        context.fillStyle = `hsla(${particle.hue}, 90%, 68%, 0.55)`;
        context.fill();
      }

      // 近い粒子どうしを結んでネットワークに見せます
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.hypot(dx, dy);
          if (distance > 116) continue;
          context.beginPath();
          context.moveTo(particles[i].x, particles[i].y);
          context.lineTo(particles[j].x, particles[j].y);
          context.strokeStyle = `hsla(200, 90%, 70%, ${0.16 * (1 - distance / 116)})`;
          context.lineWidth = 0.6;
          context.stroke();
        }
      }

      frame = window.requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible && !frame) {
        running = true;
        frame = window.requestAnimationFrame(draw);
      }
      if (!visible && frame) {
        running = false;
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    });

    resize();
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    frame = window.requestAnimationFrame(draw);

    return () => {
      running = false;
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
