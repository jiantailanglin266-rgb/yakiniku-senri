import "server-only";

import { prisma } from "@/server/db/client";
import {
  requirePermission,
  requireStoreAccess,
  type RequestContext,
} from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { maskCustomerContact } from "@/server/permissions/mask";
import { addDaysISO, endOfZonedDay, startOfZonedDay, zonedDateAtMinute } from "@/lib/time";
import type { AppointmentStatus } from "./state-machine";

/**
 * Read model for the appointment ledger (予約台帳).
 *
 * The ledger is the screen salon staff live in all day, so it is loaded in a
 * fixed number of queries regardless of how many appointments the day holds.
 */

export interface LedgerQuery {
  storeId: string;
  /** First day shown, in the store's timezone. */
  fromDateISO: string;
  /** 1 = day view, 3 = three-day view, 7 = week view. */
  days: number;
  staffIds?: string[];
}

export interface LedgerEntry {
  id: string;
  reference: string;
  status: AppointmentStatus;
  source: string;
  startAt: Date;
  endAt: Date;
  isDesignated: boolean;
  totalAmount: number;
  customerNote: string | null;
  staffNote: string | null;
  customer: {
    id: string;
    name: string;
    nameKana: string | null;
    phone: string | null;
    email: string | null;
    visitCount: number;
    noShowCount: number;
  } | null;
  guestName: string | null;
  serviceNames: string[];
  /** Contiguous blocks of staff time, so the UI can draw the processing gap. */
  staffBlocks: Array<{ staffId: string; startAt: Date; endAt: Date }>;
  resourceNames: string[];
  hasMedicalRecord: boolean;
}

export interface LedgerBlock {
  id: string;
  staffId: string;
  startAt: Date;
  endAt: Date;
  kind: "break_time" | "block" | "time_off";
  note: string | null;
}

export interface LedgerColumn {
  staffId: string;
  displayName: string;
  photoUrl: string | null;
  /** Rostered windows, used to grey out off-shift hours. */
  workWindows: Array<{ startAt: Date; endAt: Date }>;
}

export interface LedgerResult {
  storeId: string;
  timeZone: string;
  fromDateISO: string;
  days: number;
  /** Store opening minute range, for the vertical axis. */
  openMinute: number;
  closeMinute: number;
  columns: LedgerColumn[];
  entries: LedgerEntry[];
  blocks: LedgerBlock[];
}

