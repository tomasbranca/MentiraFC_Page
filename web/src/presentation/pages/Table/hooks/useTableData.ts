import { useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../../data/queryKeys";
import { getTournament } from "../../../../data/tournament";
import { decorateStoredTournamentTable } from "../../../../domain/stats";
import { SANITY_FRESHNESS } from "../../../../data/sanity/freshness";
import { reportError } from "../../../../lib/errors/errorLogger";
import { shouldLoadTableInitially } from "../../../hooks/loading/loadingState.utils";
import { useInitialData } from "../../../context/useInitialData";
import type { Tournament } from "../../../../types/models";

export const useTableData = () => {
  const { initialData } = useInitialData();
  const queryClient = useQueryClient();
  const hasCachedTournament = useRef(
    queryClient.getQueryState(queryKeys.tournaments.current)?.data !==
      undefined
  );
  const cachedTournament = hasCachedTournament.current
    ? queryClient.getQueryData<Tournament | null>(
        queryKeys.tournaments.current
      )
    : undefined;
  const hasCompleteCachedTableData = hasCachedTournament.current;
  const initialTournament = hasCachedTournament.current
    ? cachedTournament ?? null
    : initialData.tournament;
  const needsInitialFetch =
    !hasCompleteCachedTableData &&
    shouldLoadTableInitially({
      bootstrapScope: initialData.bootstrapScope,
      tournament: initialTournament,
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

  const tournament = useMemo(() => {
    const tournamentSource = tournamentQuery.data;

    if (!tournamentSource) {
      return null;
    }

    const currentSnapshot = tournamentSource.currentSnapshot;
    const standings = decorateStoredTournamentTable({
      standings: currentSnapshot?.standings ?? [],
      primaryPrizeSlots: tournamentSource.primaryPrizeSlots,
      secondaryPrizeSlots: tournamentSource.secondaryPrizeSlots,
    });

    return {
      ...tournamentSource,
      standings,
    };
  }, [tournamentQuery.data]);

  const loading =
    needsInitialFetch && tournamentQuery.isFetching;
  const error = Boolean(
    tournamentQuery.error && typeof tournamentQuery.data === "undefined"
  );

  return {
    tournament,
    loading,
    error,
    refetch: async () => {
      await tournamentQuery.refetch();
    },
  };
};
