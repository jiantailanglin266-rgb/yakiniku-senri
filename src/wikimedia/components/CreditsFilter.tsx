"use client";

/**
 * 画像クレジット一覧の絞り込み。
 *
 * ■ 設計の意図
 *   クレジットの本文はサーバー側で描画し、この部品は「並べ替えと絞り込み」だけを担います。
 *   フィルタ用の情報は各 <li> の data-* 属性から読むため、
 *   JavaScript が動かない環境でもクレジットはすべて表示されます
 *   （絞り込みが効かないだけで、作者・出典・ライセンスは常に読めます）。
 *
 * ■ 検索対象
 *   画像名・作者名・掲載ページ・ライセンス。
 *   固有名詞は原文のまま保持しているので、大文字小文字だけを無視して照合します。
 */
import { Children, isValidElement, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";

type ItemProps = {
  "data-license"?: string;
  "data-author"?: string;
  "data-title"?: string;
  "data-pages"?: string;
};

export function CreditsFilter({ locale, children }: { locale: string; children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [license, setLicense] = useState("all");

  const items = useMemo(
    () =>
      Children.toArray(children).filter((child): child is ReactElement<ItemProps> =>
        isValidElement(child),
      ),
    [children],
  );

  const licenses = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      const code = item.props["data-license"];
      if (code) set.add(code);
    }
    return Array.from(set).sort();
  }, [items]);

  const needle = query.trim().toLowerCase();
  const visible = items.filter((item) => {
    if (license !== "all" && item.props["data-license"] !== license) return false;
    if (!needle) return true;
    const haystack = [
      item.props["data-title"],
      item.props["data-author"],
      item.props["data-pages"],
      item.props["data-license"],
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });

  const ja = locale === "ja";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label htmlFor="credits-q" className="sr-only">
          {ja ? "画像名・作者・掲載ページで絞り込む" : "Filter by title, author or page"}
        </label>
        <input
          id="credits-q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={ja ? "画像名・作者・掲載ページ" : "Title, author or page"}
          autoComplete="off"
          className="sp-solid text-ink placeholder:text-ink-faint min-w-0 flex-1 px-3 py-2 text-sm focus:outline-none"
        />
        {licenses.length > 1 ? (
          <>
            <label htmlFor="credits-license" className="sr-only">
              {ja ? "ライセンスで絞り込む" : "Filter by licence"}
            </label>
            <select
              id="credits-license"
              value={license}
              onChange={(event) => setLicense(event.target.value)}
              className="sp-solid text-ink-soft px-3 py-2 text-xs focus:outline-none"
            >
              <option value="all">{ja ? "すべてのライセンス" : "All licences"}</option>
              {licenses.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </>
        ) : null}
        <span className="sp-mono text-ink-faint shrink-0 text-[0.6875rem]">
          {visible.length} / {items.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="sp-solid text-ink-dim p-6 text-sm" role="status">
          {ja ? "条件に合う画像はありません。" : "No images match this filter."}
        </p>
      ) : null}

      <ul className="space-y-3">{visible}</ul>
    </div>
  );
}
