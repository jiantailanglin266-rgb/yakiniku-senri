import { requireContext, requirePermission } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { getTranslator } from "@/i18n";
import { EMPTY_STAFF, StaffForm } from "@/components/admin/staff-form";
import { PageHeader } from "@/components/ui/primitives";

export const metadata = { title: "スタッフを追加" };
export const dynamic = "force-dynamic";

export default async function NewStaffPage() {
  const context = await requireContext();
  requirePermission(context, PERMISSIONS.STAFF_MANAGE);

  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const stores = context.accessibleStores.map((store) => ({ id: store.id, name: store.name }));

  return (
    <>
      <PageHeader title={t("settings.newStaff")} />
      <StaffForm
        initial={{
          ...EMPTY_STAFF,
          // With one store there is no choice to make; pre-selecting it saves
          // a click and removes the commonest reason a save is rejected.
          storeIds: stores.length === 1 ? [stores[0]!.id] : [],
        }}
        stores={stores}
        locale={locale}
      />
    </>
  );
}
