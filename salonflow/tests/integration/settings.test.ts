import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AuthorizationError } from "@/server/auth/context";
import { getAvailability } from "@/server/modules/appointments/availability-service";
import {
  createService,
  getService,
  updateService,
} from "@/server/modules/settings/service-catalog";
import { getSetupStatus } from "@/server/modules/settings/setup-status";
import {
  createStaff,
  saveShift,
  updateStaff,
  archiveStaff,
} from "@/server/modules/settings/staff-service";
import {
  SettingsValidationError,
  updateBusinessHours,
  updateStoreSettings,
} from "@/server/modules/settings/store-service";
import {
  contextFor,
  createTenant,
  destroyTenant,
  prisma,
  TEST_DATE,
  TIMEZONE,
  type TenantFixture,
} from "./helpers";

/**
 * Master data, against a real database.
 *
 * The headline test is `setup path`: it starts from the state `bootstrap`
 * leaves behind — a store with every day closed and no roster — and walks the
 * screens an operator would use, asserting availability goes from empty to
 * bookable. Until Phase 2 that path did not exist, so a provisioned tenant was
 * unusable without direct SQL.
 */

let tenant: TenantFixture;
let other: TenantFixture;

const CLOSED_WEEK = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  isClosed: true,
  openMinute: 600,
  closeMinute: 1140,
  breakStartMinute: null,
  breakEndMinute: null,
}));

const OPEN_WEEK = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  isClosed: false,
  openMinute: 600, // 10:00
  closeMinute: 1140, // 19:00
  breakStartMinute: null,
  breakEndMinute: null,
}));

beforeAll(async () => {
  tenant = await createTenant("settings");
  other = await createTenant("settings-other");
});

afterAll(async () => {
  await destroyTenant(tenant);
  await destroyTenant(other);
  await prisma.$disconnect();
});

describe("updateBusinessHours", () => {
  it("replaces the whole week and reports a permanently closed store", async () => {
    const context = contextFor(tenant);

    const result = await updateBusinessHours(context, tenant.storeId, CLOSED_WEEK);
    expect(result.permanentlyClosed).toBe(true);

    const stored = await prisma.storeBusinessHour.findMany({
      where: { storeId: tenant.storeId },
    });
    expect(stored).toHaveLength(7);
    expect(stored.every((row) => row.isClosed)).toBe(true);

    const reopened = await updateBusinessHours(context, tenant.storeId, OPEN_WEEK);
    expect(reopened.permanentlyClosed).toBe(false);
  });

  it("rejects a week that is not seven days", async () => {
    await expect(
      updateBusinessHours(contextFor(tenant), tenant.storeId, OPEN_WEEK.slice(0, 3)),
    ).rejects.toThrow(SettingsValidationError);
  });

  it("rejects a close before the open without writing anything", async () => {
    const context = contextFor(tenant);

    const broken = OPEN_WEEK.map((hour) =>
      hour.dayOfWeek === 3 ? { ...hour, closeMinute: 540 } : hour,
    );

    await expect(updateBusinessHours(context, tenant.storeId, broken)).rejects.toThrow(
      SettingsValidationError,
    );

    // The valid days in the same submission must not have been applied either.
    const wednesday = await prisma.storeBusinessHour.findUnique({
      where: { storeId_dayOfWeek: { storeId: tenant.storeId, dayOfWeek: 3 } },
    });
    expect(wednesday?.closeMinute).toBe(1140);
  });

  it("refuses another tenant's store", async () => {
    await expect(updateBusinessHours(contextFor(tenant), other.storeId, OPEN_WEEK)).rejects.toThrow(
      AuthorizationError,
    );
  });

  it("writes an audit entry", async () => {
    const context = contextFor(tenant);
    await updateBusinessHours(context, tenant.storeId, OPEN_WEEK);

    const log = await prisma.auditLog.findFirst({
      where: {
        organizationId: tenant.organizationId,
        entityType: "StoreBusinessHour",
        entityId: tenant.storeId,
      },
      orderBy: { createdAt: "desc" },
    });

    expect(log).not.toBeNull();
    expect(log?.action).toBe("settings.changed");
  });
});

