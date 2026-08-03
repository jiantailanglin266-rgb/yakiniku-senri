import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/client";
import {
  computeAvailability,
  resolveOpenWindows,
  type AvailableSlot,
  type BookingPolicy,
  type BusinessHourSpec,
  type HolidaySpec,
  type ResourceAvailability,
  type StaffAvailability,
} from "@/server/booking-engine/availability";
import type { Interval } from "@/server/booking-engine/interval";
import {
  buildOccupancyPlan,
  type OccupancyPlan,
  type ServiceSpec,
} from "@/server/booking-engine/occupancy";
import {
  addDaysISO,
  startOfZonedDay,
  endOfZonedDay,
  zonedDateAtMinute,
  zonedDateISO,
} from "@/lib/time";

/**
 * Loads everything the pure booking engine needs, then calls it.
 *
 * The split matters: this file owns the queries and can be optimised freely,
 * while the rules it feeds live in `booking-engine/` where they are tested
 * without a database.
 */

export interface AvailabilityQuery {
  storeId: string;
  dateISO: string;
  serviceIds: string[];
  optionIds?: string[];
  staffId?: string | null;
  now?: Date;
}

export interface StoreBookingContext {
  storeId: string;
  timeZone: string;
  policy: BookingPolicy;
  bufferMinutes: number;
  businessHours: BusinessHourSpec[];
  holidays: HolidaySpec[];
}

/** Store settings and calendar rules for the window being queried. */
export async function loadStoreBookingContext(
  storeId: string,
  fromDateISO: string,
  toDateISO: string,
): Promise<StoreBookingContext | null> {
  const store = await prisma.store.findFirst({
    where: { id: storeId, deletedAt: null },
    select: {
      id: true,
      timezone: true,
      slotIntervalMinutes: true,
      bookingCutoffMinutes: true,
      minAdvanceMinutes: true,
      maxAdvanceDays: true,
      bufferMinutes: true,
      businessHours: {
        select: {
          dayOfWeek: true,
          openMinute: true,
          closeMinute: true,
          breakStartMinute: true,
          breakEndMinute: true,
          isClosed: true,
        },
      },
    },
  });

  if (!store) return null;

  const holidays = await prisma.storeHoliday.findMany({
    where: {
      storeId,
      date: {
        gte: new Date(`${fromDateISO}T00:00:00.000Z`),
        lte: new Date(`${toDateISO}T00:00:00.000Z`),
      },
    },
    select: { date: true, isClosed: true, openMinute: true, closeMinute: true },
  });

  return {
    storeId: store.id,
    timeZone: store.timezone,
    bufferMinutes: store.bufferMinutes,
    policy: {
      slotIntervalMinutes: store.slotIntervalMinutes,
      bookingCutoffMinutes: store.bookingCutoffMinutes,
      minAdvanceMinutes: store.minAdvanceMinutes,
      maxAdvanceDays: store.maxAdvanceDays,
    },
    businessHours: store.businessHours,
    // `date` is a DATE column, so its UTC calendar day is the local date.
    holidays: holidays.map((holiday) => ({
      dateISO: holiday.date.toISOString().slice(0, 10),
      isClosed: holiday.isClosed,
      openMinute: holiday.openMinute,
      closeMinute: holiday.closeMinute,
    })),
  };
}

