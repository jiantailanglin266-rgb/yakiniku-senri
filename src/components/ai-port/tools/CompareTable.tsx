"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { aiPortPath } from "@/data/ai-port/site";
import { toolCategories } from "@/data/ai-port/taxonomy";
import { getComparisonSet, pricingLabel, type AiTool } from "@/data/ai-port/tools";
import { Pill, Unknown } from "@/components/ai-port/ui/Primitives";

/**
 * AIツール比較表。
 *
 * ⚠ 価格の「金額」の列はありません。
 *   料金は短期間で変わるため、古い数字を並べることは読者への実害になります。
 *   代わりに「無料あり／有料」の区分と、公式サイトへの導線を置いています。
 *
 * ⚠ 未確認の項目は空欄にせず「未確認」と表示します。
 *   空欄は「なし」と読まれてしまい、事実と違う印象を与えます。
 *
 * 横スクロールは表の内側だけで起こします（ページ全体は横に動きません）。
 */
export function CompareTable({ initialCategory = "chat" }: { initialCategory?: string }) {
  const [categoryId, setCategoryId] = useState(initialCategory);

  const tools = useMemo(() => getComparisonSet(categoryId, 6), [categoryId]);

  return (
    <div>
      <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-2 pb-1">
          {toolCategories.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => setCategoryId(category.id)}
                aria-pressed={category.id === categoryId}
              >
                <Pill active={category.id === categoryId}>{category.name}</Pill>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="ai-glass mt-6 overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[46rem] border-collapse text-left">
          <caption className="sr-only">
            {toolCategories.find((category) => category.id === categoryId)?.name}のAIツール比較表
          </caption>
          <thead>
            <tr className="border-b border-white/10">
              <Th className="w-[15rem]">ツール</Th>
              <Th>料金体系</Th>
              <Th>日本語UI</Th>
              <Th>API</Th>
              <Th>スマホアプリ</Th>
              <Th>法人プラン</Th>
              <Th>向いている用途</Th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool) => (
              <Row key={tool.slug} tool={tool} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-ai-dim mt-4 text-[0.72rem] leading-[1.9]">
        「未確認」は編集部で裏取りできていない項目です。推測では埋めていません。
        料金の金額は変動が速いため掲載していません。最新の料金は各ツールの公式サイトでご確認ください。
      </p>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`text-ai-dim font-ai-mono px-4 py-3.5 text-[0.62rem] font-normal tracking-[0.14em] whitespace-nowrap uppercase ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Row({ tool }: { tool: AiTool }) {
  return (
    <tr className="border-b border-white/6 transition-colors last:border-0 hover:bg-white/[0.03]">
      <th scope="row" className="px-4 py-4 text-left font-normal">
        <Link
          href={aiPortPath(`/tools/${tool.slug}`)}
          className="text-ai-white hover:text-ai-cyan text-[0.9rem] transition-colors"
        >
          {tool.name}
        </Link>
        <span className="text-ai-dim mt-0.5 block text-[0.68rem]" translate="no">
          {tool.maker}
        </span>
      </th>
      <Td>
        <span className="text-ai-mist text-[0.78rem]">{pricingLabel[tool.pricing]}</span>
      </Td>
      <Td>
        <Flag value={tool.japaneseUi} />
      </Td>
      <Td>
        <Flag value={tool.api} />
      </Td>
      <Td>
        <Flag value={tool.mobileApp} />
      </Td>
      <Td>
        <Flag value={tool.team} />
      </Td>
      <td className="text-ai-haze px-4 py-4 text-[0.78rem] leading-[1.8]">{tool.bestFor}</td>
    </tr>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 whitespace-nowrap">{children}</td>;
}

function Flag({ value }: { value: boolean | null }) {
  if (value === true) return <Check aria-label="あり" className="text-ai-mint size-4" />;
  if (value === false) return <Minus aria-label="なし" className="text-ai-dim size-4" />;
  return <Unknown />;
}
