import { describe, expect, it } from "vitest";

import {
  computeAvailability,
  earliestBookableAt,
  resolveOpenWindows,
  verifySlot,
  type BookingPolicy,
  type BusinessHourSpec,
  type ResourceAvailability,
  type StaffAvailability,
} from "@/server/booking-engine/availability";
import {
  contains,
  coveredBy,
  intersectIntervals,
  mergeIntervals,
  overlaps,
  subtractIntervals,
} from "@/server/booking-engine/interval";
import { buildOccupancyPlan, compactSegments } from "@/server/booking-engine/occupancy";
import { zonedDateAtMinute } from "@/lib/time";

const TOKYO = "Asia/Tokyo";
const DATE = "2026-08-03"; // a Monday

function at(minute: number): Date {
  return zonedDateAtMinute(DATE, minute, TOKYO);
}

const OPEN_10_TO_19: BusinessHourSpec[] = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek,
  openMinute: 10 * 60,
  closeMinute: 19 * 60,
  breakStartMinute: null,
  breakEndMinute: null,
  isClosed: false,
}));

const POLICY: BookingPolicy = {
  slotIntervalMinutes: 30,
  bookingCutoffMinutes: 0,
  minAdvanceMinutes: 0,
  maxAdvanceDays: 60,
};

// A time well before the shop opens, so lead-time rules never interfere.
const NOW = new Date("2026-08-02T00:00:00.000Z");

const CUT: Parameters<typeof buildOccupancyPlan>[0][number] = {
  serviceId: "svc-cut",
  name: "カット",
  price: 5500,
  durationMinutes: 60,
  prepMinutes: 0,
  cleanupMinutes: 0,
  resources: [],
};

// ---------------------------------------------------------------------------

