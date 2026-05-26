import { type QueryClient, queryOptions } from "@tanstack/react-query";

import {
  fetchDashboardTournamentById,
  fetchDashboardTournamentOptions,
  fetchDashboardTournaments,
} from "../../../data/dashboardTournaments";
import { queryKeys } from "../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../data/sanity/freshness";
import { reportError } from "../../../lib/errors/errorLogger";
import type { DashboardTournamentItem } from "../../../types/dashboard";

export const dashboardTournamentsListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.tournaments.all,
    queryFn: async () => {
      try {
        return await fetchDashboardTournaments();
      } catch (error) {
        reportError(error, {
          page: "DashboardTournamentsList",
          action: "load_tournaments",
        });
        throw error;
      }
    },
    ...SANITY_FRESHNESS.dashboard,
  });

export const dashboardTournamentOptionsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.tournaments.options,
    queryFn: async () => {
      try {
        return await fetchDashboardTournamentOptions();
      } catch (error) {
        reportError(error, {
          page: "DashboardTournamentsForm",
          action: "load_tournament_options",
        });
        throw error;
      }
    },
    ...SANITY_FRESHNESS.dashboard,
  });

export const dashboardTournamentDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.dashboard.tournaments.byId(id),
    queryFn: async () => {
      try {
        return await fetchDashboardTournamentById(id);
      } catch (error) {
        reportError(error, {
          page: "DashboardTournamentsForm",
          action: "load_tournament",
          id,
        });
        throw error;
      }
    },
    ...SANITY_FRESHNESS.dashboard,
  });

export const invalidateDashboardTournamentsList = async (
  queryClient: QueryClient
) => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.tournaments.all,
  });
};

export const invalidateDashboardTournamentPublishDependencies = async (
  queryClient: QueryClient
) => {
  await Promise.all([
    invalidateDashboardTournamentsList(queryClient),
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
    queryClient.invalidateQueries({ queryKey: queryKeys.home.deferred }),
  ]);
};

export const cacheDashboardTournament = (
  queryClient: QueryClient,
  tournament: DashboardTournamentItem
) => {
  queryClient.setQueryData(
    queryKeys.dashboard.tournaments.byId(tournament.id),
    tournament
  );
};
