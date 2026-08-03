/**
 * SaaS plan catalogue.
 *
 * Prices are NOT hardcoded as product truth: this module supplies defaults
 * that seed the database, and the running application reads entitlements from
 * `FeatureFlag` / `Subscription` rows. Commercial pricing must be confirmed by
 * the business before launch (see docs/legal/LEGAL_REVIEW.md).
 */

export type FeatureKey =
  | "pos"
  | "analytics_advanced"
  | "marketing"
  | "tickets"
  | "memberships"
  | "multi_store"
  | "api_access"
  | "webhooks"
  | "custom_roles"
  | "sso"
  | "audit_log_long_retention";

export interface PlanDefinition {
  key: string;
  name: string;
  /** Monthly list price in minor currency units. 0 means "contact us". */
  monthlyPrice: number;
  yearlyPrice: number;
  limits: {
    stores: number | null;
    staff: number | null;
    /** Retention window for audit logs, in days. */
    auditLogRetentionDays: number;
  };
  features: FeatureKey[];
}

export const PLANS: readonly PlanDefinition[] = [
  {
    key: "starter",
    name: "Starter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: { stores: 1, staff: 3, auditLogRetentionDays: 90 },
    features: [],
  },
  {
    key: "standard",
    name: "Standard",
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: { stores: 1, staff: 20, auditLogRetentionDays: 180 },
    features: ["pos", "marketing", "tickets"],
  },
  {
    key: "professional",
    name: "Professional",
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: { stores: null, staff: null, auditLogRetentionDays: 365 },
    features: [
      "pos",
      "marketing",
      "tickets",
      "memberships",
      "multi_store",
      "analytics_advanced",
      "api_access",
      "webhooks",
      "custom_roles",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: { stores: null, staff: null, auditLogRetentionDays: 2555 },
    features: [
      "pos",
      "marketing",
      "tickets",
      "memberships",
      "multi_store",
      "analytics_advanced",
      "api_access",
      "webhooks",
      "custom_roles",
      "sso",
      "audit_log_long_retention",
    ],
  },
] as const;

export function findPlan(key: string): PlanDefinition | undefined {
  return PLANS.find((plan) => plan.key === key);
}

export function planHasFeature(planKey: string, feature: FeatureKey): boolean {
  return findPlan(planKey)?.features.includes(feature) ?? false;
}
