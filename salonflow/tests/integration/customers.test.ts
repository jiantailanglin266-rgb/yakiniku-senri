import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  anonymizeCustomer,
  createCustomer,
  findDuplicateCandidates,
  getCustomer,
  listCustomers,
  mergeCustomers,
} from "@/server/modules/customers/customer-service";
import { createAppointment } from "@/server/modules/appointments/booking-service";
import { hashPassword, verifyPassword, checkPasswordPolicy } from "@/server/auth/password";
import { hashSessionToken } from "@/server/auth/session";
import { AUDIT_ACTIONS } from "@/server/observability/audit";
import { redact } from "@/server/observability/audit";
import {
  at,
  contextFor,
  createTenant,
  destroyTenant,
  prisma,
  type TenantFixture,
} from "./helpers";

let tenant: TenantFixture;

beforeAll(async () => {
  tenant = await createTenant("cust");
});

afterAll(async () => {
  await destroyTenant(tenant);
  await prisma.$disconnect();
});

describe("customer creation and search", () => {
  it("normalises the phone number on write", async () => {
    const context = contextFor(tenant);

    const created = await createCustomer(context, {
      name: "検索 太郎",
      nameKana: "ケンサク タロウ",
      phone: "０９０－１１１１－２２２２",
      email: "  Search.Taro@Example.INVALID ",
    });

    const stored = await prisma.customer.findUniqueOrThrow({
      where: { id: created.id },
      select: { phoneNormalized: true, emailNormalized: true },
    });

    expect(stored.phoneNormalized).toBe("+819011112222");
    expect(stored.emailNormalized).toBe("search.taro@example.invalid");
  });

  it("finds a customer by a differently formatted phone number", async () => {
    const context = contextFor(tenant);

    await createCustomer(context, { name: "電話 花子", phone: "090-3333-4444" });

    const result = await listCustomers(context, { search: "09033334444" });
    expect(result.items.some((customer) => customer.name === "電話 花子")).toBe(true);
  });

  it("writes an audit entry when a customer record is opened", async () => {
    const context = contextFor(tenant);

    await getCustomer(context, tenant.customerIds[0]!);

    const entry = await prisma.auditLog.findFirst({
      where: {
        organizationId: tenant.organizationId,
        action: AUDIT_ACTIONS.CUSTOMER_VIEWED,
        entityId: tenant.customerIds[0]!,
      },
      orderBy: { createdAt: "desc" },
    });

    expect(entry).not.toBeNull();
    expect(entry?.actorId).toBe(tenant.userId);
  });
});

describe("duplicate detection and merge", () => {
  it("suggests a record sharing a phone number and name", async () => {
    const context = contextFor(tenant);

    const first = await createCustomer(context, {
      name: "重複 candidate",
      nameKana: "チョウフク",
      phone: "090-5555-6666",
    });
    await createCustomer(context, {
      name: "重複 candidate",
      nameKana: "チョウフク",
      phone: "090-5555-6666",
    });

    const candidates = await findDuplicateCandidates(context, first.id);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]?.score).toBeGreaterThanOrEqual(60);
  });

  it("moves history to the surviving record and flags the absorbed one", async () => {
    const context = contextFor(tenant);

    const target = await createCustomer(context, { name: "統合先", phone: "090-7777-0001" });
    const source = await createCustomer(context, { name: "統合元", phone: "090-7777-0002" });

    const appointment = await createAppointment({
      organizationId: tenant.organizationId,
      storeId: tenant.storeId,
      customerId: source.id,
      serviceIds: [tenant.serviceId],
      staffId: tenant.staffIds[0]!,
      startAt: at(11 * 60),
      source: "staff_entry",
      now: at(9 * 60),
    });

    await mergeCustomers(context, target.id, source.id);

    const moved = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointment.id },
      select: { customerId: true },
    });
    expect(moved.customerId).toBe(target.id);

    const absorbed = await prisma.customer.findUniqueOrThrow({
      where: { id: source.id },
      select: { mergedIntoId: true, deletedAt: true },
    });
    expect(absorbed.mergedIntoId).toBe(target.id);
    expect(absorbed.deletedAt).not.toBeNull();

    // The merge is recorded with a full snapshot, so it can be investigated.
    const history = await prisma.customerMergeHistory.findFirst({
      where: { targetCustomerId: target.id, sourceCustomerId: source.id },
    });
    expect(history).not.toBeNull();
    expect(history?.sourceSnapshot).toBeTruthy();
  });

  it("refuses to merge a customer into itself", async () => {
    const context = contextFor(tenant);
    await expect(
      mergeCustomers(context, tenant.customerIds[0]!, tenant.customerIds[0]!),
    ).rejects.toThrow();
  });

  it("hides merged records from the list", async () => {
    const context = contextFor(tenant);

    const target = await createCustomer(context, { name: "残る側" });
    const source = await createCustomer(context, { name: "消える側" });
    await mergeCustomers(context, target.id, source.id);

    const result = await listCustomers(context, { search: "消える側" });
    expect(result.items).toHaveLength(0);
  });
});

