/**
 * Availability computation.
 *
 * Pure: every input is passed in, nothing is fetched. That is what makes the
 * booking rules testable without a database, and it is why the same function
 * runs both when rendering the public calendar and when re-validating a
 * booking the instant before it is committed.
 *
 * The engine answers one question: *given all constraints, at which start
 * times can this basket of services be performed, and by whom?* It never
 * writes anything and never claims a slot — the exclusion constraints in
 * PostgreSQL do that.
 */

import {
  contains,
  coveredBy,
  mergeIntervals,
  overlapsAny,
  subtractIntervals,
  type Interval,
} from "./interval";
import type { OccupancyPlan } from "./occupancy";
import { addDaysISO, zonedDateAtMinute, zonedDateISO } from "@/lib/time";

export interface BusinessHourSpec {
  dayOfWeek: number;
  openMinute: number;
  closeMinute: number;
  breakStartMinute?: number | null;
  breakEndMinute?: number | null;
  isClosed: boolean;
}

export interface HolidaySpec {
  dateISO: string;
  isClosed: boolean;
  openMinute?: number | null;
  closeMinute?: number | null;
}

export interface StaffAvailability {
  staffId: string;
  /** Windows the staff member is rostered to work, already in UTC. */
  workWindows: Interval[];
  /** Everything already occupying this staff member: appointments, breaks, leave. */
  busy: Interval[];
  /** Speed multiplier in basis points; 10000 = standard. */
  durationFactorBps: number;
  /** false when the staff member cannot perform every requested service. */
  canPerformAll: boolean;
  /** Cap on same-day appointments; null when uncapped. */
  remainingDailyCapacity: number | null;
}

export interface ResourceAvailability {
  resourceId: string;
  resourceTypeId: string;
  busy: Interval[];
}

export interface BookingPolicy {
  /** Grid spacing for offered start times, in minutes. */
  slotIntervalMinutes: number;
  /** Online booking closes this many minutes before the start time. */
  bookingCutoffMinutes: number;
  /** Earliest bookable time, as an offset from now. */
  minAdvanceMinutes: number;
  /** Latest bookable date, as a day offset from today. */
  maxAdvanceDays: number;
}

export interface AvailabilityRequest {
  dateISO: string;
  timeZone: string;
  now: Date;
  policy: BookingPolicy;
  businessHours: readonly BusinessHourSpec[];
  holidays: readonly HolidaySpec[];
  /**
   * The occupancy plan for the requested services, computed with the standard
   * (10000 bps) duration factor. Per-staff factors are applied by re-scaling
   * the plan through `planFactory` when supplied.
   */
  plan: OccupancyPlan;
  /** Recomputes the plan for a staff member whose speed differs. */
  planFactory?: (durationFactorBps: number) => OccupancyPlan;
  staff: readonly StaffAvailability[];
  resources: readonly ResourceAvailability[];
  /** When set, only this staff member is considered (customer designation). */
  requestedStaffId?: string | null;
  /** Resource requirements are skipped when the store defines none. */
  requireResources?: boolean;
}

export interface AvailableSlot {
  startAt: Date;
  endAt: Date;
  staffId: string;
  /** Physical resources reserved for this slot, keyed by resource type. */
  resourceIds: string[];
  durationMinutes: number;
}

/**
 * Resolve the store's opening windows for a single local date.
 * Returns an empty array when the store is closed that day.
 */
export function resolveOpenWindows(
  dateISO: string,
  timeZone: string,
  businessHours: readonly BusinessHourSpec[],
  holidays: readonly HolidaySpec[],
): Interval[] {
  const holiday = holidays.find((entry) => entry.dateISO === dateISO);

  if (holiday?.isClosed) return [];

  let openMinute: number;
  let closeMinute: number;
  let breakStart: number | null = null;
  let breakEnd: number | null = null;

  if (holiday && holiday.openMinute != null && holiday.closeMinute != null) {
    // Special opening hours override the weekly schedule for this date.
    openMinute = holiday.openMinute;
    closeMinute = holiday.closeMinute;
  } else {
    // The schedule keys on the weekday of the *local* calendar date, which is
    // exactly the UTC weekday of that date read as a plain calendar value.
    const weekday = new Date(
      Date.UTC(
        Number(dateISO.slice(0, 4)),
        Number(dateISO.slice(5, 7)) - 1,
        Number(dateISO.slice(8, 10)),
      ),
    ).getUTCDay();

    const rule = businessHours.find((entry) => entry.dayOfWeek === weekday);
    if (!rule || rule.isClosed) return [];

    openMinute = rule.openMinute;
    closeMinute = rule.closeMinute;
    breakStart = rule.breakStartMinute ?? null;
    breakEnd = rule.breakEndMinute ?? null;
  }

  if (closeMinute <= openMinute) return [];

  const open: Interval = {
    start: zonedDateAtMinute(dateISO, openMinute, timeZone),
    end: zonedDateAtMinute(dateISO, closeMinute, timeZone),
  };

  if (breakStart != null && breakEnd != null && breakEnd > breakStart) {
    return subtractIntervals(
      [open],
      [
        {
          start: zonedDateAtMinute(dateISO, breakStart, timeZone),
          end: zonedDateAtMinute(dateISO, breakEnd, timeZone),
        },
      ],
    );
  }

  return [open];
}

