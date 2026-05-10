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
  it("deriva puntos, partidos jugados y diferencia para snapshots legacy", () => {
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
});