describe("interval algebra", () => {
  it("treats touching intervals as non-overlapping (half-open)", () => {
    const a = { start: at(600), end: at(660) };
    const b = { start: at(660), end: at(720) };
    expect(overlaps(a, b)).toBe(false);
  });

  it("detects a genuine overlap", () => {
    expect(
      overlaps({ start: at(600), end: at(660) }, { start: at(630), end: at(690) }),
    ).toBe(true);
  });

  it("merges adjacent and overlapping intervals", () => {
    const merged = mergeIntervals([
      { start: at(600), end: at(660) },
      { start: at(660), end: at(720) },
      { start: at(800), end: at(830) },
    ]);
    expect(merged).toHaveLength(2);
    expect(merged[0]?.end.getTime()).toBe(at(720).getTime());
  });

  it("subtracts a hole from the middle of a window", () => {
    const result = subtractIntervals(
      [{ start: at(600), end: at(720) }],
      [{ start: at(630), end: at(660) }],
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ start: at(600), end: at(630) });
    expect(result[1]).toMatchObject({ start: at(660), end: at(720) });
  });

  it("intersects two sets", () => {
    const result = intersectIntervals(
      [{ start: at(600), end: at(720) }],
      [{ start: at(660), end: at(780) }],
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ start: at(660), end: at(720) });
  });

  it("reports coverage correctly", () => {
    const window = [{ start: at(600), end: at(720) }];
    expect(coveredBy([{ start: at(610), end: at(650) }], window)).toBe(true);
    expect(coveredBy([{ start: at(610), end: at(730) }], window)).toBe(false);
    expect(contains(window[0]!, { start: at(600), end: at(720) })).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe("buildOccupancyPlan", () => {
  it("occupies staff for the whole service when there is no processing gap", () => {
    const plan = buildOccupancyPlan([CUT]);
    expect(plan.customerMinutes).toBe(60);
    expect(plan.staffSegments).toEqual([
      { startOffset: 0, endOffset: 60, serviceId: "svc-cut", sequence: 0 },
    ]);
    expect(plan.subtotal).toBe(5500);
  });

  it("extends staff occupancy by prep and cleanup without extending the customer's visit", () => {
    const plan = buildOccupancyPlan([{ ...CUT, prepMinutes: 10, cleanupMinutes: 15 }]);
    expect(plan.customerMinutes).toBe(60);
    expect(plan.staffSegments[0]).toMatchObject({ startOffset: -10, endOffset: 75 });
    expect(plan.minOffset).toBe(-10);
    expect(plan.maxOffset).toBe(75);
  });

  it("releases staff during the unattended window but keeps the chair", () => {
    // Colour: 30 apply / 30 process / 30 finish, on one chair.
    const plan = buildOccupancyPlan([
      {
        serviceId: "svc-color",
        name: "カラー",
        price: 9900,
        durationMinutes: 90,
        prepMinutes: 0,
        cleanupMinutes: 0,
        unattendedStartMinute: 30,
        unattendedMinutes: 30,
        resources: [{ resourceTypeId: "chair", quantity: 1, holdsDuringUnattended: true }],
      },
    ]);

    expect(plan.staffSegments).toEqual([
      { startOffset: 0, endOffset: 30, serviceId: "svc-color", sequence: 0 },
      { startOffset: 60, endOffset: 90, serviceId: "svc-color", sequence: 0 },
    ]);
    // The chair is held for the full 90 minutes.
    expect(plan.resourceSegments).toEqual([
      {
        startOffset: 0,
        endOffset: 90,
        serviceId: "svc-color",
        sequence: 0,
        resourceTypeId: "chair",
        quantity: 1,
      },
    ]);
  });

  it("frees the resource too when it does not hold during processing", () => {
    const plan = buildOccupancyPlan([
      {
        serviceId: "svc-color",
        name: "カラー",
        price: 9900,
        durationMinutes: 90,
        prepMinutes: 0,
        cleanupMinutes: 0,
        unattendedStartMinute: 30,
        unattendedMinutes: 30,
        resources: [{ resourceTypeId: "chair", quantity: 1, holdsDuringUnattended: false }],
      },
    ]);
    expect(plan.resourceSegments).toHaveLength(2);
  });

  it("ignores an unattended window that would overrun the service", () => {
    const plan = buildOccupancyPlan([
      { ...CUT, unattendedStartMinute: 30, unattendedMinutes: 40 },
    ]);
    expect(plan.staffSegments).toHaveLength(1);
  });

  it("chains multiple services back to back", () => {
    const plan = buildOccupancyPlan([CUT, { ...CUT, serviceId: "svc-spa", name: "スパ", durationMinutes: 30, price: 3300 }]);
    expect(plan.customerMinutes).toBe(90);
    expect(plan.subtotal).toBe(8800);
    expect(plan.serviceWindows[1]).toMatchObject({ startOffset: 60, endOffset: 90 });
  });

  it("adds option duration and price to the service", () => {
    const plan = buildOccupancyPlan([
      {
        ...CUT,
        options: [
          { serviceOptionId: "opt-1", name: "トリートメント", price: 2200, durationMinutes: 20 },
        ],
      },
    ]);
    expect(plan.customerMinutes).toBe(80);
    expect(plan.subtotal).toBe(7700);
  });

  it("scales durations for a slower staff member, rounding up", () => {
    const plan = buildOccupancyPlan([CUT], { durationFactorBps: 12_500 });
    expect(plan.customerMinutes).toBe(75);
  });

  it("extends only the staff block with the store buffer", () => {
    const plan = buildOccupancyPlan([CUT], { bufferMinutes: 10 });
    expect(plan.customerMinutes).toBe(60);
    expect(plan.staffSegments[0]?.endOffset).toBe(70);
  });

  it("compacts touching segments into one", () => {
    const compacted = compactSegments([
      { startOffset: 0, endOffset: 30, serviceId: "a", sequence: 0 },
      { startOffset: 30, endOffset: 60, serviceId: "b", sequence: 1 },
    ]);
    expect(compacted).toHaveLength(1);
    expect(compacted[0]).toMatchObject({ startOffset: 0, endOffset: 60 });
  });
});

// ---------------------------------------------------------------------------

describe("resolveOpenWindows", () => {
  it("returns the opening window for a normal day", () => {
    const windows = resolveOpenWindows(DATE, TOKYO, OPEN_10_TO_19, []);
    expect(windows).toHaveLength(1);
    expect(windows[0]).toMatchObject({ start: at(600), end: at(1140) });
  });

  it("returns nothing on a weekly closing day", () => {
    const closed = OPEN_10_TO_19.map((hour) =>
      hour.dayOfWeek === 1 ? { ...hour, isClosed: true } : hour,
    );
    expect(resolveOpenWindows(DATE, TOKYO, closed, [])).toEqual([]);
  });

  it("returns nothing on an ad-hoc holiday", () => {
    expect(
      resolveOpenWindows(DATE, TOKYO, OPEN_10_TO_19, [
        { dateISO: DATE, isClosed: true },
      ]),
    ).toEqual([]);
  });

  it("lets a holiday row override the hours instead of closing", () => {
    const windows = resolveOpenWindows(DATE, TOKYO, OPEN_10_TO_19, [
      { dateISO: DATE, isClosed: false, openMinute: 13 * 60, closeMinute: 17 * 60 },
    ]);
    expect(windows[0]).toMatchObject({ start: at(780), end: at(1020) });
  });

  it("splits the day around a midday closure", () => {
    const withBreak = OPEN_10_TO_19.map((hour) => ({
      ...hour,
      breakStartMinute: 13 * 60,
      breakEndMinute: 14 * 60,
    }));
    const windows = resolveOpenWindows(DATE, TOKYO, withBreak, []);
    expect(windows).toHaveLength(2);
    expect(windows[0]).toMatchObject({ start: at(600), end: at(780) });
    expect(windows[1]).toMatchObject({ start: at(840), end: at(1140) });
  });
});

// ---------------------------------------------------------------------------

function staff(overrides: Partial<StaffAvailability> = {}): StaffAvailability {
  return {
    staffId: "staff-1",
    workWindows: [{ start: at(600), end: at(1140) }],
    busy: [],
    durationFactorBps: 10_000,
    canPerformAll: true,
    remainingDailyCapacity: null,
    ...overrides,
  };
}

function baseRequest(overrides: Record<string, unknown> = {}) {
  return {
    dateISO: DATE,
    timeZone: TOKYO,
    now: NOW,
    policy: POLICY,
    businessHours: OPEN_10_TO_19,
    holidays: [],
    plan: buildOccupancyPlan([CUT]),
    staff: [staff()],
    resources: [] as ResourceAvailability[],
    requireResources: false,
    ...overrides,
  };
}

describe("computeAvailability", () => {
  it("offers slots on the configured grid up to the last one that fits", () => {
    const slots = computeAvailability(baseRequest());

    expect(slots[0]?.startAt.getTime()).toBe(at(600).getTime());
    // A 60-minute service in a 10:00–19:00 day: last start is 18:00.
    expect(slots[slots.length - 1]?.startAt.getTime()).toBe(at(1080).getTime());
    // 10:00 to 18:00 inclusive on a 30-minute grid = 17 slots.
    expect(slots).toHaveLength(17);
  });

  it("returns nothing when the store is closed", () => {
    expect(
      computeAvailability(baseRequest({ holidays: [{ dateISO: DATE, isClosed: true }] })),
    ).toEqual([]);
  });

  it("removes slots that collide with an existing booking", () => {
    const slots = computeAvailability(
      baseRequest({ staff: [staff({ busy: [{ start: at(720), end: at(780) }] })] }),
    );
    const starts = slots.map((slot) => slot.startAt.getTime());

    // 11:30, 12:00 and 12:30 all overlap a 12:00–13:00 booking.
    expect(starts).not.toContain(at(690).getTime());
    expect(starts).not.toContain(at(720).getTime());
    expect(starts).not.toContain(at(750).getTime());
    // 13:00 is free again.
    expect(starts).toContain(at(780).getTime());
  });

  it("respects the roster rather than the shop's opening hours", () => {
    const slots = computeAvailability(
      baseRequest({ staff: [staff({ workWindows: [{ start: at(600), end: at(720) }] })] }),
    );
    // The shop is open until 19:00, but the shift ends at 12:00. On the
    // 30-minute grid only 10:00, 10:30 and 11:00 leave a full hour inside it.
    expect(slots.map((slot) => slot.startAt.getTime())).toEqual([
      at(600).getTime(),
      at(630).getTime(),
      at(660).getTime(),
    ]);
  });

  it("does not offer a service that would straddle the midday closure", () => {
    const withBreak = OPEN_10_TO_19.map((hour) => ({
      ...hour,
      breakStartMinute: 13 * 60,
      breakEndMinute: 14 * 60,
    }));
    const slots = computeAvailability(baseRequest({ businessHours: withBreak }));
    const starts = slots.map((slot) => slot.startAt.getTime());

    expect(starts).not.toContain(at(750).getTime()); // 12:30 would run into 13:30
    expect(starts).toContain(at(720).getTime()); // 12:00–13:00 fits
    expect(starts).toContain(at(840).getTime()); // 14:00 after reopening
  });

  it("excludes staff who cannot perform the menu", () => {
    expect(
      computeAvailability(baseRequest({ staff: [staff({ canPerformAll: false })] })),
    ).toEqual([]);
  });

  it("honours a customer's staff designation", () => {
    const slots = computeAvailability(
      baseRequest({
        staff: [staff({ staffId: "a" }), staff({ staffId: "b" })],
        requestedStaffId: "b",
      }),
    );
    expect(slots.every((slot) => slot.staffId === "b")).toBe(true);
  });

  it("falls through to a second staff member when the first is busy", () => {
    const slots = computeAvailability(
      baseRequest({
        staff: [
          staff({ staffId: "a", busy: [{ start: at(600), end: at(1140) }] }),
          staff({ staffId: "b" }),
        ],
      }),
    );
    expect(slots).not.toHaveLength(0);
    expect(slots.every((slot) => slot.staffId === "b")).toBe(true);
  });

  it("stops offering slots once a staff member's daily cap is reached", () => {
    expect(
      computeAvailability(baseRequest({ staff: [staff({ remainingDailyCapacity: 0 })] })),
    ).toEqual([]);
  });

  it("applies the booking cutoff", () => {
    // 12:00 JST on the day itself, with a 2-hour cutoff -> nothing before 14:00.
    const slots = computeAvailability(
      baseRequest({
        now: at(720),
        policy: { ...POLICY, bookingCutoffMinutes: 120 },
      }),
    );
    expect(slots[0]?.startAt.getTime()).toBe(at(840).getTime());
  });

  it("refuses dates beyond the advance-booking limit", () => {
    expect(
      computeAvailability(
        baseRequest({
          now: new Date("2026-01-01T00:00:00.000Z"),
          policy: { ...POLICY, maxAdvanceDays: 7 },
        }),
      ),
    ).toEqual([]);
  });

  it("refuses dates in the past", () => {
    expect(
      computeAvailability(baseRequest({ now: new Date("2026-09-01T00:00:00.000Z") })),
    ).toEqual([]);
  });
});

describe("computeAvailability — resources", () => {
  const colourPlan = buildOccupancyPlan([
    {
      serviceId: "svc-color",
      name: "カラー",
      price: 9900,
      durationMinutes: 60,
      prepMinutes: 0,
      cleanupMinutes: 0,
      resources: [{ resourceTypeId: "chair", quantity: 1, holdsDuringUnattended: true }],
    },
  ]);

  it("assigns a free chair", () => {
    const slots = computeAvailability(
      baseRequest({
        plan: colourPlan,
        requireResources: true,
        resources: [{ resourceId: "chair-1", resourceTypeId: "chair", busy: [] }],
      }),
    );
    expect(slots[0]?.resourceIds).toEqual(["chair-1"]);
  });

  it("refuses a slot when every chair of the required type is taken", () => {
    const slots = computeAvailability(
      baseRequest({
        plan: colourPlan,
        requireResources: true,
        resources: [
          {
            resourceId: "chair-1",
            resourceTypeId: "chair",
            busy: [{ start: at(600), end: at(1140) }],
          },
        ],
      }),
    );
    expect(slots).toEqual([]);
  });

  it("uses the second chair when the first is busy", () => {
    const slots = computeAvailability(
      baseRequest({
        plan: colourPlan,
        requireResources: true,
        resources: [
          {
            resourceId: "chair-1",
            resourceTypeId: "chair",
            busy: [{ start: at(600), end: at(720) }],
          },
          { resourceId: "chair-2", resourceTypeId: "chair", busy: [] },
        ],
      }),
    );
    expect(slots[0]?.resourceIds).toEqual(["chair-2"]);
  });

  it("refuses when the required resource type does not exist at the store", () => {
    const slots = computeAvailability(
      baseRequest({
        plan: colourPlan,
        requireResources: true,
        resources: [{ resourceId: "bed-1", resourceTypeId: "bed", busy: [] }],
      }),
    );
    expect(slots).toEqual([]);
  });
});

describe("verifySlot", () => {
  it("accepts a slot that is genuinely free", () => {
    const verdict = verifySlot({
      ...baseRequest(),
      startAt: at(600),
      staffId: "staff-1",
    });
    expect(verdict.ok).toBe(true);
  });

  it("rejects a slot the staff member is already booked for", () => {
    const verdict = verifySlot({
      ...baseRequest({ staff: [staff({ busy: [{ start: at(600), end: at(660) }] })] }),
      startAt: at(600),
      staffId: "staff-1",
    });
    expect(verdict).toMatchObject({ ok: false, reason: "STAFF_UNAVAILABLE" });
  });

  it("rejects a slot outside opening hours", () => {
    const verdict = verifySlot({
      ...baseRequest({ staff: [staff({ workWindows: [{ start: at(480), end: at(1200) }] })] }),
      startAt: at(540), // 09:00, before the 10:00 opening
      staffId: "staff-1",
    });
    expect(verdict).toMatchObject({ ok: false, reason: "OUTSIDE_BUSINESS_HOURS" });
  });

  it("rejects a closed day", () => {
    const verdict = verifySlot({
      ...baseRequest({ holidays: [{ dateISO: DATE, isClosed: true }] }),
      startAt: at(600),
      staffId: "staff-1",
    });
    expect(verdict).toMatchObject({ ok: false, reason: "STORE_CLOSED" });
  });

  it("rejects a booking made after the cutoff", () => {
    const verdict = verifySlot({
      ...baseRequest({ now: at(660), policy: { ...POLICY, bookingCutoffMinutes: 120 } }),
      startAt: at(660),
      staffId: "staff-1",
    });
    expect(verdict).toMatchObject({ ok: false, reason: "BOOKING_CUTOFF_PASSED" });
  });

  it("rejects an unknown staff member", () => {
    const verdict = verifySlot({
      ...baseRequest(),
      startAt: at(600),
      staffId: "nobody",
    });
    expect(verdict).toMatchObject({ ok: false, reason: "STAFF_UNAVAILABLE" });
  });

  it("reports the resource shortage specifically", () => {
    const plan = buildOccupancyPlan([
      {
        ...CUT,
        resources: [{ resourceTypeId: "chair", quantity: 1, holdsDuringUnattended: true }],
      },
    ]);
    const verdict = verifySlot({
      ...baseRequest({
        plan,
        requireResources: true,
        resources: [
          {
            resourceId: "chair-1",
            resourceTypeId: "chair",
            busy: [{ start: at(600), end: at(660) }],
          },
        ],
      }),
      startAt: at(600),
      staffId: "staff-1",
    });
    expect(verdict).toMatchObject({ ok: false, reason: "RESOURCE_UNAVAILABLE" });
  });
});

describe("earliestBookableAt", () => {
  it("takes the larger of the lead time and the cutoff", () => {
    const now = new Date("2026-08-03T00:00:00.000Z");
    expect(
      earliestBookableAt(now, { ...POLICY, minAdvanceMinutes: 30, bookingCutoffMinutes: 120 }),
    ).toEqual(new Date("2026-08-03T02:00:00.000Z"));
  });
});
