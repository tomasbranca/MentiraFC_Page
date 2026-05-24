import { describe, expect, it } from "vitest";

import {
  dashboardMatchByIdQuery,
  dashboardMatchGoalEventsQuery,
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
        goalsFor: "4",
        goalsAgainst: 1,
        playedPlayerIds: ["player-1", "player-1", "player-2"],
        goalScorers: [
          { playerId: "player-1", goals: 2 },
          { playerId: "player-1", goals: 1 },
          { playerId: "player-2", goals: "1" },
        ],
      })
    ).toEqual({
      rivalId: "team-1",
      date: "2026-05-16T21:30:00.000Z",
      location: "Cancha 1",
      competition: "Torneo",
      tournamentId: "tournament-1",
      state: "finalizado",
      goalsFor: 4,
      goalsAgainst: 1,
      playedPlayerIds: ["player-1", "player-2"],
      goalScorers: [
        { playerId: "player-1", goals: 3 },
        { playerId: "player-2", goals: 1 },
      ],
      guestGoalScorers: [],
      opponentOwnGoals: 0,
    });
  });

  it("acepta goles de invitados y en propia del rival dentro de goalsFor", () => {
    expect(
      parseDashboardMatchInput({
        rivalId: "team-1",
        date: "2026-05-16T21:30:00.000Z",
        location: "Cancha 1",
        competition: "Amistoso",
        state: "finalizado",
        goalsFor: 3,
        goalsAgainst: 2,
        goalScorers: [{ playerId: "player-1", goals: 1 }],
        guestGoalScorers: [{ name: " Invitado ", goals: 1 }],
        opponentOwnGoals: 1,
      })
    ).toMatchObject({
      goalsFor: 3,
      goalScorers: [{ playerId: "player-1", goals: 1 }],
      guestGoalScorers: [{ name: "Invitado", goals: 1 }],
      opponentOwnGoals: 1,
    });
  });

  it("rechaza partidos finalizados si los goleadores no coinciden con goalsFor", () => {
    expect(
      parseDashboardMatchInput({
        rivalId: "team-1",
        date: "2026-05-16T21:30:00.000Z",
        location: "Cancha 1",
        competition: "Amistoso",
        state: "finalizado",
        goalsFor: 2,
        goalsAgainst: 0,
        goalScorers: [{ playerId: "player-1", goals: 1 }],
      })
    ).toBeNull();
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
        goalScorers: [{ playerId: "player-2", goals: "2" }],
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
      goalScorers: [{ playerId: "player-2", goals: 2 }],
      guestGoalScorers: [],
      opponentOwnGoals: 0,
    });
  });

  it("lee publicados, borradores y opciones de referencia", () => {
    expect(dashboardMatchListQuery).toContain('*[_type == "games"]');
    expect(dashboardMatchByIdQuery).toContain("_id == $draftId");
    expect(dashboardMatchByIdQuery).toContain('"goalEvents"');
    expect(dashboardMatchGoalEventsQuery).toContain('type == "goal"');
    expect(dashboardMatchOptionsQuery).toContain('"teams"');
    expect(dashboardMatchOptionsQuery).toContain('!(_id in path("drafts.**"))');
    expect(dashboardMatchOptionsQuery).toContain('"players"');
    expect(dashboardMatchOptionsQuery).toContain('"tournaments"');
  });
});
