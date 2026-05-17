import { describe, expect, it } from "vitest";

import {
  dashboardNewsByIdQuery,
  dashboardNewsListQuery,
  parseDashboardNewsFormData,
  parseDashboardNewsInput,
  validateDashboardNewsImageFile,
} from "./news.js";

describe("dashboard news api input", () => {
  it("acepta datos válidos para una noticia", () => {
    expect(
      parseDashboardNewsInput({
        title: "Nueva noticia",
        description: "Descripción corta",
        date: "2026-05-16T21:30:00.000Z",
        slug: "nueva-noticia",
        imageAlt: "Jugadores festejando",
      })
    ).toEqual({
      title: "Nueva noticia",
      description: "Descripción corta",
      date: "2026-05-16T21:30:00.000Z",
      slug: "nueva-noticia",
      imageAlt: "Jugadores festejando",
    });
  });

  it("rechaza slugs inválidos", () => {
    expect(
      parseDashboardNewsInput({
        title: "Nueva noticia",
        description: "Descripción corta",
        date: "2026-05-16T21:30:00.000Z",
        slug: "Nueva Noticia",
        imageAlt: "Imagen",
      })
    ).toBeNull();
  });

  it("usa el título como texto alternativo cuando llega vacío", () => {
    expect(
      parseDashboardNewsInput({
        title: "Nueva noticia",
        description: "Descripción corta",
        date: "2026-05-16T21:30:00.000Z",
        slug: "nueva-noticia",
        imageAlt: "   ",
      })?.imageAlt
    ).toBe("Nueva noticia");
  });

  it("parsea FormData con imagen de portada", () => {
    const formData = new FormData();
    const file = new File(["image"], "portada.webp", { type: "image/webp" });

    formData.set("title", "Nueva noticia");
    formData.set("description", "Descripción corta");
    formData.set("date", "2026-05-16T21:30:00.000Z");
    formData.set("slug", "nueva-noticia");
    formData.set("imageAlt", "Portada de prueba");
    formData.set("useDefaultImage", "true");
    formData.set("coverImage", file, file.name);

    expect(parseDashboardNewsFormData(formData)).toMatchObject({
      title: "Nueva noticia",
      slug: "nueva-noticia",
      imageAlt: "Portada de prueba",
      coverImage: file,
      useDefaultImage: true,
    });
  });

  it("valida formato y peso de imagen en el servidor", () => {
    expect(
      validateDashboardNewsImageFile(
        new File(["image"], "portada.gif", { type: "image/gif" })
      )
    ).toBe("La imagen debe ser JPG, PNG o WebP.");

    expect(
      validateDashboardNewsImageFile(
        new File([new Uint8Array(5 * 1024 * 1024)], "portada.jpg", {
          type: "image/jpeg",
        })
      )
    ).toBe("La imagen no puede superar 4 MB en producción.");
  });

  it("excluye drafts de Sanity en las lecturas del dashboard", () => {
    expect(dashboardNewsListQuery).toContain(
      '!(_id in path("drafts.**"))'
    );
    expect(dashboardNewsByIdQuery).toContain(
      '!(_id in path("drafts.**"))'
    );
    expect(dashboardNewsListQuery).toContain('"imageAssetId": image.asset->_id');
  });
});
