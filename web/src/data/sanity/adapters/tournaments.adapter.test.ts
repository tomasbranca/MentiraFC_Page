import { describe, expect, it } from "vitest";

import { adaptTournament } from "./tournaments.adapter";

const createTournament = (overrides: Record<string, unknown> = {}) => ({
  _id: "tournament-1",
  name: "Apertura",
  organization: {
    name: "Liga",
  },
  standingsSnapshots: [],
  ...overrides,
});

describe("tournaments.adapter", () => {
  it("deriva puntos, partidos jugados y diferencia si faltan valores publicados", () => {
    const tournament = adaptTournament(
      createTournament({
        standingsSnapshots: [
          {
            _id: "snapshot-1",
            matchdayNumber: 8,
            rows: [
              {
                wins: 8,
                draws: 1,
                losses: 0,
                goalsFor: 18,
                goalsAgainst: 7,
                team: {
                  _id: "team-1",
                  name: "Cucurella",
                },
              },
            ],
          },
        ],
      })
    );

    expect(tournament?.currentSnapshot?.standings[0]).toMatchObject({
      played: 9,
      points: 25,
      goalDiff: 11,
    });
    expect(tournament?.standings[0].points).toBe(25);
  });

  it("deriva valores visibles y calcula movimiento desde posiciones guardadas", () => {
    const tournament = adaptTournament(
      createTournament({
        standingsSnapshots: [
          {
            _id: "snapshot-current",
            matchdayNumber: 1,
            rows: [
              {
                wins: 1,
                draws: 0,
                losses: 2,
                goalsFor: 2,
                goalsAgainst: 4,
                position: 5,
                previousPosition: 2,
                team: {
                  _id: "team-1",
                  name: "Guardado",
                },
              },
            ],
          },
        ],
      })
    );

    expect(tournament?.currentSnapshot?.standings[0]).toMatchObject({
      played: 3,
      points: 3,
      goalDiff: -2,
      position: 5,
      previousPosition: 2,
      positionChange: -3,
    });
  });

  it("corrige la fila de Mentira con partidos oficiales aunque el snapshot este viejo", () => {
    const tournament = adaptTournament(
      createTournament({
        mainTeam: {
          _id: "main",
          name: "Mentira FC",
          isMain: true,
        },
        mainTeamGames: [
          { result: { goalsFor: 1, goalsAgainst: 0 } },
          { result: { goalsFor: 2, goalsAgainst: 2 } },
          { result: { goalsFor: null, goalsAgainst: 0 } },
        ],
        standingsSnapshots: [
          {
            _id: "snapshot-current",
            matchdayNumber: 12,
            rows: [
              {
                wins: 1,
                draws: 2,
                losses: 0,
                goalsFor: 5,
                goalsAgainst: 3,
                position: 3,
                previousPosition: 2,
                team: {
                  _id: "main",
                  name: "Mentira FC",
                  isMain: true,
                },
              },
            ],
          },
        ],
      })
    );

    expect(tournament?.currentSnapshot?.standings[0]).toMatchObject({
      played: 2,
      wins: 1,
      draws: 1,
      losses: 0,
      goalsFor: 3,
      goalsAgainst: 2,
      points: 4,
      goalDiff: 1,
      position: 3,
      previousPosition: 2,
      positionChange: -1,
    });
  });

  it("usa la primera tabla publicada recibida para alimentar la pagina", () => {
    const tournament = adaptTournament(
      createTournament({
        standingsSnapshots: [
          {
            _id: "snapshot-current",
            matchdayNumber: 8,
            rows: [
              {
                wins: 2,
                draws: 0,
                losses: 0,
                goalsFor: 5,
                goalsAgainst: 1,
                team: {
                  _id: "team-current",
                  name: "Actual",
                },
              },
            ],
          },
        ],
      })
    );

    expect(tournament?.currentSnapshot?.id).toBe("snapshot-current");
    expect(tournament?.standings[0].team.id).toBe("team-current");
  });

  it("usa la tabla publicada aunque no tenga filas calculadas completas", () => {
    const tournament = adaptTournament(
      createTournament({
        standingsSnapshots: [
          {
            _id: "snapshot-legacy",
            matchdayNumber: 7,
            rows: [
              {
                wins: 1,
                draws: 0,
                losses: 1,
                goalsFor: 2,
                goalsAgainst: 2,
                team: {
                  _id: "team-previous",
                  name: "Anterior",
                },
              },
            ],
          },
        ],
      })
    );

    expect(tournament?.currentSnapshot?.id).toBe("snapshot-legacy");
    expect(tournament?.standings[0].team.id).toBe("team-previous");
  });
});
