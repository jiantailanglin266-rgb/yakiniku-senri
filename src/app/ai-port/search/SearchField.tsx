"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { aiPortPath } from "@/data/ai-port/site";
import { searchDocs, searchKindLabel } from "@/lib/ai-port/search";
import { GlassCard, Pill } from "@/components/ai-port/ui/Primitives";

/**
 * サイト内検索の入力欄と結果。
 *
 * ■ なぜクライアント側で検索するのか
 *   1. 検索インデックスはビルド時の静的データから作られるので、サーバーへ問い合わせる必要がない
 *   2. ページ自体を静的配信できる（サーバーが `searchParams` を読むと動的描画になります）
 *   3. 入力から結果までが即座（体感がはっきり速い）
 *
 *   `?q=` はURLに残るので、検索結果のリンクを共有できます。
 *   ⚠ ただしページは noindex です。キーワードごとにURLが無限に生えるため、
 *     インデックスさせると中身の薄いページが大量に登録されます。
 */
const SUGGESTIONS = ["画像生成", "AIエージェント", "RAG", "副業", "無料"];

export function SearchField() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const submitted = (searchParams.get("q") ?? "").trim();
  const [query, setQuery] = useState(submitted);

  const hits = submitted ? searchDocs(submitted, 40) : [];

  const submit = (value: string) => {
    const trimmed = value.trim();
    router.push(
      trimmed ? `${aiPortPath("/search")}?q=${encodeURIComponent(trimmed)}` : aiPortPath("/search"),
    );
  };

  return (
    <>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit(query);
        }}
        className="ai-glass ai-glass-rim flex max-w-xl items-center gap-3 rounded-full py-2 pr-2 pl-5"
      >
        <Search aria-hidden="true" className="text-ai-haze size-4 shrink-0" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="キーワードを入力"
          aria-label="検索キーワード"
          className="text-ai-white placeholder:text-ai-dim min-w-0 flex-1 bg-transparent py-2.5 text-[0.9rem] outline-none"
        />
        <button
          type="submit"
          className="from-ai-cyan to-ai-blue shrink-0 rounded-full bg-gradient-to-r px-5 py-2.5 text-[0.8rem] font-medium text-[#04060f] transition-transform duration-300 hover:scale-[1.03]"
        >
          検索
        </button>
      </form>

      <div className="mt-12" aria-live="polite" aria-atomic="false">
        {submitted === "" ? (
          <GlassCard className="px-6 py-12 text-center">
            <p className="text-ai-mist text-[0.9rem]">キーワードを入力してください。</p>
            <ul className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((keyword) => (
                <li key={keyword}>
                  <button type="button" onClick={() => submit(keyword)}>
                    <Pill>{keyword}</Pill>
                  </button>
                </li>
              ))}
            </ul>
          </GlassCard>
        ) : hits.length === 0 ? (
          <GlassCard className="px-6 py-12 text-center">
            <p className="text-ai-mist text-[0.9rem]">
              「{submitted}」に一致する情報は見つかりませんでした。
            </p>
            <p className="text-ai-dim mt-3 text-[0.8rem] leading-[1.9]">
              別のキーワードでお試しいただくか、
              <Link
                href={aiPortPath("/chat")}
                className="text-ai-cyan mx-1 underline underline-offset-4"
              >
                AIチャット
              </Link>
              でご質問ください。
            </p>
          </GlassCard>
        ) : (
          <>
            <p className="text-ai-haze text-[0.84rem]">
              「{submitted}」の検索結果：
              <span className="text-ai-white ml-1" translate="no">
                {hits.length}
              </span>
              件
            </p>

            <ul className="mt-6 grid gap-3">
              {hits.map((hit) => (
                <li key={hit.doc.id}>
                  <Link
                    href={hit.doc.href}
                    className="ai-glass ai-glass-rim group block rounded-xl p-5"
                  >
                    <span className="font-ai-mono text-ai-dim text-[0.6rem] tracking-[0.16em] uppercase">
                      {searchKindLabel[hit.doc.kind]}
                    </span>
                    <span className="text-ai-white group-hover:text-ai-cyan mt-1.5 block text-[0.95rem] transition-colors">
                      {hit.doc.title}
                    </span>
                    <span className="text-ai-haze mt-2 line-clamp-2 block text-[0.8rem] leading-[1.85]">
                      {hit.doc.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
