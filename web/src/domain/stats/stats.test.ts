import { describe, expect, it } from "vitest";

import {
  decorateStoredTournamentTable,
  getPlayerStats,
  getTopScorers,
  getTopScorersFromGoalEvents,
} from "./index";

describe("decorateStoredTournamentTable", () => {
  it("renderiza el snapshot guardado sin recalcular estadisticas ni movimientos", () => {
    const table = decorateStoredTournamentTable({
      primaryPrizeSlots: 1,
      secondaryPrizeSlots: 1,
      standings: [
        {
          team: { id: "main", name: "Mentira FC", isMain: true },
          played: 13,
          wins: 4,
          draws: 6,
          losses: 3,
          goalsFor: 51,
          goalsAgainst: 53,
          points: 18,
          goalDiff: -2,
          position: 3,
          previousPosition: 2,
          positionChange: -1,
        },
        {
          team: { id: "alpha", name: "Alpha FC" },
          played: 13,
          wins: 7,
          draws: 2,
          losses: 4,
          goalsFor: 20,
          goalsAgainst: 11,
          points: 23,
          goalDiff: 9,
          position: 1,
          previousPosition: 3,
          positionChange: 2,
        },
      ],
    });

    expect(table.map((row) => row.team.id)).toEqual(["alpha", "main"]);
    expect(table.find((row) => row.team.id === "main")).toMatchObject({
      played: 13,
      points: 18,
      position: 3,
      previousPosition: 2,
      positionChange: -1,
      type: "normal",
    });
    expect(table[0].type).toBe("primaryPrize");
  });
});

describe("getTopScorers", () => {
  const players = [
    { id: "p1", fullName: "Ana GÃ³mez" },
    { id: "p2", fullName: "Bruno PÃ©rez" },
    { id: "p3", fullName: "Carlos Ruiz" },
  ];

  it("calcula goleadores con datos normales y permite filtrar por aÃ±o", () => {
    const games = [
      {
        date: "2025-03-01",
        state: "finalizado",
        result: { goalsFor: 3, goalsAgainst: 1 },
        events: [
          { type: "goal", player: { id: "p1" } },
          { type: "goal", player: { id: "p1" } },
          { type: "goal", player: { id: "p2" } },
        ],
      },
      {
        date: "2024-10-10",
        state: "finalizado",
        result: { goalsFor: 1, goalsAgainst: 0 },
        events: [{ type: "goal", player: { id: "p3" } }],
      },
    ];

    const topScorers = getTopScorers(games, players, { year: 2025 });

    expect(topScorers.map((p) => [p.id, p.goals])).toEqual([
      ["p1", 2],
      ["p2", 1],
      ["p3", 0],
    ]);
  });

  it("devuelve valores en cero con datos vacÃ­os", () => {
    const result = getTopScorers([], players);

    expect(result).toHaveLength(3);
    expect(result.every((player) => player.goals === 0)).toBe(true);
  });

  it("desempata por nombre cuando hay igualdad de goles", () => {
    const tiePlayers = [
      { id: "p1", fullName: "Zoe Alvarez" },
      { id: "p2", fullName: "Ana BelÃ©n" },
    ];

    const games = [
      {
        date: "2025-01-05",
        state: "finalizado",
        result: { goalsFor: 2, goalsAgainst: 0 },
        events: [
          { type: "goal", player: { id: "p1" } },
          { type: "goal", player: { id: "p2" } },
        ],
      },
    ];

    const result = getTopScorers(games, tiePlayers);

    expect(result.map((player) => player.id)).toEqual(["p2", "p1"]);
  });

  it("ignora datos invÃ¡lidos y no rompe cuando input no es arreglo", () => {
    expect(getTopScorers(null, players)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "p1", goals: 0 }),
        expect.objectContaining({ id: "p2", goals: 0 }),
      ])
    );

    const games = [
      {
        date: "invalid-date",
        events: [
          { type: "goal", player: {} },
          { type: "foul", player: { id: "p1" } },
          null,
        ],
      },
    ];

    expect(getTopScorers(games, "not-array")).toEqual([]);
  });
});

