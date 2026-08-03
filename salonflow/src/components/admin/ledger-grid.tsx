"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Star, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import {
  addDaysISO,
  formatMinuteOfDay,
  startOfZonedDay,
  zonedDateISO,
  zonedMinuteOfDay,
} from "@/lib/time";
import { getTranslator } from "@/i18n";
import { Alert, Badge, Button } from "@/components/ui/primitives";
import { SourceBadge, StatusBadge, statusBlockClass } from "@/components/ui/status";
import { changeStatusAction } from "@/server/modules/appointments/actions";
import { nextStatuses, type AppointmentStatus } from "@/server/modules/appointments/state-machine";

/**
 * The appointment ledger grid.
 *
 * A staff-column × time-row layout, one block per contiguous span of staff
 * time. Rendering each staff *block* rather than each appointment is what
 * makes the "stylist is free while the colour processes" gap visible — the
 * customer keeps the chair, the stylist's column shows a hole another booking
 * can fill.
 *
 * Information density is deliberate: a busy salon needs a whole day on one
 * screen, so the row height is tuned to fit ~10 hours without scrolling on a
 * laptop, and the layout switches to a list on narrow screens rather than
 * shrinking further.
 */

export interface SerialisedLedger {
  storeId: string;
  timeZone: string;
  fromDateISO: string;
  days: number;
  openMinute: number;
  closeMinute: number;
  columns: Array<{
    staffId: string;
    displayName: string;
    photoUrl: string | null;
    workWindows: Array<{ startAt: string; endAt: string }>;
  }>;
  entries: Array<{
    id: string;
    reference: string;
    status: AppointmentStatus;
    source: string;
    startAt: string;
    endAt: string;
    isDesignated: boolean;
    totalAmount: number;
    customerNote: string | null;
    staffNote: string | null;
    customer: {
      id: string;
      name: string;
      nameKana: string | null;
      phone: string | null;
      email: string | null;
      visitCount: number;
      noShowCount: number;
    } | null;
    guestName: string | null;
    serviceNames: string[];
    staffBlocks: Array<{ staffId: string; startAt: string; endAt: string }>;
    resourceNames: string[];
    hasMedicalRecord: boolean;
  }>;
  blocks: Array<{
    id: string;
    staffId: string;
    startAt: string;
    endAt: string;
    kind: "break_time" | "block" | "time_off";
    note: string | null;
  }>;
}

/** Pixels per minute. 1.1 fits a 10-hour day in roughly 660px. */
const PX_PER_MINUTE = 1.1;
const HEADER_HEIGHT = 44;

