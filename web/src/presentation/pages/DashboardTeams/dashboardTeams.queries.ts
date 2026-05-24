import { type QueryClient, queryOptions } from "@tanstack/react-query";

import {
  fetchDashboardTeamById,
  fetchDashboardTeams,
} from "../../../data/dashboardTeams";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import type { DashboardTeamItem } from "../../../types/dashboard";

export const dashboardTeamsListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.teams.all,
    queryFn: async () => {
      try {
        return await fetchDashboardTeams();
      } catch (error) {
        reportError(error, {
          page: "DashboardTeamsList",
          action: "load_teams",
        });
        throw error;
      }
    },
  });

export const dashboardTeamDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.dashboard.teams.byId(id),
    queryFn: async () => {
      try {
        return await fetchDashboardTeamById(id);
      } catch (error) {
        reportError(error, {
          page: "DashboardTeamsForm",
          action: "load_team",
          id,
        });
        throw error;
      }
    },
  });

export const invalidateDashboardTeamsList = async (
  queryClient: QueryClient
) => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.teams.all,
  });
};

export const invalidateDashboardTeamPublishDependencies = async (
  queryClient: QueryClient
) => {
  await Promise.all([
    invalidateDashboardTeamsList(queryClient),
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.matches.all,
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.matches.options,
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.tournaments.all,
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.tournaments.options,
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.table.all,
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.table.options,
    }),
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.games.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.games.latest }),
    queryClient.invalidateQueries({ queryKey: queryKeys.games.finished }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.tournaments.current,
    }),
  ]);
};

export const cacheDashboardTeam = (
  queryClient: QueryClient,
  team: DashboardTeamItem
) => {
  queryClient.setQueryData(queryKeys.dashboard.teams.byId(team.id), team);
};
