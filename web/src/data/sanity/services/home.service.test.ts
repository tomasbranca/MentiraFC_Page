import { beforeEach, describe, expect, it, vi } from "vitest";

import { HOME_CRITICAL_QUERY } from "../queries/home.queries";
import { sanityFreshClient } from "../client";
import { fetchSanityQuery } from "../sanityFetch";
import { getHomeCriticalData } from "./home.service";

vi.mock("../sanityFetch", () => ({
  fetchSanityQuery: vi.fn(),
}));

const fetchSanityQueryMock = vi.mocked(fetchSanityQuery);

describe("home.service", () => {
  beforeEach(() => {
    fetchSanityQueryMock.mockReset();
  });

  it("carga los datos criticos del inicio sin CDN para refrescar el partido destacado", async () => {
    fetchSanityQueryMock.mockResolvedValue({
      news: [],
      latestGame: {
        _id: "game-1",
        date: "2026-05-26T02:08:00.000Z",
        state: "por_jugar",
        location: "Futbol San Martin",
        competition: "Amistoso",
        rival: {
          _id: "team-1",
          name: "Kickeros",
        },
        result: null,
        events: [],
        playedPlayers: [],
      },
    });

    const data = await getHomeCriticalData();

    expect(fetchSanityQueryMock).toHaveBeenCalledWith(HOME_CRITICAL_QUERY, {
      client: sanityFreshClient,
    });
    expect(data.latestGame?.state).toBe("por_jugar");
    expect(data.latestGame?.result).toEqual({
      goalsFor: 0,
      goalsAgainst: 0,
    });
  });
});
