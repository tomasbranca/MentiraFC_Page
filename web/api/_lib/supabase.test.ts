import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createAdminSupabaseClient,
  createPublicSupabaseClient,
  createUserSupabaseClient,
} from "./supabase";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({})),
}));

const stubPublicSupabaseEnv = () => {
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "publishable-key");
};

describe("server Supabase clients", () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  it("crea un cliente publico solo con publishable key", () => {
    stubPublicSupabaseEnv();

    createPublicSupabaseClient();

    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "publishable-key",
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    );

    const options = vi.mocked(createClient).mock.calls[0]?.[2] as Record<
      string,
      unknown
    >;

    expect(options).not.toHaveProperty("global");
  });

  it("crea un cliente de usuario con token Bearer y respeta RLS", () => {
    stubPublicSupabaseEnv();
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    createUserSupabaseClient(" user-token ");

    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "publishable-key",
      expect.objectContaining({
        global: {
          headers: {
            Authorization: "Bearer user-token",
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    );
  });

  it("rechaza clientes de usuario sin token", () => {
    stubPublicSupabaseEnv();

    expect(() => createUserSupabaseClient(" ")).toThrow("Missing auth token.");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("crea un cliente admin solo con service role server-side", () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    createAdminSupabaseClient();

    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role-key",
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    );
  });

  it("falla explicitamente si falta la service role del cliente admin", () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    expect(() => createAdminSupabaseClient()).toThrow(
      "Supabase admin environment variables are not configured."
    );
    expect(createClient).not.toHaveBeenCalled();
  });
});
