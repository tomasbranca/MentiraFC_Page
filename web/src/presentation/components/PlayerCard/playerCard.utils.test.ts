import { describe, expect, it } from "vitest";

import type { Player } from "../../../types/models";
import { getPlayerLink } from "./playerCard.utils";

const createPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: "player-1",
  name: "Tomas",
  lastName: "Garcia",
  fullName: "Tomas Garcia",
  ...overrides,
});

describe("playerCard.utils", () => {
  it("usa el slug como ruta canonica cuando existe", () => {
    expect(getPlayerLink(createPlayer({ slug: "tomas-garcia" }))).toBe(
      "/plantel/tomas-garcia"
    );
  });

  it("usa el id como fallback cuando el jugador no tiene slug", () => {
    expect(getPlayerLink(createPlayer({ slug: undefined }))).toBe(
      "/plantel/player-1"
    );
  });

  it("usa el id como fallback cuando el slug esta vacio", () => {
    expect(getPlayerLink(createPlayer({ slug: "   " }))).toBe(
      "/plantel/player-1"
    );
  });
});
