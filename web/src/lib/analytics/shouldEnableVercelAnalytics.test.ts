import { describe, expect, it } from "vitest";

import { shouldEnableVercelAnalytics } from "./shouldEnableVercelAnalytics";

describe("shouldEnableVercelAnalytics", () => {
  it("habilita analytics por defecto en production", () => {
    expect(shouldEnableVercelAnalytics({ PROD: true })).toBe(true);
  });

  it("mantiene analytics apagado por defecto fuera de production", () => {
    expect(shouldEnableVercelAnalytics({ PROD: false })).toBe(false);
  });

  it("permite forzar analytics con VITE_ENABLE_ANALYTICS=true", () => {
    expect(
      shouldEnableVercelAnalytics({
        PROD: false,
        VITE_ENABLE_ANALYTICS: "true",
      })
    ).toBe(true);
  });

  it("permite apagar analytics explicitamente en production", () => {
    expect(
      shouldEnableVercelAnalytics({
        PROD: true,
        VITE_ENABLE_ANALYTICS: "false",
      })
    ).toBe(false);
  });
});
