/**
 * Database seed.
 *
 * Creates the permission catalogue, the seeded roles, and a complete set of
 * FICTIONAL demo data: 2 stores, 6 staff, 50 customers, 20 menu items,
 * 100 appointments, 30 charts, 50 sales and 10 retail products.
 *
 * Nothing here represents a real business or person. Appointments are laid out
 * sequentially per staff member per day, so the exclusion constraints that
 * guard against double booking are satisfied by construction — the seed
 * exercises the same tables the booking API writes to, with no shortcuts.
 *
 * Run with `npm run db:seed`. Safe to re-run: it clears the demo organization
 * first.
 */

import { PrismaClient, type AppointmentStatus, type Prisma } from "@prisma/client";

import { hashPassword } from "../../src/server/auth/password";
import { PERMISSION_CATALOG, ROLE_CATALOG } from "../../src/server/permissions/catalog";
import { DEFAULT_TEMPLATES } from "../../src/server/notifications/default-templates";
import { buildOccupancyPlan } from "../../src/server/booking-engine/occupancy";
import { addDaysISO, zonedDateAtMinute, zonedDateISO } from "../../src/lib/time";
import { normalizeEmail, normalizePhone } from "../../src/lib/normalize";
import {
  DEMO_ACQUISITION_SOURCES,
  DEMO_GIVEN_NAMES,
  DEMO_ORGANIZATION,
  DEMO_PRODUCTS,
  DEMO_RECORD_TEMPLATES,
  DEMO_RESOURCE_TYPES,
  DEMO_SERVICES,
  DEMO_SERVICE_CATEGORIES,
  DEMO_STAFF,
  DEMO_STORES,
  DEMO_SURNAMES,
  DEMO_TAGS,
  DEMO_USERS,
} from "./fixtures";

const prisma = new PrismaClient();

/**
 * Deterministic pseudo-random generator (mulberry32).
 *
 * A fixed seed means every developer, CI run and screenshot sees identical
 * demo data — which matters when a test asserts "the dashboard shows 7
 * appointments today".
 */
