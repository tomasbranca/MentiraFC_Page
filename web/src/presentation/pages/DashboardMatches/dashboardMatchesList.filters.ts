import type {
  DashboardMatchCompetition,
  DashboardMatchItem,
  DashboardMatchState,
} from "../../../types/dashboard";
import {
  type DashboardDocumentStatusFilter,
  matchesDashboardSearchQuery,
  matchesDashboardStatusFilter,
} from "../../dashboard/dashboardListFilters.utils";
import {
  getDashboardMatchCompetitionLabel,
  getDashboardMatchStateLabel,
} from "./dashboardMatches.utils";

export type DashboardMatchCompetitionFilter = "all" | DashboardMatchCompetition;
export type DashboardMatchStateFilter = "all" | DashboardMatchState;

export type DashboardMatchesListFilters = {
  search: string;
  status: DashboardDocumentStatusFilter;
  state: DashboardMatchStateFilter;
  competition: DashboardMatchCompetitionFilter;
};

export const defaultDashboardMatchesListFilters =
  (): DashboardMatchesListFilters => ({
    search: "",
    status: "all",
    state: "all",
    competition: "all",
  });

export const hasActiveDashboardMatchesListFilters = (
  filters: DashboardMatchesListFilters
): boolean =>
  filters.search.trim() !== "" ||
  filters.status !== "all" ||
  filters.state !== "all" ||
  filters.competition !== "all";

export const filterDashboardMatchesList = (
  items: DashboardMatchItem[],
  filters: DashboardMatchesListFilters
): DashboardMatchItem[] =>
  items.filter((item) => {
    if (!matchesDashboardStatusFilter(item.status, filters.status)) {
      return false;
    }

    if (filters.state !== "all" && item.state !== filters.state) {
      return false;
    }

    if (
      filters.competition !== "all" &&
      item.competition !== filters.competition
    ) {
      return false;
    }

    const competitionLabel = getDashboardMatchCompetitionLabel(item.competition);
    const stateLabel = getDashboardMatchStateLabel(item.state);
    const scoreLabel =
      item.state === "finalizado"
        ? `${item.result?.goalsFor ?? 0}-${item.result?.goalsAgainst ?? 0}`
        : "";

    return matchesDashboardSearchQuery(filters.search, [
      item.rivalName,
      item.tournamentLabel,
      item.tournamentName,
      item.location,
      competitionLabel,
      stateLabel,
      scoreLabel,
    ]);
  });
