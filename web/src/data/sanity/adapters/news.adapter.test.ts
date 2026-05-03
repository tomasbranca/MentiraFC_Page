import { describe, expect, it } from "vitest";

import { adaptSingleNews } from "./news.adapter";

const createSanityNews = (overrides: Record<string, unknown> = {}) => ({
  _id: "news-1",
  title: "Victoria importante",
  description: "Mentira FC gano un partido clave.",
  date: "2026-01-15T20:00:00Z",
  slug: { current: "victoria-importante" },
  imageUrl: "https://cdn.sanity.io/images/project/dataset/main.jpg",
  ...overrides,
});

describe("news.adapter", () => {
  it("conserva bloques de texto, imagen y video en el contenido", () => {
    const content = [
      {
        _key: "paragraph-1",
        _type: "block",
        children: [{ _key: "span-1", _type: "span", text: "Primer bloque" }],
      },
      {
        _key: "image-1",
        _type: "image",
        alt: "Equipo festejando",
        caption: "El festejo despues del gol.",
        imageUrl: "https://cdn.sanity.io/images/project/dataset/inline.jpg",
      },
      {
        _key: "video-1",
        _type: "video",
        title: "Resumen",
        fileUrl: "https://cdn.sanity.io/files/project/dataset/resumen.mp4",
      },
    ];

    const news = adaptSingleNews(createSanityNews({ content }));

    expect(news?.content).toEqual(content);
  });

  it("descarta noticias con contenido que no llega como arreglo", () => {
    expect(adaptSingleNews(createSanityNews({ content: "texto plano" }))).toBe(
      null
    );
  });
});
