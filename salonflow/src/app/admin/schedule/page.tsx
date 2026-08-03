import Link from "next/link";

import { requireContext, can } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { getLedger } from "@/server/modules/appointments/ledger-service";
import { addDaysISO, zonedDateISO } from "@/lib/time";
import { getTranslator } from "@/i18n";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { LedgerGrid } from "@/components/admin/ledger-grid";
import { LedgerToolbar } from "@/components/admin/ledger-toolbar";

export const metadata = { title: "予約台帳" };
export const dynamic = "force-dynamic";

export default async function SchedulePage(props: {
  searchParams: Promise<{ date?: string; days?: string; store?: string }>;
}) {
  const searchParams = await props.searchParams;
  const context = await requireContext();
  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const storeId = searchParams.store ?? context.activeStoreId;
  if (!storeId) {
    return <EmptyState title={t("schedule.noStaff")} />;
  }

  const store = context.accessibleStores.find((entry) => entry.id === storeId);
  if (!store) {
    return <EmptyState title={t("errors.forbidden")} />;
  }

  const days = normaliseDays(searchParams.days);
  const dateISO = normaliseDate(searchParams.date, store.timezone);

  const ledger = await getLedger(context, { storeId, fromDateISO: dateISO, days });

  if (!ledger) {
    return <EmptyState title={t("errors.notFound")} />;
  }

  const canWrite = can(context, PERMISSIONS.RESERVATION_WRITE, storeId);

  return (
    <>
      <PageHeader
        title={t("schedule.title")}
        description={`${store.name} — ${dateISO}${days > 1 ? ` 〜 ${addDaysISO(dateISO, days - 1)}` : ""}`}
        actions={
          canWrite ? (
            <Link
              href={`/admin/schedule/new?store=${storeId}&date=${dateISO}`}
              className="rounded-md bg-[--color-accent] px-4 py-2 text-sm font-medium text-[--color-accent-ink] hover:bg-[--color-accent-hover]"
            >
              {t("schedule.newAppointment")}
            </Link>
          ) : null
        }
      />

      <LedgerToolbar
        dateISO={dateISO}
        days={days}
        storeId={storeId}
        timeZone={store.timezone}
        locale={locale}
      />

      {ledger.columns.length === 0 ? (
        <EmptyState
          title={t("schedule.noStaff")}
          description="スタッフをこの店舗に所属させると、予約台帳に列が表示されます。"
        />
      ) : (
        <LedgerGrid ledger={serialiseLedger(ledger)} canWrite={canWrite} locale={locale} />
      )}
    </>
  );
}

function normaliseDays(value: string | undefined): number {
  const parsed = Number(value);
  return parsed === 3 || parsed === 7 ? parsed : 1;
}

function normaliseDate(value: string | undefined, timeZone: string): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return zonedDateISO(new Date(), timeZone);
}

/**
 * Dates cross the server/client boundary as ISO strings.
 *
 * RSC can serialise `Date`, but the grid does date arithmetic in the store's
 * timezone rather than the browser's, so it works with explicit instants and
 * converts once, deliberately.
 */
function serialiseLedger(ledger: Awaited<ReturnType<typeof getLedger>>) {
  if (!ledger) throw new Error("unreachable");

  return {
    ...ledger,
    columns: ledger.columns.map((column) => ({
      ...column,
      workWindows: column.workWindows.map((window) => ({
        startAt: window.startAt.toISOString(),
        endAt: window.endAt.toISOString(),
      })),
    })),
    entries: ledger.entries.map((entry) => ({
      ...entry,
      startAt: entry.startAt.toISOString(),
      endAt: entry.endAt.toISOString(),
      staffBlocks: entry.staffBlocks.map((block) => ({
        staffId: block.staffId,
        startAt: block.startAt.toISOString(),
        endAt: block.endAt.toISOString(),
      })),
    })),
    blocks: ledger.blocks.map((block) => ({
      ...block,
      startAt: block.startAt.toISOString(),
      endAt: block.endAt.toISOString(),
    })),
  };
}
