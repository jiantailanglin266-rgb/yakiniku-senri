"use client";

import { useState, useTransition } from "react";

import { getTranslator } from "@/i18n";
import { formatMinuteOfDay, parseMinuteOfDay } from "@/lib/time";
import { updateBusinessHoursAction } from "@/server/modules/settings/actions";
import { Alert, Button, Card, CardBody, CardHeader, Input } from "@/components/ui/primitives";

/**
 * Weekly opening hours.
 *
 * This is the screen that decides whether the public booking page has anything
 * to show. `bootstrap` leaves every day closed on purpose — a salon should
 * declare when it works rather than inherit a guess — so until this form is
 * saved, availability is legitimately empty.
 *
 * Times are edited as `HH:mm` and stored as minutes from midnight. Closing
 * after midnight is expressed by going past 24:00 (a 02:00 close is `26:00`),
 * which the parser accepts.
 */

export interface BusinessHourRow {
  dayOfWeek: number;
  isClosed: boolean;
  openMinute: number;
  closeMinute: number;
  breakStartMinute: number | null;
  breakEndMinute: number | null;
}

interface DraftRow {
  dayOfWeek: number;
  isClosed: boolean;
  open: string;
  close: string;
  breakStart: string;
  breakEnd: string;
}

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDraft(rows: BusinessHourRow[]): DraftRow[] {
  const byDay = new Map(rows.map((row) => [row.dayOfWeek, row]));

  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const row = byDay.get(dayOfWeek);
    return {
      dayOfWeek,
      // A day with no row at all is closed. Defaulting it to open would put a
      // salon online for hours nobody agreed to work.
      isClosed: row?.isClosed ?? true,
      open: formatMinuteOfDay(row?.openMinute ?? 600),
      close: formatMinuteOfDay(row?.closeMinute ?? 1140),
      breakStart:
        row?.breakStartMinute !== null && row?.breakStartMinute !== undefined
          ? formatMinuteOfDay(row.breakStartMinute)
          : "",
      breakEnd:
        row?.breakEndMinute !== null && row?.breakEndMinute !== undefined
          ? formatMinuteOfDay(row.breakEndMinute)
          : "",
    };
  });
}

