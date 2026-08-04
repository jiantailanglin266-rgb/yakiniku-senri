/**
 * Validation for the master-data screens.
 *
 * Pure functions, no I/O — so the rules can be tested exhaustively without a
 * database, and so the same rules can run on the server before a write.
 *
 * Each function returns a list of problem codes rather than a single message.
 * A form that gets both "closes before it opens" and "the break sits outside
 * opening hours" should say both at once; making the operator fix one error
 * per round-trip is how setup screens get abandoned half-finished.
 */

/** A day's opening hours, in minutes from local midnight. */
export interface BusinessHourInput {
  dayOfWeek: number;
  isClosed: boolean;
  openMinute: number;
  closeMinute: number;
  breakStartMinute: number | null;
  breakEndMinute: number | null;
}

/**
 * The latest representable closing time.
 *
 * Closing after midnight is expressed by exceeding 1440 (a bar-adjacent salon
 * closing at 02:00 is 1560), so the ceiling is a day and a half rather than a
 * day. Beyond that the operator has almost certainly typed a wrong number.
 */
export const MAX_CLOSE_MINUTE = 36 * 60;

export interface ValidationResult {
  ok: boolean;
  problems: string[];
}

function ok(problems: string[]): ValidationResult {
  return { ok: problems.length === 0, problems };
}

export function validateBusinessHour(input: BusinessHourInput): ValidationResult {
  const problems: string[] = [];

  if (!Number.isInteger(input.dayOfWeek) || input.dayOfWeek < 0 || input.dayOfWeek > 6) {
    problems.push("hours.day_out_of_range");
  }

  // A closed day carries whatever times happen to be in the form. Validating
  // them would block saving "Tuesday: closed" because of stale values the
  // operator cannot see.
  if (input.isClosed) return ok(problems);

  if (!Number.isInteger(input.openMinute) || input.openMinute < 0 || input.openMinute >= 1440) {
    problems.push("hours.open_out_of_range");
  }
  if (
    !Number.isInteger(input.closeMinute) ||
    input.closeMinute < 0 ||
    input.closeMinute > MAX_CLOSE_MINUTE
  ) {
    problems.push("hours.close_out_of_range");
  }

  // Anything below depends on both endpoints being sane.
  if (problems.length > 0) return ok(problems);

  if (input.closeMinute <= input.openMinute) problems.push("hours.close_before_open");

  const hasStart = input.breakStartMinute !== null;
  const hasEnd = input.breakEndMinute !== null;

  if (hasStart !== hasEnd) {
    problems.push("hours.break_incomplete");
    return ok(problems);
  }

  if (hasStart && hasEnd) {
    const start = input.breakStartMinute as number;
    const end = input.breakEndMinute as number;

    if (end <= start) problems.push("hours.break_end_before_start");
    if (start < input.openMinute || end > input.closeMinute) {
      problems.push("hours.break_outside_hours");
    }
  }

  return ok(problems);
}

export function validateBusinessHours(inputs: BusinessHourInput[]): ValidationResult {
  const problems = inputs.flatMap((input) => validateBusinessHour(input).problems);

  const days = inputs.map((input) => input.dayOfWeek);
  if (new Set(days).size !== days.length) problems.push("hours.duplicate_day");

  // Not an error — a salon may genuinely close for a refurbishment week — but
  // the caller surfaces it, because a store closed every day shows no slots at
  // all and the operator will otherwise assume the booking page is broken.
  return ok([...new Set(problems)]);
}

/** True when no day is open. The public booking page will show nothing. */
export function isPermanentlyClosed(inputs: BusinessHourInput[]): boolean {
  return inputs.length > 0 && inputs.every((input) => input.isClosed);
}

// --- Booking policy --------------------------------------------------------

export interface BookingPolicyInput {
  slotIntervalMinutes: number;
  bookingCutoffMinutes: number;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  bufferMinutes: number;
  cancelDeadlineHours: number;
}

export function validateBookingPolicy(input: BookingPolicyInput): ValidationResult {
  const problems: string[] = [];

  // A slot grid finer than 5 minutes produces an unusable number of options on
  // the booking page; coarser than an hour hides real availability.
  if (!Number.isInteger(input.slotIntervalMinutes) || input.slotIntervalMinutes < 5) {
    problems.push("policy.slot_interval_too_small");
  } else if (input.slotIntervalMinutes > 60) {
    problems.push("policy.slot_interval_too_large");
  }

  if (!Number.isInteger(input.bookingCutoffMinutes) || input.bookingCutoffMinutes < 0) {
    problems.push("policy.cutoff_negative");
  }
  if (!Number.isInteger(input.minAdvanceMinutes) || input.minAdvanceMinutes < 0) {
    problems.push("policy.min_advance_negative");
  }
  if (!Number.isInteger(input.maxAdvanceDays) || input.maxAdvanceDays < 1) {
    problems.push("policy.max_advance_too_small");
  } else if (input.maxAdvanceDays > 365) {
    problems.push("policy.max_advance_too_large");
  }
  if (!Number.isInteger(input.bufferMinutes) || input.bufferMinutes < 0) {
    problems.push("policy.buffer_negative");
  } else if (input.bufferMinutes > 120) {
    problems.push("policy.buffer_too_large");
  }
  if (!Number.isInteger(input.cancelDeadlineHours) || input.cancelDeadlineHours < 0) {
    problems.push("policy.cancel_deadline_negative");
  }

  return ok(problems);
}

// --- Service (menu) --------------------------------------------------------

