import process from "node:process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mutateSanity, querySanity } from "./sanity.js";

const ENV_KEYS = [
  "SANITY_PROJECT_ID",
  "SANITY_DATASET",
  "SANITY_API_VERSION",
  "SANITY_WRITE_TOKEN",
] as const;

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]])
);

describe("dashboard Sanity API client", () => {
  beforeEach(() => {
    process.env.SANITY_PROJECT_ID = "test-project";
    process.env.SANITY_DATASET = "production";
    process.env.SANITY_API_VERSION = "2026-05-17";
    process.env.SANITY_WRITE_TOKEN = "secret-token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    for (const key of ENV_KEYS) {
      const originalValue = originalEnv[key];

      if (typeof originalValue === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    }
  });

  it("no usa el token de escritura para lecturas", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Response.json({
        result: [],
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await querySanity("[]");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toBeUndefined();
  });

  it("usa el token de escritura para mutaciones", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Response.json({
        results: [
          {
            document: {
              _id: "news-1",
            },
          },
        ],
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await mutateSanity([
      {
        delete: {
          id: "news-1",
        },
      },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer secret-token",
      },
    });
  });
});
