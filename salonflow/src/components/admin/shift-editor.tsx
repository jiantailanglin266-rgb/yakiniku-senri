"use client";

import { useState, useTransition } from "react";

import { getTranslator } from "@/i18n";
import { addDaysISO } from "@/lib/time";
import { deleteShiftAction, saveShiftAction } from "@/server/modules/settings/actions";
import { Alert, Button, Card, CardBody, CardHeader, Input } from "@/components/ui/primitives";

/**
 * One person's roster, a fortnight at a time.
 *
 * Rosters are the last thing standing between a configured salon and a
 * bookable one, and they are entered in bulk — so the grid saves each day
 * independently rather than as one big form. A typo on Thursday should not
 * discard the other thirteen days.
 */

export interface ShiftRow {
  date: string;
  startMinute: number;
  endMinute: number;
  breakStartMinute: number | null;
  breakEndMinute: number | null;
}

export interface BusinessHourSummary {
  dayOfWeek: number;
  isClosed: boolean;
  openMinute: number;
  closeMinute: number;
}

interface DayState {
  enabled: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
  status: "idle" | "saving" | "saved" | "warning" | "error";
  message?: string;
}

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function hhmm(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function parse(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59 || hour > 47) return null;
  return hour * 60 + minute;
}

/** Weekday for a `YYYY-MM-DD` string, without dragging in the local zone. */
function weekdayOf(dateISO: string): number {
  return new Date(`${dateISO}T00:00:00.000Z`).getUTCDay();
}