function createRandom(seed: number) {
  let state = seed >>> 0;
  return function random(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const random = createRandom(20260803);

function pick<T>(items: readonly T[]): T {
  const index = Math.floor(random() * items.length);
  return items[Math.min(index, items.length - 1)] as T;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

const TIMEZONE = DEMO_ORGANIZATION.timezone;
const TODAY = zonedDateISO(new Date(), TIMEZONE);

const DEMO_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? "DemoPassw0rd!";

async function main(): Promise<void> {
  console.log("Seeding SalonFlow demo data (all fictional)…");

  await seedPermissions();
  await resetDemoOrganization();

  const organization = await seedOrganization();
  const roles = await seedRoles(organization.id);
  const stores = await seedStores(organization.id);
  const resourceTypes = await seedResourceTypes(organization.id);
  await seedResources(organization.id, stores, resourceTypes);
  const categories = await seedServiceCategories(organization.id);
  const services = await seedServices(organization.id, stores, categories, resourceTypes);
  const staff = await seedStaff(organization.id, stores, services);
  await seedUsers(organization.id, roles, stores, staff);
  await seedShifts(stores, staff);
  const templates = await seedRecordTemplates(organization.id, stores);
  await seedMessageTemplates(organization.id);
  const tags = await seedTags(organization.id);
  const customers = await seedCustomers(organization.id, stores, staff, tags);
  await seedProducts(organization.id, stores);
  const appointments = await seedAppointments(organization.id, stores, staff, services, customers);
  await seedMedicalRecords(organization.id, templates, appointments, staff);
  await seedSales(organization.id, appointments);
  await seedSubscription(organization.id);

  console.log("");
  console.log("Done. Demo sign-in accounts (all fictional):");
  for (const user of DEMO_USERS) {
    console.log(`  ${user.email.padEnd(36)} ${DEMO_PASSWORD}   (${user.roleKey})`);
  }
  console.log("");
  console.log(`Public booking pages:`);
  for (const store of DEMO_STORES) {
    console.log(`  /booking/${store.slug}`);
  }
}

// ---------------------------------------------------------------------------

async function seedPermissions(): Promise<void> {
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
  console.log(`  permissions: ${PERMISSION_CATALOG.length}`);
}

async function resetDemoOrganization(): Promise<void> {
  // Cascading deletes remove every child row, so re-running the seed is safe.
  const existing = await prisma.organization.findUnique({
    where: { slug: DEMO_ORGANIZATION.slug },
    select: { id: true },
  });
  if (!existing) return;

  await prisma.userRole.deleteMany({ where: { organizationId: existing.id } });
  await prisma.organization.delete({ where: { id: existing.id } });
  await prisma.user.deleteMany({
    where: { email: { in: DEMO_USERS.map((user) => user.email) } },
  });
  console.log("  cleared previous demo organization");
}

async function seedOrganization() {
  const organization = await prisma.organization.create({
    data: {
      name: DEMO_ORGANIZATION.name,
      nameKana: DEMO_ORGANIZATION.nameKana,
      slug: DEMO_ORGANIZATION.slug,
      status: "active",
      timezone: TIMEZONE,
      billingEmail: DEMO_ORGANIZATION.billingEmail,
    },
    select: { id: true },
  });
  console.log(`  organization: ${DEMO_ORGANIZATION.name}`);
  return organization;
}

async function seedRoles(organizationId: string) {
  const roles = new Map<string, string>();

  for (const definition of ROLE_CATALOG) {
    const role = await prisma.role.create({
      data: {
        organizationId,
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

  console.log(`  roles: ${roles.size}`);
  return roles;
}

async function seedStores(organizationId: string) {
  const brand = await prisma.brand.create({
    data: {
      organizationId,
      name: "Demo Beauty",
      slug: "demo-beauty",
      primaryColor: "#7c3aed",
      description: "デモ用の架空ブランドです。",
    },
    select: { id: true },
  });

  const stores = [];
  for (const definition of DEMO_STORES) {
    const store = await prisma.store.create({
      data: {
        organizationId,
        brandId: brand.id,
        slug: definition.slug,
        name: definition.name,
        nameKana: definition.nameKana,
        industry: definition.industry,
        status: "active",
        timezone: TIMEZONE,
        phone: definition.phone,
        email: definition.email,
        postalCode: definition.postalCode,
        prefecture: definition.prefecture,
        city: definition.city,
        addressLine: definition.addressLine,
        accessNote: definition.accessNote,
        description: definition.description,
        approvalMode: definition.approvalMode,
        slotIntervalMinutes: definition.slotIntervalMinutes,
        bookingCutoffMinutes: definition.bookingCutoffMinutes,
        maxAdvanceDays: definition.maxAdvanceDays,
        bufferMinutes: definition.bufferMinutes,
        cancelDeadlineHours: definition.cancelDeadlineHours,
        cancellationPolicy: "ご来店の前日までにご連絡ください。（デモデータ用の文面です）",
        businessHours: {
          create: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
            dayOfWeek,
            // Closed on Tuesdays — a common salon closing day.
            isClosed: dayOfWeek === 2,
            openMinute: 10 * 60,
            closeMinute: dayOfWeek === 0 ? 18 * 60 : 20 * 60,
            breakStartMinute: null,
            breakEndMinute: null,
          })),
        },
      },
      select: { id: true, slug: true, name: true, timezone: true },
    });
    stores.push(store);
  }

  // One ad-hoc closure two weeks out, so the calendar demonstrates it.
  await prisma.storeHoliday.create({
    data: {
      storeId: stores[0]!.id,
      date: new Date(`${addDaysISO(TODAY, 14)}T00:00:00.000Z`),
      isClosed: true,
      reason: "臨時休業（デモ）",
    },
  });

  console.log(`  stores: ${stores.length}`);
  return stores;
}

async function seedResourceTypes(organizationId: string) {
  const types = new Map<string, string>();
  for (const definition of DEMO_RESOURCE_TYPES) {
    const type = await prisma.resourceType.create({
      data: {
        organizationId,
        key: definition.key,
        name: definition.name,
        kind: definition.kind,
      },
      select: { id: true, key: true },
    });
    types.set(type.key, type.id);
  }
  return types;
}

async function seedResources(
  organizationId: string,
  stores: Array<{ id: string }>,
  types: Map<string, string>,
) {
  const layout: Array<{ storeIndex: number; typeKey: string; count: number; label: string }> = [
    { storeIndex: 0, typeKey: "chair", count: 4, label: "セット面" },
    { storeIndex: 0, typeKey: "shampoo", count: 2, label: "シャンプー台" },
    { storeIndex: 1, typeKey: "nail_table", count: 3, label: "ネイルテーブル" },
    { storeIndex: 1, typeKey: "bed", count: 2, label: "ベッド" },
    { storeIndex: 1, typeKey: "private_room", count: 1, label: "個室" },
  ];

  let total = 0;
  for (const entry of layout) {
    const storeId = stores[entry.storeIndex]?.id;
    const resourceTypeId = types.get(entry.typeKey);
    if (!storeId || !resourceTypeId) continue;

    for (let index = 1; index <= entry.count; index += 1) {
      await prisma.resource.create({
        data: {
          organizationId,
          storeId,
          resourceTypeId,
          name: `${entry.label}${index}`,
          displayOrder: index,
        },
      });
      total += 1;
    }
  }
  console.log(`  resources: ${total}`);
}

async function seedServiceCategories(organizationId: string) {
  const categories = new Map<string, string>();
  for (const [index, name] of DEMO_SERVICE_CATEGORIES.entries()) {
    const category = await prisma.serviceCategory.create({
      data: { organizationId, name, displayOrder: index },
      select: { id: true, name: true },
    });
    categories.set(category.name, category.id);
  }
  return categories;
}

interface SeededService {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  prepMinutes: number;
  cleanupMinutes: number;
  unattendedStartMinute: number | null;
  unattendedMinutes: number | null;
  storeIndex: number;
  resourceTypeIds: string[];
}

async function seedServices(
  organizationId: string,
  stores: Array<{ id: string }>,
  categories: Map<string, string>,
  types: Map<string, string>,
): Promise<SeededService[]> {
  const services: SeededService[] = [];

  for (const [index, definition] of DEMO_SERVICES.entries()) {
    const categoryId = categories.get(definition.category);
    const storeId = stores[definition.storeIndex]?.id;
    if (!categoryId || !storeId) continue;

    const resourceTypeIds = definition.resources
      .map((key) => types.get(key))
      .filter((id): id is string => Boolean(id));

    const service = await prisma.service.create({
      data: {
        organizationId,
        storeId,
        categoryId,
        name: definition.name,
        description: `${definition.name}（デモデータ）`,
        price: definition.price,
        cost: Math.round(definition.price * 0.15),
        taxCategory: "standard",
        taxMode: "inclusive",
        durationMinutes: definition.duration,
        prepMinutes: definition.prep,
        cleanupMinutes: definition.cleanup,
        unattendedStartMinute: "unattendedStart" in definition ? definition.unattendedStart : null,
        unattendedMinutes: "unattended" in definition ? definition.unattended : null,
        isOnlineBookable: true,
        allowsDesignation: true,
        displayOrder: index,
        commissionBps: 1000,
        serviceResources: {
          create: resourceTypeIds.map((resourceTypeId) => ({
            resourceTypeId,
            quantity: 1,
            holdsDuringUnattended: true,
          })),
        },
      },
      select: { id: true },
    });

    // A couple of menu items get options, to exercise the option pricing path.
    if (definition.name === "カット") {
      await prisma.serviceOption.createMany({
        data: [
          {
            serviceId: service.id,
            name: "炭酸スパ追加",
            price: 2200,
            durationMinutes: 15,
            displayOrder: 0,
          },
          {
            serviceId: service.id,
            name: "眉カット",
            price: 1100,
            durationMinutes: 10,
            displayOrder: 1,
          },
        ],
      });
    }

    services.push({
      id: service.id,
      name: definition.name,
      price: definition.price,
      durationMinutes: definition.duration,
      prepMinutes: definition.prep,
      cleanupMinutes: definition.cleanup,
      unattendedStartMinute: "unattendedStart" in definition ? definition.unattendedStart : null,
      unattendedMinutes: "unattended" in definition ? definition.unattended : null,
      storeIndex: definition.storeIndex,
      resourceTypeIds,
    });
  }

  console.log(`  services: ${services.length}`);
  return services;
}

interface SeededStaff {
  id: string;
  code: string;
  displayName: string;
  storeIndex: number;
  storeId: string;
}

async function seedStaff(
  organizationId: string,
  stores: Array<{ id: string }>,
  services: SeededService[],
): Promise<SeededStaff[]> {
  const result: SeededStaff[] = [];

  for (const [index, definition] of DEMO_STAFF.entries()) {
    const storeId = stores[definition.storeIndex]?.id;
    if (!storeId) continue;

    const eligible = services.filter((service) => service.storeIndex === definition.storeIndex);

    const staff = await prisma.staff.create({
      data: {
        organizationId,
        code: definition.code,
        name: definition.name,
        nameKana: definition.nameKana,
        displayName: definition.displayName,
        title: definition.title,
        bio: definition.bio,
        employmentType: definition.employmentType,
        designationFee: definition.designationFee,
        salesTarget: 1_200_000,
        commissionBps: 3000,
        displayOrder: index,
        hiredOn: new Date("2024-04-01"),
        stores: { create: { storeId, isPrimary: true } },
        serviceStaff: { create: eligible.map((service) => ({ serviceId: service.id })) },
        skills: {
          create: eligible.map((service) => ({
            serviceId: service.id,
            durationFactorBps: definition.durationFactorBps,
          })),
        },
      },
      select: { id: true, code: true, displayName: true },
    });

    result.push({
      id: staff.id,
      code: staff.code ?? definition.code,
      displayName: staff.displayName,
      storeIndex: definition.storeIndex,
      storeId,
    });
  }

  console.log(`  staff: ${result.length}`);
  return result;
}

async function seedUsers(
  organizationId: string,
  roles: Map<string, string>,
  stores: Array<{ id: string }>,
  staff: SeededStaff[],
) {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  for (const definition of DEMO_USERS) {
    const roleId = roles.get(definition.roleKey);
    if (!roleId) continue;

    const user = await prisma.user.create({
      data: {
        email: definition.email,
        emailNormalized: normalizeEmail(definition.email) ?? definition.email,
        name: definition.name,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
      select: { id: true },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId,
        organizationId,
        storeId:
          definition.storeIndex === null ? null : (stores[definition.storeIndex]?.id ?? null),
      },
    });

    if (definition.staffCode) {
      const linked = staff.find((entry) => entry.code === definition.staffCode);
      if (linked) {
        await prisma.staff.update({
          where: { id: linked.id },
          data: { userId: user.id },
        });
      }
    }
  }

  console.log(`  users: ${DEMO_USERS.length}`);
}

/**
 * Roster covering 45 days back and 30 days forward.
 *
 * Every staff member works 10:00–19:00 with an hour's break, except on the
 * store's Tuesday closure and one rotating day off each, so the ledger shows
 * realistic gaps rather than a uniform grid.
 */
async function seedShifts(stores: Array<{ id: string }>, staff: SeededStaff[]) {
  const rows: Prisma.StaffShiftCreateManyInput[] = [];

  for (let offset = -45; offset <= 30; offset += 1) {
    const dateISO = addDaysISO(TODAY, offset);
    const weekday = new Date(`${dateISO}T00:00:00.000Z`).getUTCDay();
    if (weekday === 2) continue; // store closed

    for (const [index, member] of staff.entries()) {
      // Each staff member takes one additional day off, staggered.
      if (weekday === (index % 6) + 1 && weekday !== 2) continue;

      rows.push({
        staffId: member.id,
        storeId: member.storeId,
        date: new Date(`${dateISO}T00:00:00.000Z`),
        type: "work",
        startMinute: 10 * 60,
        endMinute: weekday === 0 ? 18 * 60 : 20 * 60,
        breakStartMinute: 14 * 60,
        breakEndMinute: 15 * 60,
      });
    }
  }

  await prisma.staffShift.createMany({ data: rows, skipDuplicates: true });
  console.log(`  shifts: ${rows.length}`);
  void stores;
}

async function seedRecordTemplates(organizationId: string, stores: Array<{ id: string }>) {
  const templates = new Map<string, { id: string; fieldIds: Map<string, string> }>();

  for (const definition of DEMO_RECORD_TEMPLATES) {
    const storeId = stores[definition.storeIndex]?.id ?? null;

    const template = await prisma.medicalRecordTemplate.create({
      data: {
        organizationId,
        storeId,
        industry: definition.industry,
        name: definition.name,
        description: `${definition.name}（デモ）`,
        isDefault: definition.isDefault,
        fields: {
          create: definition.fields.map((field, index) => ({
            key: field.key,
            label: field.label,
            type: field.type,
            section: field.section,
            options:
              "options" in field && field.options
                ? (field.options.map((option) => ({
                    value: option,
                    label: option,
                  })) as Prisma.InputJsonValue)
                : undefined,
            isSensitive: "sensitive" in field ? Boolean(field.sensitive) : false,
            displayOrder: index,
          })),
        },
      },
      select: { id: true, fields: { select: { id: true, key: true } } },
    });

    templates.set(definition.key, {
      id: template.id,
      fieldIds: new Map(template.fields.map((field) => [field.key, field.id])),
    });
  }

  console.log(`  chart templates: ${templates.size}`);
  return templates;
}

async function seedMessageTemplates(organizationId: string) {
  const rows: Prisma.MessageTemplateCreateManyInput[] = [];

  for (const [locale, events] of Object.entries(DEFAULT_TEMPLATES)) {
    for (const [event, template] of Object.entries(events)) {
      if (!template) continue;
      rows.push({
        organizationId,
        storeId: null,
        event: event as Prisma.MessageTemplateCreateManyInput["event"],
        channel: "email",
        locale: locale as Prisma.MessageTemplateCreateManyInput["locale"],
        subject: template.subject,
        body: template.body,
      });
    }
  }

  await prisma.messageTemplate.createMany({ data: rows, skipDuplicates: true });
  console.log(`  message templates: ${rows.length}`);
}

async function seedTags(organizationId: string) {
  const tags: Array<{ id: string }> = [];
  for (const definition of DEMO_TAGS) {
    const tag = await prisma.customerTag.create({
      data: { organizationId, name: definition.name, color: definition.color },
      select: { id: true },
    });
    tags.push(tag);
  }
  return tags;
}

interface SeededCustomer {
  id: string;
  name: string;
  email: string | null;
  storeIndex: number;
}

async function seedCustomers(
  organizationId: string,
  stores: Array<{ id: string }>,
  staff: SeededStaff[],
  tags: Array<{ id: string }>,
): Promise<SeededCustomer[]> {
  const customers: SeededCustomer[] = [];

  for (let index = 0; index < 50; index += 1) {
    const surname = DEMO_SURNAMES[index % DEMO_SURNAMES.length]!;
    const given =
      DEMO_GIVEN_NAMES[Math.floor(index / DEMO_SURNAMES.length) % DEMO_GIVEN_NAMES.length]!;

    const name = `${surname[0]} ${given[0]}`;
    const nameKana = `${surname[1]} ${given[1]}`;
    // Reserved numbering range and reserved TLD: unreachable by design.
    const phone = `090-0000-${String(1000 + index).padStart(4, "0")}`;
    const email = index % 7 === 0 ? null : `customer${index + 1}@demo.example.invalid`;
    const storeIndex = index % 2 === 0 ? 0 : 1;
    const storeId = stores[storeIndex]?.id ?? null;

    const staffPool = staff.filter((member) => member.storeIndex === storeIndex);

    const customer = await prisma.customer.create({
      data: {
        organizationId,
        code: `C${String(index + 1).padStart(4, "0")}`,
        name,
        nameKana,
        phone,
        phoneNormalized: normalizePhone(phone),
        email,
        emailNormalized: normalizeEmail(email),
        birthDate: new Date(Date.UTC(1980 + (index % 25), index % 12, ((index * 3) % 27) + 1)),
        gender: given[2] as "female" | "male" | "other",
        postalCode: `100-${String(index).padStart(4, "0")}`,
        occupation: pick(["会社員", "自営業", "学生", "主婦・主夫", "公務員"]),
        acquisitionSource: pick(DEMO_ACQUISITION_SOURCES),
        homeStoreId: storeId,
        primaryStaffId: staffPool.length > 0 ? pick(staffPool).id : null,
        note: index % 9 === 0 ? "デモ用のメモです。" : null,
        allergyNote: index % 11 === 0 ? "デモ用のアレルギー記載です。" : null,
        consents: {
          create: [
            {
              type: "privacy_policy",
              status: "granted",
              grantedAt: new Date(),
              documentVersion: "2026-01",
            },
            {
              type: "marketing_email",
              status: index % 4 === 0 ? "withdrawn" : "granted",
              grantedAt: new Date(),
              withdrawnAt: index % 4 === 0 ? new Date() : null,
              documentVersion: "2026-01",
            },
          ],
        },
        pointAccount: { create: { organizationId, balance: randomInt(0, 3000) } },
      },
      select: { id: true },
    });

    if (index % 5 === 0 && tags.length > 0) {
      await prisma.customerTagAssignment.create({
        data: { customerId: customer.id, tagId: pick(tags).id },
      });
    }

    customers.push({ id: customer.id, name, email, storeIndex });
  }

  console.log(`  customers: ${customers.length}`);
  return customers;
}

async function seedProducts(organizationId: string, stores: Array<{ id: string }>) {
  const supplier = await prisma.supplier.create({
    data: {
      organizationId,
      name: "デモ商事株式会社",
      contactName: "架空 担当",
      email: "supplier@demo.example.invalid",
    },
    select: { id: true },
  });

  for (const definition of DEMO_PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        organizationId,
        supplierId: supplier.id,
        sku: definition.sku,
        janCode: `49${definition.sku.replace(/\D/g, "").padStart(11, "0")}`,
        name: definition.name,
        isRetail: true,
        purchasePrice: definition.purchase,
        sellingPrice: definition.selling,
        taxCategory: "standard",
      },
      select: { id: true },
    });

    for (const store of stores) {
      await prisma.inventory.create({
        data: {
          storeId: store.id,
          productId: product.id,
          quantity: randomInt(3, 30),
          reorderPoint: 5,
        },
      });
    }
  }

  console.log(`  products: ${DEMO_PRODUCTS.length}`);
}

interface SeededAppointment {
  id: string;
  storeId: string;
  storeIndex: number;
  customerId: string;
  staffId: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  totalAmount: number;
  serviceIds: string[];
}

/**
 * 100 appointments spread across the past 45 and next 21 days.
 *
 * Placement is sequential per staff member per day: a cursor walks forward
 * from the shift start, so two appointments can never overlap and the
 * exclusion constraints hold without the seed needing to query for conflicts.
 */
async function seedAppointments(
  organizationId: string,
  stores: Array<{ id: string; timezone: string }>,
  staff: SeededStaff[],
  services: SeededService[],
  customers: SeededCustomer[],
): Promise<SeededAppointment[]> {
  const created: SeededAppointment[] = [];
  const resources = await prisma.resource.findMany({
    select: { id: true, storeId: true, resourceTypeId: true },
  });

  const target = 100;
  let sequence = 0;

  // Cursor per (staffId, dateISO), in minutes from midnight.
  const cursors = new Map<string, number>();
  // Which resource of each type is next in line, per store.
  const resourceCursor = new Map<string, number>();

  for (let offset = -45; offset <= 21 && created.length < target; offset += 1) {
    const dateISO = addDaysISO(TODAY, offset);
    const weekday = new Date(`${dateISO}T00:00:00.000Z`).getUTCDay();
    if (weekday === 2) continue;

    // Roughly two bookings per open day, more on weekends.
    const perDay = weekday === 0 || weekday === 6 ? 3 : 2;

    for (let n = 0; n < perDay && created.length < target; n += 1) {
      const member = staff[sequence % staff.length]!;
      sequence += 1;

      const storeIndex = member.storeIndex;
      const store = stores[storeIndex];
      if (!store) continue;

      const eligible = services.filter((service) => service.storeIndex === storeIndex);
      if (eligible.length === 0) continue;
      const service = pick(eligible);

      const cursorKey = `${member.id}:${dateISO}`;
      const startMinute = cursors.get(cursorKey) ?? 10 * 60;

      const plan = buildOccupancyPlan([
        {
          serviceId: service.id,
          name: service.name,
          price: service.price,
          durationMinutes: service.durationMinutes,
          prepMinutes: service.prepMinutes,
          cleanupMinutes: service.cleanupMinutes,
          unattendedStartMinute: service.unattendedStartMinute,
          unattendedMinutes: service.unattendedMinutes,
          resources: service.resourceTypeIds.map((resourceTypeId) => ({
            resourceTypeId,
            quantity: 1,
            holdsDuringUnattended: true,
          })),
        },
      ]);

      const endMinute = startMinute + plan.customerMinutes;
      // Leave the shop before closing; otherwise skip to the next day.
      if (endMinute > (weekday === 0 ? 18 * 60 : 20 * 60)) continue;

      const startAt = zonedDateAtMinute(dateISO, startMinute, store.timezone);
      const customerPool = customers.filter((customer) => customer.storeIndex === storeIndex);
      if (customerPool.length === 0) continue;
      const customer = pick(customerPool);

      const status = pickStatus(offset);

      const appointment = await prisma.appointment.create({
        data: {
          organizationId,
          storeId: store.id,
          customerId: customer.id,
          reference: `A-${dateISO.replace(/-/g, "")}-${String(created.length + 1).padStart(4, "0")}`,
          status,
          source: pick(["public_web", "phone", "walk_in", "next_visit", "staff_entry"] as const),
          startAt,
          endAt: new Date(startAt.getTime() + plan.customerMinutes * 60_000),
          isDesignated: random() > 0.4,
          subtotalAmount: plan.subtotal,
          totalAmount: plan.subtotal,
          customerNote: random() > 0.8 ? "デモ用の要望メモです。" : null,
          confirmedAt: status === "pending" ? null : startAt,
          completedAt: status === "completed" ? startAt : null,
          cancelledAt: status === "cancelled" ? startAt : null,
          statusHistory: {
            create: { fromStatus: null, toStatus: status, reason: "seed" },
          },
          services: {
            create: {
              serviceId: service.id,
              sequence: 0,
              nameSnapshot: service.name,
              priceSnapshot: service.price,
              durationMinutes: plan.customerMinutes,
              startAt,
              endAt: new Date(startAt.getTime() + plan.customerMinutes * 60_000),
            },
          },
        },
        select: { id: true },
      });

      const occupies = status !== "cancelled" && status !== "no_show";

      await prisma.appointmentStaff.createMany({
        data: plan.staffSegments.map((segment, index) => ({
          organizationId,
          storeId: store.id,
          appointmentId: appointment.id,
          staffId: member.id,
          kind: "service" as const,
          startAt: new Date(startAt.getTime() + segment.startOffset * 60_000),
          endAt: new Date(startAt.getTime() + segment.endOffset * 60_000),
          isActive: occupies,
          sequence: index,
        })),
      });

      // Round-robin a resource of each required type at this store.
      for (const resourceTypeId of service.resourceTypeIds) {
        const pool = resources.filter(
          (resource) => resource.storeId === store.id && resource.resourceTypeId === resourceTypeId,
        );
        if (pool.length === 0) continue;

        const key = `${store.id}:${resourceTypeId}`;
        const nextIndex = (resourceCursor.get(key) ?? 0) % pool.length;
        resourceCursor.set(key, nextIndex + 1);

        const chosen = pool[nextIndex]!;
        await prisma.appointmentResource.createMany({
          data: plan.resourceSegments
            .filter((segment) => segment.resourceTypeId === resourceTypeId)
            .map((segment, index) => ({
              organizationId,
              storeId: store.id,
              appointmentId: appointment.id,
              resourceId: chosen.id,
              startAt: new Date(startAt.getTime() + segment.startOffset * 60_000),
              endAt: new Date(startAt.getTime() + segment.endOffset * 60_000),
              isActive: occupies,
              sequence: index,
            })),
        });
      }

      // Advance the cursor past this booking plus the store buffer, and round
      // up to the next quarter hour so the ledger looks natural.
      const nextStart = Math.ceil((endMinute + 15) / 15) * 15;
      cursors.set(cursorKey, nextStart);

      created.push({
        id: appointment.id,
        storeId: store.id,
        storeIndex,
        customerId: customer.id,
        staffId: member.id,
        startAt,
        endAt: new Date(startAt.getTime() + plan.customerMinutes * 60_000),
        status,
        totalAmount: plan.subtotal,
        serviceIds: [service.id],
      });
    }
  }

  // Refresh the denormalised customer counters the app maintains at runtime.
  for (const customer of customers) {
    const completed = created.filter(
      (appointment) => appointment.customerId === customer.id && appointment.status === "completed",
    );
    if (completed.length === 0) continue;

    const sorted = [...completed].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        visitCount: completed.length,
        totalSpent: completed.reduce((total, entry) => total + entry.totalAmount, 0),
        firstVisitAt: sorted[0]?.startAt,
        lastVisitAt: sorted[sorted.length - 1]?.startAt,
      },
    });
  }

  console.log(`  appointments: ${created.length}`);
  return created;
}

