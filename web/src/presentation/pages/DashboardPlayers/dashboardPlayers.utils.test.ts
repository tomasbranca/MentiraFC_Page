import { describe, expect, it } from "vitest";

import {
  buildDashboardPlayerDraftInput,
  buildDashboardPlayerMutationInput,
  validateDashboardPlayerImageDimensions,
  validateDashboardPlayerImageFile,
  validateDashboardPlayerInput,
  validateDashboardPlayerRatings,
} from "./dashboardPlayers.utils";

const createValues = () => ({
  name: "Tomas",
  lastName: "Mentira",
  number: "10",
  position: "del" as const,
  dominantFoot: "right" as const,
  birthDate: "2003-06-12",
  fieldRatings: {
    speed: "8",
    shooting: "",
    passing: "9",
    dribbling: "",
    defense: "",
    physical: "",
  },
  goalkeeperRatings: {
    jumping: "",
    saving: "",
    kicking: "",
    reflexes: "",
    speed: "",
    positioning: "",
  },
});

describe("dashboard players utils", () => {
  it("valida campos obligatorios y convierte valoraciones publicables", () => {
    expect(
      validateDashboardPlayerInput({
        ...createValues(),
        name: "",
        number: "",
        position: "",
      })
    ).toMatchObject({
      name: "Escribi el nombre.",
      number: "Carga un numero valido.",
      position: "Elegi la posicion.",
    });
    expect(buildDashboardPlayerMutationInput(createValues())).toEqual({
      name: "Tomas",
      lastName: "Mentira",
      number: 10,
      position: "del",
      dominantFoot: "right",
      birthDate: "2003-06-12",
      fieldRatings: {
        speed: 8,
        passing: 9,
      },
      goalkeeperRatings: undefined,
    });
  });

  it("mantiene borradores incompletos y exige rangos de valoraciones", () => {
    expect(
      buildDashboardPlayerDraftInput({
        ...createValues(),
        number: "",
      }).number
    ).toBeUndefined();
    expect(
      validateDashboardPlayerRatings({
        ...createValues(),
        fieldRatings: {
          ...createValues().fieldRatings,
          speed: "11",
        },
      })
    ).toBe("Las valoraciones deben ser numeros enteros del 1 al 10.");
  });

  it("valida fotos por formato, peso y dimensiones", () => {
    expect(validateDashboardPlayerImageFile({ type: "image/gif", size: 100 })).toBe(
      "La foto debe ser JPG, PNG o WebP."
    );
    expect(
      validateDashboardPlayerImageFile({
        type: "image/webp",
        size: 5 * 1024 * 1024,
      })
    ).toBe("La foto no puede superar 4 MB en produccion.");
    expect(
      validateDashboardPlayerImageDimensions({ width: 16000, height: 16001 })
    ).toBe("La foto supera el limite de 256 megapixeles de Sanity.");
  });
});
