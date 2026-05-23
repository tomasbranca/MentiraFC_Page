import type { DashboardOrganizationItem } from "../../../types/dashboard";
import {
  type DashboardDocumentStatusFilter,
  matchesDashboardSearchQuery,
  matchesDashboardStatusFilter,
} from "../../dashboard/dashboardListFilters.utils";
import {
  getOrganizationColorLabel,
  getOrganizationReferenceCount,
} from "./dashboardOrganizations.utils";

export type DashboardOrganizationUsageFilter =
  | "all"
  | "with_references"
  | "without_references";

export type DashboardOrganizationsListFilters = {
  search: string;
  status: DashboardDocumentStatusFilter;
  usage: DashboardOrganizationUsageFilter;
};

export const defaultDashboardOrganizationsListFilters =
  (): DashboardOrganizationsListFilters => ({
    search: "",
    status: "all",
    usage: "all",
  });

export const hasActiveDashboardOrganizationsListFilters = (
  filters: DashboardOrganizationsListFilters
): boolean =>
  filters.search.trim() !== "" ||
  filters.status !== "all" ||
  filters.usage !== "all";

export const filterDashboardOrganizationsList = (
  items: DashboardOrganizationItem[],
  filters: DashboardOrganizationsListFilters
): DashboardOrganizationItem[] =>
  items.filter((item) => {
    if (!matchesDashboardStatusFilter(item.status, filters.status)) {
      return false;
    }

    const referenceCount = getOrganizationReferenceCount(item.referenceCounts);

    if (filters.usage === "with_references" && referenceCount === 0) {
      return false;
    }

    if (filters.usage === "without_references" && referenceCount > 0) {
      return false;
    }

    return matchesDashboardSearchQuery(filters.search, [
      item.name,
      item.primaryColor,
      getOrganizationColorLabel(item.primaryColor),
      referenceCount,
    ]);
  });