export interface ServiceInput {
  name: string;
  price: number;
  durationMinutes: number;
  prepMinutes: number;
  cleanupMinutes: number;
  unattendedStartMinute: number | null;
  unattendedMinutes: number | null;
}

export function validateService(input: ServiceInput): ValidationResult {
  const problems: string[] = [];

  const name = input.name.trim();
  if (name.length === 0) problems.push("service.name_required");
  if (name.length > 120) problems.push("service.name_too_long");

  // Zero is legitimate — a complimentary fringe trim, a consultation.
  if (!Number.isInteger(input.price) || input.price < 0) problems.push("service.price_invalid");

  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 1) {
    problems.push("service.duration_too_small");
  } else if (input.durationMinutes > 12 * 60) {
    problems.push("service.duration_too_large");
  }

  if (!Number.isInteger(input.prepMinutes) || input.prepMinutes < 0) {
    problems.push("service.prep_negative");
  }
  if (!Number.isInteger(input.cleanupMinutes) || input.cleanupMinutes < 0) {
    problems.push("service.cleanup_negative");
  }

  const hasStart = input.unattendedStartMinute !== null;
  const hasLength = input.unattendedMinutes !== null;

  if (hasStart !== hasLength) {
    problems.push("service.unattended_incomplete");
    return ok(problems);
  }

  if (hasStart && hasLength) {
    const start = input.unattendedStartMinute as number;
    const length = input.unattendedMinutes as number;

    if (!Number.isInteger(start) || start < 0) problems.push("service.unattended_start_invalid");
    if (!Number.isInteger(length) || length < 1) problems.push("service.unattended_length_invalid");

    // The processing gap is what frees the stylist to take another customer.
    // If it ran past the end of the service the occupancy plan would emit a
    // staff block with a negative length, and the booking engine would then
    // hand out slots that do not exist.
    if (
      Number.isInteger(start) &&
      Number.isInteger(length) &&
      Number.isInteger(input.durationMinutes) &&
      start + length > input.durationMinutes
    ) {
      problems.push("service.unattended_exceeds_duration");
    }
  }

  return ok(problems);
}

// --- Staff -----------------------------------------------------------------

export interface StaffInput {
  name: string;
  displayName: string;
  designationFee: number;
  commissionBps: number | null;
  maxConcurrent: number;
  maxDailyAppointments: number | null;
}

export function validateStaff(input: StaffInput): ValidationResult {
  const problems: string[] = [];

  if (input.name.trim().length === 0) problems.push("staff.name_required");
  if (input.name.trim().length > 120) problems.push("staff.name_too_long");
  if (input.displayName.trim().length === 0) problems.push("staff.display_name_required");
  if (input.displayName.trim().length > 120) problems.push("staff.display_name_too_long");

  if (!Number.isInteger(input.designationFee) || input.designationFee < 0) {
    problems.push("staff.designation_fee_invalid");
  }

  if (input.commissionBps !== null) {
    if (
      !Number.isInteger(input.commissionBps) ||
      input.commissionBps < 0 ||
      input.commissionBps > 10_000
    ) {
      // 10000 bps = 100%. Above that the salon pays out more than it takes in.
      problems.push("staff.commission_out_of_range");
    }
  }

  if (!Number.isInteger(input.maxConcurrent) || input.maxConcurrent < 1) {
    problems.push("staff.max_concurrent_invalid");
  } else if (input.maxConcurrent > 10) {
    problems.push("staff.max_concurrent_too_large");
  }

  if (input.maxDailyAppointments !== null) {
    if (!Number.isInteger(input.maxDailyAppointments) || input.maxDailyAppointments < 1) {
      problems.push("staff.max_daily_invalid");
    }
  }

  return ok(problems);
}

// --- Shift -----------------------------------------------------------------

export interface ShiftInput {
  startMinute: number;
  endMinute: number;
  breakStartMinute: number | null;
  breakEndMinute: number | null;
}

export function validateShift(input: ShiftInput): ValidationResult {
  const problems: string[] = [];

  if (!Number.isInteger(input.startMinute) || input.startMinute < 0 || input.startMinute >= 1440) {
    problems.push("shift.start_out_of_range");
  }
  if (
    !Number.isInteger(input.endMinute) ||
    input.endMinute < 0 ||
    input.endMinute > MAX_CLOSE_MINUTE
  ) {
    problems.push("shift.end_out_of_range");
  }
  if (problems.length > 0) return ok(problems);

  if (input.endMinute <= input.startMinute) problems.push("shift.end_before_start");

  const hasStart = input.breakStartMinute !== null;
  const hasEnd = input.breakEndMinute !== null;

  if (hasStart !== hasEnd) {
    problems.push("shift.break_incomplete");
    return ok(problems);
  }

  if (hasStart && hasEnd) {
    const start = input.breakStartMinute as number;
    const end = input.breakEndMinute as number;

    if (end <= start) problems.push("shift.break_end_before_start");
    if (start < input.startMinute || end > input.endMinute) {
      problems.push("shift.break_outside_shift");
    }
  }

  return ok(problems);
}

/**
 * Does a shift overlap the store's opening hours at all?
 *
 * A shift entirely outside opening hours is not rejected — a stylist may come
 * in early to prepare — but it produces no bookable time, so the caller warns
 * rather than silently accepting what looks to the operator like availability.
 */
export function shiftOverlapsHours(
  shift: { startMinute: number; endMinute: number },
  hours: { isClosed: boolean; openMinute: number; closeMinute: number } | null,
): boolean {
  if (!hours || hours.isClosed) return false;
  return shift.startMinute < hours.closeMinute && hours.openMinute < shift.endMinute;
}
