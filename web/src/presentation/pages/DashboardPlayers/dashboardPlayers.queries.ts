import {
  type QueryClient,
  queryOptions,
} from "@tanstack/react-query";

import {
  fetchDashboardPlayerById,
  fetchDashboardPlayers,
} from "../../../data/dashboardPlayers";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import type { DashboardPlayerItem } from "../../../types/dashboard";

export const dashboardPlayersListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.players.all,
    queryFn: async () => {
      try {
        return await fetchDashboardPlayers();
      } catch (error) {
        reportError(error, {
          page: "DashboardPlayersList",
          action: "load_players",
        });
        throw error;
      }
    },
  });

export const dashboardPlayerDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.dashboard.players.byId(id),
    queryFn: async () => {
      try {
        return await fetchDashboardPlayerById(id);
      } catch (error) {
        reportError(error, {
          page: "DashboardPlayersForm",
          action: "load_player",
          id,
        });
        throw error;
      }
    },
  });

export const invalidateDashboardPlayersList = async (
  queryClient: QueryClient
) => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.players.all,
  });
};

export const invalidateDashboardPlayerPublishDependencies = async (
  queryClient: QueryClient
) => {
  await Promise.all([
    invalidateDashboardPlayersList(queryClient),
    queryClient.invalidateQueries({ queryKey: queryKeys.players.all }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.matches.options,
    }),
    queryClient.invalidateQueries({ queryKey: queryKeys.games.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.events.goals() }),
  ]);
};

export const cacheDashboardPlayer = (
  queryClient: QueryClient,
  player: DashboardPlayerItem
) => {
  queryClient.setQueryData(queryKeys.dashboard.players.byId(player.id), player);
};
