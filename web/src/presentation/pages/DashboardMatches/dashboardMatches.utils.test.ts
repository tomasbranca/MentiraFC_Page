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
        guestGoalScorers: [],
        opponentOwnGoals: "0",
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
        guestGoalScorers: [],
        opponentOwnGoals: "0",
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
      guestGoalScorers: [],
      opponentOwnGoals: 0,
    });
  });

  it("no exige resultado para partidos por jugar", () => {
    expect(
      validateDashboardMatchInput({
        rivalId: "team-1",
        date: "2026-05-17T00:30:00.000Z",
        location: "Cancha 1",
        competition: "Amistoso",
        tournamentId: "",
        state: "por_jugar",
        goalsFor: "",
        goalsAgainst: "",
        playedPlayerIds: [],
        goalScorers: [],
        guestGoalScorers: [],
        opponentOwnGoals: "0",
      })
    ).toEqual({});
  });

  it("normaliza goleadores aunque no coincidan con el resultado", () => {
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
        guestGoalScorers: [],
        opponentOwnGoals: "0",
      }).goalScorers
    ).toEqual([
      { playerId: "player-1", goals: 2 },
      { playerId: "player-2", goals: 1 },
    ]);
  });

  it("valida plantel, invitados y goles en propia del rival contra goalsFor", () => {
    expect(
      validateDashboardMatchInput({
        rivalId: "team-1",
        date: "2026-05-17T00:30:00.000Z",
        location: "Cancha 1",
        competition: "Amistoso",
        tournamentId: "",
        state: "finalizado",
        goalsFor: "3",
        goalsAgainst: "1",
        playedPlayerIds: [],
        goalScorers: [{ playerId: "player-1", goals: "1" }],
        guestGoalScorers: [{ name: "Invitado", goals: "1" }],
        opponentOwnGoals: "1",
      }).goalScorers
    ).toBeUndefined();
  });

  it("bloquea partidos finalizados si los goleadores no coinciden con el resultado", () => {
    expect(
      validateDashboardMatchInput({
        rivalId: "team-1",
        date: "2026-05-17T00:30:00.000Z",
        location: "Cancha 1",
        competition: "Amistoso",
        tournamentId: "",
        state: "finalizado",
        goalsFor: "2",
        goalsAgainst: "1",
        playedPlayerIds: [],
        goalScorers: [{ playerId: "player-1", goals: "1" }],
        guestGoalScorers: [],
        opponentOwnGoals: "0",
      }).goalScorers
    ).toContain("suman 1 gol");

    expect(
      validateDashboardMatchInput({
        rivalId: "team-1",
        date: "2026-05-17T00:30:00.000Z",
        location: "Cancha 1",
        competition: "Amistoso",
        tournamentId: "",
        state: "finalizado",
        goalsFor: "0",
        goalsAgainst: "1",
        playedPlayerIds: [],
        goalScorers: [],
        guestGoalScorers: [],
        opponentOwnGoals: "0",
      }).goalScorers
    ).toBeUndefined();
  });
});
