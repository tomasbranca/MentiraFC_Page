import { describe, expect, it } from "vitest";

import {
  buildDashboardGallerySlugFromGame,
  validateDashboardGalleryImageDimensions,
  validateDashboardGalleryImageFile,
  validateDashboardGalleryInput,
} from "./dashboardGalleries.utils";

describe("dashboardGalleries utils", () => {
  it("valida partido, slug, fotos y hero antes de publicar", () => {
    expect(
      validateDashboardGalleryInput({
        gameId: "",
        slug: "slug invalido",
        photos: [],
      })
    ).toEqual({
      gameId: "Elegi el partido finalizado de la galeria.",
      slug: "Usa minusculas, numeros y guiones, sin espacios.",
      photos: "Carga al menos una foto.",
    });
  });

  it("genera slugs desde el partido", () => {
    expect(
      buildDashboardGallerySlugFromGame({
        id: "games-1",
        date: "2026-05-20T18:00:00Z",
        rivalName: "Atlético Norte",
      })
    ).toBe("galeria-2026-05-20-atletico-norte");
  });

  it("calcula restricciones de foto", () => {
    expect(validateDashboardGalleryImageFile({ type: "image/gif", size: 100 })).toBe(
      "La foto debe ser JPG, PNG o WebP."
    );
    expect(
      validateDashboardGalleryImageDimensions({
        width: 16000,
        height: 16001,
      })
    ).toBe("La foto supera el limite de 256 megapixeles de Sanity.");
  });
});
