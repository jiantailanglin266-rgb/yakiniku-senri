import Link from "next/link";
import { notFound } from "next/navigation";

import { requireContext, requirePermission } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { getStaff } from "@/server/modules/settings/staff-service";
import { getTranslator } from "@/i18n";
import { StaffForm } from "@/components/admin/staff-form";
import { PageHeader } from "@/components/ui/primitives";

export const metadata = { title: "スタッフを編集" };
export const dynamic = "force-dynamic";

export default async function EditStaffPage({ params }: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await params;

  const context = await requireContext();
  requirePermission(context, PERMISSIONS.STAFF_MANAGE);

  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const staff = await getStaff(context, staffId).catch(() => null);
  if (!staff) notFound();

  return (
    <>
      <PageHeader
        title={staff.displayName}
        description={t("settings.editStaff")}
        actions={
          <Link
            href={`/admin/staff/${staff.id}/shifts`}
            className="text-xs text-[--color-accent] hover:underline"
          >
            {t("settings.editShifts")} →
          </Link>
        }
      />

      <StaffForm
        staffId={staff.id}
        initial={{
          name: staff.name,
          nameKana: staff.nameKana ?? "",
          displayName: staff.displayName,
          title: staff.title ?? "",
          employmentType: staff.employmentType,
          designationFee: staff.designationFee,
          commissionPercent: staff.commissionBps === null ? "" : String(staff.commissionBps / 100),
          maxConcurrent: staff.maxConcurrent,
          maxDailyAppointments:
            staff.maxDailyAppointments === null ? "" : String(staff.maxDailyAppointments),
          isBookable: staff.isBookable,
          isPubliclyVisible: staff.isPubliclyVisible,
          displayOrder: staff.displayOrder,
          storeIds: staff.storeIds,
        }}
        stores={context.accessibleStores.map((store) => ({ id: store.id, name: store.name }))}
        locale={locale}
      />
    </>
  );
}
