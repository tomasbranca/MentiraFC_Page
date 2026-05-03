import { describe, expect, it } from "vitest";

import type { Player } from "../../../types/models";
import { getPlayerRatingHexagonPoints } from "./playerRatingsHexagon.utils";

const createPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: "player-1",
  name: "Agustin",
  lastName: "Sanchez",
  fullName: "Agustin Sanchez",
  number: 2,
  position: "def",
  ...overrides,
});

describe("playerRatingsHexagon.utils", () => {
  it("ordena los atributos de jugadores de campo desde el vertice superior en sentido horario", () => {
    const points = getPlayerRatingHexagonPoints(
      createPlayer({
        fieldRatings: {
          speed: 8,
          shooting: 4,
          passing: 6,
          dribbling: 7,
          defense: 9,
          physical: 10,
        },
      })
    );

    expect(points).toEqual([
      { label: "VEL", value: 8 },
      { label: "TIR", value: 4 },
      { label: "PAS", value: 6 },
      { label: "REG", value: 7 },
      { label: "DEF", value: 9 },
      { label: "FIS", value: 10 },
    ]);
  });

  it("ordena los atributos de arqueros desde el vertice superior en sentido horario", () => {
    const points = getPlayerRatingHexagonPoints(
      createPlayer({
        position: "arq",
        goalkeeperRatings: {
          jumping: 8,
          saving: 9,
          kicking: 5,
          reflexes: 10,
          speed: 6,
          positioning: 7,
        },
      })
    );

    expect(points).toEqual([
      { label: "SAL", value: 8 },
      { label: "PAR", value: 9 },
      { label: "SAQ", value: 5 },
      { label: "REF", value: 10 },
      { label: "VEL", value: 6 },
      { label: "POS", value: 7 },
    ]);
  });

  it("no devuelve datos si falta cualquier rating del set correspondiente", () => {
    const points = getPlayerRatingHexagonPoints(
      createPlayer({
        fieldRatings: {
          speed: 8,
          shooting: 4,
          passing: 6,
          dribbling: 7,
          defense: 9,
        },
      })
    );

    expect(points).toBeNull();
  });

  it("ignora ratings de campo cuando el jugador actualmente es arquero", () => {
    const points = getPlayerRatingHexagonPoints(
      createPlayer({
        position: "arq",
        fieldRatings: {
          speed: 8,
          shooting: 4,
          passing: 6,
          dribbling: 7,
          defense: 9,
          physical: 10,
        },
      })
    );

    expect(points).toBeNull();
  });
});
