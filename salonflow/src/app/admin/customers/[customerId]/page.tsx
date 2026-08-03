import Link from "next/link";
import { notFound } from "next/navigation";

import { can, requireContext } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { findDuplicateCandidates, getCustomer } from "@/server/modules/customers/customer-service";
import { listCustomerRecords } from "@/server/modules/medical-records/record-service";
import { prisma } from "@/server/db/client";
import { formatMoney } from "@/lib/money";
import { zonedDateISO, zonedTimeHHmm } from "@/lib/time";
import { getTranslator } from "@/i18n";
import {
  Alert,
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status";
import { MergeDuplicates } from "@/components/admin/merge-duplicates";
import type { AppointmentStatus } from "@/server/modules/appointments/state-machine";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage(props: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await props.params;
  const context = await requireContext();
  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const customer = await getCustomer(context, customerId);
  if (!customer) notFound();

  const canReadRecords = can(context, PERMISSIONS.MEDICAL_RECORD_READ);
  const canWriteCustomer = can(context, PERMISSIONS.CUSTOMER_WRITE);

  const [appointments, records, duplicates] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        customerId,
        organizationId: context.organizationId,
        deletedAt: null,
        storeId: { in: context.accessibleStores.map((store) => store.id) },
      },
      orderBy: { startAt: "desc" },
      take: 20,
      select: {
        id: true,
        reference: true,
        status: true,
        startAt: true,
        totalAmount: true,
        store: { select: { name: true, timezone: true } },
        services: { select: { nameSnapshot: true } },
        staffSlots: {
          where: { kind: "service" },
          take: 1,
          select: { staff: { select: { displayName: true } } },
        },
      },
    }),
    canReadRecords ? listCustomerRecords(context, customerId) : Promise.resolve([]),
    canWriteCustomer ? findDuplicateCandidates(context, customerId) : Promise.resolve([]),
  ]);

  const consentByType = new Map(customer.consents.map((consent) => [consent.type, consent.status]));

  return (
    <>
      <PageHeader
        title={customer.name}
        description={customer.nameKana ?? undefined}
        actions={
          <Link
            href="/admin/customers"
            className="rounded-md border border-[--color-border] bg-[--color-surface] px-3 py-2 text-xs hover:bg-[--color-surface-muted]"
          >
            {t("common.back")}
          </Link>
        }
      />

      {customer.allergyNote || customer.cautionNote ? (
        <Alert tone="warning" title={t("customer.allergyNote")}>
          {[customer.allergyNote, customer.cautionNote].filter(Boolean).join(" / ")}
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title={t("customer.title")} />
          <CardBody>
            <dl className="space-y-2 text-sm">
              <Row label={t("customer.phone")}>{customer.phone ?? "—"}</Row>
              <Row label={t("customer.email")}>{customer.email ?? "—"}</Row>
              <Row label={t("customer.birthDate")}>
                {customer.birthDate ? customer.birthDate.toISOString().slice(0, 10) : "—"}
              </Row>
              <Row label={t("customer.homeStore")}>{customer.homeStore?.name ?? "—"}</Row>
              <Row label={t("customer.primaryStaff")}>
                {customer.primaryStaff?.displayName ?? "—"}
              </Row>
              <Row label={t("customer.acquisitionSource")}>{customer.acquisitionSource ?? "—"}</Row>
              <Row label={t("customer.tags")}>
                <div className="flex flex-wrap gap-1">
                  {customer.tags.length === 0
                    ? "—"
                    : customer.tags.map((tag) => (
                        <Badge key={tag.id} tone="neutral">
                          {tag.name}
                        </Badge>
                      ))}
                </div>
              </Row>
              <Row label={t("customer.note")}>{customer.note ?? "—"}</Row>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("dashboard.title")} />
          <CardBody>
            <dl className="space-y-2 text-sm">
              <Row label={t("customer.visitCount")}>
                <span className="tabular-nums">{customer.visitCount}</span>
              </Row>
              <Row label={t("customer.totalSpent")}>
                <span className="tabular-nums">{formatMoney(customer.totalSpent)}</span>
              </Row>
              <Row label={t("customer.averageSpend")}>
                <span className="tabular-nums">{formatMoney(customer.averageSpend)}</span>
              </Row>
              <Row label={t("customer.firstVisit")}>
                {customer.firstVisitAt ? customer.firstVisitAt.toISOString().slice(0, 10) : "—"}
              </Row>
              <Row label={t("customer.lastVisit")}>
                {customer.lastVisitAt ? customer.lastVisitAt.toISOString().slice(0, 10) : "—"}
              </Row>
              <Row label={t("customer.cancelCount")}>
                <span className="tabular-nums">{customer.cancelCount}</span>
              </Row>
              <Row label={t("customer.noShowCount")}>
                <span
                  className={
                    customer.noShowCount > 0
                      ? "font-semibold tabular-nums text-[--color-danger]"
                      : "tabular-nums"
                  }
                >
                  {customer.noShowCount}
                </span>
              </Row>
              <Row label={t("customer.points")}>
                <span className="tabular-nums">{customer.pointAccount?.balance ?? 0} pt</span>
              </Row>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("customer.consents")} />
          <CardBody>
            <dl className="space-y-2 text-sm">
              {(
                [
                  ["privacy_policy", "プライバシーポリシー"],
                  ["marketing_email", "メール配信"],
                  ["photo_usage", "写真利用"],
                ] as const
              ).map(([type, label]) => {
                const status = consentByType.get(type);
                return (
                  <Row key={type} label={label}>
                    <Badge
                      tone={
                        status === "granted"
                          ? "positive"
                          : status === "withdrawn"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {status === "granted" ? "同意済" : status === "withdrawn" ? "撤回" : "未取得"}
                    </Badge>
                  </Row>
                );
              })}
            </dl>
            <p className="mt-3 text-xs text-[--color-ink-subtle]">
              配信は同意がある顧客にのみ行われます。
            </p>
          </CardBody>
        </Card>
      </div>

      {duplicates.length > 0 ? (
        <MergeDuplicates
          targetId={customerId}
          targetName={customer.name}
          candidates={duplicates.map((candidate) => ({
            id: candidate.id,
            name: candidate.name,
            nameKana: candidate.nameKana,
            phone: candidate.phone,
            email: candidate.email,
            score: candidate.score,
            lastVisitAt: candidate.lastVisitAt
              ? candidate.lastVisitAt.toISOString().slice(0, 10)
              : null,
          }))}
          locale={locale}
        />
      ) : null}

      <Card>
        <CardHeader title={t("nav.appointments")} />
        {appointments.length === 0 ? (
          <EmptyState title={t("common.noData")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("appointment.startAt")}</Th>
                <Th>{t("store.title")}</Th>
                <Th>{t("appointment.services")}</Th>
                <Th>{t("appointment.staff")}</Th>
                <Th className="text-right">{t("appointment.amount")}</Th>
                <Th>{t("appointment.status")}</Th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <Td className="tabular-nums">
                    {zonedDateISO(appointment.startAt, appointment.store.timezone)}{" "}
                    {zonedTimeHHmm(appointment.startAt, appointment.store.timezone)}
                  </Td>
                  <Td className="text-xs">{appointment.store.name}</Td>
                  <Td className="text-xs">
                    {appointment.services.map((service) => service.nameSnapshot).join("、")}
                  </Td>
                  <Td className="text-xs">{appointment.staffSlots[0]?.staff.displayName ?? "—"}</Td>
                  <Td className="text-right tabular-nums">
                    {formatMoney(appointment.totalAmount)}
                  </Td>
                  <Td>
                    <StatusBadge status={appointment.status as AppointmentStatus} locale={locale} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader
          title={t("medicalRecord.title")}
          action={
            can(context, PERMISSIONS.MEDICAL_RECORD_WRITE) ? (
              <Link
                href={`/admin/customers/${customerId}/records/new`}
                className="text-xs text-[--color-accent] hover:underline"
              >
                {t("medicalRecord.new")}
              </Link>
            ) : null
          }
        />
        {!canReadRecords ? (
          <EmptyState title={t("errors.forbidden")} />
        ) : records.length === 0 ? (
          <EmptyState title={t("medicalRecord.noRecords")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("medicalRecord.visitedAt")}</Th>
                <Th>{t("store.title")}</Th>
                <Th>{t("appointment.staff")}</Th>
                <Th>{t("medicalRecord.serviceSummary")}</Th>
                <Th className="text-right">{t("medicalRecord.photos")}</Th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <Td className="tabular-nums">
                    <Link
                      href={`/admin/customers/${customerId}/records/${record.id}`}
                      className="text-[--color-accent] hover:underline"
                    >
                      {record.visitedAt.toISOString().slice(0, 10)}
                    </Link>
                  </Td>
                  <Td className="text-xs">{record.storeName}</Td>
                  <Td className="text-xs">{record.staffName ?? "—"}</Td>
                  <Td className="text-xs">{record.serviceSummary ?? "—"}</Td>
                  <Td className="text-right tabular-nums">{record.photoCount}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2">
      <dt className="text-xs text-[--color-ink-muted]">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