describe("updateStoreSettings", () => {
  const base = {
    name: "設定テスト店",
    phone: "03-0000-0000",
    postalCode: null,
    prefecture: null,
    city: null,
    addressLine: null,
    approvalMode: "instant" as const,
    slotIntervalMinutes: 30,
    bookingCutoffMinutes: 0,
    minAdvanceMinutes: 0,
    // The fixture uses 3650 to keep other tests clear of cutoffs, but the
    // product caps the booking window at a year — a longer one is a typo.
    maxAdvanceDays: 365,
    bufferMinutes: 0,
    cancelDeadlineHours: 24,
  };

  it("saves the profile and policy", async () => {
    await updateStoreSettings(contextFor(tenant), tenant.storeId, base);

    const store = await prisma.store.findUnique({ where: { id: tenant.storeId } });
    expect(store?.name).toBe("設定テスト店");
    expect(store?.phone).toBe("03-0000-0000");
  });

  it("rejects an unusable slot interval", async () => {
    await expect(
      updateStoreSettings(contextFor(tenant), tenant.storeId, {
        ...base,
        slotIntervalMinutes: 1,
      }),
    ).rejects.toThrow(SettingsValidationError);
  });

  it("refuses another tenant's store", async () => {
    await expect(updateStoreSettings(contextFor(tenant), other.storeId, base)).rejects.toThrow(
      AuthorizationError,
    );
  });
});

describe("service catalog", () => {
  async function categoryId(fixture: TenantFixture): Promise<string> {
    const category = await prisma.serviceCategory.findFirst({
      where: { organizationId: fixture.organizationId },
      select: { id: true },
    });
    if (!category) throw new Error("fixture is missing a service category");
    return category.id;
  }

  it("creates a service with its staff assignments", async () => {
    const context = contextFor(tenant);

    const serviceId = await createService(context, {
      categoryId: await categoryId(tenant),
      storeId: tenant.storeId,
      name: "テストカット",
      description: null,
      price: 5500,
      durationMinutes: 60,
      prepMinutes: 0,
      cleanupMinutes: 0,
      unattendedStartMinute: null,
      unattendedMinutes: null,
      isOnlineBookable: true,
      allowsDesignation: true,
      isActive: true,
      displayOrder: 0,
      staffIds: [tenant.staffIds[0]!],
    });

    const loaded = await getService(context, serviceId);
    expect(loaded.name).toBe("テストカット");
    expect(loaded.staffIds).toEqual([tenant.staffIds[0]]);
  });

  it("replaces the staff assignment set rather than merging it", async () => {
    const context = contextFor(tenant);
    const category = await categoryId(tenant);

    const serviceId = await createService(context, {
      categoryId: category,
      storeId: tenant.storeId,
      name: "担当入れ替えテスト",
      description: null,
      price: 3300,
      durationMinutes: 30,
      prepMinutes: 0,
      cleanupMinutes: 0,
      unattendedStartMinute: null,
      unattendedMinutes: null,
      isOnlineBookable: true,
      allowsDesignation: true,
      isActive: true,
      displayOrder: 0,
      staffIds: [tenant.staffIds[0]!, tenant.staffIds[1]!],
    });

    await updateService(context, serviceId, {
      categoryId: category,
      storeId: tenant.storeId,
      name: "担当入れ替えテスト",
      description: null,
      price: 3300,
      durationMinutes: 30,
      prepMinutes: 0,
      cleanupMinutes: 0,
      unattendedStartMinute: null,
      unattendedMinutes: null,
      isOnlineBookable: true,
      allowsDesignation: true,
      isActive: true,
      displayOrder: 0,
      staffIds: [tenant.staffIds[1]!],
    });

    const loaded = await getService(context, serviceId);
    // An operator who unticks someone expects them gone, not merged back in.
    expect(loaded.staffIds).toEqual([tenant.staffIds[1]]);
  });

  it("refuses a category belonging to another organization", async () => {
    await expect(
      createService(contextFor(tenant), {
        categoryId: await categoryId(other),
        storeId: tenant.storeId,
        name: "越境カテゴリ",
        description: null,
        price: 1000,
        durationMinutes: 30,
        prepMinutes: 0,
        cleanupMinutes: 0,
        unattendedStartMinute: null,
        unattendedMinutes: null,
        isOnlineBookable: true,
        allowsDesignation: true,
        isActive: true,
        displayOrder: 0,
        staffIds: [],
      }),
    ).rejects.toThrow(SettingsValidationError);
  });

  it("refuses staff belonging to another organization", async () => {
    await expect(
      createService(contextFor(tenant), {
        categoryId: await categoryId(tenant),
        storeId: tenant.storeId,
        name: "越境スタッフ",
        description: null,
        price: 1000,
        durationMinutes: 30,
        prepMinutes: 0,
        cleanupMinutes: 0,
        unattendedStartMinute: null,
        unattendedMinutes: null,
        isOnlineBookable: true,
        allowsDesignation: true,
        isActive: true,
        displayOrder: 0,
        staffIds: [other.staffIds[0]!],
      }),
    ).rejects.toThrow(SettingsValidationError);
  });

  it("refuses a processing gap that runs past the end of the service", async () => {
    await expect(
      createService(contextFor(tenant), {
        categoryId: await categoryId(tenant),
        storeId: tenant.storeId,
        name: "壊れたカラー",
        description: null,
        price: 9900,
        durationMinutes: 60,
        prepMinutes: 0,
        cleanupMinutes: 0,
        unattendedStartMinute: 45,
        unattendedMinutes: 30,
        isOnlineBookable: true,
        allowsDesignation: true,
        isActive: true,
        displayOrder: 0,
        staffIds: [],
      }),
    ).rejects.toThrow(SettingsValidationError);
  });

  it("refuses to read another tenant's service", async () => {
    await expect(getService(contextFor(tenant), other.serviceId)).rejects.toThrow();
  });
});

