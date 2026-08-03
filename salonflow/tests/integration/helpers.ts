import { PrismaClient } from "@prisma/client";

import { PERMISSION_CATALOG, ROLE_CATALOG } from "@/server/permissions/catalog";
import type { RequestContext } from "@/server/auth/context";
import { zonedDateAtMinute, zonedDateISO } from "@/lib/time";

/**
 * Integration-test fixtures.
 *
 * Tests run against a real PostgreSQL database so the exclusion constraints,
 * cascades and transaction behaviour under test are the ones that will run in
 * production. A mocked Prisma client would prove nothing about the guarantee
 * these tests exist to verify.
 */

export const prisma = new PrismaClient();

export const TIMEZONE = "Asia/Tokyo";

/** A fixed future date, far enough ahead to clear any booking cutoff. */
export const TEST_DATE = "2027-06-07"; // a Monday

export function at(minute: number, dateISO = TEST_DATE): Date {
  return zonedDateAtMinute(dateISO, minute, TIMEZONE);
}

export interface TenantFixture {
  organizationId: string;
  storeId: string;
  storeSlug: string;
  staffIds: string[];
  serviceId: string;
  colourServiceId: string;
  resourceIds: string[];
  customerIds: string[];
  userId: string;
  roleId: string;
}

let counter = 0;

function uniqueSuffix(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter}`;
}

export async function ensurePermissions(): Promise<void> {
  for (const permission of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      create: {
        key: permission.key,
        description: permission.description,
        category: permission.category,
      },
      update: {},
    });
  }
}

/**
 * Build a complete, isolated tenant: organization, store, opening hours,
 * two staff with a full roster, two menu items (one with a processing gap),
 * two chairs, and two customers.
 */
export async function createTenant(label: string): Promise<TenantFixture> {
  await ensurePermissions();

  const suffix = uniqueSuffix();

  const organization = await prisma.organization.create({
    data: {
      name: `${label} 法人`,
      slug: `test-${label}-${suffix}`,
      status: "active",
      timezone: TIMEZONE,
    },
    select: { id: true },
  });

  const ownerDefinition = ROLE_CATALOG.find((role) => role.key === "org_owner");
  if (!ownerDefinition) throw new Error("org_owner role definition missing");

  const role = await prisma.role.create({
    data: {
      organizationId: organization.id,
      key: "org_owner",
      name: ownerDefinition.name,
      description: ownerDefinition.description,
      isSystem: true,
      rolePermissions: {
        create: ownerDefinition.permissions.map((permissionKey) => ({ permissionKey })),
      },
    },
    select: { id: true },
  });

  const store = await prisma.store.create({
    data: {
      organizationId: organization.id,
      slug: `store-${label}-${suffix}`,
      name: `${label} 店`,
      industry: "hair",
      timezone: TIMEZONE,
      approvalMode: "instant",
      slotIntervalMinutes: 30,
      // Zero lead time keeps the tests about conflicts, not about cutoffs.
      bookingCutoffMinutes: 0,
      minAdvanceMinutes: 0,
      maxAdvanceDays: 3650,
      bufferMinutes: 0,
      businessHours: {
        create: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          isClosed: false,
          openMinute: 10 * 60,
          closeMinute: 20 * 60,
        })),
      },
    },
    select: { id: true, slug: true },
  });

  const resourceType = await prisma.resourceType.create({
    data: {
      organizationId: organization.id,
      key: `chair-${suffix}`,
      name: "セット面",
      kind: "chair",
    },
    select: { id: true },
  });

  const resourceIds: string[] = [];
  for (let index = 1; index <= 2; index += 1) {
    const resource = await prisma.resource.create({
      data: {
        organizationId: organization.id,
        storeId: store.id,
        resourceTypeId: resourceType.id,
        name: `セット面${index}`,
      },
      select: { id: true },
    });
    resourceIds.push(resource.id);
  }

  const category = await prisma.serviceCategory.create({
    data: { organizationId: organization.id, name: "カット" },
    select: { id: true },
  });

  const service = await prisma.service.create({
    data: {
      organizationId: organization.id,
      storeId: store.id,
      categoryId: category.id,
      name: "カット",
      price: 5500,
      durationMinutes: 60,
      prepMinutes: 0,
      cleanupMinutes: 0,
      serviceResources: {
        create: { resourceTypeId: resourceType.id, quantity: 1, holdsDuringUnattended: true },
      },
    },
    select: { id: true },
  });

  // Colour: 30 apply / 30 process / 30 finish. The stylist is released for the
  // middle third while the chair stays occupied.
  const colourService = await prisma.service.create({
    data: {
      organizationId: organization.id,
      storeId: store.id,
      categoryId: category.id,
      name: "カラー",
      price: 9900,
      durationMinutes: 90,
      prepMinutes: 0,
      cleanupMinutes: 0,
      unattendedStartMinute: 30,
      unattendedMinutes: 30,
      serviceResources: {
        create: { resourceTypeId: resourceType.id, quantity: 1, holdsDuringUnattended: true },
      },
    },
    select: { id: true },
  });

  const staffIds: string[] = [];
  for (let index = 1; index <= 2; index += 1) {
    const staff = await prisma.staff.create({
      data: {
        organizationId: organization.id,
        code: `S${index}-${suffix}`,
        name: `${label} スタッフ${index}`,
        displayName: `STAFF${index}`,
        displayOrder: index,
        stores: { create: { storeId: store.id, isPrimary: true } },
        serviceStaff: {
          create: [{ serviceId: service.id }, { serviceId: colourService.id }],
        },
        skills: {
          create: [
            { serviceId: service.id, durationFactorBps: 10_000 },
            { serviceId: colourService.id, durationFactorBps: 10_000 },
          ],
        },
      },
      select: { id: true },
    });
    staffIds.push(staff.id);
  }

  // Roster the whole week around the test date so no test trips over a day off.
  const shiftRows = [];
  for (let offset = -2; offset <= 7; offset += 1) {
    const date = new Date(`${TEST_DATE}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    for (const staffId of staffIds) {
      shiftRows.push({
        staffId,
        storeId: store.id,
        date,
        type: "work" as const,
        startMinute: 9 * 60,
        endMinute: 21 * 60,
      });
    }
  }
  await prisma.staffShift.createMany({ data: shiftRows });

  const customerIds: string[] = [];
  for (let index = 1; index <= 2; index += 1) {
    const customer = await prisma.customer.create({
      data: {
        organizationId: organization.id,
        homeStoreId: store.id,
        name: `${label} 顧客${index}`,
        nameKana: `テストコキャク${index}`,
        phone: `090-0000-${String(index).padStart(4, "0")}`,
        phoneNormalized: `+8190000${String(index).padStart(4, "0")}`,
        email: `${label}-${index}-${suffix}@demo.example.invalid`,
        emailNormalized: `${label}-${index}-${suffix}@demo.example.invalid`,
      },
      select: { id: true },
    });
    customerIds.push(customer.id);
  }

  const user = await prisma.user.create({
    data: {
      email: `owner-${label}-${suffix}@demo.example.invalid`,
      emailNormalized: `owner-${label}-${suffix}@demo.example.invalid`,
      name: `${label} オーナー`,
      passwordHash: null,
    },
    select: { id: true },
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
      organizationId: organization.id,
      storeId: null,
    },
  });

  return {
    organizationId: organization.id,
    storeId: store.id,
    storeSlug: store.slug,
    staffIds,
    serviceId: service.id,
    colourServiceId: colourService.id,
    resourceIds,
    customerIds,
    userId: user.id,
    roleId: role.id,
  };
}