/** Earliest instant a customer may book, given the store's lead-time rules. */
export function earliestBookableAt(now: Date, policy: BookingPolicy): Date {
  const leadMinutes = Math.max(policy.minAdvanceMinutes, policy.bookingCutoffMinutes);
  return new Date(now.getTime() + leadMinutes * 60_000);
}

/** Latest local date a customer may book. */
export function latestBookableDateISO(now: Date, timeZone: string, policy: BookingPolicy): string {
  return addDaysISO(zonedDateISO(now, timeZone), policy.maxAdvanceDays);
}

/**
 * Compute every bookable start time on a single local date.
 *
 * Slots are generated on the store's configured grid, then filtered against,
 * in order of cheapness: lead time, opening hours, staff roster, staff
 * conflicts, and finally resource capacity.
 */
export function computeAvailability(request: AvailabilityRequest): AvailableSlot[] {
  const {
    dateISO,
    timeZone,
    now,
    policy,
    businessHours,
    holidays,
    plan,
    planFactory,
    staff,
    resources,
    requestedStaffId,
    requireResources = true,
  } = request;

  const openWindows = resolveOpenWindows(dateISO, timeZone, businessHours, holidays);
  if (openWindows.length === 0) return [];

  const todayISO = zonedDateISO(now, timeZone);
  if (dateISO < todayISO) return [];
  if (dateISO > latestBookableDateISO(now, timeZone, policy)) return [];

  const notBefore = earliestBookableAt(now, policy);

  const candidates = staff.filter((entry) => {
    if (requestedStaffId && entry.staffId !== requestedStaffId) return false;
    if (!entry.canPerformAll) return false;
    if (entry.remainingDailyCapacity !== null && entry.remainingDailyCapacity <= 0) return false;
    return entry.workWindows.length > 0;
  });
  if (candidates.length === 0) return [];

  const step = Math.max(1, policy.slotIntervalMinutes);
  const slots: AvailableSlot[] = [];
  const seen = new Set<number>();

  for (const window of openWindows) {
    for (
      let cursor = window.start.getTime();
      cursor < window.end.getTime();
      cursor += step * 60_000
    ) {
      const startAt = alignToGrid(new Date(cursor), window.start, step);
      if (startAt.getTime() < window.start.getTime()) continue;
      if (startAt.getTime() < notBefore.getTime()) continue;
      if (seen.has(startAt.getTime())) continue;

      const match = findAssignment({
        startAt,
        openWindows,
        plan,
        planFactory,
        candidates,
        resources,
        requireResources,
      });

      if (match) {
        seen.add(startAt.getTime());
        slots.push(match);
      }
    }
  }

  return slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

interface AssignmentRequest {
  startAt: Date;
  openWindows: readonly Interval[];
  plan: OccupancyPlan;
  planFactory?: (durationFactorBps: number) => OccupancyPlan;
  candidates: readonly StaffAvailability[];
  resources: readonly ResourceAvailability[];
  requireResources: boolean;
}

/**
 * Find the first staff member (and matching resources) able to take the
 * booking at `startAt`. Returns null when nobody can.
 *
 * Candidates are tried in the order supplied, so the caller controls the
 * assignment policy — the seed and the admin UI pass them ordered by
 * least-loaded so work spreads evenly rather than piling on the first stylist.
 */
function findAssignment(request: AssignmentRequest): AvailableSlot | null {
  const { startAt, openWindows, candidates, resources, requireResources } = request;

  for (const candidate of candidates) {
    const plan =
      candidate.durationFactorBps !== 10_000 && request.planFactory
        ? request.planFactory(candidate.durationFactorBps)
        : request.plan;

    const staffIntervals = plan.staffSegments.map((segment) => ({
      start: new Date(startAt.getTime() + segment.startOffset * 60_000),
      end: new Date(startAt.getTime() + segment.endOffset * 60_000),
    }));

    const customerWindow: Interval = {
      start: startAt,
      end: new Date(startAt.getTime() + plan.customerMinutes * 60_000),
    };

    // The customer must be served entirely within one opening window; a
    // service may not straddle the midday closure.
    if (!openWindows.some((window) => contains(window, customerWindow))) continue;

    // Staff prep/cleanup may fall outside opening hours (setup before open),
    // so only the roster is checked for those, not the shop's opening times.
    if (!coveredBy(staffIntervals, candidate.workWindows)) continue;
    if (staffIntervals.some((interval) => overlapsAny(interval, candidate.busy))) continue;

    let resourceIds: string[] = [];
    if (requireResources && plan.resourceSegments.length > 0) {
      const allocated = allocateResources(startAt, plan, resources);
      if (!allocated) continue;
      resourceIds = allocated;
    }

    return {
      startAt,
      endAt: customerWindow.end,
      staffId: candidate.staffId,
      resourceIds,
      durationMinutes: plan.customerMinutes,
    };
  }

  return null;
}

/**
 * Reserve concrete resources for the plan.
 *
 * Each resource type is allocated once for the union of the intervals that
 * type is needed, so the customer keeps the *same* chair across a multi-step
 * service instead of being moved mid-appointment. Returns null when any type
 * lacks enough free units.
 */
export function allocateResources(
  startAt: Date,
  plan: OccupancyPlan,
  resources: readonly ResourceAvailability[],
): string[] | null {
  const requirements = new Map<string, { intervals: Interval[]; quantity: number }>();

  for (const segment of plan.resourceSegments) {
    const entry = requirements.get(segment.resourceTypeId) ?? { intervals: [], quantity: 0 };
    entry.intervals.push({
      start: new Date(startAt.getTime() + segment.startOffset * 60_000),
      end: new Date(startAt.getTime() + segment.endOffset * 60_000),
    });
    entry.quantity = Math.max(entry.quantity, segment.quantity);
    requirements.set(segment.resourceTypeId, entry);
  }

  const assigned: string[] = [];
  const taken = new Set<string>();

  for (const [resourceTypeId, requirement] of requirements) {
    const needed = mergeIntervals(requirement.intervals);
    const pool = resources.filter(
      (resource) => resource.resourceTypeId === resourceTypeId && !taken.has(resource.resourceId),
    );

    const free = pool.filter(
      (resource) => !needed.some((interval) => overlapsAny(interval, resource.busy)),
    );

    if (free.length < requirement.quantity) return null;

    for (const resource of free.slice(0, requirement.quantity)) {
      taken.add(resource.resourceId);
      assigned.push(resource.resourceId);
    }
  }

  return assigned;
}

/** Snap a timestamp onto the slot grid anchored at the opening time. */
function alignToGrid(value: Date, anchor: Date, stepMinutes: number): Date {
  const stepMs = stepMinutes * 60_000;
  const delta = value.getTime() - anchor.getTime();
  const aligned = Math.ceil(delta / stepMs) * stepMs;
  return new Date(anchor.getTime() + aligned);
}

/**
 * Verify a specific booking request one last time, immediately before the
 * insert. This intentionally duplicates part of `computeAvailability` — the
 * displayed calendar is advisory, this is the gate.
 */
export function verifySlot(
  request: Omit<AvailabilityRequest, "policy"> & {
    policy: BookingPolicy;
    startAt: Date;
    staffId: string;
  },
): { ok: true; slot: AvailableSlot } | { ok: false; reason: SlotRejectionReason } {
  const openWindows = resolveOpenWindows(
    request.dateISO,
    request.timeZone,
    request.businessHours,
    request.holidays,
  );
  if (openWindows.length === 0) return { ok: false, reason: "STORE_CLOSED" };

  if (request.startAt.getTime() < earliestBookableAt(request.now, request.policy).getTime()) {
    return { ok: false, reason: "BOOKING_CUTOFF_PASSED" };
  }

  if (request.dateISO > latestBookableDateISO(request.now, request.timeZone, request.policy)) {
    return { ok: false, reason: "TOO_FAR_IN_ADVANCE" };
  }

  const candidate = request.staff.find((entry) => entry.staffId === request.staffId);
  if (!candidate) return { ok: false, reason: "STAFF_UNAVAILABLE" };
  if (!candidate.canPerformAll) return { ok: false, reason: "STAFF_CANNOT_PERFORM" };

  const match = findAssignment({
    startAt: request.startAt,
    openWindows,
    plan: request.plan,
    planFactory: request.planFactory,
    candidates: [candidate],
    resources: request.resources,
    requireResources: request.requireResources ?? true,
  });

  if (!match) {
    const plan = request.plan;
    const customerWindow: Interval = {
      start: request.startAt,
      end: new Date(request.startAt.getTime() + plan.customerMinutes * 60_000),
    };
    if (!openWindows.some((window) => contains(window, customerWindow))) {
      return { ok: false, reason: "OUTSIDE_BUSINESS_HOURS" };
    }
    if (request.requireResources !== false && plan.resourceSegments.length > 0) {
      if (!allocateResources(request.startAt, plan, request.resources)) {
        return { ok: false, reason: "RESOURCE_UNAVAILABLE" };
      }
    }
    return { ok: false, reason: "STAFF_UNAVAILABLE" };
  }

  return { ok: true, slot: match };
}

export type SlotRejectionReason =
  | "STORE_CLOSED"
  | "OUTSIDE_BUSINESS_HOURS"
  | "BOOKING_CUTOFF_PASSED"
  | "TOO_FAR_IN_ADVANCE"
  | "STAFF_UNAVAILABLE"
  | "STAFF_CANNOT_PERFORM"
  | "RESOURCE_UNAVAILABLE";
