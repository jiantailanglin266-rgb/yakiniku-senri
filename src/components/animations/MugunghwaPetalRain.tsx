"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { FallingFlowerLayer } from "./FallingFlowerLayer";
import { MugunghwaFlower } from "./MugunghwaFlower";
import {
  buildFallingFlowers,
  buildStaticFlowers,
  type DeviceTier,
  type FlowerDensity,
  type RainVariant,
} from "./fallingFlowerConfig";
import { cn } from "@/lib/utils";

/**
 * 木槿（ムクゲ）が舞い落ちる背景装飾。
 *
 * ■ 使い方
 *   <section className="relative">
 *     <MugunghwaPetalRain density="medium" variant="hero" />
 *     <div className="relative z-10">{ 本文 }</div>
 *   </section>
 *
 *   本文は必ず z-10 以上に置いてください。装飾は z-0 に入るため、
 *   本文・ボタン・ナビゲーションの背面に必ず回ります。
 *
 * ■ Hydration について
 *   画面幅で表示数を変えますが、幅の判定はマウント後に一度だけ行います。
 *   サーバーと初回クライアントレンダーはどちらも null を返すため、差分が出ません。
 *   花の配置自体は固定シードの疑似乱数なので、判定後の結果も常に同じです。
 *
 * ■ アクセシビリティ
 *   レイヤー全体が aria-hidden / pointer-events-none / user-select-none です。
 *   prefers-reduced-motion が有効なときは落下・回転・点滅をすべて止め、
 *   静止した木槿を数輪だけ残します。
 */

export type MugunghwaPetalRainProps = {
  density?: FlowerDensity;
  variant?: RainVariant;
  showFlowers?: boolean;
  showPetals?: boolean;
  showSparkles?: boolean;
  className?: string;
};

/** マウント後に一度だけ画面幅を判定します（リサイズ時のみ再判定）。 */
function useDeviceTier(): DeviceTier | null {
  const [tier, setTier] = useState<DeviceTier | null>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const tablet = window.matchMedia("(min-width: 640px)");

    const update = () => {
      setTier(desktop.matches ? "desktop" : tablet.matches ? "tablet" : "mobile");
    };

    update();
    desktop.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);

  return tier;
}

export function MugunghwaPetalRain({
  density = "medium",
  variant = "section",
  showFlowers = true,
  showPetals = true,
  showSparkles = true,
  className,
}: MugunghwaPetalRainProps) {
  const tier = useDeviceTier();
  const reduced = useReducedMotion();

  const configs = useMemo(() => {
    if (!tier) return [];
    return buildFallingFlowers({
      tier,
      density,
      rainVariant: variant,
      showFlowers,
      showPetals,
      showSparkles,
    });
  }, [tier, density, variant, showFlowers, showPetals, showSparkles]);

  const staticFlowers = useMemo(() => (tier ? buildStaticFlowers(tier) : []), [tier]);

  if (!tier) return null;

  // モバイルのCTA周辺は、操作の邪魔と負荷を避けるため表示しません。
  if (tier === "mobile" && variant === "cta") return null;

  // 既定は z-0（本文の z-10 より背面）。呼び出し側が z-* を渡した場合は、
  // 同じ優先度のクラスが2つ並んでCSSの出力順に結果が左右されるのを避けるため、既定を外します。
  const hasZIndex = className ? /(^|\s)-?z-/.test(className) : false;

  const wrapperClass = cn(
    "pointer-events-none absolute inset-0 overflow-hidden select-none",
    hasZIndex ? undefined : "z-0",
    className,
  );

  if (reduced) {
    return (
      <div aria-hidden="true" className={wrapperClass}>
        {staticFlowers.map((config, index) => (
          <div
            key={config.id}
            className="absolute"
            style={{
              left: `${config.startX}%`,
              top: `${12 + index * 21}%`,
            }}
          >
            <MugunghwaFlower
              size={config.size}
              opacity={config.opacity}
              variant={config.variant}
              pose={config.pose}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={wrapperClass}>
      <FallingFlowerLayer configs={configs} layer="back" />
      <FallingFlowerLayer configs={configs} layer="middle" />
      <FallingFlowerLayer configs={configs} layer="front" />
    </div>
  );
}
