import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AuthorizationError } from "@/server/auth/context";
import { assertTenant, assertTenantStore, storeScope } from "@/server/db/tenant";
import {
  getCustomer,
  listCustomers,
  mergeCustomers,
} from "@/server/modules/customers/customer-service";
import { getLedger } from "@/server/modules/appointments/ledger-service";
import { getRecord } from "@/server/modules/medical-records/record-service";
import { createAppointment } from "@/server/modules/appointments/booking-service";
import { saveRecord } from "@/server/modules/medical-records/record-service";
import { ROLE_CATALOG, PERMISSIONS } from "@/server/permissions/catalog";
import {
  at,
  contextFor,
  createTenant,
  destroyTenant,
  prisma,
  TEST_DATE,
  type TenantFixture,
} from "./helpers";

/**
 * Tenant isolation and authorisation.
 *
 * Risk R-01 in the design document: one salon seeing another salon's
 * customers or charts is the worst thing this product could do. These tests
 * attempt the crossing deliberately, from a context that is otherwise fully
 * privileged within its own tenant.
 */

let alpha: TenantFixture;
let beta: TenantFixture;

beforeAll(async () => {
  alpha = await createTenant("alpha");
  beta = await createTenant("beta");
});

afterAll(async () => {
  await destroyTenant(alpha);
  await destroyTenant(beta);
  await prisma.$disconnect();
});

describe("customer directory", () => {
  it("lists only the caller's own customers", async () => {
    const context = contextFor(alpha);
    const result = await listCustomers(context);

    const ids = result.items.map((customer) => customer.id);
    expect(ids).toEqual(expect.arrayContaining(alpha.customerIds));
    for (const foreignId of beta.customerIds) {
      expect(ids).not.toContain(foreignId);
    }
  });

  it("returns null for a customer id belonging to another organization", async () => {
    const context = contextFor(alpha);
    const foreign = await getCustomer(context, beta.customerIds[0]!);
    expect(foreign).toBeNull();
  });

  it("refuses to merge a customer across organizations", async () => {
    const context = contextFor(alpha);
    await expect(
      mergeCustomers(context, alpha.customerIds[0]!, beta.customerIds[0]!),
    ).rejects.toThrow();

    // The foreign record must be untouched.
    const untouched = await prisma.customer.findUniqueOrThrow({
      where: { id: beta.customerIds[0]! },
      select: { mergedIntoId: true, deletedAt: true },
    });
    expect(untouched.mergedIntoId).toBeNull();
    expect(untouched.deletedAt).toBeNull();
  });
});

