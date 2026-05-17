import { describe, expect, it } from "vitest";

import {
  dashboardNewsByIdQuery,
  dashboardNewsListQuery,
  parseDashboardNewsInput,
} from "./news.js";

describe("dashboard news api input", () => {
  it("acepta datos válidos para una noticia", () => {
    expect(
      parseDashboardNewsInput({
        title: "Nueva noticia",
        description: "Descripción corta",
        date: "2026-05-16T21:30:00.000Z",
        slug: "nueva-noticia",
      })
    ).toEqual({
      title: "Nueva noticia",
      description: "Descripción corta",
      date: "2026-05-16T21:30:00.000Z",
      slug: "nueva-noticia",
    });
  });

  it("rechaza slugs inválidos", () => {
    expect(
      parseDashboardNewsInput({
        title: "Nueva noticia",
        description: "Descripción corta",
        date: "2026-05-16T21:30:00.000Z",
        slug: "Nueva Noticia",
      })
    ).toBeNull();
  });

  it("excluye drafts de Sanity en las lecturas del dashboard", () => {
    expect(dashboardNewsListQuery).toContain(
      '!(_id in path("drafts.**"))'
    );
    expect(dashboardNewsByIdQuery).toContain(
      '!(_id in path("drafts.**"))'
    );
  });
});
