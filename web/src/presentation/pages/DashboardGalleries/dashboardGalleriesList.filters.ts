import type { DashboardGalleryItem } from "../../../types/dashboard";
import {
  type DashboardDocumentStatusFilter,
  matchesDashboardSearchQuery,
  matchesDashboardStatusFilter,
} from "../../dashboard/dashboardListFilters.utils";
import { getDashboardGalleryTitle } from "./dashboardGalleries.utils";

export type DashboardGalleryPhotoFilter = "all" | "with_photos" | "empty";

export type DashboardGalleriesListFilters = {
  search: string;
  status: DashboardDocumentStatusFilter;
  photos: DashboardGalleryPhotoFilter;
};

export const defaultDashboardGalleriesListFilters =
  (): DashboardGalleriesListFilters => ({
    search: "",
    status: "all",
    photos: "all",
  });

export const hasActiveDashboardGalleriesListFilters = (
  filters: DashboardGalleriesListFilters
): boolean =>
  filters.search.trim() !== "" ||
  filters.status !== "all" ||
  filters.photos !== "all";

export const filterDashboardGalleriesList = (
  items: DashboardGalleryItem[],
  filters: DashboardGalleriesListFilters
): DashboardGalleryItem[] =>
  items.filter((item) => {
    if (!matchesDashboardStatusFilter(item.status, filters.status)) {
      return false;
    }

    if (filters.photos === "with_photos" && item.photoCount === 0) {
      return false;
    }

    if (filters.photos === "empty" && item.photoCount > 0) {
      return false;
    }

    return matchesDashboardSearchQuery(filters.search, [
      getDashboardGalleryTitle(item),
      item.slug,
      item.rivalName,
      item.gameTournamentName,
      item.gameTournamentOrganizationName,
      item.gameCompetition,
      item.photoCount,
    ]);
  });
