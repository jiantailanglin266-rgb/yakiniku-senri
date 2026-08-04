"use client";

import { useSyncExternalStore } from "react";

/**
 * 閲覧者の端末タイムゾーン。
 *
 * サーバー側では undefined を返し、クライアントで解決したタイムゾーンに切り替わります。
 * useEffect + setState ではなく useSyncExternalStore を使うのは、
 * 「サーバーとクライアントでスナップショットが違う値」を React に正しく伝えるためです
 * （effect 内での setState は余分な再描画を招きます）。
 */
const noopSubscribe = () => () => {};

export function useTimeZone(): string | undefined {
  return useSyncExternalStore(
    noopSubscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => undefined,
  );
}
