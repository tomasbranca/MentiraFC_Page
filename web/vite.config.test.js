import { describe, expect, it } from "vitest";

import {
  ADMIN_API_RESOURCES,
  DASHBOARD_API_RESOURCES,
  PUBLIC_API_ROUTES,
  createSentryReleaseConfig,
} from "./vite.config.js";

describe("dashboard api dev middleware", () => {
  it("registra todos los recursos locales del dashboard", () => {
    expect([...DASHBOARD_API_RESOURCES].sort()).toEqual([
      "galleries",
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

  it("registra las APIs publicas locales", () => {
    expect([...PUBLIC_API_ROUTES].sort()).toEqual(["comments", "reactions"]);
  });

  it("registra todos los recursos locales del admin", () => {
    expect([...ADMIN_API_RESOURCES].sort()).toEqual([
      "audit-log",
      "auth-controls",
      "feature-flags",
      "footer-settings",
      "maintenance",
      "metrics",
      "moderation",
      "reports",
      "roles",
      "users",
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
