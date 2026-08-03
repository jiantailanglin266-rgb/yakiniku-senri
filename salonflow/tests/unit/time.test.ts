import { describe, expect, it } from "vitest";

import {
  addDaysISO,
  dateRangeISO,
  endOfZonedDay,
  formatMinuteOfDay,
  parseMinuteOfDay,
  startOfZonedDay,
  toZonedParts,
  zonedDateAtMinute,
  zonedDateISO,
  zonedMinuteOfDay,
  zonedTimeHHmm,
  zoneOffsetMinutes,
  zonedTimeToUtc,
} from "@/lib/time";

const TOKYO = "Asia/Tokyo";
const NEW_YORK = "America/New_York";

describe("zonedTimeToUtc", () => {
  it("converts Tokyo wall-clock time to the correct UTC instant", () => {
    // 2026-08-03 10:00 JST is 2026-08-03 01:00 UTC (JST is UTC+9, no DST).
    const instant = zonedTimeToUtc(TOKYO, 2026, 8, 3, 10, 0);
    expect(instant.toISOString()).toBe("2026-08-03T01:00:00.000Z");
  });

  it("handles a day boundary where local and UTC dates differ", () => {
    // 2026-08-03 08:00 JST is still 2026-08-02 in UTC.
    const instant = zonedTimeToUtc(TOKYO, 2026, 8, 3, 8, 0);
    expect(instant.toISOString()).toBe("2026-08-02T23:00:00.000Z");
  });

  it("applies the correct offset on either side of a DST transition", () => {
    // US DST began 2026-03-08. 01:30 is EST (-5), 03:30 is EDT (-4).
    const beforeDst = zonedTimeToUtc(NEW_YORK, 2026, 3, 8, 1, 30);
    const afterDst = zonedTimeToUtc(NEW_YORK, 2026, 3, 8, 3, 30);

    expect(beforeDst.toISOString()).toBe("2026-03-08T06:30:00.000Z");
    expect(afterDst.toISOString()).toBe("2026-03-08T07:30:00.000Z");
  });

  it("round-trips through toZonedParts", () => {
    const instant = zonedTimeToUtc(NEW_YORK, 2026, 11, 1, 14, 45);
    const parts = toZonedParts(instant, NEW_YORK);

    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(11);
    expect(parts.day).toBe(1);
    expect(parts.hour).toBe(14);
    expect(parts.minute).toBe(45);
  });
});

describe("zoneOffsetMinutes", () => {
  it("reports +540 for Tokyo year-round", () => {
    expect(zoneOffsetMinutes(new Date("2026-01-15T00:00:00Z"), TOKYO)).toBe(540);
    expect(zoneOffsetMinutes(new Date("2026-07-15T00:00:00Z"), TOKYO)).toBe(540);
  });

  it("tracks the DST shift in New York", () => {
    expect(zoneOffsetMinutes(new Date("2026-01-15T12:00:00Z"), NEW_YORK)).toBe(-300);
    expect(zoneOffsetMinutes(new Date("2026-07-15T12:00:00Z"), NEW_YORK)).toBe(-240);
  });
});

describe("day boundaries", () => {
  it("startOfZonedDay is local midnight expressed in UTC", () => {
    expect(startOfZonedDay("2026-08-03", TOKYO).toISOString()).toBe(
      "2026-08-02T15:00:00.000Z",
    );
  });

  it("endOfZonedDay is the next local midnight", () => {
    expect(endOfZonedDay("2026-08-03", TOKYO).toISOString()).toBe(
      "2026-08-03T15:00:00.000Z",
    );
  });

  it("spans exactly 24 hours on an ordinary day", () => {
    const start = startOfZonedDay("2026-08-03", TOKYO);
    const end = endOfZonedDay("2026-08-03", TOKYO);
    expect(end.getTime() - start.getTime()).toBe(24 * 3600_000);
  });

  it("spans 23 hours on a spring-forward day", () => {
    const start = startOfZonedDay("2026-03-08", NEW_YORK);
    const end = endOfZonedDay("2026-03-08", NEW_YORK);
    expect(end.getTime() - start.getTime()).toBe(23 * 3600_000);
  });
});

describe("zonedDateAtMinute", () => {
  it("resolves a minute-of-day to the right instant", () => {
    // 10:30 JST -> 01:30 UTC
    expect(zonedDateAtMinute("2026-08-03", 10 * 60 + 30, TOKYO).toISOString()).toBe(
      "2026-08-03T01:30:00.000Z",
    );
  });

  it("rolls minutes past midnight into the next day", () => {
    // 26:00 (2am the next day) JST -> 17:00 UTC the previous day
    expect(zonedDateAtMinute("2026-08-03", 26 * 60, TOKYO).toISOString()).toBe(
      "2026-08-03T17:00:00.000Z",
    );
  });
});

describe("display helpers", () => {
  it("renders the local date and time for a UTC instant", () => {
    const instant = new Date("2026-08-02T23:30:00.000Z");
    expect(zonedDateISO(instant, TOKYO)).toBe("2026-08-03");
    expect(zonedTimeHHmm(instant, TOKYO)).toBe("08:30");
    expect(zonedMinuteOfDay(instant, TOKYO)).toBe(8 * 60 + 30);
  });

  it("formats minutes past 24:00 without wrapping", () => {
    expect(formatMinuteOfDay(9 * 60)).toBe("09:00");
    expect(formatMinuteOfDay(26 * 60 + 30)).toBe("26:30");
  });

  it("parses HH:mm and rejects nonsense", () => {
    expect(parseMinuteOfDay("09:30")).toBe(570);
    expect(parseMinuteOfDay("26:00")).toBe(1560);
    expect(parseMinuteOfDay("9:5")).toBeNull();
    expect(parseMinuteOfDay("09:75")).toBeNull();
    expect(parseMinuteOfDay("abc")).toBeNull();
  });
});

describe("date arithmetic", () => {
  it("adds days across a month boundary", () => {
    expect(addDaysISO("2026-08-30", 3)).toBe("2026-09-02");
    expect(addDaysISO("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("handles a leap day", () => {
    expect(addDaysISO("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysISO("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("builds an inclusive range", () => {
    expect(dateRangeISO("2026-08-01", "2026-08-04")).toEqual([
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
      "2026-08-04",
    ]);
  });

  it("returns an empty range when inverted", () => {
    expect(dateRangeISO("2026-08-04", "2026-08-01")).toEqual([]);
  });
});
