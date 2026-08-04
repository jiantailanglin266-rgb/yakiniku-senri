import { describe, expect, it } from "vitest";

import {
  isPermanentlyClosed,
  shiftOverlapsHours,
  validateBookingPolicy,
  validateBusinessHour,
  validateBusinessHours,
  validateService,
  validateShift,
  validateStaff,
  type BusinessHourInput,
} from "@/server/modules/settings/validation";

/**
 * Master-data validation.
 *
 * These rules guard the inputs to the availability calculation. A service
 * whose processing gap runs past its own end, or a week where every day is
 * closed, does not fail loudly at booking time — it silently produces wrong or
 * empty availability, which is the failure mode hardest to diagnose from the
 * outside.
 */

function hour(overrides: Partial<BusinessHourInput> = {}): BusinessHourInput {
  return {
    dayOfWeek: 1,
    isClosed: false,
    openMinute: 600, // 10:00
    closeMinute: 1140, // 19:00
    breakStartMinute: null,
    breakEndMinute: null,
    ...overrides,
  };
}

describe("validateBusinessHour", () => {
  it("accepts a plain open day", () => {
    expect(validateBusinessHour(hour()).ok).toBe(true);
  });

  it("rejects a close at or before the open", () => {
    expect(validateBusinessHour(hour({ closeMinute: 600 })).problems).toContain(
      "hours.close_before_open",
    );
    expect(validateBusinessHour(hour({ closeMinute: 540 })).problems).toContain(
      "hours.close_before_open",
    );
  });

  it("allows closing after midnight", () => {
    // 26:00 is 02:00 the next day. Rejecting this would make the product
    // unusable for late-opening salons.
    expect(validateBusinessHour(hour({ closeMinute: 26 * 60 })).ok).toBe(true);
  });

  it("rejects a close beyond a day and a half", () => {
    expect(validateBusinessHour(hour({ closeMinute: 37 * 60 })).problems).toContain(
      "hours.close_out_of_range",
    );
  });

  it("ignores the times on a closed day", () => {
    // The form still holds whatever was last typed; a stale value the operator
    // cannot see must not block saving "Tuesday: closed".
    const result = validateBusinessHour(
      hour({ isClosed: true, openMinute: 1200, closeMinute: 600 }),
    );
    expect(result.ok).toBe(true);
  });

  it("requires both ends of a break", () => {
    expect(validateBusinessHour(hour({ breakStartMinute: 780 })).problems).toContain(
      "hours.break_incomplete",
    );
    expect(validateBusinessHour(hour({ breakEndMinute: 840 })).problems).toContain(
      "hours.break_incomplete",
    );
  });

  it("requires the break to sit inside opening hours", () => {
    expect(
      validateBusinessHour(hour({ breakStartMinute: 540, breakEndMinute: 600 })).problems,
    ).toContain("hours.break_outside_hours");

    expect(
      validateBusinessHour(hour({ breakStartMinute: 1100, breakEndMinute: 1200 })).problems,
    ).toContain("hours.break_outside_hours");
  });

  it("rejects a backwards break", () => {
    expect(
      validateBusinessHour(hour({ breakStartMinute: 840, breakEndMinute: 780 })).problems,
    ).toContain("hours.break_end_before_start");
  });

  it("rejects a day of week outside 0-6", () => {
    expect(validateBusinessHour(hour({ dayOfWeek: 7 })).problems).toContain(
      "hours.day_out_of_range",
    );
  });
});

describe("validateBusinessHours", () => {
  it("catches a duplicated weekday", () => {
    const week = [hour({ dayOfWeek: 1 }), hour({ dayOfWeek: 1 })];
    expect(validateBusinessHours(week).problems).toContain("hours.duplicate_day");
  });

  it("does not repeat the same problem code", () => {
    const week = [hour({ closeMinute: 60 }), hour({ dayOfWeek: 2, closeMinute: 60 })];
    const problems = validateBusinessHours(week).problems;
    expect(problems.filter((code) => code === "hours.close_before_open")).toHaveLength(1);
  });
});

describe("isPermanentlyClosed", () => {
  it("is true only when every day is closed", () => {
    const allClosed = Array.from({ length: 7 }, (_, day) =>
      hour({ dayOfWeek: day, isClosed: true }),
    );
    expect(isPermanentlyClosed(allClosed)).toBe(true);

    allClosed[3] = hour({ dayOfWeek: 3, isClosed: false });
    expect(isPermanentlyClosed(allClosed)).toBe(false);
  });

  it("is false for an empty week rather than true", () => {
    // "No rows" means unconfigured, not "closed forever"; reporting the latter
    // would fire the warning on a screen the operator has not filled in yet.
    expect(isPermanentlyClosed([])).toBe(false);
  });
});

describe("validateBookingPolicy", () => {
  const base = {
    slotIntervalMinutes: 15,
    bookingCutoffMinutes: 60,
    minAdvanceMinutes: 30,
    maxAdvanceDays: 60,
    bufferMinutes: 5,
    cancelDeadlineHours: 24,
  };

  it("accepts a sensible policy", () => {
    expect(validateBookingPolicy(base).ok).toBe(true);
  });

  it("bounds the slot interval on both sides", () => {
    expect(validateBookingPolicy({ ...base, slotIntervalMinutes: 1 }).problems).toContain(
      "policy.slot_interval_too_small",
    );
    expect(validateBookingPolicy({ ...base, slotIntervalMinutes: 90 }).problems).toContain(
      "policy.slot_interval_too_large",
    );
  });

  it("rejects negative durations", () => {
    expect(validateBookingPolicy({ ...base, bufferMinutes: -1 }).problems).toContain(
      "policy.buffer_negative",
    );
    expect(validateBookingPolicy({ ...base, cancelDeadlineHours: -1 }).problems).toContain(
      "policy.cancel_deadline_negative",
    );
  });

  it("requires a booking window of at least one day", () => {
    expect(validateBookingPolicy({ ...base, maxAdvanceDays: 0 }).problems).toContain(
      "policy.max_advance_too_small",
    );
  });
});

