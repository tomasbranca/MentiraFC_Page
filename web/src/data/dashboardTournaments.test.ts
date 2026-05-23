import { describe, expect, it } from "vitest";

import {
  buildDashboardTournamentItemApiPath,
  buildDashboardTournamentOptionsApiPath,
} from "./dashboardTournaments";

describe("dashboardTournaments data client", () => {
  it("usa query params para evitar el fallback HTML de Vercel", () => {
    expect(buildDashboardTournamentItemApiPath("tournaments-1")).toBe(
      "/api/dashboard/tournaments?id=tournaments-1"
    );
    expect(buildDashboardTournamentItemApiPath("drafts.tournaments/1")).toBe(
      "/api/dashboard/tournaments?id=drafts.tournaments%2F1"
    );
  });

  it("construye la ruta de opciones del formulario", () => {
    expect(buildDashboardTournamentOptionsApiPath()).toBe(
      "/api/dashboard/tournaments?options=1"
    );
  });
});
