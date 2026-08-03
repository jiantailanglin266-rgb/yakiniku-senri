/**
 * The permission catalogue and the seeded role definitions.
 *
 * This file is the single source of truth for authorisation. It is imported by
 * the seed (to populate `Permission` / `Role`), by the runtime check, and by
 * the generated permission matrix in the docs — so the three can never drift.
 *
 * Pure data, no imports: safe to use from both server and client code.
 */

export const PERMISSIONS = {
  ORGANIZATION_MANAGE: "organization.manage",
  STORE_MANAGE: "store.manage",
  RESERVATION_READ: "reservation.read",
  RESERVATION_WRITE: "reservation.write",
  CUSTOMER_READ: "customer.read",
  CUSTOMER_WRITE: "customer.write",
  CUSTOMER_EXPORT: "customer.export",
  MEDICAL_RECORD_READ: "medical_record.read",
  MEDICAL_RECORD_WRITE: "medical_record.write",
  SALES_READ: "sales.read",
  SALES_REFUND: "sales.refund",
  REPORT_READ: "report.read",
  STAFF_MANAGE: "staff.manage",
  INVENTORY_MANAGE: "inventory.manage",
  MARKETING_SEND: "marketing.send",
  BILLING_MANAGE: "billing.manage",
  AUDIT_LOG_READ: "audit_log.read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface PermissionDefinition {
  key: PermissionKey;
  category: string;
  description: string;
  /** Guides the UI to warn before granting. */
  sensitivity: "low" | "medium" | "high" | "critical";
}

export const PERMISSION_CATALOG: readonly PermissionDefinition[] = [
  {
    key: PERMISSIONS.ORGANIZATION_MANAGE,
    category: "organization",
    description: "法人設定・ブランド・店舗の作成と削除",
    sensitivity: "high",
  },
  {
    key: PERMISSIONS.STORE_MANAGE,
    category: "store",
    description: "店舗設定・営業時間・予約ルール・設備の管理",
    sensitivity: "medium",
  },
  {
    key: PERMISSIONS.RESERVATION_READ,
    category: "reservation",
    description: "予約台帳と予約一覧の閲覧",
    sensitivity: "medium",
  },
  {
    key: PERMISSIONS.RESERVATION_WRITE,
    category: "reservation",
    description: "予約の作成・変更・キャンセル・状態遷移",
    sensitivity: "medium",
  },
  {
    key: PERMISSIONS.CUSTOMER_READ,
    category: "customer",
    description: "顧客情報の閲覧",
    sensitivity: "high",
  },
  {
    key: PERMISSIONS.CUSTOMER_WRITE,
    category: "customer",
    description: "顧客情報の作成・編集・統合",
    sensitivity: "high",
  },
  {
    key: PERMISSIONS.CUSTOMER_EXPORT,
    category: "customer",
    description: "顧客データのCSV出力",
    sensitivity: "critical",
  },
  {
    key: PERMISSIONS.MEDICAL_RECORD_READ,
    category: "medical_record",
    description: "電子カルテの閲覧",
    sensitivity: "critical",
  },
  {
    key: PERMISSIONS.MEDICAL_RECORD_WRITE,
    category: "medical_record",
    description: "電子カルテの作成・編集",
    sensitivity: "high",
  },
  {
    key: PERMISSIONS.SALES_READ,
    category: "sales",
    description: "会計・売上の閲覧",
    sensitivity: "high",
  },
  {
    key: PERMISSIONS.SALES_REFUND,
    category: "sales",
    description: "返金と会計取消",
    sensitivity: "critical",
  },
  {
    key: PERMISSIONS.REPORT_READ,
    category: "report",
    description: "集計レポートと分析の閲覧",
    sensitivity: "medium",
  },
  {
    key: PERMISSIONS.STAFF_MANAGE,
    category: "staff",
    description: "スタッフの登録・権限付与・シフト管理",
    sensitivity: "high",
  },
  {
    key: PERMISSIONS.INVENTORY_MANAGE,
    category: "inventory",
    description: "商品・在庫・発注の管理",
    sensitivity: "medium",
  },
  {
    key: PERMISSIONS.MARKETING_SEND,
    category: "marketing",
    description: "一斉配信の実行",
    sensitivity: "high",
  },
  {
    key: PERMISSIONS.BILLING_MANAGE,
    category: "billing",
    description: "SaaS契約と請求の管理",
    sensitivity: "high",
  },
  {
    key: PERMISSIONS.AUDIT_LOG_READ,
    category: "audit",
    description: "監査ログの閲覧",
    sensitivity: "high",
  },
];

