import { notFound } from "next/navigation";

import { requireContext, requirePermission } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { prisma } from "@/server/db/client";
import { displayPrice } from "@/lib/tax";
import { zonedDateISO } from "@/lib/time";
import { getTranslator } from "@/i18n";
import { PageHeader } from "@/components/ui/primitives";
import { NewAppointmentForm } from "@/components/admin/new-appointment-form";

export const metadata = { title: "新規予約" };
export const dynamic = "force-dynamic";

export default async function NewAppointmentPage(props: {
  searchParams: Promise<{ store?: string; date?: string; customer?: string }>;
}) {
  const searchParams = await props.searchParams;
  const context = await requireContext();
  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const storeId = searchParams.store ?? context.activeStoreId;
  if (!storeId) notFound();

  requirePermission(context, PERMISSIONS.RESERVATION_WRITE, storeId);

  const store = context.accessibleStores.find((entry) => entry.id === storeId);
  if (!store) notFound();

  const [services, staff, customer] = await Promise.all([
    prisma.service.findMany({
      where: {
        organizationId: context.organizationId,
        deletedAt: null,
        isActive: true,
        OR: [{ storeId }, { storeId: null }],
      },
      orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }],
      select: {
        id: true,
        name: true,
        price: true,
        taxCategory: true,
        taxMode: true,
        durationMinutes: true,
        category: { select: { name: true } },
      },
    }),
    prisma.staff.findMany({
      where: {
        organizationId: context.organizationId,
        deletedAt: null,
        isBookable: true,
        stores: { some: { storeId } },
      },
      orderBy: [{ displayOrder: "asc" }, { displayName: "asc" }],
      select: { id: true, displayName: true, designationFee: true },
    }),
    searchParams.customer
      ? prisma.customer.findFirst({
          where: {
            id: searchParams.customer,
            organizationId: context.organizationId,
            deletedAt: null,
          },
          select: { id: true, name: true },
        })
      : Promise.resolve(null),
  ]);

  const dateISO =
    searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date)
      ? searchParams.date
      : zonedDateISO(new Date(), store.timezone);

  return (
    <>
      <PageHeader title={t("schedule.newAppointment")} description={store.name} />
      <NewAppointmentForm
        storeId={storeId}
        timeZone={store.timezone}
        dateISO={dateISO}
        services={services.map((service) => ({
          id: service.id,
          name: service.name,
          categoryName: service.category.name,
          displayPrice: displayPrice(service.price, service.taxCategory, service.taxMode),
          durationMinutes: service.durationMinutes,
        }))}
        staff={staff}
        initialCustomer={customer}
        locale={locale}
      />
    </>
  );
}
