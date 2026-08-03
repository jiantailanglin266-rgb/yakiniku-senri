import { requireContext, can } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { prisma } from "@/server/db/client";
import { orgScope } from "@/server/db/tenant";
import { toCsv } from "@/lib/utils";
import { AUDIT_ACTIONS, writeAuditLog } from "@/server/observability/audit";
import { jsonError } from "@/server/api/response";

/**
 * GET /api/v1/customers/export
 *
 * Bulk export of the customer list.
 *
 * This is the highest-risk read in the product — one request can remove every
 * customer's contact details from the system — so it requires the dedicated
 * `customer.export` permission, is written to the audit log with a row count
 * before the file is produced, and passes every cell through the CSV escaper
 * that neutralises formula injection.
 */
export async function GET(request: Request): Promise<Response> {
  const context = await requireContext();

  if (!can(context, PERMISSIONS.CUSTOMER_EXPORT)) {
    return jsonError("FORBIDDEN", "顧客データを出力する権限がありません", request, {
      status: 403,
    });
  }

  const customers = await prisma.customer.findMany({
    where: { ...orgScope(context), mergedIntoId: null },
    orderBy: { createdAt: "asc" },
    select: {
      code: true,
      name: true,
      nameKana: true,
      phone: true,
      email: true,
      birthDate: true,
      gender: true,
      postalCode: true,
      acquisitionSource: true,
      visitCount: true,
      totalSpent: true,
      firstVisitAt: true,
      lastVisitAt: true,
      cancelCount: true,
      noShowCount: true,
      homeStore: { select: { name: true } },
      consents: { select: { type: true, status: true } },
    },
  });

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.CUSTOMER_EXPORTED,
    entityType: "Customer",
    meta: { rowCount: customers.length, format: "csv" },
  });

  const header = [
    "顧客コード",
    "氏名",
    "ふりがな",
    "電話番号",
    "メールアドレス",
    "生年月日",
    "性別",
    "郵便番号",
    "来店経路",
    "主な利用店舗",
    "来店回数",
    "累計売上",
    "初回来店日",
    "最終来店日",
    "キャンセル回数",
    "無断キャンセル回数",
    "メール配信同意",
  ];

  const rows = customers.map((customer) => {
    const marketing = customer.consents.find((consent) => consent.type === "marketing_email");
    return [
      customer.code,
      customer.name,
      customer.nameKana,
      // Masking applies to exports too: a role that cannot see a phone number
      // on screen must not be able to obtain it as a file.
      context.masks.customerPhone ? "" : customer.phone,
      context.masks.customerEmail ? "" : customer.email,
      customer.birthDate?.toISOString().slice(0, 10) ?? "",
      customer.gender,
      customer.postalCode,
      customer.acquisitionSource,
      customer.homeStore?.name ?? "",
      customer.visitCount,
      context.masks.salesAmount ? "" : customer.totalSpent,
      customer.firstVisitAt?.toISOString().slice(0, 10) ?? "",
      customer.lastVisitAt?.toISOString().slice(0, 10) ?? "",
      customer.cancelCount,
      customer.noShowCount,
      marketing?.status === "granted" ? "同意" : "未同意",
    ];
  });

  // UTF-8 BOM so Excel on Windows opens the file without mangling Japanese.
  const csv = `﻿${toCsv([header, ...rows])}`;
  const filename = `customers-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
