"use client";

/**
 * 比較リスト。
 *
 * サーバーに保存せず、ブラウザの localStorage だけで保持します。
 * 比較しているカードは「その人が何を検討しているか」という情報なので、
 * 必要のないサーバー送信はしません。
 *
 * localStorage は React の外にある状態なので `useSyncExternalStore` で購読します。
 * （effect の中で setState して同期すると、余分な再描画が挟まります）
 */
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "cardport.compare";
const EVENT = "cardport:compare-changed";
export const MAX_COMPARE = 4;

/** サーバー描画時のスナップショット。参照を固定しないと無限ループになります */
const EMPTY: string[] = [];

/** getSnapshot は同じ内容なら同じ参照を返す必要があるため、ここで保持します */
let cache: string[] = EMPTY;
let cacheRaw: string | null = null;

function parse(raw: string | null): string[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): string[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = parse(raw);
  }
  return cache;
}

function getServerSnapshot(): string[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // プライベートモードなどで書き込めない場合は、その回だけ保持しません
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useCompare() {
  // サーバー描画時は空配列、ハイドレーション後に実際の値へ切り替わります
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((id: string) => {
    const current = getSnapshot();
    const next = current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id].slice(-MAX_COMPARE);
    write(next);
  }, []);

  const remove = useCallback((id: string) => {
    write(getSnapshot().filter((value) => value !== id));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { ids, toggle, remove, clear, isFull: ids.length >= MAX_COMPARE };
}
