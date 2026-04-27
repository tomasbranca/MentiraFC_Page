// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from "react";

import { getTournament } from "../../../../data/tournament";
import { getTeams } from "../../../../data/teams";
import { getTournamentGames } from "../../../../data/games";
import { getHybridTournamentTable } from "../../../../domain/stats";
import { reportError } from "../../../../lib/errors/errorLogger";
import { useInitialData } from "../../../context/InitialDataContext";

export const useTableData = () => {
  const { initialData } = useInitialData();
  const [overrideTournament, setOverrideTournament] = useState(null);
  const [overrideTeams, setOverrideTeams] = useState(null);
  const [overrideGames, setOverrideGames] = useState(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const tournamentSource = overrideTournament ?? initialData.tournament;
  const teamsSource = overrideTeams ?? initialData.teams;
  const gamesSource = overrideGames ?? initialData.tournamentGames;

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
    const needsTableData =
      initialData.bootstrapScope === "home-critical" ||
      !tournamentSource ||
      (teamsSource ?? []).length === 0 ||
      (gamesSource ?? []).length === 0;

    if (!needsTableData || loading || hasAttemptedFetch) {
      return;
    }

    void refetch();
  }, [
    gamesSource,
    hasAttemptedFetch,
    initialData.bootstrapScope,
    loading,
    refetch,
    teamsSource,
    tournamentSource,
  ]);

  return {
    tournament,
    loading,
    error,
    refetch,
  };
};
