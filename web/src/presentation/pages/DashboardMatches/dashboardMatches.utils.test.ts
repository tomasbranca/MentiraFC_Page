import { describe, expect, it } from "vitest";

import {
  buildDashboardMatchMutationInput,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  validateDashboardMatchInput,
} from "./dashboardMatches.utils";

describe("dashboardMatches utils", () => {
  it("convierte fechas locales a ISO", () => {
    expect(fromDatetimeLocalValue("2026-05-16T21:30")).toContain(
      "2026-05-17T00:30:00.000Z"
    );
  });

  it("convierte ISO a fecha local argentina", () => {
    expect(toDatetimeLocalValue("2026-05-17T00:30:00.000Z")).toBe(
      "2026-05-16T21:30"
    );
  });

  it("valida campos requeridos de partidos", () => {
    expect(
      validateDashboardMatchInput({
        rivalId: "",
        date: "",
        location: "",
        competition: "Torneo",
        tournamentId: "",
        state: "finalizado",
        goalsFor: "",
        goalsAgainst: "-1",
        playedPlayerIds: [],
        goalScorers: [],
      })
    ).toEqual({
      rivalId: "Elegi un rival.",
      date: "Elegi una fecha valida.",
      location: "Escribi la ubicacion.",
      tournamentId: "Elegi el torneo.",
      goalsFor: "Carga los goles de Mentira FC.",
      goalsAgainst: "Carga los goles del rival.",
    });
  });

  it("normaliza payloads para publicar partidos", () => {
    expect(
      buildDashboardMatchMutationInput({
        rivalId: " team-1 ",
        date: "2026-05-17T00:30:00.000Z",
        location: " Cancha 1 ",
        competition: "Amistoso",
        tournamentId: "tournament-1",
        state: "por_jugar",
        goalsFor: "4",
        goalsAgainst: "2",
        playedPlayerIds: ["player-1"],
        goalScorers: [{ playerId: "player-1", goals: "2" }],
      })
    ).toEqual({
      rivalId: "team-1",
      date: "2026-05-17T00:30:00.000Z",
      location: "Cancha 1",
      competition: "Amistoso",
      tournamentId: undefined,
      state: "por_jugar",
      goalsFor: undefined,
      goalsAgainst: undefined,
      playedPlayerIds: [],
      goalScorers: [],
    });
  });

  it("normaliza goleadores sin correlacionar con el resultado", () => {
    expect(
      buildDashboardMatchMutationInput({
        rivalId: "team-1",
        date: "2026-05-17T00:30:00.000Z",
        location: "Cancha 1",
        competition: "Torneo",
        tournamentId: "tournament-1",
        state: "finalizado",
        goalsFor: "1",
        goalsAgainst: "0",
        playedPlayerIds: [],
        goalScorers: [
          { playerId: "player-1", goals: "2" },
          { playerId: "player-2", goals: "1" },
        ],
      }).goalScorers
    ).toEqual([
      { playerId: "player-1", goals: 2 },
      { playerId: "player-2", goals: 1 },
    ]);
  });
});
