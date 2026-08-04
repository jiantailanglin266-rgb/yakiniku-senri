import { requireContext, requirePermission } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { prisma } from "@/server/db/client";
import { orgScope } from "@/server/db/tenant";
import { listAssignableStaff } from "@/server/modules/settings/staff-service";
import { getTranslator } from "@/i18n";
import { EMPTY_SERVICE, ServiceForm } from "@/components/admin/service-form";
import { Alert, PageHeader } from "@/components/ui/primitives";

export const metadata = { title: "メニューを追加" };
export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  const context = await requireContext();
  requirePermission(context, PERMISSIONS.STORE_MANAGE);

  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

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
      <PageHeader title={t("settings.newService")} />

      {categories.length === 0 ? (
        // Without a category there is nothing valid to submit, so say why
        // rather than let the operator fill the form and hit a wall.
        <Alert tone="warning">
          {locale === "en"
            ? "Create a category first — every menu item belongs to one."
            : "先にカテゴリを作成してください。メニューは必ずいずれかのカテゴリに属します。"}
        </Alert>
      ) : null}

      <ServiceForm
        initial={EMPTY_SERVICE}
        categories={categories}
        stores={context.accessibleStores.map((store) => ({ id: store.id, name: store.name }))}
        staff={staff}
        locale={locale}
      />
    </>
  );
}
