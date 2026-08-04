import Link from "next/link";
import { notFound } from "next/navigation";

import { requireContext, requirePermission } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { prisma } from "@/server/db/client";
import { getSetupStatus } from "@/server/modules/settings/setup-status";
import { getTranslator } from "@/i18n";
import { BusinessHoursForm } from "@/components/admin/business-hours-form";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import { PageHeader } from "@/components/ui/primitives";
import { SetupChecklist } from "@/components/admin/setup-checklist";

export const metadata = { title: "店舗設定" };
export const dynamic = "force-dynamic";

export default async function StoreSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const context = await requireContext();
  requirePermission(context, PERMISSIONS.STORE_MANAGE, storeId);

  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  // Scoped by organization *and* by the stores this user may reach, so an id
  // from another tenant is a 404 rather than a permission message that
  // confirms the id exists.
  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      organizationId: context.organizationId,
      deletedAt: null,
      // Narrowed to the stores this session may reach, so a sibling branch's
      // id behaves exactly like one that does not exist.
      AND: { id: { in: context.accessibleStores.map((entry) => entry.id) } },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      phone: true,
      postalCode: true,
      prefecture: true,
      city: true,
      addressLine: true,
      approvalMode: true,
      slotIntervalMinutes: true,
      bookingCutoffMinutes: true,
      minAdvanceMinutes: true,
      maxAdvanceDays: true,
      bufferMinutes: true,
      cancelDeadlineHours: true,
      businessHours: {
        orderBy: { dayOfWeek: "asc" },
        select: {
          dayOfWeek: true,
          isClosed: true,
          openMinute: true,
          closeMinute: true,
          breakStartMinute: true,
          breakEndMinute: true,
        },
      },
    },
  });

  if (!store) notFound();

  const setup = await getSetupStatus(context, store.id);

  return (
    <>
      <PageHeader
        title={store.name}
        description={t("settings.storeSettings")}
        actions={
          <Link href="/admin/stores" className="text-xs text-[--color-ink-muted] hover:underline">
            ← {t("store.title")}
          </Link>
        }
      />

      <SetupChecklist status={setup} storeId={store.id} locale={locale} />

      <BusinessHoursForm storeId={store.id} initial={store.businessHours} locale={locale} />

      <StoreSettingsForm
        storeId={store.id}
        slug={store.slug}
        locale={locale}
        initial={{
          name: store.name,
          phone: store.phone ?? "",
          postalCode: store.postalCode ?? "",
          prefecture: store.prefecture ?? "",
          city: store.city ?? "",
          addressLine: store.addressLine ?? "",
          approvalMode: store.approvalMode === "request" ? "request" : "instant",
          slotIntervalMinutes: store.slotIntervalMinutes,
          bookingCutoffMinutes: store.bookingCutoffMinutes,
          minAdvanceMinutes: store.minAdvanceMinutes,
          maxAdvanceDays: store.maxAdvanceDays,
          bufferMinutes: store.bufferMinutes,
          cancelDeadlineHours: store.cancelDeadlineHours,
        }}
      />
    </>
  );
}
