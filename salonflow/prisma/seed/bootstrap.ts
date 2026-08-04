/**
 * Bootstrap a real tenant.
 *
 * The demo seed exists to show the product; this exists to start using it.
 * It creates the permission catalogue, the standard roles, one organization,
 * one store with opening hours, and one owner account — and nothing else.
 * No fictional customers, no sample bookings.
 *
 * Everything is driven by environment variables so the script can run
 * unattended from a deployment step:
 *
 *   BOOTSTRAP_ORG_NAME="架空ビューティー株式会社" \
 *   BOOTSTRAP_STORE_NAME="本店" \
 *   BOOTSTRAP_STORE_SLUG="honten" \
 *   BOOTSTRAP_ADMIN_EMAIL="owner@example.com" \
 *   BOOTSTRAP_ADMIN_NAME="山田 太郎" \
 *   BOOTSTRAP_ADMIN_PASSWORD="..." \
 *     npx tsx prisma/seed/bootstrap.ts
 *
 * Safe to re-run: if the organization slug already exists the script stops
 * without touching anything, so a repeated deployment step cannot duplicate a
 * tenant or reset an owner's password.
 */

import { PrismaClient } from "@prisma/client";

import { hashPassword, checkPasswordPolicy } from "../../src/server/auth/password";
import { PERMISSION_CATALOG, ROLE_CATALOG } from "../../src/server/permissions/catalog";
import { DEFAULT_TEMPLATES } from "../../src/server/notifications/default-templates";
import { normalizeEmail } from "../../src/lib/normalize";
import { slugify } from "../../src/lib/utils";

const prisma = new PrismaClient();

interface BootstrapConfig {
  organizationName: string;
  organizationSlug: string;
  storeName: string;
  storeSlug: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  timezone: string;
  industry:
    | "hair"
    | "barber"
    | "nail"
    | "eyelash"
    | "esthetic"
    | "relaxation"
    | "bodycare"
    | "personal"
    | "mixed";
}

function readConfig(): BootstrapConfig {
  const missing: string[] = [];

  function required(key: string): string {
    const value = process.env[key];
    if (!value || value.trim().length === 0) {
      missing.push(key);
      return "";
    }
    return value.trim();
  }

  const organizationName = required("BOOTSTRAP_ORG_NAME");
  const storeName = required("BOOTSTRAP_STORE_NAME");
  const adminEmail = required("BOOTSTRAP_ADMIN_EMAIL");
  const adminName = required("BOOTSTRAP_ADMIN_NAME");
  const adminPassword = required("BOOTSTRAP_ADMIN_PASSWORD");

  if (missing.length > 0) {
    console.error("必須の環境変数が設定されていません:\n");
    for (const key of missing) console.error(`  - ${key}`);
    console.error("\n使い方は docs/operations/DEPLOYMENT.md を参照してください。");
    process.exit(1);
  }

  const industry = (process.env.BOOTSTRAP_INDUSTRY ?? "hair") as BootstrapConfig["industry"];

  return {
    organizationName,
    organizationSlug: process.env.BOOTSTRAP_ORG_SLUG?.trim() || slugify(organizationName),
    storeName,
    storeSlug: process.env.BOOTSTRAP_STORE_SLUG?.trim() || slugify(storeName),
    adminEmail,
    adminName,
    adminPassword,
    timezone: process.env.DEFAULT_TIMEZONE?.trim() || "Asia/Tokyo",
    industry,
  };
}