describe("staff", () => {
  it("creates a staff member and links the home store", async () => {
    const context = contextFor(tenant);

    const staffId = await createStaff(context, {
      name: "新人 太郎",
      nameKana: "しんじん たろう",
      displayName: "たろう",
      title: null,
      employmentType: "part_time",
      designationFee: 0,
      commissionBps: null,
      maxConcurrent: 1,
      maxDailyAppointments: null,
      isBookable: true,
      isPubliclyVisible: true,
      displayOrder: 10,
      storeIds: [tenant.storeId],
    });

    const links = await prisma.staffStore.findMany({ where: { staffId } });
    expect(links).toHaveLength(1);
    expect(links[0]?.isPrimary).toBe(true);
  });

  it("refuses a store the caller cannot reach", async () => {
    await expect(
      createStaff(contextFor(tenant), {
        name: "越境 太郎",
        nameKana: null,
        displayName: "越境",
        title: null,
        employmentType: "full_time",
        designationFee: 0,
        commissionBps: null,
        maxConcurrent: 1,
        maxDailyAppointments: null,
        isBookable: true,
        isPubliclyVisible: true,
        displayOrder: 0,
        storeIds: [other.storeId],
      }),
    ).rejects.toThrow(AuthorizationError);
  });

  it("requires at least one store", async () => {
    await expect(
      createStaff(contextFor(tenant), {
        name: "無所属 太郎",
        nameKana: null,
        displayName: "無所属",
        title: null,
        employmentType: "full_time",
        designationFee: 0,
        commissionBps: null,
        maxConcurrent: 1,
        maxDailyAppointments: null,
        isBookable: true,
        isPubliclyVisible: true,
        displayOrder: 0,
        storeIds: [],
      }),
    ).rejects.toThrow(SettingsValidationError);
  });

  it("reports remaining appointments when archiving rather than cancelling them", async () => {
    const context = contextFor(tenant);

    const staffId = await createStaff(context, {
      name: "退職 花子",
      nameKana: null,
      displayName: "はなこ",
      title: null,
      employmentType: "full_time",
      designationFee: 0,
      commissionBps: null,
      maxConcurrent: 1,
      maxDailyAppointments: null,
      isBookable: true,
      isPubliclyVisible: true,
      displayOrder: 0,
      storeIds: [tenant.storeId],
    });

    const result = await archiveStaff(context, staffId);
    expect(result.upcomingAppointments).toBe(0);

    const row = await prisma.staff.findUnique({ where: { id: staffId } });
    expect(row?.deletedAt).not.toBeNull();
    expect(row?.isBookable).toBe(false);
  });

  it("keeps assignments to stores outside the caller's scope", async () => {
    // A branch manager editing a stylist must not silently drop that person
    // from a sibling branch's roster.
    const context = contextFor(tenant);

    const staffId = await createStaff(context, {
      name: "兼務 一郎",
      nameKana: null,
      displayName: "いちろう",
      title: null,
      employmentType: "full_time",
      designationFee: 0,
      commissionBps: null,
      maxConcurrent: 1,
      maxDailyAppointments: null,
      isBookable: true,
      isPubliclyVisible: true,
      displayOrder: 0,
      storeIds: [tenant.storeId],
    });

    // A second store in the same organization, deliberately outside the
    // context's `accessibleStores`.
    const hidden = await prisma.store.create({
      data: {
        organizationId: tenant.organizationId,
        slug: `hidden-${staffId.slice(-8)}`,
        name: "見えない店",
        industry: "hair",
        timezone: TIMEZONE,
      },
      select: { id: true },
    });
    await prisma.staffStore.create({ data: { staffId, storeId: hidden.id } });

    await updateStaff(context, staffId, {
      name: "兼務 一郎",
      nameKana: null,
      displayName: "いちろう",
      title: null,
      employmentType: "full_time",
      designationFee: 0,
      commissionBps: null,
      maxConcurrent: 1,
      maxDailyAppointments: null,
      isBookable: true,
      isPubliclyVisible: true,
      displayOrder: 0,
      storeIds: [tenant.storeId],
    });

    const links = await prisma.staffStore.findMany({ where: { staffId } });
    expect(links.map((row) => row.storeId).sort()).toEqual([tenant.storeId, hidden.id].sort());
  });
});

