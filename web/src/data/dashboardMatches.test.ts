import { describe, expect, it } from "vitest";

import {
  buildDashboardMatchItemApiPath,
  buildDashboardMatchOptionsApiPath,
  buildDashboardMatchesPageApiPath,
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

  it("construye la ruta paginada del listado", () => {
    expect(
      buildDashboardMatchesPageApiPath({
        page: 2,
        limit: 20,
        sortBy: "date",
        direction: "desc",
        search: "final",
        status: "draft",
        state: "finalizado",
        competition: "Torneo",
      })
    ).toBe(
      "/api/dashboard/matches?page=2&limit=20&sortBy=date&direction=desc&search=final&status=draft&state=finalizado&competition=Torneo"
    );
  });
});
