import { describe, expect, it } from "vitest";

import {
  buildDashboardMatchItemApiPath,
  buildDashboardMatchOptionsApiPath,
} from "./dashboardMatches";

describe("dashboardMatches data client", () => {
  it("usa query params para evitar el fallback HTML de Vercel", () => {
    expect(buildDashboardMatchItemApiPath("games-1")).toBe(
      "/api/dashboard/matches?id=games-1"
    );
    expect(buildDashboardMatchItemApiPath("drafts.games/1")).toBe(
      "/api/dashboard/matches?id=drafts.games%2F1"
    );
  });

  it("construye la ruta de opciones del formulario", () => {
    expect(buildDashboardMatchOptionsApiPath()).toBe(
      "/api/dashboard/matches?options=1"
    );
  });
});
