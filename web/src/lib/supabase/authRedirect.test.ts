import { afterEach, describe, expect, it, vi } from "vitest";

describe("auth redirect helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("usa el origen actual para local, preview o producción", async () => {
    vi.stubGlobal("window", {
      location: {
        origin: "http://localhost:5174",
      },
    });

    const { buildPasswordResetRedirectUrl } = await import("./authRedirect");

    expect(buildPasswordResetRedirectUrl()).toBe(
      "http://localhost:5174/nueva-contrasena"
    );
  });

  it("normaliza Vercel preview cuando no hay window", async () => {
    vi.stubEnv("VITE_VERCEL_URL", "mentira-fc-preview.vercel.app");

    const { buildPasswordResetRedirectUrl } = await import("./authRedirect");

    expect(buildPasswordResetRedirectUrl()).toBe(
      "https://mentira-fc-preview.vercel.app/nueva-contrasena"
    );
  });

  it("usa VITE_SITE_URL como fallback de producción", async () => {
    vi.stubEnv("VITE_SITE_URL", "https://mentirafc.vercel.app/");

    const { buildPasswordResetRedirectUrl } = await import("./authRedirect");

    expect(buildPasswordResetRedirectUrl()).toBe(
      "https://mentirafc.vercel.app/nueva-contrasena"
    );
  });
});
