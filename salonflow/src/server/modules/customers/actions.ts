"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireContext } from "@/server/auth/context";
import { mergeCustomers, anonymizeCustomer } from "./customer-service";

export interface CustomerActionResult {
  ok: boolean;
  error?: string;
}

const mergeSchema = z.object({
  targetId: z.string().min(1),
  sourceId: z.string().min(1),
});

export async function mergeCustomersAction(
  input: z.input<typeof mergeSchema>,
): Promise<CustomerActionResult> {
  const context = await requireContext();

  const parsed = mergeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.validation" };

  try {
    await mergeCustomers(context, parsed.data.targetId, parsed.data.sourceId);
    revalidatePath(`/admin/customers/${parsed.data.targetId}`);
    revalidatePath("/admin/customers");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "errors.unexpected",
    };
  }
}

const anonymizeSchema = z.object({
  customerId: z.string().min(1),
  reason: z.string().min(1).max(500),
});

/**
 * Act on an erasure request.
 *
 * Identifying fields are overwritten; sales rows are retained because
 * bookkeeping law requires them. That tension is a documented legal review
 * item, not something this action decides on its own.
 */
export async function anonymizeCustomerAction(
  input: z.input<typeof anonymizeSchema>,
): Promise<CustomerActionResult> {
  const context = await requireContext();

  const parsed = anonymizeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.validation" };

  try {
    await anonymizeCustomer(context, parsed.data.customerId, parsed.data.reason);
    revalidatePath("/admin/customers");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "errors.unexpected",
    };
  }
}
