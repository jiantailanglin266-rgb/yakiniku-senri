"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { addDaysISO, zonedDateISO } from "@/lib/time";
import { cn } from "@/lib/utils";
import { getTranslator } from "@/i18n";

/**
 * Date and view-range controls for the ledger.
 *
 * Plain links rather than client-side state: the ledger is a server-rendered
 * read model, so navigating by URL keeps the browser's back button, bookmarks
 * and a refresh all doing the obvious thing.
 */
export function LedgerToolbar({
  dateISO,
  days,
  storeId,
  timeZone,
  locale,
}: {
  dateISO: string;
  days: number;
  storeId: string;
  timeZone: string;
  locale: "ja" | "en";
}) {
  const t = getTranslator("admin", locale);
  const todayISO = zonedDateISO(new Date(), timeZone);

  const href = (nextDate: string, nextDays: number) =>
    `/admin/schedule?store=${storeId}&date=${nextDate}&days=${nextDays}`;

  const ranges: Array<{ value: number; label: string }> = [
    { value: 1, label: t("schedule.day") },
    { value: 3, label: t("schedule.threeDays") },
    { value: 7, label: t("schedule.week") },
  ];

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Link
          href={href(addDaysISO(dateISO, -days), days)}
          aria-label="前の期間"
          className="flex size-8 items-center justify-center rounded-md border border-[--color-border] bg-[--color-surface] hover:bg-[--color-surface-muted]"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Link>
        <Link
          href={href(todayISO, days)}
          className={cn(
            "rounded-md border border-[--color-border] px-3 py-1.5 text-xs",
            dateISO === todayISO
              ? "bg-[--color-accent-soft] font-medium text-[--color-accent]"
              : "bg-[--color-surface] hover:bg-[--color-surface-muted]",
          )}
        >
          {t("common.today")}
        </Link>
        <Link
          href={href(addDaysISO(dateISO, days), days)}
          aria-label="次の期間"
          className="flex size-8 items-center justify-center rounded-md border border-[--color-border] bg-[--color-surface] hover:bg-[--color-surface-muted]"
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <form action="/admin/schedule" method="get" className="flex items-center gap-1">
        <input type="hidden" name="store" value={storeId} />
        <input type="hidden" name="days" value={days} />
        <label htmlFor="ledger-date" className="sr-only">
          日付
        </label>
        <input
          id="ledger-date"
          type="date"
          name="date"
          defaultValue={dateISO}
          className="h-8 rounded-md border border-[--color-border] bg-[--color-surface] px-2 text-xs text-[--color-ink]"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        />
        <noscript>
          <button type="submit" className="text-xs underline">
            表示
          </button>
        </noscript>
      </form>

      <div
        role="group"
        aria-label="表示期間"
        className="ml-auto flex overflow-hidden rounded-md border border-[--color-border]"
      >
        {ranges.map((range) => (
          <Link
            key={range.value}
            href={href(dateISO, range.value)}
            aria-current={days === range.value ? "true" : undefined}
            className={cn(
              "px-3 py-1.5 text-xs",
              days === range.value
                ? "bg-[--color-accent-soft] font-medium text-[--color-accent]"
                : "bg-[--color-surface] text-[--color-ink-muted] hover:bg-[--color-surface-muted]",
            )}
          >
            {range.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
