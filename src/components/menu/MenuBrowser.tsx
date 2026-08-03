"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { MenuCategorySection, MenuItemRow } from "./MenuCategory";
import { getPopulatedCategories } from "@/data/menu";
import { store } from "@/data/store";

const categories = getPopulatedCategories();

/**
 * お品書きの閲覧UI。
 * - カテゴリータブはアンカーリンク（JSが無くても機能します）
 * - 検索時は全カテゴリー横断の結果を表示します
 */
export function MenuBrowser() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalized) return [];
    return categories
      .flatMap((category) => category.items.map((item) => ({ item, category })))
      .filter(
        ({ item, category }, index, all) =>
          // おすすめカテゴリーで重複した品目は除外
          all.findIndex((entry) => entry.item.id === item.id) === index &&
          [item.name, item.nameEn ?? "", item.description ?? "", category.name]
            .join(" ")
            .toLowerCase()
            .includes(normalized),
      );
  }, [normalized]);

  return (
    <div>
      <div className="no-print border-gold/15 sticky top-18 z-40 -mx-5 border-y bg-black/92 px-5 py-4 backdrop-blur-md sm:top-20 sm:-mx-8 sm:px-8">
        <div className="mx-auto flex max-w-[100rem] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="カテゴリー" className="min-w-0">
            <ul className="hide-scrollbar flex gap-1 overflow-x-auto">
              {categories.map((category) => (
                <li key={category.id}>
                  <a
                    href={`#${category.id}`}
                    className="text-ivory/80 hover:border-gold/45 hover:text-gold block min-h-11 border border-transparent px-4 py-2.5 text-[0.75rem] whitespace-nowrap transition-colors duration-500"
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="relative shrink-0 lg:w-72">
            <label htmlFor="menu-search" className="sr-only">
              お品書きを検索
            </label>
            <Search
              aria-hidden="true"
              className="text-gold/60 pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            />
            <input
              id="menu-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="品名で検索"
              className="border-ivory/15 text-ivory placeholder:text-gray-dark focus:border-gold/60 min-h-11 w-full border bg-black/40 py-2.5 pr-10 pl-10 text-[0.82rem] focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-gray hover:text-gold absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center transition-colors duration-500"
              >
                <X aria-hidden="true" className="size-4" />
                <span className="sr-only">検索条件をクリア</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <p className="text-gray-dark mt-8 text-[0.72rem]">
        表示価格はすべて{store.priceTaxIncluded ? "税込" : "税別"}です。
        仕入れ状況により、内容・価格が変更となる場合があります。
      </p>

      {normalized ? (
        <div className="mt-8" aria-live="polite">
          <p className="text-gray text-[0.78rem]">
            「{query}」の検索結果：{results.length}件
          </p>
          {results.length > 0 ? (
            <ul className="mt-2">
              {results.map(({ item }) => (
                <MenuItemRow key={item.id} item={item} />
              ))}
            </ul>
          ) : (
            <p className="text-gray mt-6 text-sm">
              該当する品目が見つかりませんでした。別のキーワードでお試しください。
            </p>
          )}
        </div>
      ) : (
        <div className="mt-12 space-y-20">
          {categories.map((category) => (
            <MenuCategorySection key={category.id} category={category} items={category.items} />
          ))}
        </div>
      )}
    </div>
  );
}
