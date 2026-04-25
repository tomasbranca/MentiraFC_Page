// @ts-nocheck
import { useCallback, useMemo, useState } from "react";

import { getPlayerBySlug } from "../../../../data/players";
import { getAllGames } from "../../../../data/games";
import { getPlayerStats } from "../../../../domain/stats";
import { reportError } from "../../../../lib/errors/errorLogger";
import { useInitialData } from "../../../context/InitialDataContext";

export const usePlayerDetail = (slug) => {
  const { initialData } = useInitialData();
  const [overridePlayer, setOverridePlayer] = useState(null);
  const [overrideGames, setOverrideGames] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const year = new Date().getFullYear();

  const playerSource = useMemo(() => {
    if (overridePlayer !== null) {
      return overridePlayer;
    }

    return (initialData.players ?? []).find((nextPlayer) => nextPlayer.slug === slug) || null;
  }, [initialData.players, overridePlayer, slug]);

  const gamesSource = overrideGames ?? initialData.games;

  const player = useMemo(() => {
    if (!playerSource) {
      return null;
    }

    const stats = getPlayerStats(gamesSource ?? [], playerSource.id, {
      year,
    });

    return {
      ...playerSource,
      goalsThisYear: stats.goals,
    };
  }, [gamesSource, playerSource, year]);

  const refetch = useCallback(async () => {
    if (!slug) {
      return;
    }

    setLoading(true);

    try {
      const [nextPlayer, nextGames] = await Promise.all([
        getPlayerBySlug(slug),
        getAllGames(),
      ]);

      setOverridePlayer(nextPlayer);
      setOverrideGames(nextGames);
      setError(false);
    } catch (nextError) {
      setError(true);
      reportError(nextError, {
        page: "PlayerDetail",
        action: "refresh_player_detail",
        slug,
      });
    } finally {
      setLoading(false);
    }
  }, [slug]);

  return {
    player,
    loading,
    error,
    year,
    refetch,
  };
};
