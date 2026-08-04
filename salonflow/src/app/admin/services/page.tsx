import Link from "next/link";

import { can, requireContext } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { prisma } from "@/server/db/client";
import { orgScope } from "@/server/db/tenant";
import { formatMoney } from "@/lib/money";
import { getTranslator } from "@/i18n";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui/primitives";

export const metadata = { title: "メニュー" };
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const context = await requireContext();
  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const categories = await prisma.serviceCategory.findMany({
    where: orgScope(context),
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      name: true,
      services: {
        where: {
          deletedAt: null,
          OR: [
            { storeId: null },
            { storeId: { in: context.accessibleStores.map((store) => store.id) } },
          ],
        },
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          name: true,
          price: true,
          durationMinutes: true,
          prepMinutes: true,
          cleanupMinutes: true,
          unattendedMinutes: true,
          isOnlineBookable: true,
          allowsDesignation: true,
          isActive: true,
          store: { select: { name: true } },
          serviceResources: { select: { resourceType: { select: { name: true } } } },
          options: { where: { isActive: true }, select: { id: true, name: true, price: true } },
        },
      },
    },
  });

  const withServices = categories.filter((category) => category.services.length > 0);
  const canManage = can(context, PERMISSIONS.STORE_MANAGE);

  return (
    <>
      <PageHeader
        title={t("service.title")}
        description="価格は税込表示（店舗設定の税区分に従います）"
        actions={
          canManage ? (
            <Link href="/admin/services/new">
              <Button type="button">{t("settings.newService")}</Button>
            </Link>
          ) : null
        }
      />

      {withServices.length === 0 ? (
        <EmptyState
          title={t("common.noData")}
          description={canManage ? t("settings.setupServiceTodo") : undefined}
        />
      ) : (
        withServices.map((category) => (
          <Card key={category.id}>
            <CardHeader title={category.name} />
            <Table>
              <thead>
                <tr>
                  <Th>{t("service.name")}</Th>
                  <Th>{t("store.title")}</Th>
                  <Th className="text-right">{t("service.price")}</Th>
                  <Th className="text-right">{t("service.duration")}</Th>
                  <Th className="text-right">
                    {t("service.prep")}/{t("service.cleanup")}
                  </Th>
                  <Th className="text-right">{t("service.unattended")}</Th>
                  <Th>{t("appointment.resources")}</Th>
                  <Th>{t("service.onlineBookable")}</Th>
                  {canManage ? <Th className="text-right">{t("common.actions")}</Th> : null}
                </tr>
              </thead>
              <tbody>
                {category.services.map((service) => (
                  <tr key={service.id}>
                    <Td>
                      <span className={service.isActive ? "" : "text-[--color-ink-subtle]"}>
                        {service.name}
                      </span>
                      {service.options.length > 0 ? (
                        <span className="mt-1 block text-xs text-[--color-ink-subtle]">
                          オプション:{" "}
                          {service.options
                            .map((option) => `${option.name} ${formatMoney(option.price)}`)
                            .join(" / ")}
                        </span>
                      ) : null}
                    </Td>
                    <Td className="text-xs">{service.store?.name ?? "全店舗"}</Td>
                    <Td className="text-right tabular-nums">{formatMoney(service.price)}</Td>
                    <Td className="text-right tabular-nums">
                      {service.durationMinutes}
                      {t("service.minutes")}
                    </Td>
                    <Td className="text-right text-xs tabular-nums">
                      {service.prepMinutes} / {service.cleanupMinutes}
                    </Td>
                    <Td className="text-right text-xs tabular-nums">
                      {service.unattendedMinutes
                        ? `${service.unattendedMinutes}${t("service.minutes")}`
                        : "—"}
                    </Td>
                    <Td className="text-xs">
                      {service.serviceResources
                        .map((resource) => resource.resourceType.name)
                        .join("、") || "—"}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={service.isOnlineBookable ? "positive" : "neutral"}>
                          {service.isOnlineBookable ? "可" : "不可"}
                        </Badge>
                        {service.allowsDesignation ? (
                          <Badge tone="accent">{t("schedule.designated")}</Badge>
                        ) : null}
                      </div>
                    </Td>
                    {canManage ? (
                      <Td className="text-right whitespace-nowrap">
                        <Link
                          href={`/admin/services/${service.id}`}
                          className="text-xs text-[--color-accent] hover:underline"
                        >
                          {t("common.edit")}
                        </Link>
                      </Td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        ))
      )}
    </>
  );
}