describe("getPlayerStats", () => {
  const games = [
      {
        date: "2025-02-10",
        state: "finalizado",
        result: { goalsFor: 3, goalsAgainst: 1 },
        playedPlayers: [{ id: "p1" }, { id: "p2" }],
        events: [
        { type: "goal", player: { id: "p1" } },
        { type: "goal", player: { id: "p1" } },
        { type: "goal", player: { id: "p2" } },
      ],
    },
      {
        date: "2025-03-15",
        state: "finalizado",
        result: { goalsFor: 1, goalsAgainst: 0 },
        playedPlayers: [{ id: "p1" }],
        events: [{ type: "goal", player: { id: "p1" } }],
      },
      {
        date: "2024-11-01",
        state: "finalizado",
        result: { goalsFor: 1, goalsAgainst: 0 },
        playedPlayers: [{ id: "p1" }],
        events: [{ type: "goal", player: { id: "p1" } }],
    },
  ];

  it("calcula goles y partidos con gol para un jugador", () => {
    const stats = getPlayerStats(games, "p1", { year: 2025 });

    expect(stats).toEqual({
      playerId: "p1",
      goals: 3,
      matchesWithGoals: 2,
      matchesPlayed: 2,
    });
  });

  it("devuelve ceros cuando no hay partidos", () => {
    expect(getPlayerStats([], "p1")).toEqual({
      playerId: "p1",
      goals: 0,
      matchesWithGoals: 0,
      matchesPlayed: 0,
    });
  });

  it("maneja playerId invÃ¡lido devolviendo objeto neutral", () => {
    expect(getPlayerStats(games, null)).toEqual({
      playerId: null,
      goals: 0,
      matchesWithGoals: 0,
      matchesPlayed: 0,
    });
  });

  it("ignora eventos invÃ¡lidos y entradas no arreglos", () => {
    expect(getPlayerStats(null, "p1")).toEqual({
      playerId: "p1",
      goals: 0,
      matchesWithGoals: 0,
      matchesPlayed: 0,
    });

    const malformedGames = [
      {
        date: "2025-01-01",
        events: [
          null,
          { type: "assist", player: { id: "p1" } },
          { type: "goal", player: { id: "p2" } },
        ],
      },
    ];

    expect(getPlayerStats(malformedGames, "p1")).toEqual({
      playerId: "p1",
      goals: 0,
      matchesWithGoals: 0,
      matchesPlayed: 0,
    });
  });

  it("calcula partidos jugados desde la lista del partido aunque no haya goles", () => {
    const stats = getPlayerStats(
      [
        {
          date: "2025-01-10",
          state: "finalizado",
          result: { goalsFor: 1, goalsAgainst: 0 },
          playedPlayers: [{ id: "p1" }, { id: "p2" }],
          events: [{ type: "goal", player: { id: "p2" } }],
        },
        {
          date: "2025-02-10",
          state: "finalizado",
          result: { goalsFor: 0, goalsAgainst: 0 },
          playedPlayers: [{ id: "p3" }],
          events: [],
        },
        {
          date: "2024-02-10",
          state: "finalizado",
          result: { goalsFor: 0, goalsAgainst: 0 },
          playedPlayers: [{ id: "p1" }],
          events: [],
        },
      ],
      "p1",
      { year: 2025 }
    );

    expect(stats).toEqual({
      playerId: "p1",
      goals: 0,
      matchesWithGoals: 0,
      matchesPlayed: 1,
    });
  });

  it("ignora partidos por jugar o sin resultado para partidos jugados", () => {
    const stats = getPlayerStats(
      [
        {
          id: "scheduled",
          date: "2025-01-10",
          state: "por_jugar",
          result: null,
          playedPlayers: [{ id: "p1" }],
          events: [{ type: "goal", player: { id: "p1" } }],
        },
        {
          id: "finished-missing-result",
          date: "2025-02-10",
          state: "finalizado",
          result: null,
          playedPlayers: [{ id: "p1" }],
          events: [{ type: "goal", player: { id: "p1" } }],
        },
      ],
      "p1",
      { year: 2025 }
    );

    expect(stats).toEqual({
      playerId: "p1",
      goals: 0,
      matchesWithGoals: 0,
      matchesPlayed: 0,
    });
  });

  it("ignora invitados y goles en propia para estadisticas del jugador", () => {
    const stats = getPlayerStats(
      [
        {
          id: "g1",
          date: "2025-01-10",
          state: "finalizado",
          result: { goalsFor: 1, goalsAgainst: 0 },
          playedPlayers: [{ id: "p1" }],
          events: [
            { type: "goal", player: { id: "p1" }, scorerKind: "roster" },
            { type: "goal", player: { id: "p1" }, scorerKind: "guest" },
            {
              type: "goal",
              player: { id: "p1" },
              scorerKind: "opponent_own_goal",
            },
          ],
        },
      ],
      "p1",
      { year: 2025 }
    );

    expect(stats).toEqual({
      playerId: "p1",
      goals: 1,
      matchesWithGoals: 1,
      matchesPlayed: 1,
    });
  });

  it("usa eventos de gol planos para no recorrer eventos anidados cuando estan disponibles", () => {
    const stats = getPlayerStats(
      [
        {
          id: "g1",
          date: "2025-01-10",
          state: "finalizado",
          result: { goalsFor: 1, goalsAgainst: 0 },
          playedPlayers: [{ id: "p1" }],
          events: [{ type: "goal", player: { id: "p2" } }],
        },
        {
          id: "g2",
          date: "2025-02-10",
          state: "finalizado",
          result: { goalsFor: 1, goalsAgainst: 0 },
          playedPlayers: [],
          events: [],
        },
      ],
      "p1",
      {
        year: 2025,
        goalEvents: [
          {
            id: "e1",
            type: "goal",
            game: {
              id: "g2",
              date: "2025-02-10",
              state: "finalizado",
              result: { goalsFor: 1, goalsAgainst: 0 },
            },
            player: { id: "p1" },
          },
        ],
      }
    );

    expect(stats).toEqual({
      playerId: "p1",
      goals: 1,
      matchesWithGoals: 1,
      matchesPlayed: 1,
    });
  });

  it("usa solo goles de plantel desde eventos planos pero conserva partidos jugados", () => {
    const stats = getPlayerStats(
      [
        {
          id: "g1",
          date: "2025-01-10",
          state: "finalizado",
          result: { goalsFor: 1, goalsAgainst: 0 },
          playedPlayers: [{ id: "p1" }],
          events: [],
        },
      ],
      "p1",
      {
        year: 2025,
        goalEvents: [
          {
            id: "e1",
            type: "goal",
            game: {
              id: "g1",
              date: "2025-01-10",
              state: "finalizado",
              result: { goalsFor: 1, goalsAgainst: 0 },
            },
            player: { id: "p1" },
            scorerKind: "roster",
          },
          {
            id: "e2",
            type: "goal",
            game: {
              id: "g1",
              date: "2025-01-10",
              state: "finalizado",
              result: { goalsFor: 1, goalsAgainst: 0 },
            },
            player: { id: "p1" },
            scorerKind: "guest",
          },
          {
            id: "e3",
            type: "goal",
            game: {
              id: "g1",
              date: "2025-01-10",
              state: "finalizado",
              result: { goalsFor: 1, goalsAgainst: 0 },
            },
            player: { id: "p1" },
            scorerKind: "opponent_own_goal",
          },
        ],
      }
    );

    expect(stats).toEqual({
      playerId: "p1",
      goals: 1,
      matchesWithGoals: 1,
      matchesPlayed: 1,
    });
  });
});

