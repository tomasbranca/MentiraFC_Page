import { describe, expect, it } from "vitest";

import {
  buildDashboardNewsItemApiPath,
  buildDashboardNewsPageApiPath,
} from "./dashboardNews";

describe("dashboardNews data client", () => {
  it("usa la API base con query param para evitar el fallback HTML de Vercel", () => {
    expect(buildDashboardNewsItemApiPath("news-1")).toBe(
      "/api/dashboard/news?id=news-1"
    );
    expect(buildDashboardNewsItemApiPath("drafts.news/1")).toBe(
      "/api/dashboard/news?id=drafts.news%2F1"
    );
  });

  it("arma la URL paginada sin cambiar la ruta del recurso", () => {
    expect(
      buildDashboardNewsPageApiPath({
        page: 2,
        limit: 25,
        sortBy: "title",
        direction: "asc",
        search: "final",
        status: "draft",
      })
    ).toBe(
      "/api/dashboard/news?page=2&limit=25&sortBy=title&direction=asc&search=final&status=draft"
    );
  });
});
