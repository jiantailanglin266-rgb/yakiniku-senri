import { formatDateTime } from "@/portal/lib/format";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import type { MarketSnapshot } from "@/portal/lib/types";
import { Badge } from "@/portal/components/ui/primitives";

/**
 * 取得日時と更新間隔の表示。
 *
 * 「リアルタイム」とだけ書くと、実際の更新頻度との差が誤認を生みます。
 * ここでは常に「取得日時」と「◯秒ごとに更新」を並べて出します。
 * データがモックのとき、および取得に失敗してフォールバックしたときは、
 * それが分かるバッジを添えます。
 */
export function DataFreshness({
  snapshot,
  dict,
  locale,
  className,
}: {
  snapshot: Pick<MarketSnapshot, "fetchedAt" | "source" | "refreshIntervalSec" | "degraded">;
  dict: Dictionary;
  locale: string;
  className?: string;
}) {
  const interval =
    snapshot.refreshIntervalSec >= 60
      ? locale === "ja"
        ? `${Math.round(snapshot.refreshIntervalSec / 60)}分ごとに更新`
        : `updates every ${Math.round(snapshot.refreshIntervalSec / 60)} min`
      : locale === "ja"
        ? `${snapshot.refreshIntervalSec}秒ごとに更新`
        : `updates every ${snapshot.refreshIntervalSec}s`;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-(--color-ink-dim) ${className ?? ""}`}
    >
      <span>
        {dict.common.updatedAt}:{" "}
        <time dateTime={snapshot.fetchedAt}>{formatDateTime(snapshot.fetchedAt, locale)}</time>
      </span>
      <span aria-hidden="true">·</span>
      <span>{interval}</span>
      {snapshot.source === "mock" ? (
        <Badge tone="amber">{locale === "ja" ? "モックデータ" : "Mock data"}</Badge>
      ) : null}
      {snapshot.degraded ? (
        <Badge tone="rose">
          {locale === "ja" ? "取得に失敗し代替表示中" : "Showing fallback data"}
        </Badge>
      ) : null}
    </div>
  );
}
