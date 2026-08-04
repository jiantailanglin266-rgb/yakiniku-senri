import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { aiPortPath } from "@/data/ai-port/site";
import { findToolCategory } from "@/data/ai-port/taxonomy";
import { pricingLabel, type AiTool } from "@/data/ai-port/tools";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/components/ai-port/effects/TiltCard";
import { Badge, Unknown } from "@/components/ai-port/ui/Primitives";

/**
 * AIツール1件。
 *
 * ⚠ 料金の金額は表示しません（変動が速く、古い数字は実害になるため）。
 *   「無料あり／有料」の区分だけを出し、金額は公式サイトで確認してもらいます。
 * ⚠ 未確認の項目は空欄にせず「未確認」と表示します。
 */
export function ToolCard({ tool, rank }: { tool: AiTool; rank?: number }) {
  const category = findToolCategory(tool.categories[0]);

  return (
    <TiltCard className="h-full">
      <article className="ai-glass ai-glass-rim group relative flex h-full flex-col rounded-2xl p-5">
        <div className="flex items-start gap-3">
          {typeof rank === "number" ? (
            <span
              className="font-ai-display from-ai-cyan to-ai-violet bg-gradient-to-br bg-clip-text text-[1.5rem] leading-none font-bold text-transparent"
              translate="no"
            >
              {String(rank).padStart(2, "0")}
            </span>
          ) : null}

          <div className="min-w-0 flex-1">
            <h3 className="text-ai-white text-[1rem] leading-tight">
              <Link
                href={aiPortPath(`/tools/${tool.slug}`)}
                className="group-hover:text-ai-cyan transition-colors duration-300 after:absolute after:inset-0"
              >
                {tool.name}
              </Link>
            </h3>
            {/* 提供元の社名は機械翻訳で書き換わると別物になるため除外します */}
            <p className="text-ai-dim mt-1 text-[0.7rem]" translate="no">
              {tool.maker}
            </p>
          </div>

          {category ? <Badge accent={category.accent}>{category.nameEn}</Badge> : null}
        </div>

        <p className="text-ai-haze mt-3.5 line-clamp-2 text-[0.82rem] leading-[1.85]">
          {tool.summary}
        </p>

        <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 pt-5 text-[0.72rem]">
          <Spec label="料金体系" value={pricingLabel[tool.pricing]} />
          <Spec label="日本語UI" value={tool.japaneseUi} />
          <Spec label="API" value={tool.api} />
          <Spec label="法人プラン" value={tool.team} />
        </dl>
      </article>
    </TiltCard>
  );
}

function Spec({ label, value }: { label: string; value: boolean | null | string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-white/6 pt-2">
      <dt className="text-ai-dim">{label}</dt>
      <dd className="shrink-0">
        {typeof value === "string" ? (
          <span className="text-ai-mist">{value}</span>
        ) : value === true ? (
          <Check aria-label="あり" className="text-ai-mint size-3.5" />
        ) : value === false ? (
          <Minus aria-label="なし" className="text-ai-dim size-3.5" />
        ) : (
          <Unknown />
        )}
      </dd>
    </div>
  );
}

/** 一覧のグリッド。 */
export function ToolGrid({ tools, className }: { tools: AiTool[]; className?: string }) {
  if (tools.length === 0) {
    return (
      <p className="ai-glass text-ai-haze rounded-2xl px-6 py-10 text-center text-[0.85rem]">
        条件に合うツールが見つかりませんでした。フィルターを外して再度お試しください。
      </p>
    );
  }

  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {tools.map((tool) => (
        <li key={tool.slug}>
          <ToolCard tool={tool} />
        </li>
      ))}
    </ul>
  );
}
