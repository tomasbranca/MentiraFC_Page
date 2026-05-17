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

  it("renderiza enlaces internos y externos", () => {
    const content: NewsContentBlock[] = [
      {
        _key: "paragraph-links",
        _type: "block",
        style: "normal",
        markDefs: [
          { _key: "internal-link", _type: "link", href: "/plantel" },
          { _key: "external-link", _type: "link", href: "https://example.com" },
        ],
        children: [
          {
            _key: "span-internal",
            _type: "span",
            marks: ["internal-link"],
            text: "Plantel",
          },
          {
            _key: "span-external",
            _type: "span",
            marks: ["external-link"],
            text: "Sitio externo",
          },
        ],
      },
    ];

    const markup = renderToStaticMarkup(<NewsRichContent content={content} />);

    expect(markup).toContain('href="/plantel"');
    expect(markup).toContain('href="https://example.com"');
    expect(markup).toContain('target="_blank"');
  });

  it("no renderiza hrefs inseguros", () => {
    const content: NewsContentBlock[] = [
      {
        _key: "paragraph-links",
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
            _key: "span-unsafe",
            _type: "span",
            marks: ["unsafe-link"],
            text: "No ejecutar",
          },
        ],
      },
    ];

    const markup = renderToStaticMarkup(<NewsRichContent content={content} />);

    expect(markup).toContain("No ejecutar");
    expect(markup).not.toContain("javascript:alert(1)");
  });
});
