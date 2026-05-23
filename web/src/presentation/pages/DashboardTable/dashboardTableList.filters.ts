import type { DashboardTableItem } from "../../../types/dashboard";
import {
  type DashboardDocumentStatusFilter,
  matchesDashboardSearchQuery,
  matchesDashboardStatusFilter,
} from "../../dashboard/dashboardListFilters.utils";

export type DashboardTableListFilters = {
  search: string;
  status: DashboardDocumentStatusFilter;
};

export const defaultDashboardTableListFilters = (): DashboardTableListFilters => ({
  search: "",
  status: "all",
});

export const hasActiveDashboardTableListFilters = (
  filters: DashboardTableListFilters
): boolean => filters.search.trim() !== "" || filters.status !== "all";

export const filterDashboardTableList = (
  items: DashboardTableItem[],
  filters: DashboardTableListFilters
): DashboardTableItem[] =>
  items.filter((item) => {
    if (!matchesDashboardStatusFilter(item.status, filters.status)) {
      return false;
    }

    return matchesDashboardSearchQuery(filters.search, [
      item.tournamentOrganizationName,
      item.tournamentName,
      item.label,
      item.matchdayNumber,
      item.rows.length,
      item.snapshotDate,
      item.gamesThroughDate,
      item.updatedAt,
    ]);
  });
