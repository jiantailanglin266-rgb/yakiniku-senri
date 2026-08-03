import Link from "next/link";

import { requireContext, requirePermission } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { prisma } from "@/server/db/client";
import { formatMinuteOfDay } from "@/lib/time";
import { getTranslator } from "@/i18n";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
} from "@/components/ui/primitives";

export const metadata = { title: "店舗設定" };
export const dynamic = "force-dynamic";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default async function StoresPage() {
  const context = await requireContext();
  requirePermission(context, PERMISSIONS.STORE_MANAGE);

  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const stores = await prisma.store.findMany({
    where: {
      organizationId: context.organizationId,
      deletedAt: null,
      id: { in: context.accessibleStores.map((store) => store.id) },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      industry: true,
      timezone: true,
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
      taxMode: true,
      invoiceRegistrationNo: true,
      businessHours: { orderBy: { dayOfWeek: "asc" } },
      holidays: {
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 5,
      },
      _count: { select: { resources: true, staffStores: true } },
    },
  });

  if (stores.length === 0) return <EmptyState title={t("common.noData")} />;

  return (
    <>
      <PageHeader title={t("store.title")} description={`${stores.length} 店舗`} />

      {stores.map((store) => (
        <Card key={store.id}>
          <CardHeader
            title={store.name}
            description={`${store.prefecture ?? ""}${store.city ?? ""}${store.addressLine ?? ""}`}
            action={
              <Link
                href={`/booking/${store.slug}`}
                className="text-xs text-[--color-accent] hover:underline"
              >
                /booking/{store.slug}
              </Link>
            }
          />
          <CardBody className="grid gap-6 lg:grid-cols-3">
            <section>
              <h3 className="text-xs font-semibold text-[--color-ink-muted]">
                {t("store.businessHours")}
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {store.businessHours.map((hour) => (
                  <li key={hour.dayOfWeek} className="flex items-center gap-3">
                    <span className="w-6 text-[--color-ink-muted]">{WEEKDAYS[hour.dayOfWeek]}</span>
                    {hour.isClosed ? (
                      <Badge tone="neutral">{t("schedule.closed")}</Badge>
                    ) : (
                      <span className="tabular-nums">
                        {formatMinuteOfDay(hour.openMinute)} – {formatMinuteOfDay(hour.closeMinute)}
                        {hour.breakStartMinute !== null && hour.breakEndMinute !== null ? (
                          <span className="ml-2 text-xs text-[--color-ink-subtle]">
                            （中休み {formatMinuteOfDay(hour.breakStartMinute)}–
                            {formatMinuteOfDay(hour.breakEndMinute)}）
                          </span>
                        ) : null}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {store.holidays.length > 0 ? (
                <>
                  <h3 className="mt-4 text-xs font-semibold text-[--color-ink-muted]">
                    {t("store.holidays")}
                  </h3>
                  <ul className="mt-1 space-y-0.5 text-xs">
                    {store.holidays.map((holiday) => (
                      <li key={holiday.id} className="tabular-nums">
                        {holiday.date.toISOString().slice(0, 10)}
                        {holiday.reason ? ` — ${holiday.reason}` : ""}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>

            <section>
              <h3 className="text-xs font-semibold text-[--color-ink-muted]">
                {t("store.bookingPolicy")}
              </h3>
              <dl className="mt-2 space-y-1.5 text-sm">
                <Row label={t("store.approvalMode")}>
                  <Badge tone={store.approvalMode === "instant" ? "positive" : "warning"}>
                    {store.approvalMode === "instant" ? t("store.instant") : t("store.request")}
                  </Badge>
                </Row>
                <Row label={t("store.slotInterval")}>{store.slotIntervalMinutes} 分</Row>
                <Row label={t("store.cutoff")}>{store.bookingCutoffMinutes} 分前</Row>
                <Row label={t("store.maxAdvance")}>{store.maxAdvanceDays} 日先まで</Row>
                <Row label={t("store.buffer")}>{store.bufferMinutes} 分</Row>
                <Row label={t("store.cancelDeadline")}>{store.cancelDeadlineHours} 時間前</Row>
                <Row label={t("store.timezone")}>{store.timezone}</Row>
              </dl>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-[--color-ink-muted]">その他</h3>
              <dl className="mt-2 space-y-1.5 text-sm">
                <Row label={t("appointment.resources")}>{store._count.resources} 件</Row>
                <Row label={t("staff.title")}>{store._count.staffStores} 名</Row>
                <Row label="税区分">{store.taxMode === "inclusive" ? "内税" : "外税"}</Row>
                <Row label="登録番号">{store.invoiceRegistrationNo ?? "未設定"}</Row>
              </dl>
              <p className="mt-3 text-xs text-[--color-ink-subtle]">
                適格請求書の登録番号や税区分の運用は、税理士の確認が必要です。
              </p>
            </section>
          </CardBody>
        </Card>
      ))}

      <p className="text-xs text-[--color-ink-subtle]">
        店舗設定の編集画面は Phase 2 で実装予定です。
      </p>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2">
      <dt className="text-xs text-[--color-ink-muted]">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
