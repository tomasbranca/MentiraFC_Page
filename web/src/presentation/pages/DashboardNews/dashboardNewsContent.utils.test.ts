import { describe, expect, it } from "vitest";

import type { NewsContentBlock } from "../../../types/models";
import {
  createImageEditorBlock,
  createRichTextEditorBlock,
  createVideoEditorBlock,
  getDashboardNewsContentImageFiles,
  hasDashboardNewsContent,
  serializeDashboardNewsEditorBlocks,
  toDashboardNewsEditorBlocks,
  validateDashboardNewsEditorBlocks,
} from "./dashboardNewsContent.utils";

describe("dashboardNewsContent utils", () => {
  it("agrupa bloques de texto editables y deja readonly los no soportados", () => {
    const content: NewsContentBlock[] = [
      {
        _key: "p1",
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [{ _key: "s1", _type: "span", marks: [], text: "Hola" }],
      },
      {
        _key: "p2",
        _type: "block",
        style: "h2",
        markDefs: [],
        children: [{ _key: "s2", _type: "span", marks: [], text: "Titulo" }],
      },
      {
        _key: "legacy",
        _type: "block",
        style: "h4",
        markDefs: [],
        children: [{ _key: "s3", _type: "span", marks: [], text: "Legacy" }],
      },
    ];

    expect(toDashboardNewsEditorBlocks(content).map((block) => block.kind)).toEqual([
      "richText",
      "readonly",
    ]);
  });

  it("serializa imagenes nuevas con uploadKey y expone su archivo asociado", () => {
    const file = new File(["image"], "portada.webp", { type: "image/webp" });
    const imageBlock = createImageEditorBlock({
      title: "Nueva noticia",
      file,
      previewUrl: "blob:preview",
    });

    expect(serializeDashboardNewsEditorBlocks([imageBlock])).toMatchObject([
      {
        _type: "image",
        alt: "Nueva noticia",
        uploadKey: imageBlock.value.uploadKey,
      },
    ]);
    expect(getDashboardNewsContentImageFiles([imageBlock])).toEqual({
      [imageBlock.value.uploadKey ?? ""]: file,
    });
  });

  it("considera contenido valido si hay texto, imagen o video", () => {
    const emptyText = createRichTextEditorBlock();
    const video = createVideoEditorBlock();
    video.value.url = "https://www.youtube.com/watch?v=abc";

    expect(hasDashboardNewsContent([emptyText])).toBe(false);
    expect(hasDashboardNewsContent([video])).toBe(true);
  });

  it("valida alt de imagenes y URLs de video", () => {
    const video = createVideoEditorBlock();
    const file = new File(["image"], "portada.webp", { type: "image/webp" });
    const image = createImageEditorBlock({
      title: "",
      file,
      previewUrl: "blob:preview",
    });

    video.value.url = "video-invalido";

    expect(validateDashboardNewsEditorBlocks([image])).toBe(
      "Cada imagen del contenido necesita texto alternativo."
    );
    expect(validateDashboardNewsEditorBlocks([video])).toBe(
      "Cada video del contenido necesita una URL válida."
    );
  });
});
