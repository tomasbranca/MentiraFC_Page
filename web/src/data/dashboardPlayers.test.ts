import { describe, expect, it } from "vitest";

import { buildDashboardPlayerItemApiPath } from "./dashboardPlayers";

describe("dashboardPlayers data client", () => {
  it("usa query params para evitar el fallback HTML de Vercel", () => {
    expect(buildDashboardPlayerItemApiPath("players-1")).toBe(
      "/api/dashboard/players?id=players-1"
    );
    expect(buildDashboardPlayerItemApiPath("drafts.players/1")).toBe(
      "/api/dashboard/players?id=drafts.players%2F1"
    );
  });
});
