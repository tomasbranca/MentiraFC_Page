// @ts-nocheck
import { useCallback, useEffect, useState } from "react";

import { getAllGames } from "../../../../data/games";
import { reportError } from "../../../../lib/errors/errorLogger";
import { shouldLoadRecordInitially } from "../../../hooks/loading/loadingState.utils";
import { useInitialData } from "../../../context/InitialDataContext";

export const useRecordData = () => {
  const { initialData } = useInitialData();
  const [overrideGames, setOverrideGames] = useState(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [error, setError] = useState(false);

  const games = overrideGames ?? initialData.games;
  const needsInitialFetch = shouldLoadRecordInitially(
    initialData.bootstrapScope,
    games.length
  );
  const [loading, setLoading] = useState(needsInitialFetch);

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
    if (!needsInitialFetch || hasAttemptedFetch) {
      return;
    }

    void refetch();
  }, [hasAttemptedFetch, needsInitialFetch, refetch]);

  return { games, loading, error, refetch };
};