describe("shifts", () => {
  it("saves a shift and flags one outside opening hours", async () => {
    const context = contextFor(tenant);
    await updateBusinessHours(context, tenant.storeId, OPEN_WEEK);

    const inside = await saveShift(context, {
      staffId: tenant.staffIds[0]!,
      storeId: tenant.storeId,
      date: TEST_DATE,
      startMinute: 600,
      endMinute: 1080,
      breakStartMinute: null,
      breakEndMinute: null,
      note: null,
    });
    expect(inside.outsideBusinessHours).toBe(false);

    const outside = await saveShift(context, {
      staffId: tenant.staffIds[0]!,
      storeId: tenant.storeId,
      date: TEST_DATE,
      // 06:00–09:00, entirely before a 10:00 opening.
      startMinute: 360,
      endMinute: 540,
      breakStartMinute: null,
      breakEndMinute: null,
      note: null,
    });
    expect(outside.outsideBusinessHours).toBe(true);
  });

  it("stores the calendar day the operator typed", async () => {
    const context = contextFor(tenant);

    await saveShift(context, {
      staffId: tenant.staffIds[1]!,
      storeId: tenant.storeId,
      date: TEST_DATE,
      startMinute: 600,
      endMinute: 1080,
      breakStartMinute: null,
      breakEndMinute: null,
      note: null,
    });

    // Scoped to the date under test: the fixture rosters the surrounding
    // week too, so an unfiltered lookup returns someone else's row.
    const shift = await prisma.staffShift.findUnique({
      where: {
        staffId_storeId_date: {
          staffId: tenant.staffIds[1]!,
          storeId: tenant.storeId,
          date: new Date(`${TEST_DATE}T00:00:00.000Z`),
        },
      },
    });
    expect(shift).not.toBeNull();
    expect(shift?.date.toISOString().slice(0, 10)).toBe(TEST_DATE);
    expect(shift?.startMinute).toBe(600);
  });

  it("refuses a staff member from another organization", async () => {
    await expect(
      saveShift(contextFor(tenant), {
        staffId: other.staffIds[0]!,
        storeId: tenant.storeId,
        date: TEST_DATE,
        startMinute: 600,
        endMinute: 1080,
        breakStartMinute: null,
        breakEndMinute: null,
        note: null,
      }),
    ).rejects.toThrow(AuthorizationError);
  });

  it("refuses a break outside the shift", async () => {
    await expect(
      saveShift(contextFor(tenant), {
        staffId: tenant.staffIds[0]!,
        storeId: tenant.storeId,
        date: TEST_DATE,
        startMinute: 600,
        endMinute: 1080,
        breakStartMinute: 540,
        breakEndMinute: 600,
        note: null,
      }),
    ).rejects.toThrow(SettingsValidationError);
  });
});

