import "server-only";

import { prisma } from "@/server/db/client";
import { can, requirePermission, type RequestContext } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { addDaysISO, endOfZonedDay, startOfZonedDay, zonedDateISO } from "@/lib/time";

/**
 * Dashboard read model.
 *
 * Everything here is an aggregate — no personal detail beyond the names on
 * today's arrival list, which reception needs. Amounts are omitted entirely
 * for roles that may not see money, rather than being fetched and hidden.
 */

export interface DashboardQuery {
  storeId?: string | null;
  /** Local date the dashboard is "as of". Defaults to today in store time. */
  dateISO?: string;
}

export interface DashboardMetrics {
  dateISO: string;
  timeZone: string;
  storeName: string;
  today: {
    appointmentCount: number;
    expectedVisitors: number;
    pendingRequests: number;
    cancellations: number;
    noShows: number;
    newCustomers: number;
    returningCustomers: number;
    unsettled: number;
    missingMedicalRecords: number;
    /** null when the viewer may not see amounts. */
    salesAmount: number | null;
  };
  staffStatus: Array<{
    staffId: string;
    displayName: string;
    bookedMinutes: number;
    rosteredMinutes: number;
    utilizationPercent: number;
    appointmentCount: number;
  }>;
  upcoming: Array<{
    id: string;
    startAt: Date;
    customerName: string;
    serviceNames: string[];
    staffNames: string[];
    status: string;
    isFirstVisit: boolean;
  }>;
  monthlyTrend: Array<{ dateISO: string; appointments: number; sales: number | null }>;
  sourceBreakdown: Array<{ source: string; count: number }>;
  topServices: Array<{ name: string; count: number }>;
}

