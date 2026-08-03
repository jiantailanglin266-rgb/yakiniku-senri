"use client";

import { motion, useReducedMotion } from "framer-motion";
import { store } from "@/data/store";

const LINE_1 = "炎とともに、";
const LINE_2 = "受け継がれる味。";

/**
 * ファーストビューのコピー。
 * 見出しは一文字ずつ表示しますが、スクリーンリーダーには1つの文として読ませます。
 */
export function HeroCopy() {
  const reduced = useReducedMotion();

  const renderLine = (line: string, offset: number) => (
    <span className="block">
      {line.split("").map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          className="inline-block"
          initial={reduced ? false : { opacity: 0, y: 22, filter: "blur(6px)" }}
          animate={reduced ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.95,
            delay: 0.35 + (offset + index) * 0.055,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );

  return (
    <div className="relative z-10">
      <motion.p
        className="font-display text-gold text-[0.62rem] tracking-[0.5em] uppercase sm:text-xs"
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        {store.founded}年創業
      </motion.p>

      <h1
        aria-label={`${LINE_1}${LINE_2}`}
        className="font-serif-jp mt-7 text-[2.05rem] leading-[1.55] tracking-[0.09em] text-white sm:text-[3rem] lg:text-[3.9rem]"
      >
        <span aria-hidden="true">
          {renderLine(LINE_1, 0)}
          {renderLine(LINE_2, LINE_1.length)}
        </span>
      </h1>

      <motion.p
        className="text-ivory/85 mt-8 text-[0.85rem] leading-[2.1] tracking-[0.16em] sm:text-base"
        initial={reduced ? false : { opacity: 0 }}
        animate={reduced ? undefined : { opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
      >
        世田谷の老舗焼肉店
        <br className="sm:hidden" />
        <span className="ml-0 sm:ml-3">{store.name}</span>
      </motion.p>
    </div>
  );
}
