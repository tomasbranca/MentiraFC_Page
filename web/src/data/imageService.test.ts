import { beforeEach, describe, expect, it, vi } from "vitest";

const sanityImageMock = vi.hoisted(() => {
  const builder = {
    width: vi.fn(),
    height: vi.fn(),
    fit: vi.fn(),
    quality: vi.fn(),
    auto: vi.fn(),
    format: vi.fn(),
    url: vi.fn(),
  };

  builder.width.mockReturnValue(builder);
  builder.height.mockReturnValue(builder);
  builder.fit.mockReturnValue(builder);
  builder.quality.mockReturnValue(builder);
  builder.auto.mockReturnValue(builder);
  builder.format.mockReturnValue(builder);
  builder.url.mockReturnValue("https://cdn.sanity.io/images/project/dataset/logo.png");

  return {
    builder,
    urlFor: vi.fn(() => builder),
  };
});

vi.mock("./sanity/sanity.image", () => ({
  urlFor: sanityImageMock.urlFor,
}));

import { getImageSrcSet, getImageUrl } from "./imageService";

describe("imageService", () => {
  beforeEach(() => {
    sanityImageMock.urlFor.mockClear();
    Object.values(sanityImageMock.builder).forEach((method) => {
      method.mockClear();
    });
    sanityImageMock.builder.url.mockReturnValue(
      "https://cdn.sanity.io/images/project/dataset/logo.png"
    );
  });

  it("devuelve string vacio para imagenes ausentes o vacias", () => {
    expect(getImageUrl(undefined)).toBe("");
    expect(getImageUrl(null)).toBe("");
    expect(getImageUrl("   ")).toBe("");
    expect(sanityImageMock.urlFor).not.toHaveBeenCalled();
  });

  it("mantiene urls externas sin pasar por el builder de Sanity", () => {
    expect(getImageUrl(" https://example.com/logo.png ")).toBe(
      "https://example.com/logo.png"
    );
    expect(sanityImageMock.urlFor).not.toHaveBeenCalled();
  });

  it("agrega parametros de optimizacion a urls CDN de Sanity", () => {
    const imageUrl = getImageUrl(
      "https://cdn.sanity.io/images/project/dataset/logo.png",
      {
        width: 80,
        height: 80,
        fit: "max",
        autoFormat: true,
        format: "webp",
      }
    );
    const url = new URL(imageUrl);

    expect(url.searchParams.get("w")).toBe("80");
    expect(url.searchParams.get("h")).toBe("80");
    expect(url.searchParams.get("fit")).toBe("max");
    expect(url.searchParams.get("auto")).toBe("format");
    expect(url.searchParams.get("fm")).toBe("webp");
    expect(sanityImageMock.urlFor).not.toHaveBeenCalled();
  });

  it("construye urls para refs de asset de Sanity", () => {
    const imageUrl = getImageUrl(" image-abc123-120x120-png ", {
      width: 32,
      height: 32,
      fit: "max",
      autoFormat: true,
    });

    expect(imageUrl).toBe("https://cdn.sanity.io/images/project/dataset/logo.png");
    expect(sanityImageMock.urlFor).toHaveBeenCalledWith(
      "image-abc123-120x120-png"
    );
    expect(sanityImageMock.builder.width).toHaveBeenCalledWith(32);
    expect(sanityImageMock.builder.height).toHaveBeenCalledWith(32);
    expect(sanityImageMock.builder.fit).toHaveBeenCalledWith("max");
    expect(sanityImageMock.builder.auto).toHaveBeenCalledWith("format");
  });

  it("no propaga errores del builder de Sanity", () => {
    sanityImageMock.urlFor.mockImplementationOnce(() => {
      throw new Error("Invalid image source");
    });

    expect(getImageUrl({ asset: { _ref: "" } })).toBe("");
  });

  it("omite entradas vacias en srcset", () => {
    expect(getImageSrcSet(null, [320, 640])).toBe("");
  });
});