describe("validateService", () => {
  const base = {
    name: "カット",
    price: 5500,
    durationMinutes: 60,
    prepMinutes: 0,
    cleanupMinutes: 0,
    unattendedStartMinute: null,
    unattendedMinutes: null,
  };

  it("accepts a plain service", () => {
    expect(validateService(base).ok).toBe(true);
  });

  it("accepts a free service", () => {
    // A complimentary fringe trim is a real menu item.
    expect(validateService({ ...base, price: 0 }).ok).toBe(true);
  });

  it("rejects a negative price", () => {
    expect(validateService({ ...base, price: -1 }).problems).toContain("service.price_invalid");
  });

  it("rejects a blank or whitespace-only name", () => {
    expect(validateService({ ...base, name: "" }).problems).toContain("service.name_required");
    expect(validateService({ ...base, name: "   " }).problems).toContain("service.name_required");
  });

  it("accepts a processing gap that fits", () => {
    const colour = {
      ...base,
      durationMinutes: 90,
      unattendedStartMinute: 30,
      unattendedMinutes: 30,
    };
    expect(validateService(colour).ok).toBe(true);
  });

  it("rejects a processing gap running past the end of the service", () => {
    // This is the one that matters: the occupancy plan would emit a staff
    // block of negative length and availability would offer unworkable slots.
    const broken = {
      ...base,
      durationMinutes: 60,
      unattendedStartMinute: 45,
      unattendedMinutes: 30,
    };
    expect(validateService(broken).problems).toContain("service.unattended_exceeds_duration");
  });

  it("accepts a gap that ends exactly at the end of the service", () => {
    const edge = {
      ...base,
      durationMinutes: 60,
      unattendedStartMinute: 30,
      unattendedMinutes: 30,
    };
    expect(validateService(edge).ok).toBe(true);
  });

  it("requires both halves of the processing gap", () => {
    expect(validateService({ ...base, unattendedStartMinute: 30 }).problems).toContain(
      "service.unattended_incomplete",
    );
    expect(validateService({ ...base, unattendedMinutes: 30 }).problems).toContain(
      "service.unattended_incomplete",
    );
  });
});

describe("validateStaff", () => {
  const base = {
    name: "山田 花子",
    displayName: "はなこ",
    designationFee: 1100,
    commissionBps: null,
    maxConcurrent: 1,
    maxDailyAppointments: null,
  };

  it("accepts a plain staff member", () => {
    expect(validateStaff(base).ok).toBe(true);
  });

  it("requires a name and a display name", () => {
    expect(validateStaff({ ...base, name: " " }).problems).toContain("staff.name_required");
    expect(validateStaff({ ...base, displayName: "" }).problems).toContain(
      "staff.display_name_required",
    );
  });

  it("bounds commission at 100%", () => {
    expect(validateStaff({ ...base, commissionBps: 10_000 }).ok).toBe(true);
    expect(validateStaff({ ...base, commissionBps: 10_001 }).problems).toContain(
      "staff.commission_out_of_range",
    );
    expect(validateStaff({ ...base, commissionBps: -1 }).problems).toContain(
      "staff.commission_out_of_range",
    );
  });

  it("requires at least one concurrent appointment", () => {
    expect(validateStaff({ ...base, maxConcurrent: 0 }).problems).toContain(
      "staff.max_concurrent_invalid",
    );
  });
});

describe("validateShift", () => {
  const base = {
    startMinute: 600,
    endMinute: 1080,
    breakStartMinute: null,
    breakEndMinute: null,
  };

  it("accepts a plain shift", () => {
    expect(validateShift(base).ok).toBe(true);
  });

  it("rejects an end at or before the start", () => {
    expect(validateShift({ ...base, endMinute: 600 }).problems).toContain("shift.end_before_start");
  });

  it("requires the break to sit inside the shift", () => {
    expect(
      validateShift({ ...base, breakStartMinute: 540, breakEndMinute: 600 }).problems,
    ).toContain("shift.break_outside_shift");
  });

  it("accepts a break at the very edges of the shift", () => {
    expect(validateShift({ ...base, breakStartMinute: 600, breakEndMinute: 1080 }).ok).toBe(true);
  });
});

describe("shiftOverlapsHours", () => {
  const hours = { isClosed: false, openMinute: 600, closeMinute: 1140 };

  it("is true when the shift covers part of the opening hours", () => {
    expect(shiftOverlapsHours({ startMinute: 540, endMinute: 660 }, hours)).toBe(true);
    expect(shiftOverlapsHours({ startMinute: 1100, endMinute: 1300 }, hours)).toBe(true);
  });

  it("is false when the shift ends exactly as the store opens", () => {
    // Half-open intervals: a shift finishing at 10:00 produces no bookable
    // minute in a day that starts at 10:00.
    expect(shiftOverlapsHours({ startMinute: 480, endMinute: 600 }, hours)).toBe(false);
  });

  it("is false when the shift starts exactly as the store closes", () => {
    expect(shiftOverlapsHours({ startMinute: 1140, endMinute: 1260 }, hours)).toBe(false);
  });

  it("is false on a closed day or with no hours at all", () => {
    expect(
      shiftOverlapsHours({ startMinute: 600, endMinute: 1080 }, { ...hours, isClosed: true }),
    ).toBe(false);
    expect(shiftOverlapsHours({ startMinute: 600, endMinute: 1080 }, null)).toBe(false);
  });
});
