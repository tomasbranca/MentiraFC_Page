import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { NewsContentBlock } from "../../../types/models";
import NewsRichContent from "./NewsRichContent";

describe("NewsRichContent", () => {
  it("renderiza bloques de texto, imagen y videos intercalados", () => {
    const content: NewsContentBlock[] = [
      {
        _key: "paragraph-1",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "span-1",
            _type: "span",
            text: "Primer bloque de la noticia.",
          },
        ],
        markDefs: [],
      },
      {
        _key: "image-1",
        _type: "image",
        alt: "Equipo festejando",
        caption: "El festejo despues del gol.",
        imageUrl: "https://cdn.sanity.io/images/project/dataset/inline.jpg",
      },
      {
        _key: "paragraph-2",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "span-2",
            _type: "span",
            text: "Segundo bloque de la noticia.",
          },
        ],
        markDefs: [],
      },
      {
        _key: "video-1",
        _type: "video",
        title: "Resumen",
        url: "https://www.youtube.com/watch?v=abc123",
        caption: "El resumen del partido.",
      },
      {
        _key: "video-2",
        _type: "video",
        title: "Gol",
        fileUrl: "https://cdn.sanity.io/files/project/dataset/gol.mp4",
      },
    ];

    const markup = renderToStaticMarkup(<NewsRichContent content={content} />);

    expect(markup).toContain("Primer bloque de la noticia.");
    expect(markup).toContain("Segundo bloque de la noticia.");
    expect(markup).toContain('alt="Equipo festejando"');
    expect(markup).toContain("El festejo despues del gol.");
    expect(markup).toContain("https://www.youtube.com/embed/abc123");
    expect(markup).toContain("https://cdn.sanity.io/files/project/dataset/gol.mp4");
  });
});
