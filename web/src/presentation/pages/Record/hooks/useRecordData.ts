// @ts-nocheck
import { useCallback, useState } from "react";

import { getAllGames } from "../../../../data/games";
import { reportError } from "../../../../lib/errors/errorLogger";
import { useInitialData } from "../../../context/InitialDataContext";

export const useRecordData = () => {
  const { initialData } = useInitialData();
  const [overrideGames, setOverrideGames] = useState(null);
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
      setLoading(false);
    }
  }, []);

  return { games, loading, error, refetch };
};