export async function getDashboard(
  context: RequestContext,
  query: DashboardQuery = {},
): Promise<DashboardMetrics | null> {
  requirePermission(context, PERMISSIONS.RESERVATION_READ);

  const storeId = query.storeId ?? context.activeStoreId;
  if (!storeId) return null;

  const store = await prisma.store.findFirst({
    where: { id: storeId, organizationId: context.organizationId, deletedAt: null },
    select: { id: true, name: true, timezone: true },
  });
  if (!store) return null;

  const dateISO = query.dateISO ?? zonedDateISO(new Date(), store.timezone);
  const dayStart = startOfZonedDay(dateISO, store.timezone);
  const dayEnd = endOfZonedDay(dateISO, store.timezone);

  const showMoney = can(context, PERMISSIONS.SALES_READ, storeId) && !context.masks.salesAmount;

  const scope = {
    organizationId: context.organizationId,
    storeId,
    deletedAt: null,
  } as const;

  const [
    statusCounts,
    todaysAppointments,
    salesAggregate,
    unsettledCount,
    missingRecords,
    sourceRows,
    serviceRows,
  ] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["status"],
      where: { ...scope, startAt: { gte: dayStart, lt: dayEnd } },
      _count: { _all: true },
    }),
    prisma.appointment.findMany({
      where: {
        ...scope,
        startAt: { gte: dayStart, lt: dayEnd },
        status: { notIn: ["cancelled", "no_show"] },
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true,
        guestName: true,
        customer: { select: { name: true, visitCount: true } },
        services: { select: { nameSnapshot: true } },
        staffSlots: {
          where: { kind: "service", isActive: true },
          select: {
            staffId: true,
            startAt: true,
            endAt: true,
            staff: { select: { displayName: true } },
          },
        },
        medicalRecords: { select: { id: true }, take: 1 },
      },
    }),
    showMoney
      ? prisma.sale.aggregate({
          where: {
            organizationId: context.organizationId,
            storeId,
            deletedAt: null,
            status: "completed",
            soldAt: { gte: dayStart, lt: dayEnd },
          },
          _sum: { totalAmount: true },
        })
      : Promise.resolve(null),
    prisma.appointment.count({
      where: { ...scope, status: "completed", startAt: { gte: dayStart, lt: dayEnd }, sale: null },
    }),
    prisma.appointment.count({
      where: {
        ...scope,
        status: "completed",
        startAt: { gte: dayStart, lt: dayEnd },
        medicalRecords: { none: {} },
      },
    }),
    prisma.appointment.groupBy({
      by: ["source"],
      where: { ...scope, startAt: { gte: addDays(dayStart, -30), lt: dayEnd } },
      _count: { _all: true },
    }),
    prisma.appointmentService.groupBy({
      by: ["nameSnapshot"],
      where: {
        appointment: { ...scope, startAt: { gte: addDays(dayStart, -30), lt: dayEnd } },
      },
      _count: { _all: true },
      orderBy: { _count: { nameSnapshot: "desc" } },
      take: 5,
    }),
  ]);

  const countByStatus = new Map(statusCounts.map((row) => [row.status, row._count._all]));

  const newCustomers = todaysAppointments.filter(
    (appointment) => (appointment.customer?.visitCount ?? 0) === 0,
  ).length;

  // --- Staff utilisation --------------------------------------------------
  const shifts = await prisma.staffShift.findMany({
    where: {
      storeId,
      date: new Date(`${dateISO}T00:00:00.000Z`),
      type: { in: ["work", "training"] },
    },
    select: {
      staffId: true,
      startMinute: true,
      endMinute: true,
      breakStartMinute: true,
      breakEndMinute: true,
      staff: { select: { displayName: true } },
    },
  });

  const bookedByStaff = new Map<string, { minutes: number; count: number }>();
  for (const appointment of todaysAppointments) {
    for (const slot of appointment.staffSlots) {
      const bucket = bookedByStaff.get(slot.staffId) ?? { minutes: 0, count: 0 };
      bucket.minutes += Math.round((slot.endAt.getTime() - slot.startAt.getTime()) / 60_000);
      bucket.count += 1;
      bookedByStaff.set(slot.staffId, bucket);
    }
  }

  const staffStatus = shifts.map((shift) => {
    const breakMinutes =
      shift.breakStartMinute !== null && shift.breakEndMinute !== null
        ? Math.max(0, shift.breakEndMinute - shift.breakStartMinute)
        : 0;
    const rosteredMinutes = Math.max(0, shift.endMinute - shift.startMinute - breakMinutes);
    const booked = bookedByStaff.get(shift.staffId) ?? { minutes: 0, count: 0 };

    return {
      staffId: shift.staffId,
      displayName: shift.staff.displayName,
      bookedMinutes: booked.minutes,
      rosteredMinutes,
      utilizationPercent:
        rosteredMinutes > 0 ? Math.round((booked.minutes / rosteredMinutes) * 100) : 0,
      appointmentCount: booked.count,
    };
  });

  // --- 30-day trend -------------------------------------------------------
  const trendStart = addDays(dayStart, -29);
  const [trendAppointments, trendSales] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        ...scope,
        startAt: { gte: trendStart, lt: dayEnd },
        status: { notIn: ["cancelled"] },
      },
      select: { startAt: true },
    }),
    showMoney
      ? prisma.sale.findMany({
          where: {
            organizationId: context.organizationId,
            storeId,
            deletedAt: null,
            status: "completed",
            soldAt: { gte: trendStart, lt: dayEnd },
          },
          select: { soldAt: true, totalAmount: true },
        })
      : Promise.resolve([]),
  ]);

  const trend = new Map<string, { appointments: number; sales: number }>();
  for (let offset = 29; offset >= 0; offset -= 1) {
    trend.set(addDaysISO(dateISO, -offset), { appointments: 0, sales: 0 });
  }
  for (const appointment of trendAppointments) {
    const key = zonedDateISO(appointment.startAt, store.timezone);
    const bucket = trend.get(key);
    if (bucket) bucket.appointments += 1;
  }
  for (const sale of trendSales) {
    const key = zonedDateISO(sale.soldAt, store.timezone);
    const bucket = trend.get(key);
    if (bucket) bucket.sales += sale.totalAmount;
  }

  return {
    dateISO,
    timeZone: store.timezone,
    storeName: store.name,
    today: {
      appointmentCount: todaysAppointments.length,
      expectedVisitors: todaysAppointments.filter((appointment) =>
        ["pending", "confirmed"].includes(appointment.status),
      ).length,
      pendingRequests: countByStatus.get("pending") ?? 0,
      cancellations: countByStatus.get("cancelled") ?? 0,
      noShows: countByStatus.get("no_show") ?? 0,
      newCustomers,
      returningCustomers: todaysAppointments.length - newCustomers,
      unsettled: unsettledCount,
      missingMedicalRecords: missingRecords,
      salesAmount: showMoney ? (salesAggregate?._sum.totalAmount ?? 0) : null,
    },
    staffStatus,
    upcoming: todaysAppointments.slice(0, 12).map((appointment) => ({
      id: appointment.id,
      startAt: appointment.startAt,
      customerName: appointment.customer?.name ?? appointment.guestName ?? "（未登録）",
      serviceNames: appointment.services.map((service) => service.nameSnapshot),
      staffNames: appointment.staffSlots.map((slot) => slot.staff.displayName),
      status: appointment.status,
      isFirstVisit: (appointment.customer?.visitCount ?? 0) === 0,
    })),
    monthlyTrend: [...trend.entries()].map(([key, value]) => ({
      dateISO: key,
      appointments: value.appointments,
      sales: showMoney ? value.sales : null,
    })),
    sourceBreakdown: sourceRows.map((row) => ({
      source: row.source,
      count: row._count._all,
    })),
    topServices: serviceRows.map((row) => ({
      name: row.nameSnapshot,
      count: row._count._all,
    })),
  };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 3600_000);
}
