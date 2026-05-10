import { describe, expect, it } from "vitest";

import { isTrustedScriptUrl } from "./trustedTypes";

describe("trustedTypes", () => {
  const origin = "https://mentirafc.vercel.app";

  it("permite los scripts propios que inyecta Vercel", () => {
    expect(isTrustedScriptUrl("/_vercel/insights/script.js", origin)).toBe(
      true
    );
    expect(
      isTrustedScriptUrl("/_vercel/speed-insights/script.js", origin)
    ).toBe(true);
  });

  it("rechaza scripts externos o rutas no permitidas", () => {
    expect(isTrustedScriptUrl("https://example.com/script.js", origin)).toBe(
      false
    );
    expect(isTrustedScriptUrl("/assets/index.js", origin)).toBe(false);
  });
});
