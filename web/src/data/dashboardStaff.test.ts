import { describe, expect, it } from "vitest";

import { buildDashboardStaffItemApiPath } from "./dashboardStaff";

describe("dashboardStaff data client", () => {
  it("usa query params para evitar el fallback HTML de Vercel", () => {
    expect(buildDashboardStaffItemApiPath("staff-1")).toBe(
      "/api/dashboard/staff?id=staff-1"
    );
    expect(buildDashboardStaffItemApiPath("drafts.staff/1")).toBe(
      "/api/dashboard/staff?id=drafts.staff%2F1"
    );
  });
});
