import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetRateLimitsForTests,
  assertRateLimit,
  getClientIp,
  isRateLimitError,
} from "./rateLimit";

describe("rate limit helpers", () => {
  beforeEach(() => {
    __resetRateLimitsForTests();
    vi.restoreAllMocks();
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
});