export function BusinessHoursForm({
  storeId,
  initial,
  locale,
}: {
  storeId: string;
  initial: BusinessHourRow[];
  locale: "ja" | "en";
}) {
  const t = getTranslator("admin", locale);
  const weekdays = locale === "en" ? WEEKDAYS_EN : WEEKDAYS_JA;

  const [rows, setRows] = useState<DraftRow[]>(() => toDraft(initial));
  const [problems, setProblems] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function update(dayOfWeek: number, patch: Partial<DraftRow>) {
    setSaved(false);
    setRows((current) =>
      current.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row)),
    );
  }

  /** Apply Monday's hours to every other open day — the common case. */
  function copyFirstOpenDay() {
    const source = rows.find((row) => !row.isClosed);
    if (!source) return;

    setSaved(false);
    setRows((current) =>
      current.map((row) =>
        row.isClosed
          ? row
          : {
              ...row,
              open: source.open,
              close: source.close,
              breakStart: source.breakStart,
              breakEnd: source.breakEnd,
            },
      ),
    );
  }

  function submit() {
    setProblems([]);
    setWarnings([]);
    setSaved(false);

    const parseProblems: string[] = [];

    const hours = rows.map((row) => {
      const open = parseMinuteOfDay(row.open);
      const close = parseMinuteOfDay(row.close);
      const breakStart = row.breakStart.trim() === "" ? null : parseMinuteOfDay(row.breakStart);
      const breakEnd = row.breakEnd.trim() === "" ? null : parseMinuteOfDay(row.breakEnd);

      if (!row.isClosed) {
        if (open === null) parseProblems.push("hours.open_out_of_range");
        if (close === null) parseProblems.push("hours.close_out_of_range");
        if (row.breakStart.trim() !== "" && breakStart === null) {
          parseProblems.push("hours.break_incomplete");
        }
        if (row.breakEnd.trim() !== "" && breakEnd === null) {
          parseProblems.push("hours.break_incomplete");
        }
      }

      return {
        dayOfWeek: row.dayOfWeek,
        isClosed: row.isClosed,
        openMinute: open ?? 0,
        closeMinute: close ?? 0,
        breakStartMinute: breakStart,
        breakEndMinute: breakEnd,
      };
    });

    if (parseProblems.length > 0) {
      setProblems([...new Set(parseProblems)]);
      return;
    }

    startTransition(async () => {
      const result = await updateBusinessHoursAction({ storeId, hours });

      if (!result.ok) {
        setProblems(result.problems ?? [result.error ?? "errors.unexpected"]);
        return;
      }

      setWarnings(result.warnings ?? []);
      setSaved(true);
    });
  }

  return (
    <Card>
      <CardHeader
        title={t("store.businessHours")}
        description={t("settings.setupIntro")}
        action={
          <Button type="button" variant="ghost" onClick={copyFirstOpenDay}>
            {locale === "en" ? "Apply to all open days" : "営業日すべてに適用"}
          </Button>
        }
      />
      <CardBody className="space-y-4">
        {problems.length > 0 ? (
          <Alert tone="danger">
            <ul className="space-y-1">
              {problems.map((code) => (
                <li key={code}>{t(`problems.${code}`)}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        {warnings.length > 0 ? (
          <Alert tone="warning">
            <ul className="space-y-1">
              {warnings.map((code) => (
                <li key={code}>{t(`problems.${code}`)}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        {saved && warnings.length === 0 ? (
          <Alert tone="positive">{t("settings.saved")}</Alert>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-[--color-ink-muted]">
                <th className="pb-2 font-medium">{locale === "en" ? "Day" : "曜日"}</th>
                <th className="pb-2 font-medium">{t("settings.open")}</th>
                <th className="pb-2 font-medium">{t("settings.openTime")}</th>
                <th className="pb-2 font-medium">{t("settings.closeTime")}</th>
                <th className="pb-2 font-medium" colSpan={2}>
                  {t("settings.breakTime")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.dayOfWeek} className="border-t border-[--color-border]">
                  <td className="py-2 pr-3 font-medium">{weekdays[row.dayOfWeek]}</td>
                  <td className="py-2 pr-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!row.isClosed}
                        onChange={(event) =>
                          update(row.dayOfWeek, { isClosed: !event.target.checked })
                        }
                        aria-label={`${weekdays[row.dayOfWeek]} ${t("settings.open")}`}
                      />
                      <span className="text-xs text-[--color-ink-muted]">
                        {row.isClosed ? t("settings.closed") : t("settings.open")}
                      </span>
                    </label>
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      value={row.open}
                      onChange={(event) => update(row.dayOfWeek, { open: event.target.value })}
                      disabled={row.isClosed}
                      placeholder="10:00"
                      inputMode="numeric"
                      className="w-24"
                      aria-label={`${weekdays[row.dayOfWeek]} ${t("settings.openTime")}`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      value={row.close}
                      onChange={(event) => update(row.dayOfWeek, { close: event.target.value })}
                      disabled={row.isClosed}
                      placeholder="19:00"
                      inputMode="numeric"
                      className="w-24"
                      aria-label={`${weekdays[row.dayOfWeek]} ${t("settings.closeTime")}`}
                    />
                  </td>
                  <td className="py-2 pr-1">
                    <Input
                      value={row.breakStart}
                      onChange={(event) =>
                        update(row.dayOfWeek, { breakStart: event.target.value })
                      }
                      disabled={row.isClosed}
                      placeholder="--:--"
                      inputMode="numeric"
                      className="w-24"
                      aria-label={`${weekdays[row.dayOfWeek]} ${t("settings.breakTime")}`}
                    />
                  </td>
                  <td className="py-2">
                    <Input
                      value={row.breakEnd}
                      onChange={(event) => update(row.dayOfWeek, { breakEnd: event.target.value })}
                      disabled={row.isClosed}
                      placeholder="--:--"
                      inputMode="numeric"
                      className="w-24"
                      aria-label={`${weekdays[row.dayOfWeek]} ${t("settings.breakTime")}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-[--color-ink-subtle]">
          {locale === "en"
            ? "To close after midnight, enter a time past 24:00 — 02:00 becomes 26:00."
            : "深夜まで営業する場合は 24:00 を超えた時刻を入力してください（翌 2:00 は 26:00）。"}
        </p>

        <div className="flex justify-end">
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? t("settings.saving") : t("settings.save")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
