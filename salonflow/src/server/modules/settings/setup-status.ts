import "server-only";

import { prisma } from "@/server/db/client";
import { requireStoreAccess, type RequestContext } from "@/server/auth/context";
import { orgScope } from "@/server/db/tenant";

/**
 * How far through setup a store is.
 *
 * A freshly bootstrapped tenant has no opening hours, no staff, no menu and no
 * roster. Each of those independently makes the public booking page show
 * nothing, and "nothing" looks identical in all four cases — which is how an
 * operator concludes the software is broken and stops. This turns that silence
 * into a list of what is still missing.
 */

export interface SetupStatus {
  hasOpenDay: boolean;
  hasStaff: boolean;
  hasService: boolean;
  hasUpcomingShift: boolean;
  complete: boolean;
}

/** Days of roster to look ahead. Roughly the horizon a customer books within. */
const SHIFT_LOOKAHEAD_DAYS = 14;

export async function getSetupStatus(
  context: RequestContext,
  storeId: string,
): Promise<SetupStatus> {
  requireStoreAccess(context, storeId);

  const today = new Date();
  const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const to = new Date(from.getTime() + SHIFT_LOOKAHEAD_DAYS * 86_400_000);

  const [openDays, staffCount, serviceCount, shiftCount] = await Promise.all([
    prisma.storeBusinessHour.count({ where: { storeId, isClosed: false } }),
    prisma.staff.count({
      where: { ...orgScope(context), stores: { some: { storeId } } },
    }),
    prisma.service.count({
      where: {
        ...orgScope(context),
        isActive: true,
        OR: [{ storeId: null }, { storeId }],
      },
    }),
    prisma.staffShift.count({ where: { storeId, date: { gte: from, lt: to } } }),
  ]);

  const hasOpenDay = openDays > 0;
  const hasStaff = staffCount > 0;
  const hasService = serviceCount > 0;
  const hasUpcomingShift = shiftCount > 0;

  return {
    hasOpenDay,
    hasStaff,
    hasService,
    hasUpcomingShift,
    complete: hasOpenDay && hasStaff && hasService && hasUpcomingShift,
  };
}
