/**
 * Product branding.
 *
 * The product name is deliberately not hardcoded anywhere else in the
 * codebase. Change `PRODUCT_NAME` in the environment to rebrand.
 */
export const productConfig = {
  name: process.env.PRODUCT_NAME ?? "SalonFlow",
  tagline: {
    ja: "サロン業務をひとつに",
    en: "One system for the whole salon",
  },
  supportEmail: process.env.PRODUCT_SUPPORT_EMAIL ?? "support@example.invalid",
  /**
   * Displayed on every screen while demo data is loaded, so fictional records
   * are never mistaken for real customers.
   */
  demoNotice: {
    ja: "これはデモデータです。店舗・スタッフ・顧客はすべて架空です。",
    en: "Demo data. All stores, staff and customers are fictional.",
  },
} as const;

export function productName(): string {
  return process.env.PRODUCT_NAME ?? productConfig.name;
}
