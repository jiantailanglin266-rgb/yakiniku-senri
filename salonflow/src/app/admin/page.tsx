import Link from "next/link";

import { requireContext } from "@/server/auth/context";
import { getDashboard } from "@/server/modules/dashboard/dashboard-service";
import { formatMoney } from "@/lib/money";
import { zonedTimeHHmm } from "@/lib/time";
import { getTranslator } from "@/i18n";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Metric,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status";
import { TrendChart } from "@/components/admin/trend-chart";
import type { AppointmentStatus } from "@/server/modules/appointments/state-machine";

export const metadata = { title: "ダッシュボード" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await requireContext();
  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const dashboard = await getDashboard(context);

  if (!dashboard) {
    return (
      <EmptyState
        title={t("common.noData")}
        description="表示できる店舗がありません。店舗を作成するか、アクセス権を確認してください。"
      />
    );
  }

  const { today } = dashboard;

  return (
    <>
      <PageHeader
        title={t("dashboard.title")}
        description={`${dashboard.storeName} — ${dashboard.dateISO}`}
      />

      <section
        aria-label={t("dashboard.title")}
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"
      >
        <Metric label={t("dashboard.todayAppointments")} value={today.appointmentCount} />
        <Metric
          label={t("dashboard.todaySales")}
          value={
            today.salesAmount === null ? (
              <span className="text-base text-[--color-ink-subtle]">{t("dashboard.hidden")}</span>
            ) : (
              formatMoney(today.salesAmount)
            )
          }
        />
        <Metric label={t("dashboard.expectedVisitors")} value={today.expectedVisitors} />
        <Metric
          label={t("dashboard.pendingRequests")}
          value={today.pendingRequests}
          tone={today.pendingRequests > 0 ? "warning" : "neutral"}
        />
        <Metric
          label={t("dashboard.noShows")}
          value={today.noShows}
          tone={today.noShows > 0 ? "danger" : "neutral"}
        />
        <Metric label={t("dashboard.newCustomers")} value={today.newCustomers} />
        <Metric label={t("dashboard.returningCustomers")} value={today.returningCustomers} />
        <Metric label={t("dashboard.cancellations")} value={today.cancellations} />
        <Metric
          label={t("dashboard.unsettled")}
          value={today.unsettled}
          tone={today.unsettled > 0 ? "warning" : "neutral"}
        />
        <Metric
          label={t("dashboard.missingRecords")}
          value={today.missingMedicalRecords}
          tone={today.missingMedicalRecords > 0 ? "warning" : "neutral"}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={t("dashboard.trend")} />
          <CardBody>
            <TrendChart data={dashboard.monthlyTrend} showSales={today.salesAmount !== null} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("dashboard.staffStatus")} />
          <CardBody className="p-0">
            {dashboard.staffStatus.length === 0 ? (
              <EmptyState title={t("common.noData")} />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>{t("appointment.staff")}</Th>
                    <Th className="text-right">{t("dashboard.utilization")}</Th>
                    <Th className="text-right">{t("dashboard.todayAppointments")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.staffStatus.map((staff) => (
                    <tr key={staff.staffId}>
                      <Td>{staff.displayName}</Td>
                      <Td className="text-right tabular-nums">
                        <span className="inline-flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-16 overflow-hidden rounded-full bg-[--color-surface-sunken]"
                          >
                            <span
                              className="block h-full rounded-full bg-[--color-accent]"
                              style={{ width: `${Math.min(100, staff.utilizationPercent)}%` }}
                            />
                          </span>
                          {staff.utilizationPercent}%
                        </span>
                      </Td>
                      <Td className="text-right tabular-nums">{staff.appointmentCount}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={t("dashboard.upcoming")}
            action={
              <Link
                href="/admin/schedule"
                className="text-xs text-[--color-accent] hover:underline"
              >
                {t("nav.schedule")}
              </Link>
            }
          />
          <CardBody className="p-0">
            {dashboard.upcoming.length === 0 ? (
              <EmptyState title={t("common.noData")} />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>{t("appointment.startAt")}</Th>
                    <Th>{t("appointment.customer")}</Th>
                    <Th>{t("appointment.services")}</Th>
                    <Th>{t("appointment.staff")}</Th>
                    <Th>{t("appointment.status")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.upcoming.map((entry) => (
                    <tr key={entry.id}>
                      <Td className="tabular-nums">
                        {zonedTimeHHmm(entry.startAt, dashboard.timeZone)}
                      </Td>
                      <Td>
                        <span className="font-medium">{entry.customerName}</span>
                        {entry.isFirstVisit ? (
                          <span className="ml-2 text-xs text-[--color-info]">
                            {t("appointment.firstVisit")}
                          </span>
                        ) : null}
                      </Td>
                      <Td className="text-xs text-[--color-ink-muted]">
                        {entry.serviceNames.join("、")}
                      </Td>
                      <Td className="text-xs">{entry.staffNames.join("、")}</Td>
                      <Td>
                        <StatusBadge status={entry.status as AppointmentStatus} locale={locale} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title={t("dashboard.sourceBreakdown")} />
            <CardBody className="space-y-2">
              {dashboard.sourceBreakdown.length === 0 ? (
                <p className="text-xs text-[--color-ink-muted]">{t("common.noData")}</p>
              ) : (
                dashboard.sourceBreakdown.map((entry) => (
                  <div key={entry.source} className="flex items-center justify-between text-xs">
                    <span className="text-[--color-ink-muted]">
                      {t(`appointment.source_${entry.source}`)}
                    </span>
                    <span className="tabular-nums">{entry.count}</span>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t("dashboard.topServices")} />
            <CardBody className="space-y-2">
              {dashboard.topServices.length === 0 ? (
                <p className="text-xs text-[--color-ink-muted]">{t("common.noData")}</p>
              ) : (
                dashboard.topServices.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <span className="truncate text-[--color-ink-muted]">{entry.name}</span>
                    <span className="tabular-nums">{entry.count}</span>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