describe("setup path", () => {
  /**
   * From a freshly bootstrapped store to a bookable one.
   *
   * Each step is one screen an operator uses. The assertion that matters is
   * the last one: real availability, computed by the same code the public
   * booking page calls.
   */
  it("takes a closed, empty store to real availability", async () => {
    const fresh = await createTenant("setup-path");

    try {
      const context = contextFor(fresh);

      // The state `bootstrap` leaves behind: closed all week, no roster.
      await updateBusinessHours(context, fresh.storeId, CLOSED_WEEK);
      await prisma.staffShift.deleteMany({ where: { storeId: fresh.storeId } });

      const before = await getAvailability(fresh.organizationId, {
        storeId: fresh.storeId,
        dateISO: TEST_DATE,
        serviceIds: [fresh.serviceId],
        now: new Date("2027-01-01T00:00:00.000Z"),
      });
      expect(before?.storeClosed).toBe(true);
      expect(before?.slots ?? []).toHaveLength(0);

      const initial = await getSetupStatus(context, fresh.storeId);
      expect(initial.hasOpenDay).toBe(false);
      expect(initial.hasUpcomingShift).toBe(false);
      expect(initial.complete).toBe(false);

      // 1. Open the week.
      await updateBusinessHours(context, fresh.storeId, OPEN_WEEK);

      // Hours alone are not enough — nobody is rostered yet.
      const afterHours = await getAvailability(fresh.organizationId, {
        storeId: fresh.storeId,
        dateISO: TEST_DATE,
        serviceIds: [fresh.serviceId],
        now: new Date("2027-01-01T00:00:00.000Z"),
      });
      expect(afterHours?.storeClosed).toBe(false);
      expect(afterHours?.slots ?? []).toHaveLength(0);

      // 2. Add a stylist.
      const staffId = await createStaff(context, {
        name: "設定 太郎",
        nameKana: null,
        displayName: "たろう",
        title: null,
        employmentType: "full_time",
        designationFee: 0,
        commissionBps: null,
        maxConcurrent: 1,
        maxDailyAppointments: null,
        isBookable: true,
        isPubliclyVisible: true,
        displayOrder: 0,
        storeIds: [fresh.storeId],
      });

      // 3. Add a menu item they can perform.
      const category = await prisma.serviceCategory.findFirstOrThrow({
        where: { organizationId: fresh.organizationId },
        select: { id: true },
      });

      const serviceId = await createService(context, {
        categoryId: category.id,
        storeId: fresh.storeId,
        name: "セットアップ・カット",
        description: null,
        price: 4400,
        durationMinutes: 60,
        prepMinutes: 0,
        cleanupMinutes: 0,
        unattendedStartMinute: null,
        unattendedMinutes: null,
        isOnlineBookable: true,
        allowsDesignation: true,
        isActive: true,
        displayOrder: 0,
        staffIds: [staffId],
      });

      // 4. Roster them.
      const shift = await saveShift(context, {
        staffId,
        storeId: fresh.storeId,
        date: TEST_DATE,
        startMinute: 600, // 10:00
        endMinute: 1080, // 18:00
        breakStartMinute: null,
        breakEndMinute: null,
        note: null,
      });
      expect(shift.outsideBusinessHours).toBe(false);

      const after = await getAvailability(fresh.organizationId, {
        storeId: fresh.storeId,
        dateISO: TEST_DATE,
        serviceIds: [serviceId],
        now: new Date("2027-01-01T00:00:00.000Z"),
      });

      expect(after?.storeClosed).toBe(false);
      expect(after?.slots.length ?? 0).toBeGreaterThan(0);

      // A 60-minute service on a 30-minute grid inside a 10:00–18:00 shift
      // starts no earlier than 10:00 and no later than 17:00.
      const starts = (after?.slots ?? []).map((slot) => slot.startAt.toISOString());
      expect(starts[0]).toBe(new Date("2027-06-07T01:00:00.000Z").toISOString());
    } finally {
      await destroyTenant(fresh);
    }
  });

  it("reports each missing piece independently", async () => {
    const fresh = await createTenant("setup-status");

    try {
      const context = contextFor(fresh);
      await prisma.staffShift.deleteMany({ where: { storeId: fresh.storeId } });

      const status = await getSetupStatus(context, fresh.storeId);

      // The fixture ships hours, staff and services; only the roster is
      // missing, and the checklist must say exactly that rather than "not
      // ready".
      expect(status.hasOpenDay).toBe(true);
      expect(status.hasStaff).toBe(true);
      expect(status.hasService).toBe(true);
      expect(status.hasUpcomingShift).toBe(false);
      expect(status.complete).toBe(false);
    } finally {
      await destroyTenant(fresh);
    }
  });

  it("refuses a setup status read for another tenant's store", async () => {
    await expect(getSetupStatus(contextFor(tenant), other.storeId)).rejects.toThrow(
      AuthorizationError,
    );
  });
});
