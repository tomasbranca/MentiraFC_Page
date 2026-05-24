import { type QueryClient, queryOptions } from "@tanstack/react-query";

import {
  fetchDashboardMatchById,
  fetchDashboardMatchOptions,
  fetchDashboardMatches,
} from "../../../data/dashboardMatches";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import type { DashboardMatchItem } from "../../../types/dashboard";

export const dashboardMatchesListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.matches.all,
    queryFn: async () => {
      try {
        return await fetchDashboardMatches();
      } catch (error) {
        reportError(error, {
          page: "DashboardMatchesList",
          action: "load_matches",
        });
        throw error;
      }
    },
  });

export const dashboardMatchOptionsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.matches.options,
    queryFn: async () => {
      try {
        return await fetchDashboardMatchOptions();
      } catch (error) {
        reportError(error, {
          page: "DashboardMatchesForm",
          action: "load_match_options",
        });
        throw error;
      }
    },
  });

export const dashboardMatchDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.dashboard.matches.byId(id),
    queryFn: async () => {
      try {
        return await fetchDashboardMatchById(id);
      } catch (error) {
        reportError(error, {
          page: "DashboardMatchesForm",
          action: "load_match",
          id,
        });
        throw error;
      }
    },
  });

export const invalidateDashboardMatchesList = async (
  queryClient: QueryClient
) => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.matches.all,
  });
};

export const invalidateDashboardMatchPublishDependencies = async (
  queryClient: QueryClient
) => {
  await Promise.all([
    invalidateDashboardMatchesList(queryClient),
    queryClient.invalidateQueries({ queryKey: queryKeys.games.latest }),
    queryClient.invalidateQueries({ queryKey: queryKeys.games.finished }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.games.tournamentFinished,
    }),
    queryClient.invalidateQueries({ queryKey: queryKeys.events.goals() }),
  ]);
};

export const cacheDashboardMatch = (
  queryClient: QueryClient,
  match: DashboardMatchItem
) => {
  queryClient.setQueryData(queryKeys.dashboard.matches.byId(match.id), match);
};
