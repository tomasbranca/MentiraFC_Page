import { type QueryClient, queryOptions } from "@tanstack/react-query";

import {
  fetchDashboardOrganizationById,
  fetchDashboardOrganizations,
} from "../../../data/dashboardOrganizations";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import type { DashboardOrganizationItem } from "../../../types/dashboard";

export const dashboardOrganizationsListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.organizations.all,
    queryFn: async () => {
      try {
        return await fetchDashboardOrganizations();
      } catch (error) {
        reportError(error, {
          page: "DashboardOrganizationsList",
          action: "load_organizations",
        });
        throw error;
      }
    },
  });

export const dashboardOrganizationDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.dashboard.organizations.byId(id),
    queryFn: async () => {
      try {
        return await fetchDashboardOrganizationById(id);
      } catch (error) {
        reportError(error, {
          page: "DashboardOrganizationsForm",
          action: "load_organization",
          id,
        });
        throw error;
      }
    },
  });

export const invalidateDashboardOrganizationsList = async (
  queryClient: QueryClient
) => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.organizations.all,
  });
};

export const invalidateDashboardOrganizationPublishDependencies = async (
  queryClient: QueryClient
) => {
  await Promise.all([
    invalidateDashboardOrganizationsList(queryClient),
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.tournaments.all,
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.tournaments.options,
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.matches.options,
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.table.options,
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.tournaments.current,
    }),
  ]);
};

export const cacheDashboardOrganization = (
  queryClient: QueryClient,
  organization: DashboardOrganizationItem
) => {
  queryClient.setQueryData(
    queryKeys.dashboard.organizations.byId(organization.id),
    organization
  );
};
