import Link from "next/link";
import { notFound } from "next/navigation";

import { requireContext } from "@/server/auth/context";
import { getRecord } from "@/server/modules/medical-records/record-service";
import { getTranslator } from "@/i18n";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/primitives";

export const metadata = { title: "カルテ" };
export const dynamic = "force-dynamic";

export default async function RecordDetailPage(props: {
  params: Promise<{ customerId: string; recordId: string }>;
}) {
  const { customerId, recordId } = await props.params;
  const context = await requireContext();
  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const record = await getRecord(context, recordId);
  if (!record || record.customerId !== customerId) notFound();

  const sections = new Map<string, typeof record.fields>();
  for (const field of record.fields) {
    const key = field.section ?? "その他";
    const bucket = sections.get(key) ?? [];
    bucket.push(field);
    sections.set(key, bucket);
  }

  return (
    <>
      <PageHeader
        title={t("medicalRecord.title")}
        description={`${record.customerName} — ${record.visitedAt.toISOString().slice(0, 10)}（${record.storeName}）`}
        actions={
          <Link
            href={`/admin/customers/${customerId}`}
            className="rounded-md border border-[--color-border] bg-[--color-surface] px-3 py-2 text-xs hover:bg-[--color-surface-muted]"
          >
            {t("common.back")}
          </Link>
        }
      />

      <Card>
        <CardHeader title={record.templateName} description={record.staffName ?? undefined} />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Entry label={t("medicalRecord.serviceSummary")} value={record.serviceSummary} wide />
          <Entry label={t("medicalRecord.productsUsed")} value={record.productsUsed} />
          <Entry label={t("medicalRecord.cautionNote")} value={record.cautionNote} />
          <Entry label={t("medicalRecord.customerRequest")} value={record.customerRequest} />
          <Entry label={t("medicalRecord.result")} value={record.result} />
          <Entry label={t("medicalRecord.nextProposal")} value={record.nextProposal} />
          <Entry label={t("medicalRecord.staffNote")} value={record.staffNote} wide />
        </CardBody>
      </Card>

      {[...sections.entries()].map(([section, fields]) => (
        <Card key={section}>
          <CardHeader title={section} />
          <CardBody className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <Entry
                key={field.id}
                label={field.label}
                value={formatValue(field.value)}
                wide={field.type === "textarea" || field.type === "color_formula"}
              />
            ))}
          </CardBody>
        </Card>
      ))}

      <Card>
        <CardHeader title={t("medicalRecord.photos")} />
        <CardBody>
          {record.photos.length === 0 ? (
            <p className="text-xs text-[--color-ink-muted]">{t("common.noData")}</p>
          ) : record.photos.every((photo) => photo.url === null) ? (
            <p className="text-xs text-[--color-ink-muted]">{t("medicalRecord.photosHidden")}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {record.photos.map((photo) => (
                <li key={photo.id} className="space-y-1">
                  {photo.url ? (
                    // Signed, short-lived URL. Never a stable public path.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.url}
                      alt={photo.caption ?? t("medicalRecord.photos")}
                      className="aspect-square w-full rounded-md border border-[--color-border] object-cover"
                    />
                  ) : null}
                  <p className="text-xs text-[--color-ink-subtle]">
                    {photo.slot ?? photo.caption ?? ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-[--color-ink-subtle]">
            カルテの閲覧と写真の表示は監査ログに記録されます。
          </p>
        </CardBody>
      </Card>
    </>
  );
}

function Entry({ label, value, wide }: { label: string; value: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <p className="text-xs text-[--color-ink-muted]">{label}</p>
      <p className="mt-0.5 text-sm whitespace-pre-wrap text-[--color-ink]">{value || "—"}</p>
    </div>
  );
}

function formatValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value ? "はい" : "いいえ";
  if (Array.isArray(value)) return value.map(String).join("、");
  return String(value);
}
