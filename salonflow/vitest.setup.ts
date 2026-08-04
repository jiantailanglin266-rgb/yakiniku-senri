import { beforeAll } from "vitest";

beforeAll(() => {
  // Deterministic timezone for tests. The application always stores UTC and
  // converts on render, so the host timezone must never influence assertions.
  process.env.TZ = "UTC";
  process.env.SESSION_SECRET ??= "test-session-secret-value-at-least-32-chars";
  process.env.PRODUCT_NAME ??= "SalonFlow";
  process.env.DATABASE_URL ??=
    "postgresql://salonflow:salonflow@localhost:5432/salonflow_test?schema=public";
  // The schema declares `directUrl`, so Prisma refuses to initialise without
  // it. Tests talk to PostgreSQL directly, with no pooler in between.
  process.env.DIRECT_DATABASE_URL ??= process.env.DATABASE_URL;
});