async function main(): Promise<void> {
  const config = readConfig();

  // The owner account is the keys to every customer record in the tenant, so a
  // weak password here is not a minor problem.
  const policy = checkPasswordPolicy(config.adminPassword);
  if (!policy.ok) {
    console.error("BOOTSTRAP_ADMIN_PASSWORD がパスワード要件を満たしていません:");
    for (const problem of policy.problems) console.error(`  - ${problem}`);
    console.error("\n12文字以上・英字と数字を含む・推測されやすい語を含まないこと。");
    process.exit(1);
  }

  const existing = await prisma.organization.findUnique({
    where: { slug: config.organizationSlug },
    select: { id: true, name: true },
  });
  if (existing) {
    console.log(
      `法人 "${existing.name}" (${config.organizationSlug}) はすでに存在します。何もせず終了します。`,
    );
    return;
  }

  const emailNormalized = normalizeEmail(config.adminEmail);
  if (!emailNormalized) {
    console.error("BOOTSTRAP_ADMIN_EMAIL の形式が不正です。");
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({
    where: { emailNormalized },
    select: { id: true },
  });
  if (existingUser) {
    console.error(
      `メールアドレス ${config.adminEmail} のアカウントはすでに存在します。` +
        "\n別のアドレスを指定するか、既存アカウントに権限を付与してください。",
    );
    process.exit(1);
  }

  console.log("初期セットアップを開始します…");

  // --- Permission catalogue (global, shared by every tenant) ----------------
  for (const permission of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      create: {
        key: permission.key,
        description: permission.description,
        category: permission.category,
      },
      update: { description: permission.description, category: permission.category },
    });
  }
  console.log(`  権限マスタ: ${PERMISSION_CATALOG.length} 件`);

  const passwordHash = await hashPassword(config.adminPassword);

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: config.organizationName,
        slug: config.organizationSlug,
        status: "active",
        timezone: config.timezone,
      },
      select: { id: true },
    });

    // Every standard role is created, not only the owner's: the operator will
    // need somewhere to put reception and stylists on day one.
    const roles = new Map<string, string>();
    for (const definition of ROLE_CATALOG) {
      const role = await tx.role.create({
        data: {
          organizationId: organization.id,
          key: definition.key,
          name: definition.name,
          description: definition.description,
          isSystem: true,
          maskCustomerPhone: definition.maskCustomerPhone,
          maskCustomerEmail: definition.maskCustomerEmail,
          maskSalesAmount: definition.maskSalesAmount,
          maskMedicalPhoto: definition.maskMedicalPhoto,
          maskStaffCompensation: definition.maskStaffCompensation,
          restrictToOwnRecords: definition.restrictToOwnRecords,
          rolePermissions: {
            create: definition.permissions.map((permissionKey) => ({ permissionKey })),
          },
        },
        select: { id: true, key: true },
      });
      roles.set(role.key, role.id);
    }

    const store = await tx.store.create({
      data: {
        organizationId: organization.id,
        slug: config.storeSlug,
        name: config.storeName,
        industry: config.industry,
        status: "active",
        timezone: config.timezone,
        // Conservative defaults. The operator adjusts these in 店舗設定.
        approvalMode: "instant",
        slotIntervalMinutes: 15,
        bookingCutoffMinutes: 120,
        maxAdvanceDays: 60,
        bufferMinutes: 5,
        cancelDeadlineHours: 24,
        // Every day closed to begin with. Opening a day the salon does not
        // actually work would let customers book into thin air; the operator
        // opens each day deliberately.
        businessHours: {
          create: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
            dayOfWeek,
            isClosed: true,
            openMinute: 10 * 60,
            closeMinute: 19 * 60,
          })),
        },
      },
      select: { id: true },
    });

    const user = await tx.user.create({
      data: {
        email: config.adminEmail,
        emailNormalized,
        name: config.adminName,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
      select: { id: true },
    });

    const ownerRoleId = roles.get("org_owner");
    if (!ownerRoleId) throw new Error("org_owner ロールの作成に失敗しました");

    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: ownerRoleId,
        organizationId: organization.id,
        storeId: null,
      },
    });

    // Notification templates, so the first booking confirmation is not blank.
    const templates = [];
    for (const [locale, events] of Object.entries(DEFAULT_TEMPLATES)) {
      for (const [event, template] of Object.entries(events)) {
        if (!template) continue;
        templates.push({
          organizationId: organization.id,
          storeId: null,
          event: event as never,
          channel: "email" as const,
          locale: locale as never,
          subject: template.subject,
          body: template.body,
        });
      }
    }
    await tx.messageTemplate.createMany({ data: templates, skipDuplicates: true });

    return { organizationId: organization.id, storeId: store.id, templateCount: templates.length };
  });

  console.log(`  ロール: ${ROLE_CATALOG.length} 件`);
  console.log(`  法人: ${config.organizationName}`);
  console.log(`  店舗: ${config.storeName}`);
  console.log(`  通知テンプレート: ${result.templateCount} 件`);
  console.log("");
  console.log("完了しました。");
  console.log("");
  console.log(`  ログイン: ${config.adminEmail}`);
  console.log(`  公開予約ページ: /booking/${config.storeSlug}`);
  console.log("");
  console.log("次にやること:");
  console.log("  1. 管理画面にログインし、パスワードが通ることを確認する");
  console.log("  2. 店舗設定で営業時間を開ける（初期状態は全曜日が休業です）");
  console.log("  3. 設備・スタッフ・メニューを登録する");
  console.log("  4. スタッフのシフトを入れる");
  console.log("");
  console.log("営業時間を開け、スタッフとメニューを登録するまで、");
  console.log("公開予約ページには空き枠が表示されません。");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