export async function getLedger(
  context: RequestContext,
  query: LedgerQuery,
): Promise<LedgerResult | null> {
  // Store access is checked explicitly rather than relying on the tenant
  // filter to return nothing: a caller asking for a store they may not see
  // should be refused, not quietly handed an empty ledger.
  requireStoreAccess(context, query.storeId);
  requirePermission(context, PERMISSIONS.RESERVATION_READ, query.storeId);

  const store = await prisma.store.findFirst({
    where: {
      id: query.storeId,
      organizationId: context.organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      timezone: true,
      businessHours: { select: { openMinute: true, closeMinute: true, isClosed: true } },
    },
  });
  if (!store) return null;

  const days = Math.min(31, Math.max(1, query.days));
  const rangeStart = startOfZonedDay(query.fromDateISO, store.timezone);
  const rangeEnd = endOfZonedDay(addDaysISO(query.fromDateISO, days - 1), store.timezone);

  const openHours = store.businessHours.filter((hour) => !hour.isClosed);
  const openMinute = openHours.length
    ? Math.min(...openHours.map((hour) => hour.openMinute))
    : 9 * 60;
  const closeMinute = openHours.length
    ? Math.max(...openHours.map((hour) => hour.closeMinute))
    : 20 * 60;

  const staffFilter =
    context.restrictToOwnRecords && context.staffId ? [context.staffId] : (query.staffIds ?? null);

  const staffRows = await prisma.staff.findMany({
    where: {
      organizationId: context.organizationId,
      deletedAt: null,
      stores: { some: { storeId: query.storeId } },
      ...(staffFilter ? { id: { in: staffFilter } } : {}),
    },
    orderBy: [{ displayOrder: "asc" }, { displayName: "asc" }],
    select: {
      id: true,
      displayName: true,
      photoUrl: true,
      shifts: {
        where: {
          storeId: query.storeId,
          date: {
            gte: new Date(`${query.fromDateISO}T00:00:00.000Z`),
            lte: new Date(`${addDaysISO(query.fromDateISO, days - 1)}T00:00:00.000Z`),
          },
        },
        select: { date: true, type: true, startMinute: true, endMinute: true },
      },
    },
  });

  const staffIds = staffRows.map((staff) => staff.id);

  // One query for appointments, one for non-appointment blocks. Both are
  // bounded by the visible window, so a busy chain does not load a year.
  const appointments = await prisma.appointment.findMany({
    where: {
      organizationId: context.organizationId,
      storeId: query.storeId,
      deletedAt: null,
      startAt: { lt: rangeEnd },
      endAt: { gt: rangeStart },
      ...(staffIds.length > 0
        ? { staffSlots: { some: { staffId: { in: staffIds }, isActive: true } } }
        : {}),
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      reference: true,
      status: true,
      source: true,
      startAt: true,
      endAt: true,
      isDesignated: true,
      totalAmount: true,
      customerNote: true,
      staffNote: true,
      guestName: true,
      customer: {
        select: {
          id: true,
          name: true,
          nameKana: true,
          phone: true,
          email: true,
          visitCount: true,
          noShowCount: true,
        },
      },
      services: { orderBy: { sequence: "asc" }, select: { nameSnapshot: true } },
      staffSlots: {
        where: { kind: "service" },
        orderBy: { startAt: "asc" },
        select: { staffId: true, startAt: true, endAt: true, isActive: true },
      },
      resourceSlots: {
        where: { isActive: true },
        select: { resource: { select: { name: true } } },
      },
      medicalRecords: { select: { id: true }, take: 1 },
    },
  });

  const blocks = await prisma.appointmentStaff.findMany({
    where: {
      storeId: query.storeId,
      organizationId: context.organizationId,
      appointmentId: null,
      isActive: true,
      startAt: { lt: rangeEnd },
      endAt: { gt: rangeStart },
      ...(staffIds.length > 0 ? { staffId: { in: staffIds } } : {}),
    },
    select: { id: true, staffId: true, startAt: true, endAt: true, kind: true, note: true },
  });

  const timeOffs = await prisma.staffTimeOff.findMany({
    where: {
      storeId: query.storeId,
      status: "approved",
      startAt: { lt: rangeEnd },
      endAt: { gt: rangeStart },
      ...(staffIds.length > 0 ? { staffId: { in: staffIds } } : {}),
    },
    select: { id: true, staffId: true, startAt: true, endAt: true, reason: true },
  });

  const columns: LedgerColumn[] = staffRows.map((staff) => ({
    staffId: staff.id,
    displayName: staff.displayName,
    photoUrl: staff.photoUrl,
    workWindows: staff.shifts
      .filter((shift) => shift.type === "work" || shift.type === "training")
      .map((shift) => {
        const dateISO = shift.date.toISOString().slice(0, 10);
        return {
          startAt: zonedDateAtMinute(dateISO, shift.startMinute, store.timezone),
          endAt: zonedDateAtMinute(dateISO, shift.endMinute, store.timezone),
        };
      }),
  }));

  const entries: LedgerEntry[] = appointments.map((appointment) => ({
    id: appointment.id,
    reference: appointment.reference,
    status: appointment.status as AppointmentStatus,
    source: appointment.source,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    isDesignated: appointment.isDesignated,
    totalAmount: appointment.totalAmount,
    customerNote: appointment.customerNote,
    staffNote: appointment.staffNote,
    customer: appointment.customer ? maskCustomerContact(context, appointment.customer) : null,
    guestName: appointment.guestName,
    serviceNames: appointment.services.map((service) => service.nameSnapshot),
    staffBlocks: appointment.staffSlots
      .filter((slot) => slot.isActive)
      .map((slot) => ({ staffId: slot.staffId, startAt: slot.startAt, endAt: slot.endAt })),
    resourceNames: appointment.resourceSlots.map((slot) => slot.resource.name),
    hasMedicalRecord: appointment.medicalRecords.length > 0,
  }));

  return {
    storeId: store.id,
    timeZone: store.timezone,
    fromDateISO: query.fromDateISO,
    days,
    openMinute,
    closeMinute,
    columns,
    entries,
    blocks: [
      ...blocks.map((block) => ({
        id: block.id,
        staffId: block.staffId,
        startAt: block.startAt,
        endAt: block.endAt,
        kind: block.kind as "break_time" | "block",
        note: block.note,
      })),
      ...timeOffs.map((timeOff) => ({
        id: timeOff.id,
        staffId: timeOff.staffId,
        startAt: timeOff.startAt,
        endAt: timeOff.endAt,
        kind: "time_off" as const,
        note: timeOff.reason,
      })),
    ],
  };
}

/** A single appointment with everything the detail drawer shows. */
export async function getAppointmentDetail(context: RequestContext, appointmentId: string) {
  requirePermission(context, PERMISSIONS.RESERVATION_READ);

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      organizationId: context.organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      reference: true,
      status: true,
      source: true,
      startAt: true,
      endAt: true,
      isDesignated: true,
      subtotalAmount: true,
      discountAmount: true,
      totalAmount: true,
      customerNote: true,
      staffNote: true,
      cancelReason: true,
      guestName: true,
      guestPhone: true,
      guestEmail: true,
      storeId: true,
      store: { select: { id: true, name: true, timezone: true } },
      customer: {
        select: {
          id: true,
          name: true,
          nameKana: true,
          phone: true,
          email: true,
          visitCount: true,
          noShowCount: true,
          allergyNote: true,
          cautionNote: true,
        },
      },
      services: {
        orderBy: { sequence: "asc" },
        select: {
          id: true,
          nameSnapshot: true,
          priceSnapshot: true,
          durationMinutes: true,
          startAt: true,
          endAt: true,
          options: { select: { nameSnapshot: true, priceSnapshot: true } },
        },
      },
      staffSlots: {
        orderBy: { startAt: "asc" },
        select: {
          staffId: true,
          startAt: true,
          endAt: true,
          isActive: true,
          staff: { select: { displayName: true } },
        },
      },
      resourceSlots: {
        select: { resource: { select: { name: true } }, startAt: true, endAt: true },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        select: {
          fromStatus: true,
          toStatus: true,
          reason: true,
          actorLabel: true,
          createdAt: true,
        },
      },
      medicalRecords: { select: { id: true, visitedAt: true } },
    },
  });

  if (!appointment) return null;
  if (!context.accessibleStores.some((store) => store.id === appointment.storeId)) {
    return null;
  }

  return {
    ...appointment,
    customer: appointment.customer ? maskCustomerContact(context, appointment.customer) : null,
  };
}
