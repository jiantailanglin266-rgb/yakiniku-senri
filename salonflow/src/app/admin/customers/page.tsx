import Link from "next/link";

import { requireContext } from "@/server/auth/context";
import { listCustomers, canExportCustomers } from "@/server/modules/customers/customer-service";
import { formatMoney } from "@/lib/money";
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

export const metadata = { title: "顧客" };
export const dynamic = "force-dynamic";

export default async function CustomersPage(props: {
  searchParams: Promise<{ q?: string; page?: string; dormant?: string }>;
}) {
  const searchParams = await props.searchParams;
  const context = await requireContext();
  const locale = context.user.locale === "en" ? "en" : "ja";
  const t = getTranslator("admin", locale);

  const page = Math.max(1, Number(searchParams.page) || 1);
  const dormantDays = searchParams.dormant ? 90 : null;

  const result = await listCustomers(context, {
    search: searchParams.q,
    page,
    pageSize: 25,
    dormantDays,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const masked = context.masks.customerPhone || context.masks.customerEmail;

  return (
    <>
      <PageHeader
        title={t("customer.title")}
        description={`${result.total} 件`}
        actions={
          canExportCustomers(context) ? (
            <Link
              href="/api/v1/customers/export"
              className="rounded-md border border-[--color-border] bg-[--color-surface] px-3 py-2 text-xs hover:bg-[--color-surface-muted]"
            >
              {t("customer.export")}
            </Link>
          ) : null
        }
      />

      <form action="/admin/customers" method="get" className="flex flex-wrap gap-2">
        <label htmlFor="customer-search" className="sr-only">
          {t("common.search")}
        </label>
        <Input
          id="customer-search"
          type="search"
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder={t("customer.searchPlaceholder")}
          className="max-w-md"
        />
        <label className="flex items-center gap-1.5 text-xs text-[--color-ink-muted]">
          <input
            type="checkbox"
            name="dormant"
            value="1"
            defaultChecked={Boolean(searchParams.dormant)}
          />
          {t("customer.dormant")}
        </label>
        <button
          type="submit"
          className="rounded-md bg-[--color-accent] px-4 text-sm text-[--color-accent-ink]"
        >
          {t("common.search")}
        </button>
      </form>

      {masked ? <p className="text-xs text-[--color-ink-subtle]">{t("customer.masked")}</p> : null}

      <Card>
        {result.items.length === 0 ? (
          <EmptyState title={t("common.noData")} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("customer.name")}</Th>
                <Th>{t("customer.phone")}</Th>
                <Th>{t("customer.email")}</Th>
                <Th className="text-right">{t("customer.visitCount")}</Th>
                <Th className="text-right">{t("customer.totalSpent")}</Th>
                <Th>{t("customer.lastVisit")}</Th>
                <Th>{t("customer.tags")}</Th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((customer) => (
                <tr key={customer.id} className="hover:bg-[--color-surface-muted]">
                  <Td>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium text-[--color-accent] hover:underline"
                    >
                      {customer.name}
                    </Link>
                    {customer.nameKana ? (
                      <span className="block text-xs text-[--color-ink-subtle]">
                        {customer.nameKana}
                      </span>
                    ) : null}
                    {customer.noShowCount > 0 ? (
                      <Badge tone="danger" className="mt-1">
                        {t("appointment.noShowWarning", { count: customer.noShowCount })}
                      </Badge>
                    ) : null}
                  </Td>
                  <Td className="tabular-nums">{customer.phone ?? "—"}</Td>
                  <Td className="text-xs">{customer.email ?? "—"}</Td>
                  <Td className="text-right tabular-nums">{customer.visitCount}</Td>
                  <Td className="text-right tabular-nums">{formatMoney(customer.totalSpent)}</Td>
                  <Td className="text-xs tabular-nums">
                    {customer.lastVisitAt ? customer.lastVisitAt.toISOString().slice(0, 10) : "—"}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.map((tag) => (
                        <Badge key={tag.id} tone="neutral">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </Td>
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
              href={`/admin/customers?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
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
              href={`/admin/customers?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
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
