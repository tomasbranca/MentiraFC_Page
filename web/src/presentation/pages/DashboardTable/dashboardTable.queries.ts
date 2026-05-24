import { type QueryClient, queryOptions } from "@tanstack/react-query";

import {
  fetchDashboardTableById,
  fetchDashboardTableOptions,
  fetchDashboardTables,
} from "../../../data/dashboardTable";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import type { DashboardTableItem } from "../../../types/dashboard";

export const dashboardTablesListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.table.all,
    queryFn: async () => {
      try {
        return await fetchDashboardTables();
      } catch (error) {
        reportError(error, {
          page: "DashboardTableList",
          action: "load_tables",
        });
        throw error;
      }
    },
  });

export const dashboardTableOptionsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.table.options,
    queryFn: async () => {
      try {
        return await fetchDashboardTableOptions();
      } catch (error) {
        reportError(error, {
          page: "DashboardTableForm",
          action: "load_table_options",
        });
        throw error;
      }
    },
  });

export const dashboardTableDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.dashboard.table.byId(id),
    queryFn: async () => {
      try {
        return await fetchDashboardTableById(id);
      } catch (error) {
        reportError(error, {
          page: "DashboardTableForm",
          action: "load_table",
          id,
        });
        throw error;
      }
    },
  });

export const invalidateDashboardTablesList = async (
  queryClient: QueryClient
) => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.table.all,
  });
};

export const invalidateDashboardTablePublishDependencies = async (
  queryClient: QueryClient
) => {
  await Promise.all([
    invalidateDashboardTablesList(queryClient),
    queryClient.invalidateQueries({
      queryKey: queryKeys.tournaments.current,
    }),
  ]);
};

export const cacheDashboardTable = (
  queryClient: QueryClient,
  table: DashboardTableItem
) => {
  queryClient.setQueryData(queryKeys.dashboard.table.byId(table.id), table);
};
