/**
 * Timezone-aware time helpers.
 *
 * The database stores `timestamptz` in UTC without exception. Everything a
 * salon operator sees is expressed in the *store's* timezone, which may
 * differ from the browser's and from the server's. These helpers are the only
 * sanctioned way to cross that boundary.
 *
 * No dependency on the host `TZ` — every conversion names its zone explicitly.
 */

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  second: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    });
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

/** Decompose a UTC instant into wall-clock parts in the given timezone. */
export function toZonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = partsFormatter(timeZone).formatToParts(instant);
  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") lookup[part.type] = part.value;
  }

  // Intl renders midnight as "24" in some ICU versions; normalise it.
  const hour = Number(lookup.hour ?? "0") % 24;

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour,
    minute: Number(lookup.minute ?? "0"),
    second: Number(lookup.second ?? "0"),
    weekday: WEEKDAY_INDEX[lookup.weekday ?? "Sun"] ?? 0,
  };
}

/** Offset of `timeZone` from UTC at `instant`, in minutes (JST -> +540). */
export function zoneOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = toZonedParts(instant, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  // Drop sub-second precision on both sides before differencing.
  return (asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60_000;
}

/**
 * Convert a wall-clock time in `timeZone` to the corresponding UTC instant.
 *
 * Two passes are required because the offset itself depends on the instant:
 * the first guess picks an offset, the second confirms it. This resolves DST
 * transitions correctly for every zone except within the ambiguous hour of a
 * fall-back, where the earlier (pre-transition) instant is chosen.
 */
export function zonedTimeToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute, second);

  let offset = zoneOffsetMinutes(new Date(naive), timeZone);
  let instant = new Date(naive - offset * 60_000);

  const confirmed = zoneOffsetMinutes(instant, timeZone);
  if (confirmed !== offset) {
    offset = confirmed;
    instant = new Date(naive - offset * 60_000);
  }

  return instant;
}

/**
 * UTC instant for local midnight of the given calendar date.
 * `date` must be `YYYY-MM-DD`.
 */
export function startOfZonedDay(dateISO: string, timeZone: string): Date {
  const { year, month, day } = parseISODate(dateISO);
  return zonedTimeToUtc(timeZone, year, month, day, 0, 0, 0);
}

/** UTC instant for local midnight at the start of the following day. */
export function endOfZonedDay(dateISO: string, timeZone: string): Date {
  const { year, month, day } = parseISODate(dateISO);
  // Day + 1 via UTC arithmetic on the calendar date, not on the instant.
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return zonedTimeToUtc(
    timeZone,
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
    0,
    0,
    0,
  );
}

/**
 * UTC instant for `minutesFromMidnight` on the given local calendar date.
 * Minutes beyond 1440 roll into the next day, which is how late-night salon
 * closing times (e.g. 26:00) are represented.
 */
export function zonedDateAtMinute(
  dateISO: string,
  minutesFromMidnight: number,
  timeZone: string,
): Date {
  const { year, month, day } = parseISODate(dateISO);
  const extraDays = Math.floor(minutesFromMidnight / 1440);
  const withinDay = minutesFromMidnight - extraDays * 1440;
  const shifted = new Date(Date.UTC(year, month - 1, day + extraDays));

  return zonedTimeToUtc(
    timeZone,
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
    Math.floor(withinDay / 60),
    withinDay % 60,
    0,
  );
}

/** `YYYY-MM-DD` for the instant, as seen in `timeZone`. */
export function zonedDateISO(instant: Date, timeZone: string): string {
  const { year, month, day } = toZonedParts(instant, timeZone);
  return `${pad4(year)}-${pad2(month)}-${pad2(day)}`;
}

/** `HH:mm` for the instant, as seen in `timeZone`. */
export function zonedTimeHHmm(instant: Date, timeZone: string): string {
  const { hour, minute } = toZonedParts(instant, timeZone);
  return `${pad2(hour)}:${pad2(minute)}`;
}

/** Minutes from local midnight for the instant, as seen in `timeZone`. */
export function zonedMinuteOfDay(instant: Date, timeZone: string): number {
  const { hour, minute } = toZonedParts(instant, timeZone);
  return hour * 60 + minute;
}

/** 0 = Sunday … 6 = Saturday, as seen in `timeZone`. */
export function zonedWeekday(instant: Date, timeZone: string): number {
  return toZonedParts(instant, timeZone).weekday;
}

/** Add whole days to a `YYYY-MM-DD` string without touching timezones. */
export function addDaysISO(dateISO: string, days: number): string {
  const { year, month, day } = parseISODate(dateISO);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${pad4(shifted.getUTCFullYear())}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(
    shifted.getUTCDate(),
  )}`;
}

/** Inclusive list of `YYYY-MM-DD` strings from `from` to `to`. */
export function dateRangeISO(fromISO: string, toISO: string): string[] {
  const result: string[] = [];
  let cursor = fromISO;
  // Guard against inverted ranges producing an unbounded loop.
  for (let i = 0; i < 366 && cursor <= toISO; i += 1) {
    result.push(cursor);
    cursor = addDaysISO(cursor, 1);
  }
  return result;
}

/** Minutes elapsed between two instants, rounded down. */
export function minutesBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 60_000);
}

export function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * 60_000);
}

/** Format `minutesFromMidnight` as `HH:mm`, allowing values past 24:00. */
export function formatMinuteOfDay(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  return `${pad2(hour)}:${pad2(minutes % 60)}`;
}

/** Parse `HH:mm` into minutes from midnight. Returns null when malformed. */
export function parseMinuteOfDay(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (minute > 59 || hour > 47) return null;
  return hour * 60 + minute;
}

function parseISODate(dateISO: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!match) {
    throw new Error(`Expected a YYYY-MM-DD date, received "${dateISO}"`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function pad4(value: number): string {
  return String(value).padStart(4, "0");
}