export function ShiftEditor({
  staffId,
  storeId,
  storeName,
  startDate,
  days,
  existing,
  businessHours,
  locale,
}: {
  staffId: string;
  storeId: string;
  storeName: string;
  startDate: string;
  days: number;
  existing: ShiftRow[];
  businessHours: BusinessHourSummary[];
  locale: "ja" | "en";
}) {
  const t = getTranslator("admin", locale);
  const en = locale === "en";
  const weekdays = en ? WEEKDAYS_EN : WEEKDAYS_JA;

  const dates = Array.from({ length: days }, (_, index) => addDaysISO(startDate, index));
  const byDate = new Map(existing.map((row) => [row.date, row]));
  const hoursByDay = new Map(businessHours.map((row) => [row.dayOfWeek, row]));

  const [state, setState] = useState<Record<string, DayState>>(() => {
    const initial: Record<string, DayState> = {};

    for (const date of dates) {
      const shift = byDate.get(date);
      const hours = hoursByDay.get(weekdayOf(date));

      initial[date] = {
        enabled: shift !== undefined,
        // Defaulting an empty day to the store's opening hours is the answer
        // the operator wants nine times out of ten.
        start: hhmm(shift?.startMinute ?? hours?.openMinute ?? 600),
        end: hhmm(shift?.endMinute ?? hours?.closeMinute ?? 1140),
        breakStart: shift?.breakStartMinute != null ? hhmm(shift.breakStartMinute) : "",
        breakEnd: shift?.breakEndMinute != null ? hhmm(shift.breakEndMinute) : "",
        status: "idle",
      };
    }
    return initial;
  });

  const [pending, startTransition] = useTransition();

  function update(date: string, patch: Partial<DayState>) {
    setState((current) => ({
      ...current,
      [date]: { ...current[date]!, ...patch, status: "idle", message: undefined },
    }));
  }

  function save(date: string) {
    const day = state[date];
    if (!day) return;

    const start = parse(day.start);
    const end = parse(day.end);
    const breakStart = day.breakStart.trim() === "" ? null : parse(day.breakStart);
    const breakEnd = day.breakEnd.trim() === "" ? null : parse(day.breakEnd);

    if (start === null || end === null) {
      update(date, { status: "error", message: t("problems.shift.start_out_of_range") });
      return;
    }

    setState((current) => ({ ...current, [date]: { ...current[date]!, status: "saving" } }));

    startTransition(async () => {
      const result = await saveShiftAction({
        staffId,
        storeId,
        date,
        startMinute: start,
        endMinute: end,
        breakStartMinute: breakStart,
        breakEndMinute: breakEnd,
        note: null,
      });

      if (!result.ok) {
        const code = result.problems?.[0] ?? "errors.unexpected";
        setState((current) => ({
          ...current,
          [date]: { ...current[date]!, status: "error", message: t(`problems.${code}`) },
        }));
        return;
      }

      const warning = result.warnings?.[0];
      setState((current) => ({
        ...current,
        [date]: {
          ...current[date]!,
          enabled: true,
          status: warning ? "warning" : "saved",
          message: warning ? t(`problems.${warning}`) : undefined,
        },
      }));
    });
  }

  function remove(date: string) {
    setState((current) => ({ ...current, [date]: { ...current[date]!, status: "saving" } }));

    startTransition(async () => {
      const result = await deleteShiftAction({ staffId, storeId, date });

      setState((current) => ({
        ...current,
        [date]: {
          ...current[date]!,
          enabled: false,
          status: result.ok ? "saved" : "error",
          message: result.ok ? undefined : (result.error ?? t("errors.unexpected")),
        },
      }));
    });
  }

  /** Copy the first saved day onto every other open day, then save them all. */
  function fillFromFirst() {
    const source = dates.find((date) => state[date]?.enabled);
    if (!source) return;

    const template = state[source]!;

    for (const date of dates) {
      const hours = hoursByDay.get(weekdayOf(date));
      // Skip days the store is shut — a roster there produces no bookable time.
      if (!hours || hours.isClosed || date === source) continue;

      update(date, {
        enabled: true,
        start: template.start,
        end: template.end,
        breakStart: template.breakStart,
        breakEnd: template.breakEnd,
      });
    }
  }

  return (
    <Card>
      <CardHeader
        title={`${t("settings.shifts")} — ${storeName}`}
        description={
          en
            ? "Each day saves on its own. Days the store is closed are marked."
            : "1 日ずつ保存されます。休業日には印がついています。"
        }
        action={
          <Button type="button" variant="ghost" onClick={fillFromFirst}>
            {en ? "Copy first day to open days" : "最初の日を営業日にコピー"}
          </Button>
        }
      />
      <CardBody className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-[--color-ink-muted]">
                <th className="pb-2 font-medium">{en ? "Date" : "日付"}</th>
                <th className="pb-2 font-medium">{en ? "Start" : "開始"}</th>
                <th className="pb-2 font-medium">{en ? "End" : "終了"}</th>
                <th className="pb-2 font-medium" colSpan={2}>
                  {en ? "Break" : "休憩"}
                </th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {dates.map((date) => {
                const day = state[date]!;
                const hours = hoursByDay.get(weekdayOf(date));
                const storeClosed = !hours || hours.isClosed;

                return (
                  <tr key={date} className="border-t border-[--color-border] align-top">
                    <td className="py-2 pr-3">
                      <div className="tabular-nums">{date.slice(5)}</div>
                      <div className="text-xs text-[--color-ink-muted]">
                        {weekdays[weekdayOf(date)]}
                        {storeClosed ? ` · ${t("settings.closed")}` : ""}
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        value={day.start}
                        onChange={(e) => update(date, { start: e.target.value })}
                        className="w-20"
                        inputMode="numeric"
                        aria-label={`${date} ${en ? "start" : "開始"}`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        value={day.end}
                        onChange={(e) => update(date, { end: e.target.value })}
                        className="w-20"
                        inputMode="numeric"
                        aria-label={`${date} ${en ? "end" : "終了"}`}
                      />
                    </td>
                    <td className="py-2 pr-1">
                      <Input
                        value={day.breakStart}
                        onChange={(e) => update(date, { breakStart: e.target.value })}
                        className="w-20"
                        placeholder="--:--"
                        inputMode="numeric"
                        aria-label={`${date} ${en ? "break start" : "休憩開始"}`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        value={day.breakEnd}
                        onChange={(e) => update(date, { breakEnd: e.target.value })}
                        className="w-20"
                        placeholder="--:--"
                        inputMode="numeric"
                        aria-label={`${date} ${en ? "break end" : "休憩終了"}`}
                      />
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => save(date)}
                          disabled={pending}
                        >
                          {day.status === "saving" ? "…" : t("settings.save")}
                        </Button>
                        {day.enabled ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => remove(date)}
                            disabled={pending}
                          >
                            {t("settings.removeShift")}
                          </Button>
                        ) : (
                          <span className="text-xs text-[--color-ink-subtle]">
                            {t("settings.noShift")}
                          </span>
                        )}
                      </div>
                      {day.status === "saved" ? (
                        <p className="mt-1 text-xs text-[--color-positive]">
                          {t("settings.saved")}
                        </p>
                      ) : null}
                      {day.message ? (
                        <p
                          className={
                            day.status === "error"
                              ? "mt-1 text-xs text-[--color-danger]"
                              : "mt-1 text-xs text-[--color-warning]"
                          }
                        >
                          {day.message}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {businessHours.every((hour) => hour.isClosed) ? (
          <Alert tone="warning">{t("problems.hours.all_days_closed")}</Alert>
        ) : null}
      </CardBody>
    </Card>
  );
}
