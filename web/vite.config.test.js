import { describe, expect, it } from "vitest";

import {
  DASHBOARD_API_RESOURCES,
  createSentryReleaseConfig,
} from "./vite.config.js";

describe("dashboard api dev middleware", () => {
  it("registra todos los recursos locales del dashboard", () => {
    expect([...DASHBOARD_API_RESOURCES].sort()).toEqual([
      "matches",
      "news",
      "organizations",
      "players",
      "staff",
      "table",
      "teams",
      "tournaments",
    ]);
  });

  it("no asocia commits de Sentry salvo que se habilite explicitamente", () => {
    expect(
      createSentryReleaseConfig({
        name: "release-1",
      })
    ).toEqual({
      name: "release-1",
    });

    expect(
      createSentryReleaseConfig({
        name: "release-1",
        setCommits: true,
      })
    ).toEqual({
      name: "release-1",
      setCommits: {
        auto: true,
      },
    });
  });
});