describe("appointment ledger", () => {
  it("refuses a store the caller cannot access", async () => {
    const context = contextFor(alpha);

    await expect(
      getLedger(context, { storeId: beta.storeId, fromDateISO: TEST_DATE, days: 1 }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("shows only the caller's own appointments", async () => {
    await createAppointment({
      organizationId: alpha.organizationId,
      storeId: alpha.storeId,
      customerId: alpha.customerIds[0]!,
      serviceIds: [alpha.serviceId],
      staffId: alpha.staffIds[0]!,
      startAt: at(10 * 60),
      source: "staff_entry",
      now: at(9 * 60),
    });

    await createAppointment({
      organizationId: beta.organizationId,
      storeId: beta.storeId,
      customerId: beta.customerIds[0]!,
      serviceIds: [beta.serviceId],
      staffId: beta.staffIds[0]!,
      startAt: at(10 * 60),
      source: "staff_entry",
      now: at(9 * 60),
    });

    const ledger = await getLedger(contextFor(alpha), {
      storeId: alpha.storeId,
      fromDateISO: TEST_DATE,
      days: 1,
    });

    expect(ledger).not.toBeNull();
    expect(ledger!.entries.length).toBeGreaterThan(0);
    for (const entry of ledger!.entries) {
      expect(alpha.customerIds).toContain(entry.customer?.id);
    }
  });
});

describe("medical records", () => {
  it("does not return another organization's chart", async () => {
    const betaContext = contextFor(beta);

    const template = await prisma.medicalRecordTemplate.create({
      data: {
        organizationId: beta.organizationId,
        storeId: beta.storeId,
        industry: "hair",
        name: "beta テンプレート",
        fields: {
          create: { key: "memo", label: "メモ", type: "text", displayOrder: 0 },
        },
      },
      select: { id: true },
    });

    const record = await saveRecord(betaContext, {
      customerId: beta.customerIds[0]!,
      storeId: beta.storeId,
      templateId: template.id,
      visitedAt: at(10 * 60),
      serviceSummary: "beta の施術",
      responses: {},
    });

    // The owner of alpha, holding every permission in their own tenant, still
    // cannot read it.
    const leaked = await getRecord(contextFor(alpha), record.id);
    expect(leaked).toBeNull();

    // And can read it from its own tenant, proving the test is not vacuous.
    const visible = await getRecord(betaContext, record.id);
    expect(visible?.id).toBe(record.id);
  });

  it("refuses a template belonging to another organization", async () => {
    const template = await prisma.medicalRecordTemplate.findFirstOrThrow({
      where: { organizationId: beta.organizationId },
      select: { id: true },
    });

    await expect(
      saveRecord(contextFor(alpha), {
        customerId: alpha.customerIds[0]!,
        storeId: alpha.storeId,
        templateId: template.id,
        visitedAt: at(10 * 60),
        responses: {},
      }),
    ).rejects.toThrow();
  });
});

describe("tenant guard helpers", () => {
  it("storeScope rejects an inaccessible store id", () => {
    const context = contextFor(alpha);
    expect(() => storeScope(context, beta.storeId)).toThrow(AuthorizationError);
  });

  it("storeScope narrows to accessible stores when none is given", () => {
    const context = contextFor(alpha);
    const scope = storeScope(context);
    expect(scope.organizationId).toBe(alpha.organizationId);
    expect(scope.storeId).toEqual({ in: [alpha.storeId] });
  });

  it("assertTenant rejects a row from another organization", () => {
    const context = contextFor(alpha);
    expect(() =>
      assertTenant(context, { organizationId: beta.organizationId }),
    ).toThrow(AuthorizationError);
  });

  it("assertTenant gives the same error for a missing row as for a foreign one", () => {
    const context = contextFor(alpha);

    const missing = captureMessage(() => assertTenant(context, null));
    const foreign = captureMessage(() =>
      assertTenant(context, { organizationId: beta.organizationId }),
    );

    // Identical wording: "exists but is not yours" must not be distinguishable
    // from "does not exist".
    expect(missing).toBe(foreign);
  });

  it("assertTenantStore rejects a store the caller cannot see", () => {
    const context = contextFor(alpha);
    expect(() =>
      assertTenantStore(context, {
        organizationId: alpha.organizationId,
        storeId: beta.storeId,
      }),
    ).toThrow(AuthorizationError);
  });
});

describe("permission enforcement", () => {
  it("refuses to list customers without customer.read", async () => {
    const viewerPermissions = new Set(
      ROLE_CATALOG.find((role) => role.key === "accountant")?.permissions ?? [],
    );
    expect(viewerPermissions.has(PERMISSIONS.CUSTOMER_READ)).toBe(false);

    const context = contextFor(alpha, { globalPermissions: viewerPermissions });

    await expect(listCustomers(context)).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("refuses to read a chart without medical_record.read", async () => {
    const receptionist = new Set(
      ROLE_CATALOG.find((role) => role.key === "marketer")?.permissions ?? [],
    );
    const context = contextFor(alpha, { globalPermissions: receptionist });

    await expect(getRecord(context, "any-id")).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("masks contact details for a role configured to mask them", async () => {
    const context = contextFor(alpha, {
      masks: {
        customerPhone: true,
        customerEmail: true,
        salesAmount: false,
        medicalPhoto: true,
        staffCompensation: true,
      },
    });

    const result = await listCustomers(context);
    const customer = result.items.find((entry) => entry.id === alpha.customerIds[0]);

    expect(customer?.phone).toMatch(/^\*+\d{2}$/);
    expect(customer?.email).toContain("*");
  });
});

function captureMessage(fn: () => unknown): string {
  try {
    fn();
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
