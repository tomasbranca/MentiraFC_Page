import { useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getTournamentGames } from "../../../../data/games";
import { queryKeys } from "../../../../data/queryKeys";
import { getTournament } from "../../../../data/tournament";
import { getHybridTournamentTable } from "../../../../domain/stats";
import { SANITY_FRESHNESS } from "../../../../data/sanity/freshness";
import { reportError } from "../../../../lib/errors/errorLogger";
import { shouldLoadTableInitially } from "../../../hooks/loading/loadingState.utils";
import { useInitialData } from "../../../context/useInitialData";
import type { Game, Tournament } from "../../../../types/models";

export const useTableData = () => {
  const { initialData } = useInitialData();
  const queryClient = useQueryClient();
  const hasCachedTournament = useRef(
    queryClient.getQueryState(queryKeys.tournaments.current)?.data !==
      undefined
  );
  const hasCachedGames = useRef(
    queryClient.getQueryState(queryKeys.games.tournamentFinished)?.data !==
      undefined
  );
  const cachedTournament = hasCachedTournament.current
    ? queryClient.getQueryData<Tournament | null>(
        queryKeys.tournaments.current
      )
    : undefined;
  const cachedGames = hasCachedGames.current
    ? queryClient.getQueryData<Game[]>(queryKeys.games.tournamentFinished)
    : undefined;
  const hasCompleteCachedTableData =
    hasCachedTournament.current && hasCachedGames.current;
  const initialTournament = hasCachedTournament.current
    ? cachedTournament ?? null
    : initialData.tournament;
  const initialGames = cachedGames ?? initialData.tournamentGames;
  const needsInitialFetch =
    !hasCompleteCachedTableData &&
    shouldLoadTableInitially({
      bootstrapScope: initialData.bootstrapScope,
      tournament: initialTournament,
      gamesLength: initialGames.length,
    });

  const tournamentQuery = useQuery({
    queryKey: queryKeys.tournaments.current,
    queryFn: async () => {
      try {
        return await getTournament();
      } catch (error) {
        reportError(error, {
          page: "Table",
          action: "refresh_table_tournament",
        });
        throw error;
      }
    },
    enabled: true,
    initialData: needsInitialFetch ? undefined : initialTournament,
    placeholderData: needsInitialFetch ? initialTournament : undefined,
    refetchInterval: SANITY_FRESHNESS.liveStats.refetchInterval,
    refetchOnMount: "always",
    staleTime: SANITY_FRESHNESS.liveStats.staleTime,
  });

  const gamesQuery = useQuery({
    queryKey: queryKeys.games.tournamentFinished,
    queryFn: async () => {
      try {
        return await getTournamentGames();
      } catch (error) {
        reportError(error, {
          page: "Table",
          action: "refresh_table_games",
        });
        throw error;
      }
    },
    enabled: true,
    initialData: needsInitialFetch ? undefined : initialGames,
    placeholderData: needsInitialFetch ? initialGames : undefined,
    refetchInterval: SANITY_FRESHNESS.liveStats.refetchInterval,
    refetchOnMount: "always",
    staleTime: SANITY_FRESHNESS.liveStats.staleTime,
  });

  const tournament = useMemo(() => {
    const tournamentSource = tournamentQuery.data;

    if (!tournamentSource) {
      return null;
    }

    const gamesSource = gamesQuery.data ?? [];
    const mainTeam = tournamentSource.mainTeam ?? null;
    const gamesFromActiveTournament = gamesSource.filter(
      (game) => game.tournamentId === tournamentSource.id
    );
    const currentSnapshot = tournamentSource.currentSnapshot;
    const previousSnapshot = tournamentSource.previousSnapshot;
    const standings = getHybridTournamentTable({
      manualStandings: currentSnapshot?.standings ?? [],
      previousManualStandings: previousSnapshot?.standings,
      games: gamesFromActiveTournament,
      mainTeam,
      primaryPrizeSlots: tournamentSource.primaryPrizeSlots,
      secondaryPrizeSlots: tournamentSource.secondaryPrizeSlots,
      gamesThroughDate: currentSnapshot?.gamesThroughDate,
      previousGamesThroughDate: previousSnapshot?.gamesThroughDate,
    });

    return {
      ...tournamentSource,
      standings,
    };
  }, [gamesQuery.data, tournamentQuery.data]);

  const loading =
    needsInitialFetch &&
    (tournamentQuery.isFetching || gamesQuery.isFetching);
  const error = Boolean(
    (tournamentQuery.error && typeof tournamentQuery.data === "undefined") ||
      (gamesQuery.error && typeof gamesQuery.data === "undefined")
  );

  return {
    tournament,
    loading,
    error,
    refetch: async () => {
      await Promise.all([
        tournamentQuery.refetch(),
        gamesQuery.refetch(),
      ]);
    },
  };
};
