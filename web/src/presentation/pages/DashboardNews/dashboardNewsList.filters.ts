import type { DashboardNewsItem } from "../../../types/dashboard";
import {
  type DashboardDocumentStatusFilter,
  matchesDashboardSearchQuery,
  matchesDashboardStatusFilter,
} from "../../dashboard/dashboardListFilters.utils";

export type DashboardNewsListFilters = {
  search: string;
  status: DashboardDocumentStatusFilter;
};

export const defaultDashboardNewsListFilters = (): DashboardNewsListFilters => ({
  search: "",
  status: "all",
});

export const hasActiveDashboardNewsListFilters = (
  filters: DashboardNewsListFilters
): boolean => filters.search.trim() !== "" || filters.status !== "all";

export const filterDashboardNewsList = (
  items: DashboardNewsItem[],
  filters: DashboardNewsListFilters
): DashboardNewsItem[] =>
  items.filter((item) => {
    if (!matchesDashboardStatusFilter(item.status, filters.status)) {
      return false;
    }

    return matchesDashboardSearchQuery(filters.search, [
      item.title,
      item.description,
      item.slug,
      item.date,
      item.updatedAt,
    ]);
  });
