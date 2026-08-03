import "server-only";

import { prisma } from "@/server/db/client";
import { getAvailability } from "@/server/modules/appointments/availability-service";
import { displayPrice } from "@/lib/tax";
import { addDaysISO, zonedDateISO } from "@/lib/time";

/**
 * Read model for the public booking pages.
 *
 * Unauthenticated, so it exposes strictly what a prospective customer needs:
 * published menu items, publicly visible staff, and free slots. It never
 * returns another customer's booking, a staff member's schedule, or anything
 * that would let the page be used to probe the salon's business.
 */

export interface PublicStore {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  description: string | null;
  industry: string;
  timeZone: string;
  phone: string | null;
  postalCode: string | null;
  address: string;
  accessNote: string | null;
  approvalMode: "instant" | "request";
  allowGuestBooking: boolean;
  allowStaffDesignation: boolean;
  cancelDeadlineHours: number;
  cancellationPolicy: string | null;
  maxAdvanceDays: number;
  businessHours: Array<{
    dayOfWeek: number;
    openMinute: number;
    closeMinute: number;
    isClosed: boolean;
  }>;
}

export async function getPublicStore(slug: string): Promise<PublicStore | null> {
  const store = await prisma.store.findFirst({
    where: {
      slug,
      deletedAt: null,
      status: "active",
      isPubliclyListed: true,
    },
    select: {
      id: true,
      organizationId: true,
      slug: true,
      name: true,
      description: true,
      industry: true,
      timezone: true,
      phone: true,
      postalCode: true,
      prefecture: true,
      city: true,
      addressLine: true,
      accessNote: true,
      approvalMode: true,
      allowGuestBooking: true,
      allowStaffDesignation: true,
      cancelDeadlineHours: true,
      cancellationPolicy: true,
      maxAdvanceDays: true,
      businessHours: {
        orderBy: { dayOfWeek: "asc" },
        select: {
          dayOfWeek: true,
          openMinute: true,
          closeMinute: true,
          isClosed: true,
        },
      },
    },
  });

  if (!store) return null;

  return {
    id: store.id,
    organizationId: store.organizationId,
    slug: store.slug,
    name: store.name,
    description: store.description,
    industry: store.industry,
    timeZone: store.timezone,
    phone: store.phone,
    postalCode: store.postalCode,
    address: [store.prefecture, store.city, store.addressLine].filter(Boolean).join(""),
    accessNote: store.accessNote,
    approvalMode: store.approvalMode,
    allowGuestBooking: store.allowGuestBooking,
    allowStaffDesignation: store.allowStaffDesignation,
    cancelDeadlineHours: store.cancelDeadlineHours,
    cancellationPolicy: store.cancellationPolicy,
    maxAdvanceDays: store.maxAdvanceDays,
    businessHours: store.businessHours,
  };
}

export interface PublicService {
  id: string;
  categoryName: string;
  name: string;
  description: string | null;
  /** Tax-inclusive price shown to the customer. */
  displayPrice: number;
  durationMinutes: number;
  options: Array<{ id: string; name: string; price: number; durationMinutes: number }>;
}

/**
 * Menu items bookable online right now.
 *
 * Publication windows are applied here rather than in the UI, so an expired
 * campaign menu cannot be booked by someone holding an old link.
 */
export async function getPublicServices(store: PublicStore): Promise<PublicService[]> {
  const now = new Date();

  const services = await prisma.service.findMany({
    where: {
      organizationId: store.organizationId,
      deletedAt: null,
      isActive: true,
      isOnlineBookable: true,
      OR: [{ storeId: store.id }, { storeId: null }],
      AND: [
        { OR: [{ publishedFrom: null }, { publishedFrom: { lte: now } }] },
        { OR: [{ publishedUntil: null }, { publishedUntil: { gte: now } }] },
      ],
    },
    orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      taxCategory: true,
      taxMode: true,
      durationMinutes: true,
      category: { select: { name: true } },
      options: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        select: { id: true, name: true, price: true, durationMinutes: true },
      },
    },
  });

  return services.map((service) => ({
    id: service.id,
    categoryName: service.category.name,
    name: service.name,
    description: service.description,
    displayPrice: displayPrice(service.price, service.taxCategory, service.taxMode),
    durationMinutes: service.durationMinutes,
    options: service.options,
  }));
}

export interface PublicStaff {
  id: string;
  displayName: string;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  designationFee: number;
}

export async function getPublicStaff(
  store: PublicStore,
  serviceIds: readonly string[],
): Promise<PublicStaff[]> {
  const staff = await prisma.staff.findMany({
    where: {
      organizationId: store.organizationId,
      deletedAt: null,
      isBookable: true,
      isPubliclyVisible: true,
      stores: { some: { storeId: store.id } },
      ...(serviceIds.length > 0
        ? { serviceStaff: { some: { serviceId: { in: [...serviceIds] } } } }
        : {}),
    },
    orderBy: [{ displayOrder: "asc" }, { displayName: "asc" }],
    select: {
      id: true,
      displayName: true,
      title: true,
      bio: true,
      photoUrl: true,
      designationFee: true,
      serviceStaff: { select: { serviceId: true } },
    },
  });

  // A staff member must be able to perform every selected service, not just one.
  return staff
    .filter((member) => {
      if (serviceIds.length === 0) return true;
      const assigned = new Set(member.serviceStaff.map((entry) => entry.serviceId));
      return serviceIds.every((serviceId) => assigned.has(serviceId));
    })
    .map((member) => ({
      id: member.id,
      displayName: member.displayName,
      title: member.title,
      bio: member.bio,
      photoUrl: member.photoUrl,
      designationFee: member.designationFee,
    }));
}

export interface PublicDayAvailability {
  dateISO: string;
  storeClosed: boolean;
  /** Distinct start times, as ISO instants. */
  slots: Array<{ startAt: string; staffId: string }>;
}

/**
 * Availability for a window of days.
 *
 * Capped at 14 days per request: a customer only ever sees two weeks at a
 * time, and an uncapped range would let anyone make the server compute a
 * year of slots.
 */
export async function getPublicAvailability(
  store: PublicStore,
  options: {
    fromDateISO: string;
    days: number;
    serviceIds: string[];
    optionIds?: string[];
    staffId?: string | null;
    now?: Date;
  },
): Promise<PublicDayAvailability[]> {
  const now = options.now ?? new Date();
  const days = Math.min(14, Math.max(1, options.days));

  const todayISO = zonedDateISO(now, store.timeZone);
  const fromDateISO = options.fromDateISO < todayISO ? todayISO : options.fromDateISO;

  const results: PublicDayAvailability[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const dateISO = addDaysISO(fromDateISO, offset);

    const availability = await getAvailability(store.organizationId, {
      storeId: store.id,
      dateISO,
      serviceIds: options.serviceIds,
      optionIds: options.optionIds,
      staffId: options.staffId ?? null,
      now,
    });

    results.push({
      dateISO,
      storeClosed: availability?.storeClosed ?? true,
      slots: (availability?.slots ?? []).map((slot) => ({
        startAt: slot.startAt.toISOString(),
        staffId: slot.staffId,
      })),
    });
  }

  return results;
}