/** Menu definitions, in the order requested, with options attached. */
export async function loadServiceSpecs(
  organizationId: string,
  serviceIds: readonly string[],
  optionIds: readonly string[] = [],
): Promise<ServiceSpec[]> {
  if (serviceIds.length === 0) return [];

  const services = await prisma.service.findMany({
    where: { id: { in: [...serviceIds] }, organizationId, deletedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      price: true,
      durationMinutes: true,
      prepMinutes: true,
      cleanupMinutes: true,
      unattendedStartMinute: true,
      unattendedMinutes: true,
      serviceResources: {
        select: { resourceTypeId: true, quantity: true, holdsDuringUnattended: true },
      },
      options: {
        where: { isActive: true },
        select: { id: true, name: true, price: true, durationMinutes: true },
      },
    },
  });

  const byId = new Map(services.map((service) => [service.id, service]));
  const wantedOptions = new Set(optionIds);

  // Preserve the caller's ordering: a cut-then-colour booking is not the same
  // appointment as colour-then-cut.
  return serviceIds.flatMap((serviceId) => {
    const service = byId.get(serviceId);
    if (!service) return [];

    return [
      {
        serviceId: service.id,
        name: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
        prepMinutes: service.prepMinutes,
        cleanupMinutes: service.cleanupMinutes,
        unattendedStartMinute: service.unattendedStartMinute,
        unattendedMinutes: service.unattendedMinutes,
        resources: service.serviceResources,
        options: service.options
          .filter((option) => wantedOptions.has(option.id))
          .map((option) => ({
            serviceOptionId: option.id,
            name: option.name,
            price: option.price,
            durationMinutes: option.durationMinutes,
          })),
      } satisfies ServiceSpec,
    ];
  });
}

/**
 * Either the pooled client or a transaction handle.
 *
 * The loaders accept both so the final re-validation before an insert reads
 * *inside* the booking transaction, seeing exactly the same snapshot the
 * insert will be checked against.
 */
export type DbClient = PrismaClient | Prisma.TransactionClient;

export interface StaffLoadOptions {
  storeId: string;
  dateISO: string;
  timeZone: string;
  serviceIds: readonly string[];
  /** Appointment being edited, whose own slots must not block itself. */
  excludeAppointmentId?: string | null;
  /** Defaults to the pooled client. */
  db?: DbClient;
}

/**
 * Roster, existing bookings and skills for every bookable staff member on a
 * given day.
 */
