import Link from "next/link";

import { can, requireContext } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { prisma } from "@/server/db/client";
import { orgScope } from "@/server/db/tenant";
import { maskStaffCompensation } from "@/server/permissions/mask";
import { formatMoney } from "@/lib/money";
import { getTranslator } from "@/i18n";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui/primitives";

export const metadata = { title: "スタッフ" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const context = await requireContext();
  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const rows = await prisma.staff.findMany({
    where: {
      ...orgScope(context),
      stores: { some: { storeId: { in: context.accessibleStores.map((s) => s.id) } } },
    },
    orderBy: [{ displayOrder: "asc" }, { displayName: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      displayName: true,
      title: true,
      employmentType: true,
      designationFee: true,
      commissionBps: true,
      salesTarget: true,
      isBookable: true,
      isPubliclyVisible: true,
      stores: { select: { store: { select: { name: true } } } },
      _count: { select: { skills: true } },
    },
  });

  const employmentLabels: Record<string, string> = {
    full_time: "正社員",
    part_time: "パート",
    contract: "契約",
    freelance: "業務委託",
    trainee: "研修生",
  };

  const canManage = can(context, PERMISSIONS.STAFF_MANAGE);

  return (
    <>
      <PageHeader
        title={t("staff.title")}
        description={`${rows.length} 名`}
        actions={
          canManage ? (
            <Link href="/admin/staff/new">
              <Button type="button">{t("settings.newStaff")}</Button>
            </Link>
          ) : null
        }
      />

      {context.masks.staffCompensation ? (
        <p className="text-xs text-[--color-ink-subtle]">{t("staff.compensationHidden")}</p>
      ) : null}

      <Card>
        {rows.length === 0 ? (
          <EmptyState title={t("common.noData")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("staff.displayName")}</Th>
                <Th>{t("customer.name")}</Th>
                <Th>{t("staff.employmentType")}</Th>
                <Th>{t("staff.stores")}</Th>
                <Th className="text-right">{t("staff.designationFee")}</Th>
                <Th className="text-right">歩合</Th>
                <Th className="text-right">{t("staff.skills")}</Th>
                <Th>{t("staff.bookable")}</Th>
                {canManage ? <Th className="text-right">{t("common.actions")}</Th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const masked = maskStaffCompensation(context, row);
                return (
                  <tr key={row.id}>
                    <Td className="font-medium">{row.displayName}</Td>
                    <Td className="text-xs">
                      {row.name}
                      {row.title ? (
                        <span className="block text-[--color-ink-subtle]">{row.title}</span>
                      ) : null}
                    </Td>
                    <Td className="text-xs">
                      {employmentLabels[row.employmentType] ?? row.employmentType}
                    </Td>
                    <Td className="text-xs">
                      {row.stores.map((entry) => entry.store.name).join("、")}
                    </Td>
                    <Td className="text-right tabular-nums">{formatMoney(row.designationFee)}</Td>
                    <Td className="text-right text-xs tabular-nums">
                      {masked.commissionBps === null
                        ? "—"
                        : `${(masked.commissionBps / 100).toFixed(1)}%`}
                    </Td>
                    <Td className="text-right tabular-nums">{row._count.skills}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={row.isBookable ? "positive" : "neutral"}>
                          {row.isBookable ? "受付中" : "停止"}
                        </Badge>
                        {row.isPubliclyVisible ? (
                          <Badge tone="info">{t("staff.publiclyVisible")}</Badge>
                        ) : null}
                      </div>
                    </Td>
                    {canManage ? (
                      <Td className="text-right whitespace-nowrap">
                        <Link
                          href={`/admin/staff/${row.id}`}
                          className="text-xs text-[--color-accent] hover:underline"
                        >
                          {t("common.edit")}
                        </Link>
                        <Link
                          href={`/admin/staff/${row.id}/shifts`}
                          className="ml-3 text-xs text-[--color-accent] hover:underline"
                        >
                          {t("settings.shifts")}
                        </Link>
                      </Td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
