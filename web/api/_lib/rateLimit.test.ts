import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  createAdminSupabaseClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("./supabase.js", () => ({
  createAdminSupabaseClient: supabaseMocks.createAdminSupabaseClient,
}));

import {
  __resetRateLimitsForTests,
  assertRateLimit,
  assertServerRateLimit,
  getClientIp,
  isRateLimitError,
} from "./rateLimit";
import { hashSecurityIdentifier } from "./securityLog";

describe("rate limit helpers", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    __resetRateLimitsForTests();
    vi.restoreAllMocks();
    supabaseMocks.createAdminSupabaseClient.mockReturnValue({
      rpc: supabaseMocks.rpc,
    });
    supabaseMocks.rpc.mockResolvedValue({ data: 0, error: null });
  });

  it("bloquea acciones que exceden la ventana configurada", () => {
    assertRateLimit({
      action: "comment:create",
      identifier: "user-1",
      rules: [{ windowMs: 60_000, max: 2 }],
      now: 1000,
    });
    assertRateLimit({
      action: "comment:create",
      identifier: "user-1",
      rules: [{ windowMs: 60_000, max: 2 }],
      now: 2000,
    });

    expect(() =>
      assertRateLimit({
        action: "comment:create",
        identifier: "user-1",
        rules: [{ windowMs: 60_000, max: 2 }],
        now: 3000,
      })
    ).toThrow("Rate limit exceeded.");
  });

  it("reinicia la ventana al pasar el tiempo", () => {
    assertRateLimit({
      action: "comment:create",
      identifier: "user-1",
      rules: [{ windowMs: 60_000, max: 1 }],
      now: 1000,
    });

    expect(() =>
      assertRateLimit({
        action: "comment:create",
        identifier: "user-1",
        rules: [{ windowMs: 60_000, max: 1 }],
        now: 62_000,
      })
    ).not.toThrow();
  });

  it("loguea rate limit sin exponer tokens", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    assertRateLimit({
      action: "comment:create",
      identifier: "user-1",
      rules: [{ windowMs: 60_000, max: 1 }],
      now: 1000,
    });

    try {
      assertRateLimit({
        action: "comment:create",
        identifier: "user-1",
        rules: [{ windowMs: 60_000, max: 1 }],
        now: 2000,
        meta: {
          token: "secret-token",
          authorization: "Bearer secret-token",
        },
      });
    } catch (error) {
      expect(isRateLimitError(error)).toBe(true);
    }

    const serializedLogs = JSON.stringify(warnSpy.mock.calls);
    expect(serializedLogs).not.toContain("secret-token");
    expect(serializedLogs).not.toContain("Bearer secret-token");
    expect(serializedLogs).toContain("[redacted]");
  });

  it("obtiene IP de headers proxy comunes", () => {
    const request = new Request("https://mentirafc.vercel.app/api/comments", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
      },
    });

    expect(getClientIp(request)).toBe("203.0.113.10");
  });

  it("usa memoria local por defecto para el rate limit server-side", async () => {
    await assertServerRateLimit({
      action: "comment:create",
      identifier: "user-1",
      rules: [{ windowMs: 60_000, max: 1 }],
      now: 1000,
    });

    await expect(
      assertServerRateLimit({
        action: "comment:create",
        identifier: "user-1",
        rules: [{ windowMs: 60_000, max: 1 }],
        now: 2000,
      })
    ).rejects.toThrow("Rate limit exceeded.");
    expect(supabaseMocks.createAdminSupabaseClient).not.toHaveBeenCalled();
  });

  it("usa el RPC Supabase cuando el store distribuido esta activo", async () => {
    vi.stubEnv("SUPABASE_RATE_LIMIT_STORE", "supabase");

    await assertServerRateLimit({
      action: "comment:create",
      identifier: "user-1",
      rules: [{ windowMs: 60_000, max: 2 }],
      meta: { route: "comments" },
    });

    expect(supabaseMocks.rpc).toHaveBeenCalledWith("admin_consume_rate_limit", {
      p_action: "comment:create",
      p_identifier_hash: hashSecurityIdentifier("user-1"),
      p_rules: [{ windowMs: 60_000, max: 2 }],
    });
  });

  it("convierte el bloqueo Supabase en RateLimitError sin exponer el identificador", async () => {
    vi.stubEnv("SUPABASE_RATE_LIMIT_STORE", "supabase");
    supabaseMocks.rpc.mockResolvedValueOnce({ data: 42, error: null });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(
      assertServerRateLimit({
        action: "comment:create",
        identifier: "user-1",
        rules: [{ windowMs: 60_000, max: 1 }],
      })
    ).rejects.toMatchObject({
      name: "RateLimitError",
      retryAfterSeconds: 42,
    });

    const serializedLogs = JSON.stringify(warnSpy.mock.calls);
    expect(serializedLogs).toContain(hashSecurityIdentifier("user-1"));
    expect(serializedLogs).not.toContain("user-1");
  });
});
