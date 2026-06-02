import { beforeEach, describe, expect, it, vi } from "vitest";

import { GAME_BY_ID_QUERY, LATEST_GAME_QUERY } from "../queries/games.queries";
import { sanityFreshClient } from "../client";
import { fetchSanityQuery } from "../sanityFetch";
import { getGameById, getLatestGame } from "./games.service";

vi.mock("../sanityFetch", () => ({
  fetchSanityQuery: vi.fn(),
}));

const fetchSanityQueryMock = vi.mocked(fetchSanityQuery);

const createSanityGame = (overrides: Record<string, unknown> = {}) => ({
  _id: "game-1",
  date: "2026-05-26T02:08:00.000Z",
  state: "por_jugar",
  location: "Futbol San Martin",
  competition: "Amistoso",
  rival: {
    _id: "team-1",
    name: "Kickeros",
    logoUrl: "https://cdn.sanity.io/images/project/dataset/logo.jpg",
  },
  result: null,
  events: [],
  playedPlayers: [],
  ...overrides,
});

describe("games.service", () => {
  beforeEach(() => {
    fetchSanityQueryMock.mockReset();
  });

  it("carga el partido destacado sin CDN para reflejar partidos recien publicados", async () => {
    fetchSanityQueryMock.mockResolvedValue(createSanityGame());

    const game = await getLatestGame();

    expect(fetchSanityQueryMock).toHaveBeenCalledWith(LATEST_GAME_QUERY, {
      client: sanityFreshClient,
    });
    expect(game).toMatchObject({
      id: "game-1",
      state: "por_jugar",
      rival: {
        name: "Kickeros",
      },
      result: {
        goalsFor: 0,
        goalsAgainst: 0,
      },
    });
  });

  it("mantiene soporte para el ultimo partido finalizado cuando no hay proximo", async () => {
    fetchSanityQueryMock.mockResolvedValue(
      createSanityGame({
        _id: "finished-game",
        state: "finalizado",
        result: {
          goalsFor: 1,
          goalsAgainst: 1,
        },
      })
    );

    const game = await getLatestGame();

    expect(game).toMatchObject({
      id: "finished-game",
      state: "finalizado",
      result: {
        goalsFor: 1,
        goalsAgainst: 1,
      },
    });
  });

  it("carga el detalle de un partido finalizado por id usando params", async () => {
    fetchSanityQueryMock.mockResolvedValue(
      createSanityGame({
        state: "finalizado",
        result: {
          goalsFor: 2,
          goalsAgainst: 0,
        },
      })
    );

    const game = await getGameById("game-1");

    expect(fetchSanityQueryMock).toHaveBeenCalledWith(GAME_BY_ID_QUERY, {
      client: sanityFreshClient,
      params: { id: "game-1" },
    });
    expect(game).toMatchObject({
      id: "game-1",
      state: "finalizado",
      result: {
        goalsFor: 2,
        goalsAgainst: 0,
      },
    });
  });

  it("rechaza ids invalidos antes de consultar Sanity", async () => {
    await expect(getGameById("../bad id")).resolves.toBeNull();

    expect(fetchSanityQueryMock).not.toHaveBeenCalled();
  });
});
