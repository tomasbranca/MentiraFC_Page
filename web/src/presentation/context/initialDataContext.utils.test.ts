import { describe, expect, it } from "vitest";

import {
  mergeHomeCriticalIntoInitialData,
  shouldLoadHomeCriticalData,
} from "./initialDataContext.utils";
import type { InitialDataPayload } from "../../data/getInitialData";
import { createEmptyInitialData } from "../../data/getInitialData";

const createPayload = (
  overrides: Partial<InitialDataPayload> = {}
): InitialDataPayload => ({
  ...createEmptyInitialData(),
  ...overrides,
});

describe("initialDataContext.utils", () => {
  it("solo precarga Home en segundo plano cuando estamos fuera de Home y sin noticias", () => {
    expect(
      shouldLoadHomeCriticalData({
        newsCount: 0,
        bootstrapScope: "news-detail",
        pathname: "/noticias/una-noticia",
        previousPathname: "/noticias/una-noticia",
      })
    ).toBe(true);
    expect(
      shouldLoadHomeCriticalData({
        newsCount: 0,
        bootstrapScope: "player-detail",
        pathname: "/plantel/un-jugador",
        previousPathname: "/plantel/un-jugador",
      })
    ).toBe(true);
    expect(
      shouldLoadHomeCriticalData({
        newsCount: 0,
        bootstrapScope: "staff-detail",
        pathname: "/plantel/staff/un-integrante",
        previousPathname: "/plantel/staff/un-integrante",
      })
    ).toBe(true);
    expect(
      shouldLoadHomeCriticalData({
        newsCount: 3,
        bootstrapScope: "news-detail",
        pathname: "/noticias/una-noticia",
        previousPathname: "/noticias/una-noticia",
      })
    ).toBe(false);
    expect(
      shouldLoadHomeCriticalData({
        newsCount: 0,
        bootstrapScope: "empty",
        pathname: "/",
        previousPathname: "/",
      })
    ).toBe(false);
    expect(
      shouldLoadHomeCriticalData({
        newsCount: 0,
        bootstrapScope: "bootstrap-error",
        pathname: "/",
        previousPathname: "/ingresar",
      })
    ).toBe(false);
  });

  it("hidrata Home al volver desde Login con bootstrap vacio", () => {
    expect(
      shouldLoadHomeCriticalData({
        newsCount: 0,
        bootstrapScope: "empty",
        pathname: "/",
        previousPathname: "/ingresar",
      })
    ).toBe(true);
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