export function LedgerGrid({
  ledger,
  canWrite,
  locale,
}: {
  ledger: SerialisedLedger;
  canWrite: boolean;
  locale: "ja" | "en";
}) {
  const t = getTranslator("admin", locale);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dates = useMemo(
    () =>
      Array.from({ length: ledger.days }, (_, offset) => addDaysISO(ledger.fromDateISO, offset)),
    [ledger.days, ledger.fromDateISO],
  );

  // Pad the axis slightly so a booking that starts on the hour is not flush
  // against the header.
  const axisStart = Math.max(0, ledger.openMinute - 30);
  const axisEnd = Math.min(1740, ledger.closeMinute + 30);
  const gridHeight = (axisEnd - axisStart) * PX_PER_MINUTE;

  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    for (let minute = Math.ceil(axisStart / 60) * 60; minute <= axisEnd; minute += 60) {
      marks.push(minute);
    }
    return marks;
  }, [axisStart, axisEnd]);

  const selected = ledger.entries.find((entry) => entry.id === selectedId) ?? null;

  function runStatusChange(appointmentId: string, toStatus: AppointmentStatus) {
    setError(null);
    const formData = new FormData();
    formData.set("appointmentId", appointmentId);
    formData.set("toStatus", toStatus);

    startTransition(async () => {
      const result = await changeStatusAction(formData);
      if (!result.ok) {
        // Server-provided messages are already human-readable Japanese; keys
        // are translated. Distinguishing them by the dot keeps both usable.
        setError(result.error?.includes(".") ? t(result.error) : (result.error ?? null));
      } else {
        setSelectedId(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {/* Wide layout: the time-grid ledger. */}
      <div className="hidden overflow-x-auto rounded-[--radius-card] border border-[--color-border] bg-[--color-surface] md:block">
        <div className="flex min-w-max">
          {/* Time axis */}
          <div className="sticky left-0 z-20 w-14 shrink-0 border-r border-[--color-border] bg-[--color-surface]">
            <div style={{ height: HEADER_HEIGHT }} className="border-b border-[--color-border]" />
            <div className="relative" style={{ height: gridHeight }}>
              {hourMarks.map((minute) => (
                <div
                  key={minute}
                  className="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-[--color-ink-subtle]"
                  style={{ top: (minute - axisStart) * PX_PER_MINUTE }}
                >
                  {formatMinuteOfDay(minute)}
                </div>
              ))}
            </div>
          </div>

          {dates.map((dateISO) => (
            <div key={dateISO} className="flex border-r border-[--color-border-strong]">
              {ledger.columns.map((column) => (
                <StaffColumn
                  key={`${dateISO}:${column.staffId}`}
                  ledger={ledger}
                  column={column}
                  dateISO={dateISO}
                  axisStart={axisStart}
                  axisEnd={axisEnd}
                  gridHeight={gridHeight}
                  hourMarks={hourMarks}
                  showDate={ledger.days > 1}
                  onSelect={setSelectedId}
                  selectedId={selectedId}
                  locale={locale}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Narrow layout: a chronological list. Compressing a column grid onto a
          phone produces something unusable; a list is the honest answer. */}
      <ol className="space-y-2 md:hidden">
        {ledger.entries.length === 0 ? (
          <li className="rounded-md border border-[--color-border] bg-[--color-surface] px-4 py-8 text-center text-sm text-[--color-ink-muted]">
            {t("common.noData")}
          </li>
        ) : (
          ledger.entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => setSelectedId(entry.id)}
                className="w-full rounded-md border border-[--color-border] bg-[--color-surface] p-3 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium tabular-nums">
                    {formatRange(entry.startAt, entry.endAt, ledger.timeZone)}
                  </span>
                  <StatusBadge status={entry.status} locale={locale} />
                </div>
                <p className="mt-1 text-sm">
                  {entry.customer?.name ?? entry.guestName ?? t("appointment.guest")}
                </p>
                <p className="text-xs text-[--color-ink-muted]">{entry.serviceNames.join("、")}</p>
              </button>
            </li>
          ))
        )}
      </ol>

      {selected ? (
        <DetailDrawer
          entry={selected}
          timeZone={ledger.timeZone}
          canWrite={canWrite}
          locale={locale}
          isPending={isPending}
          onClose={() => setSelectedId(null)}
          onStatusChange={runStatusChange}
        />
      ) : null}
    </div>
  );
}

function StaffColumn({
  ledger,
  column,
  dateISO,
  axisStart,
  axisEnd,
  gridHeight,
  hourMarks,
  showDate,
  onSelect,
  selectedId,
  locale,
}: {
  ledger: SerialisedLedger;
  column: SerialisedLedger["columns"][number];
  dateISO: string;
  axisStart: number;
  axisEnd: number;
  gridHeight: number;
  hourMarks: number[];
  showDate: boolean;
  onSelect: (id: string) => void;
  selectedId: string | null;
  locale: "ja" | "en";
}) {
  const t = getTranslator("admin", locale);
  const dayStart = startOfZonedDay(dateISO, ledger.timeZone).getTime();

  /** Minutes from local midnight, allowing values past 1440 for late nights. */
  const minuteOf = (iso: string) => {
    const instant = new Date(iso);
    const dayOffset = Math.floor((instant.getTime() - dayStart) / 86_400_000);
    return zonedMinuteOfDay(instant, ledger.timeZone) + dayOffset * 1440;
  };

  const belongsToDay = (iso: string) => zonedDateISO(new Date(iso), ledger.timeZone) === dateISO;

  const rostered = column.workWindows.filter((window) => belongsToDay(window.startAt));

  return (
    <div className="w-40 shrink-0 border-r border-[--color-border] last:border-r-0">
      <div
        style={{ height: HEADER_HEIGHT }}
        className="flex flex-col justify-center border-b border-[--color-border] px-2"
      >
        <p className="truncate text-xs font-semibold text-[--color-ink]">{column.displayName}</p>
        {showDate ? (
          <p className="text-[10px] text-[--color-ink-subtle]">{dateISO.slice(5)}</p>
        ) : null}
      </div>

      <div className="relative bg-[--color-surface]" style={{ height: gridHeight }}>
        {/* Off-shift shading. Rendered first so everything else sits above it. */}
        {rostered.length === 0 ? (
          <div className="absolute inset-0 bg-[--color-surface-sunken]">
            <span className="sr-only">{t("schedule.offShift")}</span>
          </div>
        ) : (
          rostered.map((window, index) => {
            const start = minuteOf(window.startAt);
            const end = minuteOf(window.endAt);
            return (
              <div key={index} aria-hidden="true">
                <div
                  className="absolute inset-x-0 bg-[--color-surface-sunken]"
                  style={{
                    top: 0,
                    height: Math.max(0, (start - axisStart) * PX_PER_MINUTE),
                  }}
                />
                <div
                  className="absolute inset-x-0 bg-[--color-surface-sunken]"
                  style={{
                    top: (end - axisStart) * PX_PER_MINUTE,
                    height: Math.max(0, (axisEnd - end) * PX_PER_MINUTE),
                  }}
                />
              </div>
            );
          })
        )}

        {/* Hour rules */}
        {hourMarks.map((minute) => (
          <div
            key={minute}
            aria-hidden="true"
            className="absolute inset-x-0 border-t border-[--color-border]"
            style={{ top: (minute - axisStart) * PX_PER_MINUTE }}
          />
        ))}

        {/* Breaks, manual blocks and approved leave */}
        {ledger.blocks
          .filter((block) => block.staffId === column.staffId && belongsToDay(block.startAt))
          .map((block) => {
            const top = (minuteOf(block.startAt) - axisStart) * PX_PER_MINUTE;
            const height = Math.max(
              14,
              (minuteOf(block.endAt) - minuteOf(block.startAt)) * PX_PER_MINUTE,
            );
            return (
              <div
                key={block.id}
                className="absolute inset-x-0.5 overflow-hidden rounded border border-dashed border-[--color-border-strong] bg-[--color-surface-sunken] px-1 py-0.5 text-[10px] text-[--color-ink-subtle]"
                style={{ top, height }}
              >
                {block.kind === "time_off"
                  ? "休暇"
                  : block.kind === "break_time"
                    ? "休憩"
                    : "ブロック"}
                {block.note ? ` — ${block.note}` : ""}
              </div>
            );
          })}

        {/* Appointment blocks, one per contiguous span of this staff's time */}
        {ledger.entries.flatMap((entry) =>
          entry.staffBlocks
            .filter((block) => block.staffId === column.staffId && belongsToDay(block.startAt))
            .map((block, index) => {
              const startMinute = minuteOf(block.startAt);
              const endMinute = minuteOf(block.endAt);
              const top = (startMinute - axisStart) * PX_PER_MINUTE;
              const height = Math.max(18, (endMinute - startMinute) * PX_PER_MINUTE);
              const isSelected = selectedId === entry.id;

              return (
                <button
                  key={`${entry.id}:${index}`}
                  type="button"
                  onClick={() => onSelect(entry.id)}
                  aria-label={`${formatRange(block.startAt, block.endAt, ledger.timeZone)} ${
                    entry.customer?.name ?? entry.guestName ?? ""
                  } ${entry.serviceNames.join(" ")}`}
                  className={cn(
                    "absolute inset-x-0.5 overflow-hidden rounded border-l-4 px-1 py-0.5 text-left text-[10px] leading-tight",
                    statusBlockClass(entry.status),
                    isSelected && "ring-2 ring-[--color-accent] ring-offset-1",
                  )}
                  style={{ top, height }}
                >
                  <span className="flex items-center gap-0.5 font-medium">
                    {entry.isDesignated ? (
                      <Star aria-label={t("schedule.designated")} className="size-2.5 shrink-0" />
                    ) : null}
                    <span className="truncate">
                      {entry.customer?.name ?? entry.guestName ?? t("appointment.guest")}
                    </span>
                  </span>
                  {height > 30 ? (
                    <span className="block truncate opacity-80">
                      {entry.serviceNames.join("、")}
                    </span>
                  ) : null}
                </button>
              );
            }),
        )}
      </div>
    </div>
  );
}

function DetailDrawer({
  entry,
  timeZone,
  canWrite,
  locale,
  isPending,
  onClose,
  onStatusChange,
}: {
  entry: SerialisedLedger["entries"][number];
  timeZone: string;
  canWrite: boolean;
  locale: "ja" | "en";
  isPending: boolean;
  onClose: () => void;
  onStatusChange: (appointmentId: string, toStatus: AppointmentStatus) => void;
}) {
  const t = getTranslator("admin", locale);
  const transitions = nextStatuses(entry.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label={t("common.close")}
        onClick={onClose}
        className="flex-1 bg-black/30"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("appointment.reference")}
        className="flex w-full max-w-md flex-col overflow-y-auto border-l border-[--color-border] bg-[--color-surface] p-4 shadow-xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-xs text-[--color-ink-subtle]">{entry.reference}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatRange(entry.startAt, entry.endAt, timeZone)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={t("common.close")}>
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={entry.status} locale={locale} />
          <SourceBadge source={entry.source} locale={locale} />
          {entry.isDesignated ? (
            <Badge tone="accent">{t("schedule.designated")}</Badge>
          ) : (
            <Badge tone="neutral">{t("schedule.freeChoice")}</Badge>
          )}
        </div>

        {entry.customer && entry.customer.noShowCount > 0 ? (
          <div className="mt-3">
            <Alert tone="warning">
              <span className="flex items-center gap-1.5">
                <AlertTriangle aria-hidden="true" className="size-3.5" />
                {t("appointment.noShowWarning", { count: entry.customer.noShowCount })}
              </span>
            </Alert>
          </div>
        ) : null}

        <dl className="mt-4 space-y-3 text-sm">
          <Row label={t("appointment.customer")}>
            {entry.customer ? (
              <Link
                href={`/admin/customers/${entry.customer.id}`}
                className="text-[--color-accent] hover:underline"
              >
                {entry.customer.name}
              </Link>
            ) : (
              (entry.guestName ?? "—")
            )}
            {entry.customer ? (
              <span className="ml-2 text-xs text-[--color-ink-subtle]">
                {t("customer.visitCount")} {entry.customer.visitCount}
              </span>
            ) : null}
          </Row>

          {entry.customer?.phone ? (
            <Row label={t("customer.phone")}>
              <span className="tabular-nums">{entry.customer.phone}</span>
            </Row>
          ) : null}

          <Row label={t("appointment.services")}>{entry.serviceNames.join("、") || "—"}</Row>

          {entry.resourceNames.length > 0 ? (
            <Row label={t("appointment.resources")}>{entry.resourceNames.join("、")}</Row>
          ) : null}

          <Row label={t("appointment.amount")}>{formatMoney(entry.totalAmount)}</Row>

          {entry.customerNote ? (
            <Row label={t("appointment.customerNote")}>{entry.customerNote}</Row>
          ) : null}
          {entry.staffNote ? <Row label={t("appointment.staffNote")}>{entry.staffNote}</Row> : null}
        </dl>

        {canWrite && transitions.length > 0 ? (
          <div className="mt-6 space-y-2 border-t border-[--color-border] pt-4">
            <p className="text-xs font-medium text-[--color-ink-muted]">{t("common.actions")}</p>
            <div className="flex flex-wrap gap-2">
              {transitions.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={status === "cancelled" || status === "no_show" ? "secondary" : "primary"}
                  disabled={isPending}
                  onClick={() => {
                    // Cancellation and no-show cannot be undone by the state
                    // machine, so they get an explicit confirmation.
                    if (status === "cancelled" || status === "no_show") {
                      if (!window.confirm(t("common.confirmDelete"))) return;
                    }
                    onStatusChange(entry.id, status);
                  }}
                >
                  {t(`appointment.status_${status}`)}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-[--color-border] pt-4">
          {entry.customer ? (
            <Link
              href={`/admin/customers/${entry.customer.id}`}
              className="text-xs text-[--color-accent] hover:underline"
            >
              {t("nav.customers")}
            </Link>
          ) : null}
          {entry.customer ? (
            <Link
              href={`/admin/customers/${entry.customer.id}/records/new?appointment=${entry.id}`}
              className="text-xs text-[--color-accent] hover:underline"
            >
              {entry.hasMedicalRecord ? t("nav.medicalRecords") : t("medicalRecord.new")}
            </Link>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2">
      <dt className="text-xs text-[--color-ink-muted]">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function formatRange(startISO: string, endISO: string, timeZone: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  return `${formatMinuteOfDay(zonedMinuteOfDay(start, timeZone))} – ${formatMinuteOfDay(
    zonedMinuteOfDay(end, timeZone),
  )}`;
}
