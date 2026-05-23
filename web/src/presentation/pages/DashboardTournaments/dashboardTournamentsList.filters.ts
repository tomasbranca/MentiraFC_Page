import type { DashboardTournamentItem } from "../../../types/dashboard";
import {
  type DashboardDocumentStatusFilter,
  matchesDashboardSearchQuery,
  matchesDashboardStatusFilter,
} from "../../dashboard/dashboardListFilters.utils";
import { getTournamentReferenceCount } from "./dashboardTournaments.utils";

export type DashboardTournamentActiveFilter = "all" | "active" | "inactive";

export type DashboardTournamentsListFilters = {
  search: string;
  status: DashboardDocumentStatusFilter;
  active: DashboardTournamentActiveFilter;
};

export const defaultDashboardTournamentsListFilters =
  (): DashboardTournamentsListFilters => ({
    search: "",
    status: "all",
    active: "all",
  });

export const hasActiveDashboardTournamentsListFilters = (
  filters: DashboardTournamentsListFilters
): boolean =>
  filters.search.trim() !== "" ||
  filters.status !== "all" ||
  filters.active !== "all";

export const filterDashboardTournamentsList = (
  items: DashboardTournamentItem[],
  filters: DashboardTournamentsListFilters
): DashboardTournamentItem[] =>
  items.filter((item) => {
    if (!matchesDashboardStatusFilter(item.status, filters.status)) {
      return false;
    }

    if (filters.active === "active" && !item.active) {
      return false;
    }

    if (filters.active === "inactive" && item.active) {
      return false;
    }

    return matchesDashboardSearchQuery(filters.search, [
      item.name,
      item.organizationName,
      item.participants.length,
      getTournamentReferenceCount(item.referenceCounts),
    ]);
  });
