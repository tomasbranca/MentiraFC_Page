import { describe, expect, it } from "vitest";

import { DASHBOARD_API_RESOURCES } from "./vite.config.js";

describe("dashboard api dev middleware", () => {
  it("registra todos los recursos locales del dashboard", () => {
    expect([...DASHBOARD_API_RESOURCES].sort()).toEqual([
      "matches",
      "news",
      "players",
      "staff",
      "table",
    ]);
  });
});
