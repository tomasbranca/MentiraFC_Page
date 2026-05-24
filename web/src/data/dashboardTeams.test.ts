import { describe, expect, it } from "vitest";

import { buildDashboardTeamItemApiPath } from "./dashboardTeams";

describe("dashboardTeams data client", () => {
  it("usa query params para evitar el fallback HTML de Vercel", () => {
    expect(buildDashboardTeamItemApiPath("teams-1")).toBe(
      "/api/dashboard/teams?id=teams-1"
    );
    expect(buildDashboardTeamItemApiPath("drafts.teams/1")).toBe(
      "/api/dashboard/teams?id=drafts.teams%2F1"
    );
  });
});
