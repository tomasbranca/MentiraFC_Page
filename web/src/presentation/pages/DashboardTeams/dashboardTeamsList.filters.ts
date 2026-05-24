import type { DashboardTeamItem } from "../../../types/dashboard";
import {
  type DashboardDocumentStatusFilter,
  matchesDashboardSearchQuery,
  matchesDashboardStatusFilter,
} from "../../dashboard/dashboardListFilters.utils";
import { getTeamReferenceCount, getTeamUsageLabel } from "./dashboardTeams.utils";

export type DashboardTeamKindFilter = "all" | "main" | "rivals";

export type DashboardTeamUsageFilter =
  | "all"
  | "with_references"
  | "without_references";

export type DashboardTeamsListFilters = {
  search: string;
  status: DashboardDocumentStatusFilter;
  kind: DashboardTeamKindFilter;
  usage: DashboardTeamUsageFilter;
};

export const defaultDashboardTeamsListFilters =
  (): DashboardTeamsListFilters => ({
    search: "",
    status: "all",
    kind: "all",
    usage: "all",
  });

export const hasActiveDashboardTeamsListFilters = (
  filters: DashboardTeamsListFilters
): boolean =>
  filters.search.trim() !== "" ||
  filters.status !== "all" ||
  filters.kind !== "all" ||
  filters.usage !== "all";

export const filterDashboardTeamsList = (
  items: DashboardTeamItem[],
  filters: DashboardTeamsListFilters
): DashboardTeamItem[] =>
  items.filter((item) => {
    if (!matchesDashboardStatusFilter(item.status, filters.status)) {
      return false;
    }

    if (filters.kind === "main" && !item.isMain) {
      return false;
    }

    if (filters.kind === "rivals" && item.isMain) {
      return false;
    }

    const referenceCount = getTeamReferenceCount(item.referenceCounts);

    if (filters.usage === "with_references" && referenceCount === 0) {
      return false;
    }

    if (filters.usage === "without_references" && referenceCount > 0) {
      return false;
    }

    return matchesDashboardSearchQuery(filters.search, [
      item.name,
      item.isMain ? "principal" : "rival",
      getTeamUsageLabel(item.referenceCounts),
      referenceCount,
    ]);
  });
