import { describe, expect, it } from "vitest";

import {
  getHybridTournamentTable,
  getPlayerStats,
  getTopScorers,
} from "./index";

describe("getHybridTournamentTable", () => {
  it("calcula tabla híbrida con datos normales y actualiza al equipo principal con partidos finalizados", () => {
    const mainTeam = { id: "main", name: "Mentira FC", isMain: true };
    const rivals = [
      { id: "a", name: "Alpha FC" },
      { id: "b", name: "Beta FC" },
    ];

    const manualStandings = [
      {
        team: mainTeam,
        played: 99,
        wins: 99,
        draws: 0,
        losses: 0,
        goalsFor: 200,
        goalsAgainst: 1,
      },
      {
        team: rivals[0],
        played: 3,
        wins: 2,
        draws: 1,
        losses: 0,
        goalsFor: 6,
        goalsAgainst: 3,
      },
      {
        team: rivals[1],
        played: 3,
        wins: 1,
        draws: 1,
        losses: 1,
        goalsFor: 4,
        goalsAgainst: 4,
      },
    ];

    const games = [
      { state: "finalizado", result: { goalsFor: 2, goalsAgainst: 1 } },
      { state: "finalizado", result: { goalsFor: 0, goalsAgainst: 0 } },
      { state: "programado", result: { goalsFor: 9, goalsAgainst: 0 } },
    ];

    const table = getHybridTournamentTable({ manualStandings, games, mainTeam });

    expect(table).toHaveLength(3);

    const mainRow = table.find((row) => row.team.id === "main");
    expect(mainRow).toMatchObject({
      played: 2,
      wins: 1,
      draws: 1,
      losses: 0,
      goalsFor: 2,
      goalsAgainst: 1,
      points: 4,
      goalDiff: 1,
    });

    expect(table[0].team.id).toBe("a");
    expect(table[0].position).toBe(1);
    expect(table[0].type).toBe("champion");
  });

  it("retorna arreglo vacío cuando no hay equipo principal ni tabla manual", () => {
    expect(getHybridTournamentTable({ manualStandings: [], games: [] })).toEqual([]);
  });

  it("resuelve empates por diferencia de gol, goles a favor y nombre", () => {
    const table = getHybridTournamentTable({
      manualStandings: [
        {
          team: { id: "z", name: "Zeta FC" },
          played: 2,
          wins: 1,
          draws: 0,
          losses: 1,
          goalsFor: 3,
          goalsAgainst: 3,
        },
        {
          team: { id: "a", name: "Alfa FC" },
          played: 2,
          wins: 1,
          draws: 0,
          losses: 1,
          goalsFor: 3,
          goalsAgainst: 3,
        },
        {
          team: { id: "b", name: "Beta FC" },
          played: 2,
          wins: 1,
          draws: 0,
          losses: 1,
          goalsFor: 5,
          goalsAgainst: 4,
        },
      ],
    });

    expect(table.map((row) => row.team.id)).toEqual(["b", "a", "z"]);
  });

  it("normaliza datos inválidos numéricos en tabla manual y en resultados de partidos", () => {
    const mainTeam = { id: "m", name: "Mentira FC", isMain: true };

    const table = getHybridTournamentTable({
      manualStandings: [
        {
          team: mainTeam,
          played: "x",
          wins: undefined,
          draws: null,
          losses: NaN,
          goalsFor: Infinity,
          goalsAgainst: "-",
        },
        {
          team: { id: "r", name: "Rival" },
          played: "x",
          wins: undefined,
          draws: null,
          losses: NaN,
          goalsFor: Infinity,
          goalsAgainst: "-",
        },
      ],
      games: [{ state: "finalizado", result: { goalsFor: "2", goalsAgainst: null } }],
      mainTeam,
    });

    const mainRow = table.find((row) => row.team.id === "m");
    const rivalRow = table.find((row) => row.team.id === "r");

    expect(mainRow).toMatchObject({
      played: 1,
      wins: 0,
      draws: 1,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    });

    expect(rivalRow).toMatchObject({
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    });
  });
});

describe("getTopScorers", () => {
  const players = [
    { id: "p1", fullName: "Ana Gómez" },
    { id: "p2", fullName: "Bruno Pérez" },
    { id: "p3", fullName: "Carlos Ruiz" },
  ];

  it("calcula goleadores con datos normales y permite filtrar por año", () => {
    const games = [
      {
        date: "2025-03-01",
        events: [
          { type: "goal", player: { id: "p1" } },
          { type: "goal", player: { id: "p1" } },
          { type: "goal", player: { id: "p2" } },
        ],
      },
      {
        date: "2024-10-10",
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

  it("devuelve valores en cero con datos vacíos", () => {
    const result = getTopScorers([], players);

    expect(result).toHaveLength(3);
    expect(result.every((player) => player.goals === 0)).toBe(true);
  });

  it("desempata por nombre cuando hay igualdad de goles", () => {
    const tiePlayers = [
      { id: "p1", fullName: "Zoe Alvarez" },
      { id: "p2", fullName: "Ana Belén" },
    ];

    const games = [
      {
        date: "2025-01-05",
        events: [
          { type: "goal", player: { id: "p1" } },
          { type: "goal", player: { id: "p2" } },
        ],
      },
    ];

    const result = getTopScorers(games, tiePlayers);

    expect(result.map((player) => player.id)).toEqual(["p2", "p1"]);
  });

  it("ignora datos inválidos y no rompe cuando input no es arreglo", () => {
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
      events: [
        { type: "goal", player: { id: "p1" } },
        { type: "goal", player: { id: "p1" } },
        { type: "goal", player: { id: "p2" } },
      ],
    },
    {
      date: "2025-03-15",
      events: [{ type: "goal", player: { id: "p1" } }],
    },
    {
      date: "2024-11-01",
      events: [{ type: "goal", player: { id: "p1" } }],
    },
  ];

  it("calcula goles y partidos con gol para un jugador", () => {
    const stats = getPlayerStats(games, "p1", { year: 2025 });

    expect(stats).toEqual({
      playerId: "p1",
      goals: 3,
      matchesWithGoals: 2,
    });
  });

  it("devuelve ceros cuando no hay partidos", () => {
    expect(getPlayerStats([], "p1")).toEqual({
      playerId: "p1",
      goals: 0,
      matchesWithGoals: 0,
    });
  });

  it("maneja playerId inválido devolviendo objeto neutral", () => {
    expect(getPlayerStats(games, null)).toEqual({
      playerId: null,
      goals: 0,
      matchesWithGoals: 0,
    });
  });

  it("ignora eventos inválidos y entradas no arreglos", () => {
    expect(getPlayerStats(null, "p1")).toEqual({
      playerId: "p1",
      goals: 0,
      matchesWithGoals: 0,
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
    });
  });
});
