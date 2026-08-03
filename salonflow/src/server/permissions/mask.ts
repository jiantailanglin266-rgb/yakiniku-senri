import "server-only";

import type { RequestContext } from "@/server/auth/context";
import { maskEmail, maskTail } from "@/lib/utils";

/**
 * Field-level masking.
 *
 * Masking happens on the server, by replacing the value before it is
 * serialised into the RSC payload. Hiding a field with CSS would still ship
 * the customer's phone number to a browser that is not entitled to it.
 */

export interface MaskableCustomer {
  phone: string | null;
  email: string | null;
  [key: string]: unknown;
}

export function maskCustomerContact<T extends MaskableCustomer>(
  context: RequestContext,
  customer: T,
): T {
  return {
    ...customer,
    phone: context.masks.customerPhone ? maskTail(customer.phone, 2) : customer.phone,
    email: context.masks.customerEmail ? maskEmail(customer.email) : customer.email,
  };
}

export function maskCustomerList<T extends MaskableCustomer>(
  context: RequestContext,
  customers: readonly T[],
): T[] {
  if (!context.masks.customerPhone && !context.masks.customerEmail) return [...customers];
  return customers.map((customer) => maskCustomerContact(context, customer));
}

/**
 * Returns null in place of an amount the viewer may not see, so the UI can
 * render a `***` placeholder without ever holding the figure.
 */
export function maskAmount(context: RequestContext, amount: number | null): number | null {
  return context.masks.salesAmount ? null : amount;
}

/** True when this viewer may be issued a signed URL for a chart photo. */
export function canViewMedicalPhoto(context: RequestContext): boolean {
  return !context.masks.medicalPhoto;
}

export function maskStaffCompensation<
  T extends {
    designationFee?: number | null;
    commissionBps?: number | null;
    salesTarget?: number | null;
  },
>(context: RequestContext, staff: T): T {
  if (!context.masks.staffCompensation) return staff;
  return {
    ...staff,
    commissionBps: null,
    salesTarget: null,
  };
}
