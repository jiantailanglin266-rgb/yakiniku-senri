import Link from "next/link";

import { requireContext, requirePermission } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { prisma } from "@/server/db/client";
import { storeScopeHard } from "@/server/db/tenant";
import { maskCustomerContact } from "@/server/permissions/mask";
import { formatMoney } from "@/lib/money";
import { zonedDateISO, zonedTimeHHmm } from "@/lib/time";
import { getTranslator } from "@/i18n";
import { Card, EmptyState, PageHeader, Select, Table, Td, Th } from "@/components/ui/primitives";
import { SourceBadge, StatusBadge } from "@/components/ui/status";
import type { AppointmentStatus } from "@/server/modules/appointments/state-machine";

export const metadata = { title: "予約一覧" };
export const dynamic = "force-dynamic";

const STATUS_OPTIONS: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "checked_in",
  "in_service",
  "completed",
  "cancelled",
  "no_show",
];

export default async function AppointmentsPage(props: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const context = await requireContext();
  requirePermission(context, PERMISSIONS.RESERVATION_READ);

  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const page = Math.max(1, Number(searchParams.page) || 1);
  const pageSize = 50;

  const status = STATUS_OPTIONS.includes(searchParams.status as AppointmentStatus)
    ? (searchParams.status as AppointmentStatus)
    : undefined;

  const where = {
    ...storeScopeHard(context),
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(context.restrictToOwnRecords && context.staffId
      ? { staffSlots: { some: { staffId: context.staffId } } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { startAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        reference: true,
        status: true,
        source: true,
        startAt: true,
        totalAmount: true,
        guestName: true,
        store: { select: { name: true, timezone: true } },
        customer: { select: { id: true, name: true, phone: true, email: true } },
        services: { select: { nameSnapshot: true } },
        staffSlots: {
          where: { kind: "service" },
          take: 1,
          select: { staff: { select: { displayName: true } } },
        },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PageHeader title={t("nav.appointments")} description={`${total} 件`} />

      <form action="/admin/appointments" method="get" className="flex items-end gap-2">
        <div className="w-48">
          <label htmlFor="status" className="text-xs text-[--color-ink-muted]">
            {t("appointment.status")}
          </label>
          <Select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
          >
            <option value="">{t("common.all")}</option>
            {STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`appointment.status_${value}`)}
              </option>
            ))}
          </Select>
        </div>
        <noscript>
          <button type="submit" className="text-xs underline">
            {t("common.filter")}
          </button>
        </noscript>
      </form>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title={t("common.noData")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("appointment.startAt")}</Th>
                <Th>{t("appointment.reference")}</Th>
                <Th>{t("store.title")}</Th>
                <Th>{t("appointment.customer")}</Th>
                <Th>{t("appointment.services")}</Th>
                <Th>{t("appointment.staff")}</Th>
                <Th className="text-right">{t("appointment.amount")}</Th>
                <Th>{t("appointment.source")}</Th>
                <Th>{t("appointment.status")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const customer = row.customer ? maskCustomerContact(context, row.customer) : null;
                return (
                  <tr key={row.id} className="hover:bg-[--color-surface-muted]">
                    <Td className="tabular-nums whitespace-nowrap">
                      {zonedDateISO(row.startAt, row.store.timezone)}{" "}
                      {zonedTimeHHmm(row.startAt, row.store.timezone)}
                    </Td>
                    <Td className="font-mono text-xs">{row.reference}</Td>
                    <Td className="text-xs">{row.store.name}</Td>
                    <Td>
                      {customer ? (
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="text-[--color-accent] hover:underline"
                        >
                          {customer.name}
                        </Link>
                      ) : (
                        (row.guestName ?? "—")
                      )}
                    </Td>
                    <Td className="text-xs">
                      {row.services.map((service) => service.nameSnapshot).join("、")}
                    </Td>
                    <Td className="text-xs">{row.staffSlots[0]?.staff.displayName ?? "—"}</Td>
                    <Td className="text-right tabular-nums">{formatMoney(row.totalAmount)}</Td>
                    <Td>
                      <SourceBadge source={row.source} locale={locale} />
                    </Td>
                    <Td>
                      <StatusBadge status={row.status as AppointmentStatus} locale={locale} />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {totalPages > 1 ? (
        <nav aria-label="ページ送り" className="flex items-center justify-center gap-2 text-xs">
          {page > 1 ? (
            <Link
              href={`/admin/appointments?page=${page - 1}${status ? `&status=${status}` : ""}`}
              className="rounded-md border border-[--color-border] px-3 py-1.5"
            >
              {t("common.back")}
            </Link>
          ) : null}
          <span className="tabular-nums text-[--color-ink-muted]">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/admin/appointments?page=${page + 1}${status ? `&status=${status}` : ""}`}
              className="rounded-md border border-[--color-border] px-3 py-1.5"
            >
              {t("common.next")}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
