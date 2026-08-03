"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireContext } from "@/server/auth/context";
import { saveRecord } from "./record-service";

const saveSchema = z.object({
  recordId: z.string().min(1).optional(),
  customerId: z.string().min(1),
  storeId: z.string().min(1),
  appointmentId: z.string().min(1).optional(),
  templateId: z.string().min(1),
  visitedAt: z.string().min(1),
  serviceSummary: z.string().max(4000).optional(),
  productsUsed: z.string().max(2000).optional(),
  cautionNote: z.string().max(2000).optional(),
  customerRequest: z.string().max(2000).optional(),
  result: z.string().max(2000).optional(),
  nextProposal: z.string().max(2000).optional(),
  staffNote: z.string().max(4000).optional(),
});

/**
 * Save a chart from the form.
 *
 * Dynamic template fields arrive as `field:<id>` entries. Values are stored as
 * JSON so one column serves every field type, and unknown ids are dropped by
 * `saveRecord` rather than trusted.
 */
export async function saveRecordAction(formData: FormData): Promise<void> {
  const context = await requireContext();

  const parsed = saveSchema.safeParse({
    recordId: formData.get("recordId") || undefined,
    customerId: formData.get("customerId"),
    storeId: formData.get("storeId"),
    appointmentId: formData.get("appointmentId") || undefined,
    templateId: formData.get("templateId"),
    visitedAt: formData.get("visitedAt"),
    serviceSummary: formData.get("serviceSummary") || undefined,
    productsUsed: formData.get("productsUsed") || undefined,
    cautionNote: formData.get("cautionNote") || undefined,
    customerRequest: formData.get("customerRequest") || undefined,
    result: formData.get("result") || undefined,
    nextProposal: formData.get("nextProposal") || undefined,
    staffNote: formData.get("staffNote") || undefined,
  });

  if (!parsed.success) throw new Error("入力内容を確認してください");

  const responses: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("field:")) continue;
    const fieldId = key.slice("field:".length);

    if (typeof value !== "string") continue;

    // Multi-select fields submit repeatedly under the same key.
    const existing = responses[fieldId];
    if (existing === undefined) {
      responses[fieldId] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      responses[fieldId] = [existing, value];
    }
  }

  const visitedAt = new Date(parsed.data.visitedAt);
  if (Number.isNaN(visitedAt.getTime())) throw new Error("来店日を確認してください");

  await saveRecord(context, {
    recordId: parsed.data.recordId,
    customerId: parsed.data.customerId,
    storeId: parsed.data.storeId,
    appointmentId: parsed.data.appointmentId ?? null,
    templateId: parsed.data.templateId,
    visitedAt,
    serviceSummary: parsed.data.serviceSummary ?? null,
    productsUsed: parsed.data.productsUsed ?? null,
    cautionNote: parsed.data.cautionNote ?? null,
    customerRequest: parsed.data.customerRequest ?? null,
    result: parsed.data.result ?? null,
    nextProposal: parsed.data.nextProposal ?? null,
    staffNote: parsed.data.staffNote ?? null,
    responses,
  });

  revalidatePath(`/admin/customers/${parsed.data.customerId}`);
  redirect(`/admin/customers/${parsed.data.customerId}`);
}
