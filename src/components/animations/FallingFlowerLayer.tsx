"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { GoldenSparkle } from "./GoldenSparkle";
import { MugunghwaFlower } from "./MugunghwaFlower";
import { MugunghwaPetal } from "./MugunghwaPetal";
import { buildKeyframes, type FallingFlowerConfig, type FlowerLayer } from "./fallingFlowerConfig";
import { cn } from "@/lib/utils";

/**
 * 木槿の降下レイヤー1枚ぶん。
 *
 * ■ 落下距離の取り方
 *   花は「全高（h-full）のラッパー」を translateY で動かしています。
 *   transform の % は自分自身の高さ基準なので、y:118% はレイヤー高さの118%＝
 *   セクションの高さを基準に落ちます。vh を使わないため、背の高いヒーローでも
 *   背の低いCTAでも同じ見え方になります。
 *
 * ■ アニメーションする値
 *   transform（x / y / rotate）と opacity のみです。
 *   top / left は初期配置に一度使うだけで、連続的には変更しません。
 */

const LAYER_Z: Record<FlowerLayer, string> = {
  back: "z-0",
  middle: "z-[1]",
  front: "z-[2]",
};

function FlowerShape({ config }: { config: FallingFlowerConfig }) {
  if (config.type === "sparkle") {
    return <GoldenSparkle size={config.size} variant={config.variant} />;
  }
  if (config.type === "petal") {
    return <MugunghwaPetal size={config.size} variant={config.variant} count={config.petalCount} />;
  }
  return <MugunghwaFlower size={config.size} variant={config.variant} pose={config.pose} />;
}

function FallingItem({ config }: { config: FallingFlowerConfig }) {
  const keyframes = useMemo(() => buildKeyframes(config), [config]);

  const transition = {
    duration: config.duration,
    delay: config.delay,
    repeat: Infinity,
    ease: "easeInOut" as const,
    times: keyframes.times,
  };

  // will-change は数の少ない中間・手前レイヤーだけに付けます。
  // 奥のレイヤーは要素数が多く、全部を合成レイヤーへ昇格させると逆に重くなります。
  const promote = config.layer !== "back";

  return (
    <motion.div
      className="absolute top-0 h-full"
      style={{
        left: `${config.startX}%`,
        willChange: promote ? "transform, opacity" : undefined,
      }}
      initial={{ opacity: 0 }}
      animate={{
        x: keyframes.x,
        y: keyframes.y,
        opacity: keyframes.opacity,
      }}
      transition={transition}
    >
      <motion.div
        style={{ filter: config.blur > 0 ? `blur(${config.blur}px)` : undefined }}
        animate={{ rotate: keyframes.rotate }}
        transition={transition}
      >
        <FlowerShape config={config} />
      </motion.div>
    </motion.div>
  );
}

export type FallingFlowerLayerProps = {
  configs: FallingFlowerConfig[];
  layer: FlowerLayer;
  className?: string;
};

export function FallingFlowerLayer({ configs, layer, className }: FallingFlowerLayerProps) {
  const items = configs.filter((config) => config.layer === layer);
  if (items.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-0 overflow-hidden", LAYER_Z[layer], className)}
    >
      {items.map((config) => (
        <FallingItem key={config.id} config={config} />
      ))}
    </div>
  );
}