describe("erasure request", () => {
  it("overwrites identifying fields but keeps the accounting link", async () => {
    const context = contextFor(tenant);

    const customer = await createCustomer(context, {
      name: "削除 依頼",
      phone: "090-9999-0001",
      email: "erase@demo.example.invalid",
    });

    const appointment = await createAppointment({
      organizationId: tenant.organizationId,
      storeId: tenant.storeId,
      customerId: customer.id,
      serviceIds: [tenant.serviceId],
      staffId: tenant.staffIds[1]!,
      startAt: at(13 * 60),
      source: "staff_entry",
      now: at(9 * 60),
    });

    await anonymizeCustomer(context, customer.id, "本人からの削除依頼");

    const after = await prisma.customer.findUniqueOrThrow({
      where: { id: customer.id },
      select: {
        name: true,
        phone: true,
        phoneNormalized: true,
        email: true,
        anonymizedAt: true,
        deletedAt: true,
      },
    });

    expect(after.name).toBe("（削除済み顧客）");
    expect(after.phone).toBeNull();
    expect(after.phoneNormalized).toBeNull();
    expect(after.email).toBeNull();
    expect(after.anonymizedAt).not.toBeNull();

    // The appointment survives — bookkeeping obligations outlive the profile.
    const survivingAppointment = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      select: { id: true },
    });
    expect(survivingAppointment).not.toBeNull();
  });
});

describe("password hashing", () => {
  it("round-trips a password", async () => {
    const hash = await hashPassword("Correct-Horse-Battery-1");
    expect(await verifyPassword("Correct-Horse-Battery-1", hash)).toBe(true);
    expect(await verifyPassword("wrong-password-entirely", hash)).toBe(false);
  });

  it("produces a different hash each time", async () => {
    const a = await hashPassword("Same-Password-123");
    const b = await hashPassword("Same-Password-123");
    expect(a).not.toBe(b);
    expect(await verifyPassword("Same-Password-123", a)).toBe(true);
    expect(await verifyPassword("Same-Password-123", b)).toBe(true);
  });

  it("returns false rather than throwing on a malformed hash", async () => {
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
    expect(await verifyPassword("anything", "")).toBe(false);
  });

  it("normalises unicode so a composed and decomposed password match", async () => {
    const composed = "パスワードabc123";
    const hash = await hashPassword(composed);
    expect(await verifyPassword(composed.normalize("NFD"), hash)).toBe(true);
  });

  it("enforces the minimum policy", () => {
    expect(checkPasswordPolicy("short1").ok).toBe(false);
    expect(checkPasswordPolicy("passwordpassword1").ok).toBe(false); // too common
    expect(checkPasswordPolicy("Sufficiently-Long-1").ok).toBe(true);
  });
});

describe("session tokens", () => {
  it("stores only a hash of the token", () => {
    const token = "a-raw-session-token";
    const hash = hashSessionToken(token);

    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(token);
    expect(hashSessionToken(token)).toBe(hash);
  });
});

describe("audit redaction", () => {
  it("strips secrets regardless of nesting", () => {
    const redacted = redact({
      name: "山田",
      passwordHash: "scrypt$…",
      nested: { accessToken: "abc", cardNumber: "4242424242424242", keep: "visible" },
    }) as Record<string, unknown>;

    expect(redacted.name).toBe("山田");
    expect(redacted.passwordHash).toBe("[redacted]");

    const nested = redacted.nested as Record<string, unknown>;
    expect(nested.accessToken).toBe("[redacted]");
    expect(nested.cardNumber).toBe("[redacted]");
    expect(nested.keep).toBe("visible");
  });

  it("truncates an oversized string instead of storing it whole", () => {
    const long = "x".repeat(5000);
    const redacted = redact({ note: long }) as Record<string, unknown>;
    expect(String(redacted.note).length).toBeLessThan(long.length);
  });
});
