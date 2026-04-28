// @ts-nocheck
import { describe, expect, it } from "vitest";

import { getGameProviderSnapshot } from "./gameProvider.utils";

const createPayload = (overrides = {}) => ({
  bootstrapScope: "empty",
  news: [],
  players: [],
  games: [],
  tournament: null,
  teams: [],
  tournamentGames: [],
  latestGame: null,
  ...overrides,
});

describe("gameProvider.utils", () => {
  it("marca loading durante el bootstrap vacio", () => {
    expect(getGameProviderSnapshot(createPayload())).toEqual({
      game: null,
      loading: true,
    });
  });

  it("sincroniza el partido cuando cambia latestGame en initialData", () => {
    const firstSnapshot = getGameProviderSnapshot(
      createPayload({
        bootstrapScope: "news-detail",
        latestGame: null,
      })
    );
    const secondSnapshot = getGameProviderSnapshot(
      createPayload({
        bootstrapScope: "home-critical",
        latestGame: {
          id: "g-2",
          date: "2025-03-10",
          state: "finalizado",
          rival: { id: "r-2", name: "Rival" },
          result: { goalsFor: 2, goalsAgainst: 1 },
          events: [],
        },
      })
    );

    expect(firstSnapshot).toEqual({
      game: null,
      loading: false,
    });
    expect(secondSnapshot.game?.id).toBe("g-2");
    expect(secondSnapshot.loading).toBe(false);
  });
});
