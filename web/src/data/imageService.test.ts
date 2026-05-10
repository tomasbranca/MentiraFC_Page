import { describe, expect, it } from "vitest";

import { getImageSrcSet, getImageUrl } from "./imageService";

describe("imageService", () => {
  it("devuelve string vacio para imagenes ausentes o vacias", () => {
    expect(getImageUrl(undefined)).toBe("");
    expect(getImageUrl(null)).toBe("");
    expect(getImageUrl("   ")).toBe("");
  });

  it("mantiene urls externas sin pasar por el builder de Sanity", () => {
    expect(getImageUrl(" https://example.com/logo.png ")).toBe(
      "https://example.com/logo.png"
    );
  });

  it("aplica transformaciones CDN por defecto a urls de Sanity", () => {
    const imageUrl = getImageUrl(
      "https://cdn.sanity.io/images/project/dataset/logo.png"
    );
    const url = new URL(imageUrl);

    expect(url.searchParams.get("auto")).toBe("format");
    expect(url.searchParams.get("q")).toBe("75");
    expect(url.searchParams.has("fm")).toBe(false);
  });

  it("agrega parametros de optimizacion a urls CDN de Sanity", () => {
    const imageUrl = getImageUrl(
      "https://cdn.sanity.io/images/project/dataset/logo.png",
      {
        width: 80,
        height: 80,
        fit: "max",
        quality: 70,
        autoFormat: true,
      }
    );
    const url = new URL(imageUrl);

    expect(url.searchParams.get("w")).toBe("80");
    expect(url.searchParams.get("h")).toBe("80");
    expect(url.searchParams.get("fit")).toBe("max");
    expect(url.searchParams.get("q")).toBe("70");
    expect(url.searchParams.get("auto")).toBe("format");
    expect(url.searchParams.has("fm")).toBe(false);
  });

  it("construye urls para refs de asset de Sanity", () => {
    const imageUrl = getImageUrl(" image-abc123-120x120-png ", {
      width: 32,
      height: 32,
      fit: "max",
      autoFormat: true,
    });
    const url = new URL(imageUrl);

    expect(url.origin).toBe("https://cdn.sanity.io");
    expect(url.pathname).toContain("/abc123-120x120.png");
    expect(url.searchParams.get("w")).toBe("32");
    expect(url.searchParams.get("h")).toBe("32");
    expect(url.searchParams.get("fit")).toBe("max");
    expect(url.searchParams.get("q")).toBe("75");
    expect(url.searchParams.get("auto")).toBe("format");
  });

  it("permite desactivar auto format cuando se necesita un formato fijo", () => {
    const imageUrl = getImageUrl(
      "https://cdn.sanity.io/images/project/dataset/logo.png",
      {
        autoFormat: false,
        format: "png",
      }
    );
    const url = new URL(imageUrl);

    expect(url.searchParams.get("q")).toBe("75");
    expect(url.searchParams.has("auto")).toBe(false);
    expect(url.searchParams.get("fm")).toBe("png");
  });

  it("devuelve string vacio para refs invalidas de objeto", () => {
    expect(getImageUrl({ asset: { _ref: "" } })).toBe("");
  });

  it("omite entradas vacias en srcset", () => {
    expect(getImageSrcSet(null, [320, 640])).toBe("");
  });

  it("permite calcular la altura de cada entrada del srcset", () => {
    const srcSet = getImageSrcSet(
      "https://cdn.sanity.io/images/project/dataset/photo.jpg",
      [320, 640],
      {
        height: (width) => Math.round(width * 0.75),
        fit: "crop",
      }
    );

    expect(srcSet).toContain("w=320");
    expect(srcSet).toContain("h=240");
    expect(srcSet).toContain("w=640");
    expect(srcSet).toContain("h=480");
  });
});