describe("getTopScorersFromGoalEvents", () => {
  const players = [
    { id: "p1", fullName: "Ana Gomez" },
    { id: "p2", fullName: "Bruno Perez" },
    { id: "p3", fullName: "Carlos Ruiz" },
  ];
  const finishedEventGame = (id: string, date: string) => ({
    id,
    date,
    state: "finalizado",
    result: {
      goalsFor: 1,
      goalsAgainst: 0,
    },
  });

  it("calcula goleadores desde eventos planos filtrados por aÃ±o", () => {
    const goalEvents = [
      {
        id: "e1",
        type: "goal",
        game: finishedEventGame("g1", "2025-02-10"),
        player: { id: "p2" },
      },
      {
        id: "e2",
        type: "goal",
        game: finishedEventGame("g2", "2025-03-10"),
        player: { id: "p1" },
      },
      {
        id: "e3",
        type: "goal",
        game: finishedEventGame("g3", "2024-03-10"),
        player: { id: "p1" },
      },
    ];

    const topScorers = getTopScorersFromGoalEvents(goalEvents, players, {
      year: 2025,
    });

    expect(topScorers.map((player) => [player.id, player.goals])).toEqual([
      ["p1", 1],
      ["p2", 1],
      ["p3", 0],
    ]);
  });

  it("no suma invitados ni goles en propia en TopScorers", () => {
    const topScorers = getTopScorersFromGoalEvents(
      [
        {
          id: "e1",
          type: "goal",
          game: finishedEventGame("g1", "2025-02-10"),
          player: { id: "p1" },
          scorerKind: "roster",
        },
        {
          id: "e2",
          type: "goal",
          game: finishedEventGame("g1", "2025-02-10"),
          player: { id: "p1" },
          scorerKind: "guest",
        },
        {
          id: "e3",
          type: "goal",
          game: finishedEventGame("g1", "2025-02-10"),
          player: null,
          scorerKind: "opponent_own_goal",
        },
        {
          id: "e4",
          type: "goal",
          game: finishedEventGame("g1", "2025-02-10"),
          player: { id: "p2" },
          scorerKind: null,
        },
      ],
      players,
      { year: 2025 }
    );

    expect(topScorers.map((player) => [player.id, player.goals])).toEqual([
      ["p1", 1],
      ["p2", 1],
      ["p3", 0],
    ]);
  });
});