function pickStatus(dayOffset: number): AppointmentStatus {
  if (dayOffset < -1) {
    const roll = random();
    if (roll < 0.86) return "completed";
    if (roll < 0.95) return "cancelled";
    return "no_show";
  }
  if (dayOffset === 0) {
    const roll = random();
    if (roll < 0.3) return "completed";
    if (roll < 0.45) return "checked_in";
    return "confirmed";
  }
  return random() < 0.12 ? "pending" : "confirmed";
}

async function seedMedicalRecords(
  organizationId: string,
  templates: Map<string, { id: string; fieldIds: Map<string, string> }>,
  appointments: SeededAppointment[],
  staff: SeededStaff[],
) {
  const completed = appointments.filter((appointment) => appointment.status === "completed");
  const target = Math.min(30, completed.length);

  for (let index = 0; index < target; index += 1) {
    const appointment = completed[index]!;
    const templateKey = appointment.storeIndex === 0 ? "hair" : "nail";
    const template = templates.get(templateKey);
    if (!template) continue;

    const member = staff.find((entry) => entry.id === appointment.staffId);

    const record = await prisma.medicalRecord.create({
      data: {
        organizationId,
        storeId: appointment.storeId,
        customerId: appointment.customerId,
        appointmentId: appointment.id,
        templateId: template.id,
        staffId: member?.id ?? null,
        visitedAt: appointment.startAt,
        serviceSummary: "デモ用の施術内容メモです。",
        productsUsed: "デモ商材A / デモ商材B",
        customerRequest: "デモ用のご要望です。",
        result: "デモ用の仕上がりメモです。",
        nextProposal: "次回はデモメニューをご提案。",
        staffNote: "デモ用のスタッフメモです。",
      },
      select: { id: true },
    });

    const responses: Prisma.MedicalRecordResponseCreateManyInput[] = [];
    if (templateKey === "hair") {
      pushResponse(responses, record.id, template, "hair_type", pick(["軟毛", "普通", "硬毛"]));
      pushResponse(responses, record.id, template, "damage_level", pick(["なし", "軽度", "中度"]));
      pushResponse(responses, record.id, template, "color_formula", "デモ配合 8/1 : 6/0 = 1:1");
      pushResponse(responses, record.id, template, "processing_minutes", randomInt(15, 40));
      pushResponse(responses, record.id, template, "cut_detail", "デモ用のカット内容です。");
    } else {
      pushResponse(responses, record.id, template, "nail_condition", pick(["良好", "乾燥"]));
      pushResponse(responses, record.id, template, "nail_length", pick(["ショート", "ミディアム"]));
      pushResponse(responses, record.id, template, "nail_shape", pick(["ラウンド", "オーバル"]));
      pushResponse(responses, record.id, template, "colors_used", "デモカラー #101 / #205");
      pushResponse(responses, record.id, template, "allergy_checked", true);
    }

    if (responses.length > 0) {
      await prisma.medicalRecordResponse.createMany({ data: responses });
    }
  }

  console.log(`  medical records: ${target}`);
}

