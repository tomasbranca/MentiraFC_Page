import { describe, expect, it } from "vitest";

import {
  dashboardMatchByIdQuery,
  dashboardMatchListQuery,
  dashboardMatchOptionsQuery,
  parseDashboardMatchDraftInput,
  parseDashboardMatchInput,
} from "./matches.js";

describe("dashboard matches api input", () => {
  it("acepta datos validos para un partido finalizado", () => {
    expect(
      parseDashboardMatchInput({
        rivalId: "team-1",
        date: "2026-05-16T21:30:00.000Z",
        location: "Cancha 1",
        competition: "Torneo",
        tournamentId: "tournament-1",
        state: "finalizado",
        goalsFor: "2",
        goalsAgainst: 1,
        playedPlayerIds: ["player-1", "player-1", "player-2"],
      })
    ).toEqual({
      rivalId: "team-1",
      date: "2026-05-16T21:30:00.000Z",
      location: "Cancha 1",
      competition: "Torneo",
      tournamentId: "tournament-1",
      state: "finalizado",
      goalsFor: 2,
      goalsAgainst: 1,
      playedPlayerIds: ["player-1", "player-2"],
    });
  });

  it("rechaza partidos de torneo sin torneo y finalizados sin resultado", () => {
    expect(
      parseDashboardMatchInput({
        rivalId: "team-1",
        date: "2026-05-16T21:30:00.000Z",
        location: "Cancha 1",
        competition: "Torneo",
        tournamentId: "",
        state: "por_jugar",
      })
    ).toBeNull();

    expect(
      parseDashboardMatchInput({
        rivalId: "team-1",
        date: "2026-05-16T21:30:00.000Z",
        location: "Cancha 1",
        competition: "Amistoso",
        state: "finalizado",
      })
    ).toBeNull();
  });

  it("acepta borradores incompletos", () => {
    expect(
      parseDashboardMatchDraftInput({
        rivalId: "",
        date: "",
        location: "",
        competition: "",
        tournamentId: "",
        state: "",
        goalsFor: "",
        playedPlayerIds: ["player-1", "player-1"],
      })
    ).toEqual({
      rivalId: "",
      date: "",
      location: "",
      competition: undefined,
      tournamentId: "",
      state: undefined,
      goalsFor: undefined,
      goalsAgainst: undefined,
      playedPlayerIds: ["player-1"],
    });
  });

  it("lee publicados, borradores y opciones de referencia", () => {
    expect(dashboardMatchListQuery).toContain('*[_type == "games"]');
    expect(dashboardMatchByIdQuery).toContain("_id == $draftId");
    expect(dashboardMatchOptionsQuery).toContain('"teams"');
    expect(dashboardMatchOptionsQuery).toContain('"players"');
    expect(dashboardMatchOptionsQuery).toContain('"tournaments"');
  });
});
