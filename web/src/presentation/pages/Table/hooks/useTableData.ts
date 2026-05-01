import { useCallback, useEffect, useMemo, useState } from "react";

import { getTournament } from "../../../../data/tournament";
import { getTeams } from "../../../../data/teams";
import { getTournamentGames } from "../../../../data/games";
import { getHybridTournamentTable } from "../../../../domain/stats";
import { reportError } from "../../../../lib/errors/errorLogger";
import { shouldLoadTableInitially } from "../../../hooks/loading/loadingState.utils";
import { useInitialData } from "../../../context/InitialDataContext";
import type { Game, TeamRef, Tournament } from "../../../../types/models";

export const useTableData = () => {
  const { initialData } = useInitialData();
  const [overrideTournament, setOverrideTournament] =
    useState<Tournament | null>(null);
  const [overrideTeams, setOverrideTeams] = useState<TeamRef[] | null>(null);
  const [overrideGames, setOverrideGames] = useState<Game[] | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [error, setError] = useState(false);

  const tournamentSource = overrideTournament ?? initialData.tournament;
  const teamsSource = overrideTeams ?? initialData.teams;
  const gamesSource = overrideGames ?? initialData.tournamentGames;
  const needsInitialFetch = shouldLoadTableInitially({
    bootstrapScope: initialData.bootstrapScope,
    tournament: tournamentSource,
    teamsLength: (teamsSource ?? []).length,
    gamesLength: (gamesSource ?? []).length,
  });
  const [loading, setLoading] = useState(needsInitialFetch);

  const tournament = useMemo(() => {
    if (!tournamentSource) {
      return null;
    }

    const mainTeam = (teamsSource ?? []).find((team) => team.isMain) || null;

    const gamesFromActiveTournament = (gamesSource ?? []).filter(
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
  }, [gamesSource, teamsSource, tournamentSource]);

  const refetch = useCallback(async () => {
    setLoading(true);

    try {
      const [nextTournament, nextTeams, nextGames] = await Promise.all([
        getTournament(),
        getTeams(),
        getTournamentGames(),
      ]);

      setOverrideTournament(nextTournament);
      setOverrideTeams(nextTeams);
      setOverrideGames(nextGames);
      setError(false);
    } catch (nextError) {
      setError(true);
      reportError(nextError, {
        page: "Table",
        action: "refresh_table",
      });
    } finally {
      setHasAttemptedFetch(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!needsInitialFetch || hasAttemptedFetch) {
      return;
    }

    void refetch();
  }, [hasAttemptedFetch, needsInitialFetch, refetch]);

  return {
    tournament,
    loading,
    error,
    refetch,
  };
};
