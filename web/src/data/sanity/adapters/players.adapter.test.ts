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

  it("propaga la pierna habil del jugador", () => {
    expect(
      adaptPlayer(createSanityPlayer({ dominantFoot: "left" }))
    ).toMatchObject({
      id: "player-1",
      dominantFoot: "left",
    });
  });

  it("normaliza ratings completos de jugador de campo", () => {
    expect(
      adaptPlayer(
        createSanityPlayer({
          fieldRatings: {
            speed: 8,
            shooting: "7",
            passing: 6,
            dribbling: 5,
            defense: 9,
            physical: 10,
          },
        })
      )
    ).toMatchObject({
      fieldRatings: {
        speed: 8,
        shooting: 7,
        passing: 6,
        dribbling: 5,
        defense: 9,
        physical: 10,
      },
    });
  });

  it("conserva ratings parciales sin bloquear el jugador", () => {
    expect(
      adaptPlayer(
        createSanityPlayer({
          fieldRatings: {
            speed: 8,
            shooting: 11,
          },
        })
      )
    ).toMatchObject({
      fieldRatings: {
        speed: 8,
        shooting: null,
        passing: null,
        dribbling: null,
        defense: null,
        physical: null,
      },
    });
  });
});
