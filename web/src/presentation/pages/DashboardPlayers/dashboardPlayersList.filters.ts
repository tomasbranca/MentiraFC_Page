import type {
  DashboardPlayerItem,
  DashboardPlayerPosition,
  DashboardStaffItem,
} from "../../../types/dashboard";
import {
  type DashboardDocumentStatusFilter,
  matchesDashboardSearchQuery,
  matchesDashboardStatusFilter,
} from "../../dashboard/dashboardListFilters.utils";
import { getDashboardPlayerPositionLabel } from "./dashboardPlayers.utils";
import { getDashboardStaffRoleLabel } from "./dashboardStaff.utils";

export type DashboardPlayerPositionFilter = "all" | DashboardPlayerPosition;

export type DashboardPlayerRosterFilter = "all" | "active" | "inactive";

export type DashboardPlayersListFilters = {
  search: string;
  status: DashboardDocumentStatusFilter;
  position: DashboardPlayerPositionFilter;
  roster: DashboardPlayerRosterFilter;
};

export const defaultDashboardPlayersListFilters =
  (): DashboardPlayersListFilters => ({
    search: "",
    status: "all",
    position: "all",
    roster: "all",
  });

export const hasActiveDashboardPlayersListFilters = (
  filters: DashboardPlayersListFilters
): boolean =>
  filters.search.trim() !== "" ||
  filters.status !== "all" ||
  filters.position !== "all" ||
  filters.roster !== "all";

const matchesDashboardPlayerRosterFilter = (
  item: DashboardPlayerItem,
  filter: DashboardPlayerRosterFilter
): boolean => {
  if (filter === "all") {
    return true;
  }

  if (!item.canManageActiveStatus) {
    return filter === "inactive";
  }

  return filter === "active" ? item.isActive : !item.isActive;
};

export const filterDashboardPlayersList = (
  items: DashboardPlayerItem[],
  filters: DashboardPlayersListFilters
): DashboardPlayerItem[] =>
  items.filter((item) => {
    if (!matchesDashboardStatusFilter(item.status, filters.status)) {
      return false;
    }

    if (filters.position !== "all" && item.position !== filters.position) {
      return false;
    }

    if (!matchesDashboardPlayerRosterFilter(item, filters.roster)) {
      return false;
    }

    return matchesDashboardSearchQuery(filters.search, [
      item.fullName,
      item.name,
      item.lastName,
      item.number,
      getDashboardPlayerPositionLabel(item.position),
      item.slug,
      item.birthDate,
    ]);
  });

export const filterDashboardStaffList = (
  items: DashboardStaffItem[],
  filters: Pick<DashboardPlayersListFilters, "search" | "status">
): DashboardStaffItem[] =>
  items.filter((item) => {
    if (!matchesDashboardStatusFilter(item.status, filters.status)) {
      return false;
    }

    return matchesDashboardSearchQuery(filters.search, [
      item.fullName,
      item.name,
      item.lastName,
      getDashboardStaffRoleLabel(item.role),
      item.role,
      item.slug,
      item.birthDate,
    ]);
  });
