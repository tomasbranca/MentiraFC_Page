import { describe, expect, it } from "vitest";

import {
  buildNewsSlug,
  fromDatetimeLocalValue,
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

  it("valida los campos editables de la noticia", () => {
    expect(
      validateDashboardNewsInput({
        title: "",
        description: "",
        date: "",
        slug: "",
      })
    ).toEqual({
      title: "Escribí un título.",
      description: "Escribí una descripción.",
      slug: "Escribí un slug.",
      date: "Elegí una fecha válida.",
    });
  });
});
