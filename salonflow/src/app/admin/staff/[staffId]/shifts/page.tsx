import Link from "next/link";
import { notFound } from "next/navigation";

import { requireContext, requirePermission } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { prisma } from "@/server/db/client";
import { getStaff } from "@/server/modules/settings/staff-service";
import { addDaysISO, zonedDateISO } from "@/lib/time";
import { getTranslator } from "@/i18n";
import { ShiftEditor } from "@/components/admin/shift-editor";
import { Alert, PageHeader } from "@/components/ui/primitives";

export const metadata = { title: "シフト" };
export const dynamic = "force-dynamic";

/** Two weeks fits a screen and covers the window most customers book within. */
const DAYS = 14;

export default async function StaffShiftsPage({
  params,
  searchParams,
}: {
  params: Promise<{ staffId: string }>;
  searchParams: Promise<{ from?: string; storeId?: string }>;
}) {
  const { staffId } = await params;
  const { from, storeId: requestedStoreId } = await searchParams;

  const context = await requireContext();
  requirePermission(context, PERMISSIONS.STAFF_MANAGE);

  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const staff = await getStaff(context, staffId).catch(() => null);
  if (!staff) notFound();

  // Rosters belong to a store, so pick one this person actually works at.
  const storeId =
    requestedStoreId && staff.storeIds.includes(requestedStoreId)
      ? requestedStoreId
      : staff.storeIds[0];

  if (!storeId) {
    return (
      <>
        <PageHeader title={staff.displayName} description={t("settings.shifts")} />
        <Alert tone="warning">{t("problems.staff.store_required")}</Alert>
      </>
    );
  }

  const store = context.accessibleStores.find((entry) => entry.id === storeId);
  if (!store) notFound();

  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(from ?? "")
    ? (from as string)
    : zonedDateISO(new Date(), store.timezone);

  const endDate = addDaysISO(startDate, DAYS);

  const [shifts, businessHours] = await Promise.all([
    prisma.staffShift.findMany({
      where: {
        staffId: staff.id,
        storeId,
        date: {
          gte: new Date(`${startDate}T00:00:00.000Z`),
          lt: new Date(`${endDate}T00:00:00.000Z`),
        },
      },
      select: {
        date: true,
        startMinute: true,
        endMinute: true,
        breakStartMinute: true,
        breakEndMinute: true,
      },
    }),
    prisma.storeBusinessHour.findMany({
      where: { storeId },
      orderBy: { dayOfWeek: "asc" },
      select: { dayOfWeek: true, isClosed: true, openMinute: true, closeMinute: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title={staff.displayName}
        description={t("settings.shifts")}
        actions={
          <div className="flex items-center gap-3 text-xs">
            <Link
              href={`/admin/staff/${staff.id}/shifts?from=${addDaysISO(startDate, -DAYS)}&storeId=${storeId}`}
              className="text-[--color-ink-muted] hover:underline"
            >
              ← {t("settings.prevWeek")}
            </Link>
            <Link
              href={`/admin/staff/${staff.id}/shifts?from=${endDate}&storeId=${storeId}`}
              className="text-[--color-ink-muted] hover:underline"
            >
              {t("settings.nextWeek")} →
            </Link>
            <Link
              href={`/admin/staff/${staff.id}`}
              className="text-[--color-accent] hover:underline"
            >
              {t("settings.editStaff")}
            </Link>
          </div>
        }
      />

      <ShiftEditor
        staffId={staff.id}
        storeId={storeId}
        storeName={store.name}
        startDate={startDate}
        days={DAYS}
        existing={shifts.map((shift) => ({
          // `@db.Date` comes back as a UTC-midnight Date; slicing the ISO
          // string keeps the calendar day the operator entered.
          date: shift.date.toISOString().slice(0, 10),
          startMinute: shift.startMinute,
          endMinute: shift.endMinute,
          breakStartMinute: shift.breakStartMinute,
          breakEndMinute: shift.breakEndMinute,
        }))}
        businessHours={businessHours}
        locale={locale}
      />
    </>
  );
}
