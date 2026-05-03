import { describe, expect, it } from "vitest";

import { adaptGame } from "./games.adapter";

const createSanityGame = (overrides: Record<string, unknown> = {}) => ({
  _id: "game-1",
  date: "2026-01-15T20:00:00Z",
  state: "finalizado",
  result: {
    goalsFor: 2,
    goalsAgainst: 1,
  },
  rival: {
    _id: "team-1",
    name: "Rival FC",
  },
  events: [],
  playedPlayers: [],
  ...overrides,
});

describe("games.adapter", () => {
  it("adapta jugadores que jugaron el partido", () => {
    const game = adaptGame(
      createSanityGame({
        playedPlayers: [
          {
            _id: "player-1",
            name: "Tomas",
            lastName: "Garcia",
            slug: { current: "tomas-garcia" },
          },
          {
            _id: "player-2",
            name: "Juan",
            lastName: "Perez",
          },
        ],
      })
    );

    expect(game?.playedPlayers).toEqual([
      {
        id: "player-1",
        name: "Tomas",
        lastName: "Garcia",
        slug: "tomas-garcia",
      },
      {
        id: "player-2",
        name: "Juan",
        lastName: "Perez",
        slug: undefined,
      },
    ]);
  });

  it("normaliza partidos sin lista de jugadores como arreglo vacio", () => {
    expect(
      adaptGame(createSanityGame({ playedPlayers: undefined }))?.playedPlayers
    ).toEqual([]);
  });
});
