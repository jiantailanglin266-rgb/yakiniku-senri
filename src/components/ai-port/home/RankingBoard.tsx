import Link from "next/link";
import { aiPortPath } from "@/data/ai-port/site";
import { pricingLabel } from "@/data/ai-port/tools";
import { MAX_SCORE, type ScoredTool } from "@/lib/ai-port/ranking";
import { Badge } from "@/components/ai-port/ui/Primitives";

/**
 * 注目度ランキング。
 *
 * ⚠ 「人気ランキング」ではありません。
 *   PV・ダウンロード数・レビュー点は持っていないので、順位の根拠にできません。
 *   代わりに「直近のニュースでの言及数（実測）」＋「編集部の選定基準」で並べ、
 *   その内訳を1件ずつ画面に開示しています。
 *   計算式そのものは /ai-port/ranking に掲載しています。
 */
export function RankingBoard({
  ranked,
  limit = 8,
  showBreakdown = false,
}: {
  ranked: ScoredTool[];
  limit?: number;
  showBreakdown?: boolean;
}) {
  const rows = ranked.slice(0, limit);

  return (
    <ol className="grid gap-3">
      {rows.map((entry, index) => {
        const percent = Math.round((entry.score / MAX_SCORE) * 100);

        return (
          <li key={entry.tool.slug}>
            <div className="ai-glass ai-glass-rim group relative rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <span
                  className="font-ai-display from-ai-cyan to-ai-violet w-10 shrink-0 bg-gradient-to-br bg-clip-text text-center text-[1.5rem] leading-none font-bold text-transparent"
                  translate="no"
                >
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="text-ai-white text-[0.95rem]">
                    <Link
                      href={aiPortPath(`/tools/${entry.tool.slug}`)}
                      className="group-hover:text-ai-cyan transition-colors after:absolute after:inset-0"
                    >
                      {entry.tool.name}
                    </Link>
                  </h3>
                  <p className="text-ai-haze mt-1 line-clamp-1 text-[0.76rem]">
                    {entry.tool.summary}
                  </p>
                </div>

                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  <Badge accent={entry.tool.pricing === "free-tier" ? "mint" : "amber"}>
                    {pricingLabel[entry.tool.pricing]}
                  </Badge>
                </div>

                <div className="w-16 shrink-0 text-right">
                  <span
                    className="font-ai-mono text-ai-cyan text-[0.95rem] leading-none"
                    translate="no"
                  >
                    {entry.score}
                  </span>
                  <span className="text-ai-dim block text-[0.6rem]">score</span>
                </div>
              </div>

              {/* スコアバー。満点との比率をそのまま見せます。 */}
              <div
                className="mt-3.5 h-1 overflow-hidden rounded-full bg-white/8"
                role="img"
                aria-label={`注目度スコア ${entry.score} / ${MAX_SCORE}`}
              >
                <div
                  className="from-ai-cyan via-ai-blue to-ai-violet h-full rounded-full bg-gradient-to-r"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {showBreakdown ? (
                <dl className="text-ai-dim mt-3.5 grid gap-x-6 gap-y-1 text-[0.7rem] sm:grid-cols-2 lg:grid-cols-3">
                  {entry.breakdown
                    .filter((row) => row.value > 0)
                    .map((row) => (
                      <div key={row.label} className="flex justify-between gap-3">
                        <dt className="truncate">{row.label}</dt>
                        <dd className="text-ai-mist shrink-0" translate="no">
                          +{row.value}
                        </dd>
                      </div>
                    ))}
                </dl>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
