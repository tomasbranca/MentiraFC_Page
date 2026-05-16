import { afterEach, describe, expect, it, vi } from "vitest";

describe("supabase client bootstrap", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("permite cargar la app aunque Supabase no este configurado", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");

    const { getSupabaseClient, isSupabaseConfigured } = await import("./supabase");

    expect(isSupabaseConfigured).toBe(false);
    expect(getSupabaseClient()).toBeNull();
  });
});
