// @ts-nocheck
import { useCallback, useEffect, useState } from "react";

import { getAllGames } from "../../../../data/games";
import { reportError } from "../../../../lib/errors/errorLogger";
import { useInitialData } from "../../../context/InitialDataContext";

export const useRecordData = () => {
  const { initialData } = useInitialData();
  const [overrideGames, setOverrideGames] = useState(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const games = overrideGames ?? initialData.games;

  const refetch = useCallback(async () => {
    setLoading(true);

    try {
      const nextGames = await getAllGames();
      setOverrideGames(nextGames || []);
      setError(false);
    } catch (nextError) {
      setError(true);
      reportError(nextError, {
        page: "Record",
        action: "refresh_record",
      });
    } finally {
      setHasAttemptedFetch(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const needsGames =
      initialData.bootstrapScope === "home-critical" || games.length === 0;

    if (!needsGames || loading || hasAttemptedFetch) {
      return;
    }

    void refetch();
  }, [games.length, hasAttemptedFetch, initialData.bootstrapScope, loading, refetch]);

  return { games, loading, error, refetch };
};