/**
 * Build a RequestContext without going through the HTTP layer.
 *
 * Services take the context as an argument precisely so they can be tested
 * this way — the alternative is spinning up a server and juggling cookies for
 * every assertion about authorisation.
 */
export function contextFor(
  tenant: TenantFixture,
  overrides: Partial<RequestContext> = {},
): RequestContext {
  const permissions = new Set(
    ROLE_CATALOG.find((role) => role.key === "org_owner")?.permissions ?? [],
  );

  return {
    requestId: `test-${uniqueSuffix()}`,
    user: {
      id: tenant.userId,
      name: "テスト実行者",
      email: "test@demo.example.invalid",
      locale: "ja",
      isPlatformAdmin: false,
    },
    sessionId: `session-${uniqueSuffix()}`,
    organizationId: tenant.organizationId,
    organization: {
      id: tenant.organizationId,
      name: "テスト法人",
      timezone: TIMEZONE,
      currency: "JPY",
    },
    staffId: null,
    accessibleStores: [
      { id: tenant.storeId, name: "テスト店", slug: tenant.storeSlug, timezone: TIMEZONE },
    ],
    activeStoreId: tenant.storeId,
    globalPermissions: permissions,
    storePermissions: new Map(),
    masks: {
      customerPhone: false,
      customerEmail: false,
      salesAmount: false,
      medicalPhoto: false,
      staffCompensation: false,
    },
    restrictToOwnRecords: false,
    ipAddress: "127.0.0.1",
    userAgent: "vitest",
    ...overrides,
  };
}

/** Remove a tenant and everything cascading from it. */
export async function destroyTenant(tenant: TenantFixture): Promise<void> {
  await prisma.userRole.deleteMany({ where: { organizationId: tenant.organizationId } });
  await prisma.organization
    .delete({ where: { id: tenant.organizationId } })
    .catch(() => undefined);
  await prisma.user.delete({ where: { id: tenant.userId } }).catch(() => undefined);
}

export function todayISO(): string {
  return zonedDateISO(new Date(), TIMEZONE);
}