export async function loadStaffAvailability(
  options: StaffLoadOptions,
): Promise<StaffAvailability[]> {
  const { storeId, dateISO, timeZone, serviceIds, excludeAppointmentId } = options;
  const db = options.db ?? prisma;

  const dayStart = startOfZonedDay(dateISO, timeZone);
  const dayEnd = endOfZonedDay(dateISO, timeZone);
  // Widen by a day on each side so a shift or booking that starts the previous
  // evening and runs past midnight is still seen.
  const windowStart = new Date(dayStart.getTime() - 24 * 3600_000);
  const windowEnd = new Date(dayEnd.getTime() + 24 * 3600_000);

  const staffRows = await db.staff.findMany({
    where: {
      deletedAt: null,
      isBookable: true,
      stores: { some: { storeId } },
      OR: [{ leftOn: null }, { leftOn: { gt: dayStart } }],
    },
    select: {
      id: true,
      maxDailyAppointments: true,
      skills: { select: { serviceId: true, durationFactorBps: true } },
      serviceStaff: { select: { serviceId: true } },
      shifts: {
        where: { storeId, date: new Date(`${dateISO}T00:00:00.000Z`) },
        select: {
          type: true,
          startMinute: true,
          endMinute: true,
          breakStartMinute: true,
          breakEndMinute: true,
        },
      },
      timeOffs: {
        where: {
          status: "approved",
          startAt: { lt: windowEnd },
          endAt: { gt: windowStart },
        },
        select: { startAt: true, endAt: true },
      },
    },
  });

  const staffIds = staffRows.map((staff) => staff.id);
  if (staffIds.length === 0) return [];

  const busySlots = await db.appointmentStaff.findMany({
    where: {
      staffId: { in: staffIds },
      isActive: true,
      startAt: { lt: windowEnd },
      endAt: { gt: windowStart },
      ...(excludeAppointmentId ? { NOT: { appointmentId: excludeAppointmentId } } : {}),
    },
    select: { staffId: true, startAt: true, endAt: true, appointmentId: true },
  });

  const bookedCounts = await db.appointmentStaff.groupBy({
    by: ["staffId"],
    where: {
      staffId: { in: staffIds },
      isActive: true,
      kind: "service",
      startAt: { gte: dayStart, lt: dayEnd },
    },
    _count: { appointmentId: true },
  });

  const busyByStaff = new Map<string, Interval[]>();
  for (const slot of busySlots) {
    const bucket = busyByStaff.get(slot.staffId) ?? [];
    bucket.push({ start: slot.startAt, end: slot.endAt });
    busyByStaff.set(slot.staffId, bucket);
  }

  const countByStaff = new Map(bookedCounts.map((row) => [row.staffId, row._count.appointmentId]));

  return staffRows.map((staff) => {
    const workWindows: Interval[] = [];

    for (const shift of staff.shifts) {
      if (shift.type !== "work" && shift.type !== "training") continue;

      const shiftWindow: Interval = {
        start: zonedDateAtMinute(dateISO, shift.startMinute, timeZone),
        end: zonedDateAtMinute(dateISO, shift.endMinute, timeZone),
      };

      if (
        shift.breakStartMinute !== null &&
        shift.breakEndMinute !== null &&
        shift.breakEndMinute > shift.breakStartMinute
      ) {
        const breakStart = zonedDateAtMinute(dateISO, shift.breakStartMinute, timeZone);
        const breakEnd = zonedDateAtMinute(dateISO, shift.breakEndMinute, timeZone);
        workWindows.push({ start: shiftWindow.start, end: breakStart });
        workWindows.push({ start: breakEnd, end: shiftWindow.end });
      } else {
        workWindows.push(shiftWindow);
      }
    }

    // Approved leave is subtracted from the roster rather than added to `busy`,
    // because leave means "not rostered", not "already booked".
    const busy = [
      ...(busyByStaff.get(staff.id) ?? []),
      ...staff.timeOffs.map((entry) => ({ start: entry.startAt, end: entry.endAt })),
    ];

    const skillById = new Map(
      staff.skills.map((skill) => [skill.serviceId, skill.durationFactorBps]),
    );
    const assignedServices = new Set(staff.serviceStaff.map((entry) => entry.serviceId));

    // A service with no explicit staff assignment can be performed by anyone;
    // once a menu item names its staff, only those staff qualify.
    const canPerformAll = serviceIds.every(
      (serviceId) => assignedServices.size === 0 || assignedServices.has(serviceId),
    );

    // When several services are booked together, the slowest factor applies.
    const durationFactorBps = serviceIds.reduce(
      (slowest, serviceId) => Math.max(slowest, skillById.get(serviceId) ?? 10_000),
      10_000,
    );

    const booked = countByStaff.get(staff.id) ?? 0;
    const remainingDailyCapacity =
      staff.maxDailyAppointments === null ? null : staff.maxDailyAppointments - booked;

    return {
      staffId: staff.id,
      workWindows,
      busy,
      durationFactorBps,
      canPerformAll,
      remainingDailyCapacity,
    } satisfies StaffAvailability;
  });
}

export async function loadResourceAvailability(
  storeId: string,
  dateISO: string,
  timeZone: string,
  excludeAppointmentId?: string | null,
  db: DbClient = prisma,
): Promise<ResourceAvailability[]> {
  const dayStart = startOfZonedDay(dateISO, timeZone);
  const dayEnd = endOfZonedDay(dateISO, timeZone);
  const windowStart = new Date(dayStart.getTime() - 24 * 3600_000);
  const windowEnd = new Date(dayEnd.getTime() + 24 * 3600_000);

  const resources = await db.resource.findMany({
    where: { storeId, isActive: true, deletedAt: null },
    select: { id: true, resourceTypeId: true },
  });
  if (resources.length === 0) return [];

  const busy = await db.appointmentResource.findMany({
    where: {
      resourceId: { in: resources.map((resource) => resource.id) },
      isActive: true,
      startAt: { lt: windowEnd },
      endAt: { gt: windowStart },
      ...(excludeAppointmentId ? { NOT: { appointmentId: excludeAppointmentId } } : {}),
    },
    select: { resourceId: true, startAt: true, endAt: true },
  });

  const byResource = new Map<string, Interval[]>();
  for (const slot of busy) {
    const bucket = byResource.get(slot.resourceId) ?? [];
    bucket.push({ start: slot.startAt, end: slot.endAt });
    byResource.set(slot.resourceId, bucket);
  }

  return resources.map((resource) => ({
    resourceId: resource.id,
    resourceTypeId: resource.resourceTypeId,
    busy: byResource.get(resource.id) ?? [],
  }));
}

