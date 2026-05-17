import { describe, expect, it } from "vitest";

import {
  buildNewsSlug,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  validateDashboardNewsImageDimensions,
  validateDashboardNewsImageFile,
  validateDashboardNewsInput,
} from "./dashboardNews.utils";

describe("dashboardNews utils", () => {
  it("genera slugs limpios a partir de títulos", () => {
    expect(buildNewsSlug("Próximo partido: Mentira FC vs Pasala")).toBe(
      "proximo-partido-mentira-fc-vs-pasala"
    );
  });

  it("convierte fechas locales a ISO", () => {
    expect(fromDatetimeLocalValue("2026-05-16T21:30")).toContain(
      "2026-05-17T00:30:00.000Z"
    );
  });

  it("convierte ISO a fecha local argentina", () => {
    expect(toDatetimeLocalValue("2026-05-17T00:30:00.000Z")).toBe(
      "2026-05-16T21:30"
    );
  });

  it("valida los campos editables de la noticia", () => {
    expect(
      validateDashboardNewsInput({
        title: "",
        description: "",
        date: "",
        slug: "",
        imageAlt: "",
      })
    ).toEqual({
      title: "Escribí un título.",
      description: "Escribí una descripción.",
      slug: "Escribí un slug.",
      date: "Elegí una fecha válida.",
      imageAlt: "Escribí un texto alternativo.",
    });
  });

  it("valida formato y peso de la imagen de portada", () => {
    expect(validateDashboardNewsImageFile({ type: "image/gif", size: 100 })).toBe(
      "La imagen debe ser JPG, PNG o WebP."
    );
    expect(
      validateDashboardNewsImageFile({ type: "image/jpeg", size: 5 * 1024 * 1024 })
    ).toBe("La imagen no puede superar 4 MB en producción.");
    expect(
      validateDashboardNewsImageFile({ type: "image/webp", size: 1024 })
    ).toBeNull();
  });

  it("valida el límite de megapíxeles de Sanity", () => {
    expect(
      validateDashboardNewsImageDimensions({ width: 16000, height: 16001 })
    ).toBe("La imagen supera el límite de 256 megapíxeles de Sanity.");
    expect(
      validateDashboardNewsImageDimensions({ width: 16000, height: 16000 })
    ).toBeNull();
  });
});
