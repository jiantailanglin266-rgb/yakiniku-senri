"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { SOURCE_LANGUAGE, findLanguage, includedLanguages } from "@/data/languages";
import {
  applyLanguage,
  getServerLanguage,
  readCurrentLanguage,
  subscribeLanguage,
} from "@/lib/translate";

/**
 * 自動翻訳エンジン（Google 翻訳ウィジェット）の読み込み。
 *
 * ■ 日本語のままの訪問者には一切読み込みません
 *   来訪者の大半は日本語話者です。外部スクリプトを常時読み込むと
 *   その全員の表示速度を落とすため、翻訳が選ばれているときだけ読み込みます。
 *
 * ■ 失敗しても本文は読める
 *   スクリプトが読み込めなかった場合は、日本語のまま表示し、
 *   小さな通知を出して原文へ戻す導線だけ残します。
 */

const SCRIPT_ID = "google-translate-script";
const CALLBACK = "__senriTranslateInit";
const TIMEOUT_MS = 8000;

type TranslateGlobal = {
  google?: { translate?: { TranslateElement?: unknown } };
} & Record<string, unknown>;

export function GoogleTranslate() {
  const [failed, setFailed] = useState(false);
  const target = useSyncExternalStore(subscribeLanguage, readCurrentLanguage, getServerLanguage);

  useEffect(() => {
    const current = readCurrentLanguage();

    // 原文（日本語）のままなら、スクリプトを読み込みません
    if (current === SOURCE_LANGUAGE) return;

    // 右横書きの言語のときは文字方向を切り替えます
    const language = findLanguage(current);
    if (language?.rtl) document.documentElement.dir = "rtl";

    if (document.getElementById(SCRIPT_ID)) return;

    const globalScope = window as unknown as TranslateGlobal;

    globalScope[CALLBACK] = () => {
      const translate = globalScope.google?.translate as
        { TranslateElement?: new (options: object, id: string) => void } | undefined;
      if (!translate?.TranslateElement) return;
      new translate.TranslateElement(
        {
          pageLanguage: SOURCE_LANGUAGE,
          includedLanguages,
          autoDisplay: false,
        },
        "google_translate_element",
      );
    };

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://translate.google.com/translate_a/element.js?cb=${CALLBACK}`;
    script.async = true;
    script.onerror = () => setFailed(true);
    document.body.appendChild(script);

    // 読み込めたかを一定時間後に確認します（onerror が発火しない環境への保険）
    const timer = window.setTimeout(() => {
      if (!globalScope.google?.translate) setFailed(true);
    }, TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {/* ウィジェット本体の描画先。画面には出しません */}
      <div id="google_translate_element" aria-hidden="true" className="sr-only" />

      {failed && target !== SOURCE_LANGUAGE ? (
        <div
          role="status"
          className="border-gold/30 bg-black-soft/95 fixed inset-x-3 bottom-24 z-[95] rounded border px-4 py-3 text-[0.78rem] leading-[1.9] backdrop-blur-sm sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm md:bottom-6"
        >
          <p className="text-ivory">
            翻訳サービスに接続できませんでした。日本語のまま表示しています。
          </p>
          <button
            type="button"
            onClick={() => applyLanguage(SOURCE_LANGUAGE)}
            className="text-gold hover:text-gold-light mt-2 underline underline-offset-4 transition-colors"
          >
            日本語表示に戻す
          </button>
        </div>
      ) : null}
    </>
  );
}
