"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { entranceMovie, hasEntranceMovie } from "@/data/media";
import { store } from "@/data/store";

const SESSION_KEY = "senri:loaded";

/** 文字だけのオープニングを出しておく時間 */
const TEXT_DURATION_MS = 2000;
/** 動画が始まらないときに待つ上限。ここを過ぎたら文字のオープニングへ切り替えます */
const VIDEO_START_TIMEOUT_MS = 1500;
/**
 * 何があってもサイトへ通す上限。
 * 「再生開始の待ち時間 + 尺 + 途中で少し詰まったぶん」を見込んだ長さです。
 */
const HARD_TIMEOUT_MS = VIDEO_START_TIMEOUT_MS + (entranceMovie.durationSeconds + 2.5) * 1000;

/** sessionStorage はクライアント専用のため useSyncExternalStore で読み取ります */
const noopSubscribe = () => () => {};

function readSeen(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    // sessionStorage が使えない環境ではローディングを出しません
    return true;
  }
}

/**
 * サイトの入り口（オープニング）。
 *
 * ■ 動画で始まります
 *   /videos/entrance.mp4 を1回だけ再生し、終わったらサイトへ入ります。
 *   黒背景のロゴアニメーションなので、切り抜かずそのままの縦横比で中央に置きます。
 *   画面いっぱいに引き伸ばすとロゴが切れ、拡大でぼやけるためです。
 *   周囲の黒は背景と同じ色なので、余白があるようには見えません。
 *
 * ■ 入り口で足止めしません
 *   自動再生の拒否・回線が遅い・コーデック非対応など、動画が始まらない事情は
 *   いくらでもあります。1.5秒で見切りをつけて従来の文字のオープニングへ切り替え、
 *   さらに全体の上限を過ぎたら無条件でサイトへ通します。
 *
 * ■ そのほか
 *   - セッション中に一度だけ表示（sessionStorage）
 *   - prefers-reduced-motion では表示しない
 *   - 表示中は背面のスクロールを止める
 *   - いつでもスキップできる
 */
export function LoadingScreen() {
  const reduced = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  // 動画が使えないと分かった時点で、文字だけのオープニングへ切り替えます
  const [useVideo, setUseVideo] = useState(hasEntranceMovie);
  const videoRef = useRef<HTMLVideoElement>(null);

  // サーバー側は「表示済み」として扱い、初期HTMLにオープニングを含めません
  const seen = useSyncExternalStore(noopSubscribe, readSeen, () => true);
  const visible = !reduced && !seen && !dismissed;

  const dismiss = useCallback(() => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* noop */
    }
    document.body.style.overflow = "";
    setDismissed(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";

    const timers: number[] = [];

    if (useVideo) {
      // 再生が始まらなければ文字のオープニングへ切り替えます
      timers.push(
        window.setTimeout(() => {
          const video = videoRef.current;
          if (!video || video.paused || video.currentTime === 0) setUseVideo(false);
        }, VIDEO_START_TIMEOUT_MS),
      );
      // 再生が終わらない場合の最終的な打ち切り
      timers.push(window.setTimeout(dismiss, HARD_TIMEOUT_MS));
    } else {
      timers.push(window.setTimeout(dismiss, TEXT_DURATION_MS));
    }

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [visible, useVideo, dismiss]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="loading"
          role="status"
          aria-live="polite"
          aria-label="読み込み中"
          className="fixed inset-0 z-[100] grid place-items-center bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {useVideo ? (
            <video
              ref={videoRef}
              src={entranceMovie.mp4}
              autoPlay
              muted
              playsInline
              preload="auto"
              aria-label={`${store.name} オープニング`}
              onEnded={dismiss}
              onError={() => setUseVideo(false)}
              /*
                切り抜かず、拡大しすぎず。
                スマートフォンでは画面幅いっぱいに、大きな画面でも 1100px で頭打ちにします
                （元が 864px 幅のため、それ以上へ引き伸ばすとぼやけます）。
              */
              className="h-auto w-full max-w-[1100px] object-contain"
            />
          ) : (
            <>
              {/* 下部から立ち上がる炭火の光 */}
              <motion.span
                aria-hidden="true"
                className="ember-glow absolute inset-x-0 bottom-0 h-2/3"
                initial={{ opacity: 0, scaleY: 0.6 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "bottom" }}
              />
              {/* 上方向へ流れる薄い煙 */}
              <motion.span
                aria-hidden="true"
                className="absolute bottom-0 left-1/2 size-[520px] -translate-x-1/2 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(199,162,83,0.14) 0%, rgba(167,167,167,0.07) 45%, rgba(8,8,8,0) 72%)",
                }}
                initial={{ opacity: 0, y: 80 }}
                animate={{ opacity: 1, y: -40 }}
                transition={{ duration: 2, ease: "easeOut" }}
              />

              <motion.div
                className="relative text-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="font-display text-gold/70 text-[0.6rem] tracking-[0.5em] uppercase">
                  Since {store.founded}
                </p>
                <p className="text-gold-gradient font-serif-jp mt-4 text-3xl tracking-[0.3em] sm:text-4xl">
                  {store.name}
                </p>
                <p className="font-display text-gold/55 mt-3 text-[0.62rem] tracking-[0.45em] uppercase">
                  {store.nameEn}
                </p>
              </motion.div>
            </>
          )}

          <button
            type="button"
            onClick={dismiss}
            className="font-display text-gray hover:text-gold absolute right-5 bottom-7 min-h-11 px-4 text-[0.68rem] tracking-[0.3em] uppercase transition-colors duration-500 sm:right-8"
          >
            Skip
            <span className="sr-only">オープニングをとばしてサイトを表示する</span>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