function pushResponse(
  target: Prisma.MedicalRecordResponseCreateManyInput[],
  recordId: string,
  template: { fieldIds: Map<string, string> },
  key: string,
  value: unknown,
): void {
  const fieldId = template.fieldIds.get(key);
  if (!fieldId) return;
  target.push({ recordId, fieldId, value: value as Prisma.InputJsonValue });
}

async function seedSales(organizationId: string, appointments: SeededAppointment[]) {
  const completed = appointments.filter((appointment) => appointment.status === "completed");
  const target = Math.min(50, completed.length);

  for (let index = 0; index < target; index += 1) {
    const appointment = completed[index]!;

    // Menu prices are tax-inclusive, so tax is extracted rather than added.
    const gross = appointment.totalAmount;
    const net = Math.floor((gross * 10_000) / 11_000);
    const tax = gross - net;

    await prisma.sale.create({
      data: {
        organizationId,
        storeId: appointment.storeId,
        customerId: appointment.customerId,
        appointmentId: appointment.id,
        reference: `S-${zonedDateISO(appointment.startAt, TIMEZONE).replace(/-/g, "")}-${String(
          index + 1,
        ).padStart(4, "0")}`,
        status: "completed",
        subtotalAmount: net,
        discountAmount: 0,
        taxAmount: tax,
        totalAmount: gross,
        paidAmount: gross,
        taxMode: "inclusive",
        soldAt: appointment.endAt,
        items: {
          create: {
            kind: "service",
            serviceId: appointment.serviceIds[0] ?? null,
            staffId: appointment.staffId,
            name: "施術",
            unitPrice: gross,
            quantity: 1,
            lineTotal: gross,
            taxCategory: "standard",
            taxAmount: tax,
          },
        },
        payments: {
          create: {
            method: pick(["cash", "credit_card", "qr_code", "e_money"] as const),
            amount: gross,
            paidAt: appointment.endAt,
          },
        },
      },
    });
  }

  console.log(`  sales: ${target}`);
}

async function seedSubscription(organizationId: string) {
  await prisma.subscription.create({
    data: {
      organizationId,
      planKey: "professional",
      status: "trialing",
      billingCycle: "monthly",
      trialEndsAt: new Date(Date.now() + 30 * 24 * 3600_000),
    },
  });

  await prisma.featureFlag.createMany({
    data: [
      { organizationId, key: "pos", isEnabled: false },
      { organizationId, key: "marketing", isEnabled: false },
      { organizationId, key: "multi_store", isEnabled: true },
      { organizationId, key: "api_access", isEnabled: false },
    ],
    skipDuplicates: true,
  });
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
