import { describe, expect, it } from "vitest";

import { buildDashboardOrganizationItemApiPath } from "./dashboardOrganizations";

describe("dashboardOrganizations data client", () => {
  it("usa query params para evitar el fallback HTML de Vercel", () => {
    expect(buildDashboardOrganizationItemApiPath("organizations-1")).toBe(
      "/api/dashboard/organizations?id=organizations-1"
    );
    expect(buildDashboardOrganizationItemApiPath("drafts.organizations/1")).toBe(
      "/api/dashboard/organizations?id=drafts.organizations%2F1"
    );
  });
});
