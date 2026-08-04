import { notFound } from "next/navigation";

import { requireContext, requirePermission } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { prisma } from "@/server/db/client";
import { orgScope } from "@/server/db/tenant";
import { getService } from "@/server/modules/settings/service-catalog";
import { listAssignableStaff } from "@/server/modules/settings/staff-service";
import { getTranslator } from "@/i18n";
import { ServiceForm } from "@/components/admin/service-form";
import { PageHeader } from "@/components/ui/primitives";

export const metadata = { title: "メニューを編集" };
export const dynamic = "force-dynamic";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;

  const context = await requireContext();
  requirePermission(context, PERMISSIONS.STORE_MANAGE);

  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  // getService applies the tenant check and throws for anything outside it.
  // A missing or foreign id becomes a 404, not a message confirming it exists.
  const service = await getService(context, serviceId).catch(() => null);
  if (!service) notFound();

  const [categories, staff] = await Promise.all([
    prisma.serviceCategory.findMany({
      where: orgScope(context),
      orderBy: { displayOrder: "asc" },
      select: { id: true, name: true },
    }),
    listAssignableStaff(context),
  ]);

  return (
    <>
      <PageHeader title={service.name} description={t("settings.editService")} />

      <ServiceForm
        serviceId={service.id}
        initial={{
          categoryId: service.categoryId,
          storeId: service.storeId,
          name: service.name,
          description: service.description ?? "",
          price: service.price,
          durationMinutes: service.durationMinutes,
          prepMinutes: service.prepMinutes,
          cleanupMinutes: service.cleanupMinutes,
          unattendedStartMinute: service.unattendedStartMinute,
          unattendedMinutes: service.unattendedMinutes,
          isOnlineBookable: service.isOnlineBookable,
          allowsDesignation: service.allowsDesignation,
          isActive: service.isActive,
          displayOrder: service.displayOrder,
          staffIds: service.staffIds,
        }}
        categories={categories}
        stores={context.accessibleStores.map((store) => ({ id: store.id, name: store.name }))}
        staff={staff}
        locale={locale}
      />
    </>
  );
}
