import { describe, expect, it } from "vitest";

import {
  dashboardNewsByIdQuery,
  dashboardNewsListQuery,
  getDashboardNewsPageQuery,
  parseDashboardNewsDraftFormData,
  parseDashboardNewsDraftInput,
  parseDashboardNewsFormData,
  parseDashboardNewsInput,
  validateDashboardNewsContent,
  validateDashboardNewsImageFile,
} from "./news.js";
import {
  DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES as DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES_FOR_API,
  DASHBOARD_NEWS_IMAGE_MAX_BYTES as DASHBOARD_NEWS_IMAGE_MAX_BYTES_FOR_API,
} from "./newsImage.js";
import {
  DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES as DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES_FOR_UI,
  DASHBOARD_NEWS_IMAGE_MAX_BYTES as DASHBOARD_NEWS_IMAGE_MAX_BYTES_FOR_UI,
} from "../../src/types/dashboard";

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
    formData.set(
      "content",
      JSON.stringify([
        {
          _key: "paragraph-1",
          _type: "block",
          style: "normal",
          markDefs: [],
          children: [
            { _key: "span-1", _type: "span", marks: [], text: "Contenido" },
          ],
        },
      ])
    );
    formData.set("useDefaultImage", "true");
    formData.set("coverImage", file, file.name);

    expect(parseDashboardNewsFormData(formData)).toMatchObject({
      title: "Nueva noticia",
      slug: "nueva-noticia",
      imageAlt: "Portada de prueba",
      coverImage: file,
      useDefaultImage: true,
      content: [
        {
          _key: "paragraph-1",
          _type: "block",
          style: "normal",
        },
      ],
    });
  });

  it("acepta borradores incompletos", () => {
    expect(
      parseDashboardNewsDraftInput({
        title: "",
        description: "",
        date: "",
        slug: "Titulo provisorio",
        imageAlt: "",
      })
    ).toEqual({
      title: "",
      description: "",
      date: "",
      slug: "Titulo provisorio",
      imageAlt: "",
    });

    const formData = new FormData();

    formData.set("content", JSON.stringify([]));

    expect(parseDashboardNewsDraftFormData(formData)).toMatchObject({
      title: "",
      description: "",
      content: [],
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

  it("mantiene alineadas las restricciones de imagen entre API y dashboard", () => {
    expect(DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES_FOR_API).toEqual(
      DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES_FOR_UI
    );
    expect(DASHBOARD_NEWS_IMAGE_MAX_BYTES_FOR_API).toBe(
      DASHBOARD_NEWS_IMAGE_MAX_BYTES_FOR_UI
    );
  });

  it("valida contenido no vacio, imagenes internas y videos por URL", () => {
    expect(
      validateDashboardNewsContent({
        title: "Nueva noticia",
        description: "Descripción corta",
        date: "2026-05-16T21:30:00.000Z",
        slug: "nueva-noticia",
        imageAlt: "Portada",
        content: [],
      })
    ).toBe("Agregá al menos un bloque de contenido antes de guardar.");

    expect(
      validateDashboardNewsContent({
        title: "Nueva noticia",
        description: "Descripción corta",
        date: "2026-05-16T21:30:00.000Z",
        slug: "nueva-noticia",
        imageAlt: "Portada",
        content: [
          {
            _key: "video-1",
            _type: "video",
            url: "nota-video",
          },
        ],
      })
    ).toBe("Cada video del contenido necesita una URL válida.");

    const contentImageFile = new File(["image"], "interna.webp", {
      type: "image/webp",
    });

    expect(
      validateDashboardNewsContent({
        title: "Nueva noticia",
        description: "Descripción corta",
        date: "2026-05-16T21:30:00.000Z",
        slug: "nueva-noticia",
        imageAlt: "Portada",
        content: [
          {
            _key: "image-1",
            _type: "image",
            alt: "Festejo",
            uploadKey: "upload-1",
          },
        ],
        contentImageFiles: {
          "upload-1": contentImageFile,
        },
      })
    ).toBeNull();

    expect(
      validateDashboardNewsContent({
        title: "Nueva noticia",
        description: "Descripción corta",
        date: "2026-05-16T21:30:00.000Z",
        slug: "nueva-noticia",
        imageAlt: "Portada",
        content: [
          {
            _key: "paragraph-1",
            _type: "block",
            style: "normal",
            markDefs: [
              {
                _key: "unsafe-link",
                _type: "link",
                href: "javascript:alert(1)",
              },
            ],
            children: [
              {
                _key: "span-1",
                _type: "span",
                marks: ["unsafe-link"],
                text: "Nope",
              },
            ],
          },
        ],
      })
    ).toBe("Cada enlace del contenido necesita una URL segura.");
  });

  it("lee publicados y borradores en las lecturas del dashboard", () => {
    expect(dashboardNewsListQuery).toContain('*[_type == "news"]');
    expect(dashboardNewsByIdQuery).toContain("_id == $draftId");
    expect(dashboardNewsListQuery).toContain('"imageAssetId": image.asset->_id');
    expect(dashboardNewsListQuery).not.toContain("content[]");
    expect(dashboardNewsByIdQuery).toContain('"imageAssetId": asset->_id');
  });

  it("arma la query paginada con slice por parametros y sort whitelisteado", () => {
    const query = getDashboardNewsPageQuery("title", "asc");

    expect(query).toContain("[$offset...$end]");
    expect(query).toContain("order(title asc, _id asc)");
    expect(query).toContain('"total": count(');
    expect(query).not.toContain("content[]");
  });
});
