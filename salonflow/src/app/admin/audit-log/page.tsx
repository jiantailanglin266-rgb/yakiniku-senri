import Link from "next/link";

import { requireContext, requirePermission } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { prisma } from "@/server/db/client";
import { getTranslator } from "@/i18n";
import {
  Badge,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui/primitives";

export const metadata = { title: "監査ログ" };
export const dynamic = "force-dynamic";

/**
 * Audit log viewer.
 *
 * Reading the audit log is itself a high-privilege action, gated on
 * `audit_log.read`. Entries are shown newest first with the actor, the target
 * and the request id, which is what an incident investigation starts from.
 */
export default async function AuditLogPage(props: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const context = await requireContext();
  requirePermission(context, PERMISSIONS.AUDIT_LOG_READ);

  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const page = Math.max(1, Number(searchParams.page) || 1);
  const pageSize = 50;
  const actionFilter = searchParams.action?.trim() || undefined;

  const where = {
    organizationId: context.organizationId,
    ...(actionFilter ? { action: { contains: actionFilter } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        createdAt: true,
        actorLabel: true,
        action: true,
        entityType: true,
        entityId: true,
        ipAddress: true,
        requestId: true,
        store: { select: { name: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PageHeader
        title={t("auditLog.title")}
        description="パスワード・カード番号・アクセストークンは記録されません。"
      />

      <form action="/admin/audit-log" method="get" className="flex gap-2">
        <label htmlFor="action-filter" className="sr-only">
          {t("auditLog.action")}
        </label>
        <Input
          id="action-filter"
          name="action"
          defaultValue={actionFilter ?? ""}
          placeholder="例: customer.viewed"
          className="max-w-xs"
        />
        <button
          type="submit"
          className="rounded-md bg-[--color-accent] px-4 text-sm text-[--color-accent-ink]"
        >
          {t("common.filter")}
        </button>
      </form>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title={t("auditLog.empty")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("auditLog.when")}</Th>
                <Th>{t("auditLog.actor")}</Th>
                <Th>{t("auditLog.action")}</Th>
                <Th>{t("auditLog.entity")}</Th>
                <Th>{t("store.title")}</Th>
                <Th>{t("auditLog.ip")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <Td className="tabular-nums whitespace-nowrap text-xs">
                    {row.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                  </Td>
                  <Td className="text-xs">{row.actorLabel ?? "—"}</Td>
                  <Td>
                    <Badge tone={toneForAction(row.action)}>{row.action}</Badge>
                  </Td>
                  <Td className="font-mono text-xs">
                    {row.entityType}
                    {row.entityId ? (
                      <span className="block text-[--color-ink-subtle]">{row.entityId}</span>
                    ) : null}
                  </Td>
                  <Td className="text-xs">{row.store?.name ?? "—"}</Td>
                  <Td className="font-mono text-xs">{row.ipAddress ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {totalPages > 1 ? (
        <nav aria-label="ページ送り" className="flex items-center justify-center gap-2 text-xs">
          {page > 1 ? (
            <Link
              href={`/admin/audit-log?page=${page - 1}${actionFilter ? `&action=${actionFilter}` : ""}`}
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
              href={`/admin/audit-log?page=${page + 1}${actionFilter ? `&action=${actionFilter}` : ""}`}
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

function toneForAction(action: string): "neutral" | "danger" | "warning" | "info" {
  if (action.includes("deleted") || action.includes("refund") || action.includes("failed")) {
    return "danger";
  }
  if (action.includes("exported") || action.includes("merged") || action.includes("locked")) {
    return "warning";
  }
  if (action.includes("viewed")) return "info";
  return "neutral";
}
