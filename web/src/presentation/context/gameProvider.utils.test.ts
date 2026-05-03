import { describe, expect, it } from "vitest";

import type { InitialDataPayload } from "../../data/getInitialData";
import { getGameProviderSnapshot } from "./gameProvider.utils";

const createPayload = (
  overrides: Partial<InitialDataPayload> = {}
): InitialDataPayload => ({
  bootstrapScope: "empty",
  news: [],
  players: [],
  staff: [],
  games: [],
  goalEvents: [],
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

  it("no mantiene loading cuando el bootstrap termina en error", () => {
    expect(
      getGameProviderSnapshot(
        createPayload({ bootstrapScope: "bootstrap-error" })
      )
    ).toEqual({
      game: null,
      loading: false,
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
          playedPlayers: [],
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
