// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from "react";

import { getPlayers } from "../../../../data/players";
import { reportError } from "../../../../lib/errors/errorLogger";
import { shouldLoadTeamInitially } from "../../../hooks/loading/loadingState.utils";
import { useInitialData } from "../../../context/InitialDataContext";
import { groupPlayersByPosition } from "../team.utils";

export const useTeamData = () => {
  const { initialData } = useInitialData();
  const [overridePlayers, setOverridePlayers] = useState(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [error, setError] = useState(false);

  const players = overridePlayers ?? initialData.players;
  const needsInitialFetch = shouldLoadTeamInitially(
    initialData.bootstrapScope,
    players.length
  );
  const [loading, setLoading] = useState(needsInitialFetch);

  const grouped = useMemo(() => groupPlayersByPosition(players), [players]);

  const refetch = useCallback(async () => {
    setLoading(true);

    try {
      const nextPlayers = await getPlayers();
      setOverridePlayers(nextPlayers);
      setError(false);
    } catch (nextError) {
      setError(true);
      reportError(nextError, {
        page: "Team",
        action: "refresh_team_players",
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
    players,
    grouped,
    loading,
    error,
    refetch,
  };
};
