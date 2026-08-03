import { notFound } from "next/navigation";

import { requireContext, requirePermission } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { listTemplates } from "@/server/modules/medical-records/record-service";
import { prisma } from "@/server/db/client";
import { zonedDateISO } from "@/lib/time";
import { getTranslator } from "@/i18n";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { RecordForm } from "@/components/admin/record-form";

export const metadata = { title: "カルテ入力" };
export const dynamic = "force-dynamic";

export default async function NewRecordPage(props: {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<{ appointment?: string }>;
}) {
  const { customerId } = await props.params;
  const { appointment: appointmentId } = await props.searchParams;

  const context = await requireContext();
  requirePermission(context, PERMISSIONS.MEDICAL_RECORD_WRITE);

  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: context.organizationId, deletedAt: null },
    select: { id: true, name: true, homeStoreId: true },
  });
  if (!customer) notFound();

  // The chart belongs to the store where the service happened; fall back to the
  // customer's usual store, then to the operator's active store.
  const appointment = appointmentId
    ? await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          organizationId: context.organizationId,
          customerId,
        },
        select: { id: true, storeId: true, startAt: true, store: { select: { timezone: true } } },
      })
    : null;

  const storeId = appointment?.storeId ?? customer.homeStoreId ?? context.activeStoreId ?? null;
  if (!storeId) {
    return <EmptyState title={t("errors.notFound")} description="対象店舗が特定できません。" />;
  }

  const store = context.accessibleStores.find((entry) => entry.id === storeId);
  if (!store) {
    return <EmptyState title={t("errors.forbidden")} />;
  }

  const templates = await listTemplates(context, storeId);
  if (templates.length === 0) {
    return (
      <EmptyState
        title={t("common.noData")}
        description="この店舗で利用できるカルテテンプレートがありません。"
      />
    );
  }

  const visitedAtISO = appointment
    ? zonedDateISO(appointment.startAt, appointment.store.timezone)
    : zonedDateISO(new Date(), store.timezone);

  return (
    <>
      <PageHeader title={t("medicalRecord.new")} description={customer.name} />
      <RecordForm
        customerId={customer.id}
        storeId={storeId}
        appointmentId={appointment?.id ?? null}
        visitedAtISO={visitedAtISO}
        templates={templates.map((template) => ({
          id: template.id,
          name: template.name,
          fields: template.fields.map((field) => ({
            id: field.id,
            key: field.key,
            label: field.label,
            type: field.type,
            section: field.section,
            options: normaliseOptions(field.options),
            isRequired: field.isRequired,
            helpText: field.helpText,
            placeholder: field.placeholder,
          })),
        }))}
        locale={locale}
      />
    </>
  );
}

/** Field options are stored as free-form JSON; narrow them for the form. */
function normaliseOptions(value: unknown): Array<{ value: string; label: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const record = entry as Record<string, unknown>;
    const optionValue = typeof record.value === "string" ? record.value : null;
    if (!optionValue) return [];
    return [
      {
        value: optionValue,
        label: typeof record.label === "string" ? record.label : optionValue,
      },
    ];
  });
}
