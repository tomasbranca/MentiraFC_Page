import { describe, expect, it } from "vitest";

import {
  mergeHomeCriticalIntoInitialData,
  shouldLoadHomeCriticalData,
} from "./initialDataContext.utils";
import type { InitialDataPayload } from "../../data/getInitialData";

const createPayload = (
  overrides: Partial<InitialDataPayload> = {}
): InitialDataPayload => ({
  bootstrapScope: "empty",
  news: [],
  galleries: [],
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

describe("initialDataContext.utils", () => {
  it("solo precarga Home en segundo plano cuando estamos fuera de Home y sin noticias", () => {
    expect(shouldLoadHomeCriticalData(0, "news-detail")).toBe(true);
    expect(shouldLoadHomeCriticalData(0, "player-detail")).toBe(true);
    expect(shouldLoadHomeCriticalData(0, "staff-detail")).toBe(true);
    expect(shouldLoadHomeCriticalData(3, "news-detail")).toBe(false);
    expect(shouldLoadHomeCriticalData(0, "empty")).toBe(false);
    expect(shouldLoadHomeCriticalData(0, "bootstrap-error")).toBe(false);
  });

  it("mezcla Home critico sin perder el detalle actual de noticia o jugador", () => {
    const previousData = createPayload({
      bootstrapScope: "news-detail",
      currentNewsDetail: {
        slug: "una-noticia",
        newsItem: { id: "n-1", title: "Detalle", date: "2025-01-02", slug: "una-noticia" },
        suggestedNews: [],
      },
    });
    const homeData = createPayload({
      bootstrapScope: "home-critical",
      news: [{ id: "n-2", title: "Home", date: "2025-01-03", slug: "home" }],
      latestGame: { id: "g-1", date: "2025-01-05", state: "por_jugar", rival: { id: "r-1", name: "Rival" }, result: { goalsFor: 0, goalsAgainst: 0 }, events: [], playedPlayers: [] },
    });

    const mergedData = mergeHomeCriticalIntoInitialData(previousData, homeData);

    expect(mergedData.bootstrapScope).toBe("home-critical");
    expect(mergedData.news).toHaveLength(1);
    expect(mergedData.latestGame?.id).toBe("g-1");
    expect(mergedData.currentNewsDetail).toEqual(previousData.currentNewsDetail);
  });
});
