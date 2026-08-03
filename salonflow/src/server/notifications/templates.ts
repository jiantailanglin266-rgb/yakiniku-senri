import "server-only";

import type { Locale, NotificationChannel, NotificationEvent, Prisma } from "@prisma/client";

import { productName } from "@/config/product";
import { formatMoney } from "@/lib/money";
import { zonedDateISO, zonedTimeHHmm } from "@/lib/time";
import { DEFAULT_TEMPLATES } from "./default-templates";

/**
 * Message rendering.
 *
 * Templates are stored per organization, store, event, channel and locale, so
 * a chain can set a house style while one branch overrides the reminder.
 *
 * Substitution is a strict allow-list of `{{token}}` names. Nothing is
 * evaluated, and an unknown token is left untouched rather than replaced with
 * `undefined`, so a typo in a template is visible instead of silently
 * producing "ご予約 undefined のご案内".
 */

export type TemplateVariables = Record<string, string | number | null | undefined>;

export interface RenderRequest {
  organizationId: string;
  storeId: string | null;
  event: NotificationEvent;
  channel: NotificationChannel;
  locale: Locale;
  variables: TemplateVariables;
}

export interface RenderedMessage {
  subject: string | null;
  body: string;
}

export async function renderTemplate(
  tx: Prisma.TransactionClient,
  request: RenderRequest,
): Promise<RenderedMessage> {
  // Most specific wins: store override, then organization default.
  const template =
    (request.storeId
      ? await tx.messageTemplate.findFirst({
          where: {
            organizationId: request.organizationId,
            storeId: request.storeId,
            event: request.event,
            channel: request.channel,
            locale: request.locale,
            isActive: true,
          },
          select: { subject: true, body: true },
        })
      : null) ??
    (await tx.messageTemplate.findFirst({
      where: {
        organizationId: request.organizationId,
        storeId: null,
        event: request.event,
        channel: request.channel,
        locale: request.locale,
        isActive: true,
      },
      select: { subject: true, body: true },
    }));

  const fallback = DEFAULT_TEMPLATES[request.locale]?.[request.event] ??
    DEFAULT_TEMPLATES.ja?.[request.event] ?? {
      subject: "{{storeName}}",
      body: "{{storeName}} からのお知らせです。",
    };

  const variables = withDerivedVariables(request.variables);

  return {
    subject: substitute(template?.subject ?? fallback.subject, variables),
    body: substitute(template?.body ?? fallback.body, variables),
  };
}

/**
 * Add presentation-ready values so templates never have to do arithmetic.
 * `startAt` arrives as an ISO instant; templates want the store's local date
 * and time.
 */
function withDerivedVariables(variables: TemplateVariables): TemplateVariables {
  const enriched: TemplateVariables = { productName: productName(), ...variables };

  const startAt = variables.startAt;
  const timeZone = typeof variables.timeZone === "string" ? variables.timeZone : "Asia/Tokyo";

  if (typeof startAt === "string") {
    const instant = new Date(startAt);
    if (!Number.isNaN(instant.getTime())) {
      enriched.startDate = zonedDateISO(instant, timeZone);
      enriched.startTime = zonedTimeHHmm(instant, timeZone);
    }
  }

  if (variables.totalAmount !== undefined && variables.totalAmount !== null) {
    const amount = Number(variables.totalAmount);
    if (Number.isFinite(amount)) {
      enriched.totalAmountFormatted = formatMoney(amount);
    }
  }

  return enriched;
}

const TOKEN_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function substitute(template: string | null, variables: TemplateVariables): string {
  if (!template) return "";
  return template.replace(TOKEN_PATTERN, (match, token: string) => {
    const value = variables[token];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}

export { DEFAULT_TEMPLATES } from "./default-templates";
