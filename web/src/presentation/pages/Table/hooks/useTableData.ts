import { useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getTournamentGames } from "../../../../data/games";
import { queryKeys } from "../../../../data/queryKeys";
import { getTeams } from "../../../../data/teams";
import { getTournament } from "../../../../data/tournament";
import { getHybridTournamentTable } from "../../../../domain/stats";
import { reportError } from "../../../../lib/errors/errorLogger";
import { shouldLoadTableInitially } from "../../../hooks/loading/loadingState.utils";
import { useInitialData } from "../../../context/useInitialData";
import type { Game, TeamRef, Tournament } from "../../../../types/models";

export const useTableData = () => {
  const { initialData } = useInitialData();
  const queryClient = useQueryClient();
  const hasCachedTournament = useRef(
    queryClient.getQueryState(queryKeys.tournaments.current)?.data !==
      undefined
  );
  const hasCachedTeams = useRef(
    queryClient.getQueryState(queryKeys.teams.all)?.data !== undefined
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
  const cachedTeams = hasCachedTeams.current
    ? queryClient.getQueryData<TeamRef[]>(queryKeys.teams.all)
    : undefined;
  const cachedGames = hasCachedGames.current
    ? queryClient.getQueryData<Game[]>(queryKeys.games.tournamentFinished)
    : undefined;
  const hasCompleteCachedTableData =
    hasCachedTournament.current &&
    hasCachedTeams.current &&
    hasCachedGames.current;
  const initialTournament = hasCachedTournament.current
    ? cachedTournament ?? null
    : initialData.tournament;
  const initialTeams = cachedTeams ?? initialData.teams;
  const initialGames = cachedGames ?? initialData.tournamentGames;
  const needsInitialFetch =
    !hasCompleteCachedTableData &&
    shouldLoadTableInitially({
      bootstrapScope: initialData.bootstrapScope,
      tournament: initialTournament,
      teamsLength: initialTeams.length,
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
    enabled: needsInitialFetch,
    initialData: needsInitialFetch ? undefined : initialTournament,
    placeholderData: needsInitialFetch ? initialTournament : undefined,
    refetchOnMount: needsInitialFetch ? "always" : false,
  });

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: async () => {
      try {
        return await getTeams();
      } catch (error) {
        reportError(error, {
          page: "Table",
          action: "refresh_table_teams",
        });
        throw error;
      }
    },
    enabled: needsInitialFetch,
    initialData: needsInitialFetch ? undefined : initialTeams,
    placeholderData: needsInitialFetch ? initialTeams : undefined,
    refetchOnMount: needsInitialFetch ? "always" : false,
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
    enabled: needsInitialFetch,
    initialData: needsInitialFetch ? undefined : initialGames,
    placeholderData: needsInitialFetch ? initialGames : undefined,
    refetchOnMount: needsInitialFetch ? "always" : false,
  });

  const tournament = useMemo(() => {
    const tournamentSource = tournamentQuery.data;

    if (!tournamentSource) {
      return null;
    }

    const teamsSource = teamsQuery.data ?? [];
    const gamesSource = gamesQuery.data ?? [];
    const mainTeam = teamsSource.find((team) => team.isMain) || null;
    const gamesFromActiveTournament = gamesSource.filter(
      (game) => game.tournamentId === tournamentSource.id
    );
    const standings = getHybridTournamentTable({
      manualStandings: tournamentSource.standings,
      games: gamesFromActiveTournament,
      mainTeam,
    });

    return {
      ...tournamentSource,
      standings,
    };
  }, [gamesQuery.data, teamsQuery.data, tournamentQuery.data]);

  const loading =
    needsInitialFetch &&
    (tournamentQuery.isFetching || teamsQuery.isFetching || gamesQuery.isFetching);
  const error = Boolean(
    tournamentQuery.error || teamsQuery.error || gamesQuery.error
  );

  return {
    tournament,
    loading,
    error,
    refetch: async () => {
      await Promise.all([
        tournamentQuery.refetch(),
        teamsQuery.refetch(),
        gamesQuery.refetch(),
      ]);
    },
  };
};
