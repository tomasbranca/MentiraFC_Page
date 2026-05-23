import { describe, expect, it } from "vitest";

import {
  matchesDashboardSearchQuery,
  matchesDashboardStatusFilter,
  normalizeDashboardFilterText,
} from "./dashboardListFilters.utils";
import { filterDashboardNewsList } from "../pages/DashboardNews/dashboardNewsList.filters";

describe("dashboardListFilters.utils", () => {
  it("normalizes case and accents for search", () => {
    expect(normalizeDashboardFilterText("  Campeón  ")).toBe("campeon");
  });

  it("matches search across combined fields", () => {
    expect(
      matchesDashboardSearchQuery("river", ["Mentira FC", "vs River Plate"])
    ).toBe(true);
    expect(matchesDashboardSearchQuery("boca", ["Mentira FC", "vs River Plate"])).toBe(
      false
    );
  });

  it("matches status filter", () => {
    expect(matchesDashboardStatusFilter("draft", "all")).toBe(true);
    expect(matchesDashboardStatusFilter("draft", "draft")).toBe(true);
    expect(matchesDashboardStatusFilter("published", "draft")).toBe(false);
  });
});

describe("dashboardNewsList.filters", () => {
  it("filters by status and search", () => {
    const items = [
      {
        id: "1",
        status: "published" as const,
        hasDraft: false,
        hasPublishedVersion: true,
        title: "Gol histórico",
        description: "Resumen del partido",
        slug: "gol-historico",
      },
      {
        id: "2",
        status: "draft" as const,
        hasDraft: true,
        hasPublishedVersion: false,
        title: "Borrador interno",
        description: "Sin publicar",
        slug: "borrador",
      },
    ];

    expect(
      filterDashboardNewsList(items, { search: "historico", status: "all" })
    ).toHaveLength(1);
    expect(
      filterDashboardNewsList(items, { search: "", status: "draft" })
    ).toHaveLength(1);
  });
});