export interface AvailabilityResult {
  dateISO: string;
  timeZone: string;
  slots: AvailableSlot[];
  plan: OccupancyPlan;
  /** True when the store is shut that day, which the UI words differently. */
  storeClosed: boolean;
}

/** End-to-end availability for one day. */
export async function getAvailability(
  organizationId: string,
  query: AvailabilityQuery,
): Promise<AvailabilityResult | null> {
  const now = query.now ?? new Date();

  const storeContext = await loadStoreBookingContext(query.storeId, query.dateISO, query.dateISO);
  if (!storeContext) return null;

  const services = await loadServiceSpecs(organizationId, query.serviceIds, query.optionIds);
  if (services.length === 0) return null;

  const openWindows = resolveOpenWindows(
    query.dateISO,
    storeContext.timeZone,
    storeContext.businessHours,
    storeContext.holidays,
  );

  const planFactory = (durationFactorBps: number) =>
    buildOccupancyPlan(services, {
      durationFactorBps,
      bufferMinutes: storeContext.bufferMinutes,
    });

  const plan = planFactory(10_000);

  if (openWindows.length === 0) {
    return {
      dateISO: query.dateISO,
      timeZone: storeContext.timeZone,
      slots: [],
      plan,
      storeClosed: true,
    };
  }

  const [staff, resources] = await Promise.all([
    loadStaffAvailability({
      storeId: query.storeId,
      dateISO: query.dateISO,
      timeZone: storeContext.timeZone,
      serviceIds: query.serviceIds,
    }),
    loadResourceAvailability(query.storeId, query.dateISO, storeContext.timeZone),
  ]);

  const slots = computeAvailability({
    dateISO: query.dateISO,
    timeZone: storeContext.timeZone,
    now,
    policy: storeContext.policy,
    businessHours: storeContext.businessHours,
    holidays: storeContext.holidays,
    plan,
    planFactory,
    staff,
    resources,
    requestedStaffId: query.staffId ?? null,
    requireResources: resources.length > 0,
  });

  return {
    dateISO: query.dateISO,
    timeZone: storeContext.timeZone,
    slots,
    plan,
    storeClosed: false,
  };
}

/**
 * Which of the next `days` days have at least one free slot.
 *
 * Used by the public calendar so a customer can see the shape of the month
 * before drilling into a day.
 */
export async function getAvailableDates(
  organizationId: string,
  query: Omit<AvailabilityQuery, "dateISO"> & { fromDateISO: string; days: number },
): Promise<Array<{ dateISO: string; slotCount: number; storeClosed: boolean }>> {
  const results: Array<{ dateISO: string; slotCount: number; storeClosed: boolean }> = [];
  const now = query.now ?? new Date();

  for (let offset = 0; offset < query.days; offset += 1) {
    const dateISO = addDaysISO(query.fromDateISO, offset);
    const result = await getAvailability(organizationId, { ...query, dateISO, now });
    results.push({
      dateISO,
      slotCount: result?.slots.length ?? 0,
      storeClosed: result?.storeClosed ?? true,
    });
  }

  return results;
}

/** Today's date in the store's timezone. */
export function storeToday(timeZone: string, now = new Date()): string {
  return zonedDateISO(now, timeZone);
}
