import { describe, expect, it } from "vitest";

import {
  PERMISSIONS,
  PERMISSION_CATALOG,
  ROLE_CATALOG,
  findRoleDefinition,
} from "@/server/permissions/catalog";
import {
  APPOINTMENT_STATUSES,
  canTransition,
  InvalidTransitionError,
  assertTransition,
  isTerminal,
  nextStatuses,
  occupiesCalendar,
  timestampFieldFor,
} from "@/server/modules/appointments/state-machine";

describe("permission catalogue", () => {
  it("documents every permission constant", () => {
    const documented = new Set(PERMISSION_CATALOG.map((entry) => entry.key));
    for (const key of Object.values(PERMISSIONS)) {
      expect(documented.has(key)).toBe(true);
    }
  });

  it("only grants permissions that exist", () => {
    const known = new Set(Object.values(PERMISSIONS));
    for (const role of ROLE_CATALOG) {
      for (const permission of role.permissions) {
        expect(known.has(permission)).toBe(true);
      }
    }
  });

  it("gives the organization owner everything", () => {
    const owner = findRoleDefinition("org_owner");
    expect(owner?.permissions).toHaveLength(Object.values(PERMISSIONS).length);
  });

  it("withholds medical records from the platform operator", () => {
    const platform = findRoleDefinition("platform_admin");
    expect(platform?.permissions).not.toContain(PERMISSIONS.MEDICAL_RECORD_READ);
    expect(platform?.permissions).not.toContain(PERMISSIONS.MEDICAL_RECORD_WRITE);
  });

  it("restricts rank-and-file staff to their own records", () => {
    expect(findRoleDefinition("staff")?.restrictToOwnRecords).toBe(true);
    expect(findRoleDefinition("contractor")?.restrictToOwnRecords).toBe(true);
    expect(findRoleDefinition("store_manager")?.restrictToOwnRecords).toBe(false);
  });

  it("never lets a read-only role write", () => {
    const viewer = findRoleDefinition("viewer");
    expect(viewer?.permissions).not.toContain(PERMISSIONS.RESERVATION_WRITE);
    expect(viewer?.permissions).not.toContain(PERMISSIONS.CUSTOMER_WRITE);
    expect(viewer?.permissions).not.toContain(PERMISSIONS.SALES_REFUND);
  });

  it("keeps customer export to senior roles only", () => {
    const withExport = ROLE_CATALOG.filter((role) =>
      role.permissions.includes(PERMISSIONS.CUSTOMER_EXPORT),
    ).map((role) => role.key);

    expect(withExport.sort()).toEqual(
      ["org_owner", "platform_admin", "store_owner"].sort(),
    );
  });

  it("hides contact details from the marketer", () => {
    const marketer = findRoleDefinition("marketer");
    expect(marketer?.maskCustomerPhone).toBe(true);
    expect(marketer?.maskCustomerEmail).toBe(true);
  });

  it("uses unique role keys", () => {
    const keys = ROLE_CATALOG.map((role) => role.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("appointment state machine", () => {
  it("allows the normal service flow", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "checked_in")).toBe(true);
    expect(canTransition("checked_in", "in_service")).toBe(true);
    expect(canTransition("in_service", "completed")).toBe(true);
  });

  it("refuses to skip ahead", () => {
    expect(canTransition("confirmed", "completed")).toBe(false);
    expect(canTransition("pending", "checked_in")).toBe(false);
  });

  it("refuses to move backwards", () => {
    expect(canTransition("completed", "in_service")).toBe(false);
    expect(canTransition("checked_in", "confirmed")).toBe(false);
  });

  it("refuses to revive a terminal appointment", () => {
    for (const status of ["completed", "cancelled", "no_show"] as const) {
      expect(isTerminal(status)).toBe(true);
      expect(nextStatuses(status)).toHaveLength(0);
    }
  });

  it("allows a no-show only from a state where the customer was expected", () => {
    expect(canTransition("confirmed", "no_show")).toBe(true);
    expect(canTransition("checked_in", "no_show")).toBe(true);
    expect(canTransition("in_service", "no_show")).toBe(false);
    expect(canTransition("pending", "no_show")).toBe(false);
  });

  it("throws on an invalid transition", () => {
    expect(() => assertTransition("completed", "cancelled")).toThrow(InvalidTransitionError);
    expect(() => assertTransition("confirmed", "checked_in")).not.toThrow();
  });

  it("frees the calendar exactly for cancelled and no-show", () => {
    const freeing = APPOINTMENT_STATUSES.filter((status) => !occupiesCalendar(status));
    expect(freeing.sort()).toEqual(["cancelled", "no_show"]);
  });

  it("names the timestamp column for each recorded status", () => {
    expect(timestampFieldFor("confirmed")).toBe("confirmedAt");
    expect(timestampFieldFor("checked_in")).toBe("checkedInAt");
    expect(timestampFieldFor("in_service")).toBe("serviceStartedAt");
    expect(timestampFieldFor("completed")).toBe("completedAt");
    expect(timestampFieldFor("cancelled")).toBe("cancelledAt");
    expect(timestampFieldFor("pending")).toBeNull();
  });
});