export interface RoleDefinition {
  key: string;
  name: string;
  description: string;
  permissions: PermissionKey[];
  maskCustomerPhone: boolean;
  maskCustomerEmail: boolean;
  maskSalesAmount: boolean;
  maskMedicalPhoto: boolean;
  maskStaffCompensation: boolean;
  restrictToOwnRecords: boolean;
}

const P = PERMISSIONS;

/**
 * Seeded roles.
 *
 * Note that `platform_admin` deliberately lacks medical-record access: the
 * SaaS operator should not be able to read a salon customer's skin, hair or
 * nail records. Emergency access is a documented manual procedure, not an
 * always-on grant.
 */
export const ROLE_CATALOG: readonly RoleDefinition[] = [
  {
    key: "platform_admin",
    name: "システム運営者",
    description: "プラットフォーム全体の運用。カルテは閲覧できません。",
    permissions: [
      P.ORGANIZATION_MANAGE,
      P.STORE_MANAGE,
      P.RESERVATION_READ,
      P.RESERVATION_WRITE,
      P.CUSTOMER_READ,
      P.CUSTOMER_WRITE,
      P.CUSTOMER_EXPORT,
      P.SALES_READ,
      P.REPORT_READ,
      P.STAFF_MANAGE,
      P.INVENTORY_MANAGE,
      P.BILLING_MANAGE,
      P.AUDIT_LOG_READ,
    ],
    maskCustomerPhone: false,
    maskCustomerEmail: false,
    maskSalesAmount: false,
    maskMedicalPhoto: true,
    maskStaffCompensation: true,
    restrictToOwnRecords: false,
  },
  {
    key: "org_owner",
    name: "法人オーナー",
    description: "法人全体のすべての操作。",
    permissions: Object.values(P),
    maskCustomerPhone: false,
    maskCustomerEmail: false,
    maskSalesAmount: false,
    maskMedicalPhoto: false,
    maskStaffCompensation: false,
    restrictToOwnRecords: false,
  },
  {
    key: "store_owner",
    name: "店舗オーナー",
    description: "担当店舗のすべての操作。",
    permissions: [
      P.STORE_MANAGE,
      P.RESERVATION_READ,
      P.RESERVATION_WRITE,
      P.CUSTOMER_READ,
      P.CUSTOMER_WRITE,
      P.CUSTOMER_EXPORT,
      P.MEDICAL_RECORD_READ,
      P.MEDICAL_RECORD_WRITE,
      P.SALES_READ,
      P.SALES_REFUND,
      P.REPORT_READ,
      P.STAFF_MANAGE,
      P.INVENTORY_MANAGE,
      P.MARKETING_SEND,
      P.AUDIT_LOG_READ,
    ],
    maskCustomerPhone: false,
    maskCustomerEmail: false,
    maskSalesAmount: false,
    maskMedicalPhoto: false,
    maskStaffCompensation: false,
    restrictToOwnRecords: false,
  },
  {
    key: "store_manager",
    name: "店長",
    description: "担当店舗の日常運営。権限付与と顧客CSV出力はできません。",
    permissions: [
      P.STORE_MANAGE,
      P.RESERVATION_READ,
      P.RESERVATION_WRITE,
      P.CUSTOMER_READ,
      P.CUSTOMER_WRITE,
      P.MEDICAL_RECORD_READ,
      P.MEDICAL_RECORD_WRITE,
      P.SALES_READ,
      P.SALES_REFUND,
      P.REPORT_READ,
      P.INVENTORY_MANAGE,
    ],
    maskCustomerPhone: false,
    maskCustomerEmail: false,
    maskSalesAmount: false,
    maskMedicalPhoto: false,
    maskStaffCompensation: true,
    restrictToOwnRecords: false,
  },
  {
    key: "receptionist",
    name: "受付",
    description: "予約・顧客対応と当日の会計。カルテ写真は閲覧できません。",
    permissions: [
      P.RESERVATION_READ,
      P.RESERVATION_WRITE,
      P.CUSTOMER_READ,
      P.CUSTOMER_WRITE,
      P.MEDICAL_RECORD_READ,
      P.SALES_READ,
      P.INVENTORY_MANAGE,
    ],
    maskCustomerPhone: false,
    maskCustomerEmail: false,
    maskSalesAmount: false,
    maskMedicalPhoto: true,
    maskStaffCompensation: true,
    restrictToOwnRecords: false,
  },
  {
    key: "staff",
    name: "スタッフ",
    description: "自分が担当する予約・顧客・カルテのみ。",
    permissions: [
      P.RESERVATION_READ,
      P.RESERVATION_WRITE,
      P.CUSTOMER_READ,
      P.MEDICAL_RECORD_READ,
      P.MEDICAL_RECORD_WRITE,
      P.SALES_READ,
      P.REPORT_READ,
    ],
    maskCustomerPhone: true,
    maskCustomerEmail: true,
    maskSalesAmount: false,
    maskMedicalPhoto: false,
    maskStaffCompensation: true,
    restrictToOwnRecords: true,
  },
  {
    key: "contractor",
    name: "業務委託スタッフ",
    description: "自分が担当する予約・カルテのみ。売上は自分の分のみ。",
    permissions: [
      P.RESERVATION_READ,
      P.RESERVATION_WRITE,
      P.CUSTOMER_READ,
      P.MEDICAL_RECORD_READ,
      P.MEDICAL_RECORD_WRITE,
      P.SALES_READ,
    ],
    maskCustomerPhone: true,
    maskCustomerEmail: true,
    maskSalesAmount: false,
    maskMedicalPhoto: false,
    maskStaffCompensation: true,
    restrictToOwnRecords: true,
  },
  {
    key: "accountant",
    name: "経理担当",
    description: "会計・売上・請求。顧客個票とカルテは閲覧できません。",
    permissions: [P.SALES_READ, P.SALES_REFUND, P.REPORT_READ, P.BILLING_MANAGE],
    maskCustomerPhone: true,
    maskCustomerEmail: true,
    maskSalesAmount: false,
    maskMedicalPhoto: true,
    maskStaffCompensation: false,
    restrictToOwnRecords: false,
  },
  {
    key: "marketer",
    name: "マーケティング担当",
    description: "セグメント作成と配信。顧客の個別連絡先は閲覧できません。",
    permissions: [P.MARKETING_SEND, P.REPORT_READ, P.CUSTOMER_READ],
    maskCustomerPhone: true,
    maskCustomerEmail: true,
    maskSalesAmount: true,
    maskMedicalPhoto: true,
    maskStaffCompensation: true,
    restrictToOwnRecords: false,
  },
  {
    key: "viewer",
    name: "閲覧専用",
    description: "参照のみ。編集操作は一切できません。",
    permissions: [P.RESERVATION_READ, P.CUSTOMER_READ, P.REPORT_READ],
    maskCustomerPhone: true,
    maskCustomerEmail: true,
    maskSalesAmount: true,
    maskMedicalPhoto: true,
    maskStaffCompensation: true,
    restrictToOwnRecords: false,
  },
];

export function findRoleDefinition(key: string): RoleDefinition | undefined {
  return ROLE_CATALOG.find((role) => role.key === key);
}
