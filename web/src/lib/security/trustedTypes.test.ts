import { afterEach, describe, expect, it, vi } from "vitest";

import { installTrustedTypesPolicy, isTrustedScriptUrl } from "./trustedTypes";

describe("trustedTypes", () => {
  const origin = "https://mentirafc.vercel.app";

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("permite los scripts propios que inyecta Vercel", () => {
    expect(isTrustedScriptUrl("/_vercel/insights/script.js", origin)).toBe(
      true
    );
    expect(
      isTrustedScriptUrl("/_vercel/speed-insights/script.js", origin)
    ).toBe(true);
    expect(
      isTrustedScriptUrl(
        "https://va.vercel-scripts.com/v1/speed-insights/script.debug.js",
        origin
      )
    ).toBe(true);
    expect(
      isTrustedScriptUrl(
        "https://va.vercel-scripts.com/v1/speed-insights/script.js",
        origin
      )
    ).toBe(true);
    expect(
      isTrustedScriptUrl(
        "https://va.vercel-scripts.com/v1/script.debug.js",
        origin
      )
    ).toBe(true);
  });

  it("rechaza scripts externos o rutas no permitidas", () => {
    expect(isTrustedScriptUrl("https://example.com/script.js", origin)).toBe(
      false
    );
    expect(isTrustedScriptUrl("/assets/index.js", origin)).toBe(false);
    expect(
      isTrustedScriptUrl("https://va.vercel-scripts.com/unsafe.js", origin)
    ).toBe(false);
  });

  it("instala una politica default con HTML para librerias legacy", () => {
    const createPolicy = vi.fn();

    vi.stubGlobal("window", {
      location: {
        origin,
      },
      trustedTypes: {
        createPolicy,
      },
    });

    installTrustedTypesPolicy();

    expect(createPolicy).toHaveBeenCalledWith(
      "default",
      expect.objectContaining({
        createHTML: expect.any(Function),
        createScriptURL: expect.any(Function),
      })
    );
    expect(createPolicy.mock.calls[0]?.[1].createHTML("<style></style>")).toBe(
      "<style></style>"
    );
  });

  it("no vuelve a crear la politica default si ya existe", () => {
    const createPolicy = vi.fn();

    vi.stubGlobal("window", {
      location: {
        origin,
      },
      trustedTypes: {
        getPolicyNames: () => ["default"],
        createPolicy,
      },
    });

    installTrustedTypesPolicy();

    expect(createPolicy).not.toHaveBeenCalled();
  });
});
