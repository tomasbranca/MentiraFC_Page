import { describe, expect, it } from "vitest";

import { adaptPlayer } from "./players.adapter";

const createSanityPlayer = (overrides: Record<string, unknown> = {}) => ({
  _id: "player-1",
  name: "Tomas",
  lastName: "Garcia",
  number: 7,
  position: "del",
  ...overrides,
});

describe("players.adapter", () => {
  it("mantiene slug cuando Sanity lo devuelve como objeto", () => {
    expect(
      adaptPlayer(createSanityPlayer({ slug: { current: "tomas-garcia" } }))
    ).toMatchObject({
      id: "player-1",
      fullName: "Tomas Garcia",
      slug: "tomas-garcia",
    });
  });

  it("permite jugadores historicos sin slug para que la web use el id", () => {
    expect(adaptPlayer(createSanityPlayer({ slug: undefined }))).toMatchObject({
      id: "player-1",
      slug: undefined,
    });
  });

  it("normaliza slugs vacios como ausentes", () => {
    expect(
      adaptPlayer(createSanityPlayer({ slug: { current: "   " } }))
    ).toMatchObject({
      id: "player-1",
      slug: undefined,
    });
  });
});
