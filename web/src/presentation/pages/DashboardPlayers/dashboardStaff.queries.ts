import { type QueryClient, queryOptions } from "@tanstack/react-query";

import {
  fetchDashboardStaff,
  fetchDashboardStaffById,
} from "../../../data/dashboardStaff";
import { queryKeys } from "../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../data/sanity/freshness";
import { reportError } from "../../../lib/errors/errorLogger";
import type { DashboardStaffItem } from "../../../types/dashboard";

export const dashboardStaffListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.staff.all,
    queryFn: async () => {
      try {
        return await fetchDashboardStaff();
      } catch (error) {
        reportError(error, {
          page: "DashboardPlayersList",
          action: "load_staff",
        });
        throw error;
      }
    },
    ...SANITY_FRESHNESS.dashboard,
  });

export const dashboardStaffDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.dashboard.staff.byId(id),
    queryFn: async () => {
      try {
        return await fetchDashboardStaffById(id);
      } catch (error) {
        reportError(error, {
          page: "DashboardStaffForm",
          action: "load_staff",
          id,
        });
        throw error;
      }
    },
    ...SANITY_FRESHNESS.dashboard,
  });

export const invalidateDashboardStaffList = async (
  queryClient: QueryClient
) => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.staff.all,
  });
};

export const invalidateDashboardStaffPublishDependencies = async (
  queryClient: QueryClient
) => {
  await Promise.all([
    invalidateDashboardStaffList(queryClient),
    queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
  ]);
};

export const cacheDashboardStaff = (
  queryClient: QueryClient,
  staff: DashboardStaffItem
) => {
  queryClient.setQueryData(queryKeys.dashboard.staff.byId(staff.id), staff);
};
