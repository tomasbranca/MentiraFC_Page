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

  it("elige snapshot actual y anterior por snapshotRole", () => {
    const tournament = adaptTournament(
      createTournament({
        standingsSnapshots: [
          {
            _id: "snapshot-previous",
            snapshotRole: "previous",
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
          {
            _id: "snapshot-current",
            snapshotRole: "current",
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
    expect(tournament?.previousSnapshot?.id).toBe("snapshot-previous");
    expect(tournament?.standings[0].team.id).toBe("team-current");
  });

  it("no trata un snapshot previous como tabla actual", () => {
    const tournament = adaptTournament(
      createTournament({
        standingsSnapshots: [
          {
            _id: "snapshot-previous",
            snapshotRole: "previous",
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

    expect(tournament?.currentSnapshot).toBeNull();
    expect(tournament?.previousSnapshot?.id).toBe("snapshot-previous");
    expect(tournament?.standings).toEqual([]);
  });
});
