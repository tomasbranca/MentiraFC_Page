import { useCallback } from "react";
import { getPlayerBySlug } from "../../../data/players";
import { getAllGames } from "../../../data/games";
import { getPlayerStats } from "../../../lib/domain/stats";
import { useFetchData } from "../../../hooks/useFetchData";

export const usePlayerDetail = (slug) => {
  const year = new Date().getFullYear();

  const fetcher = useCallback(async () => {
    const [playerData, gamesData] = await Promise.all([
      getPlayerBySlug(slug),
      getAllGames(),
    ]);

    if (!playerData) {
      return null;
    }

    const stats = getPlayerStats(gamesData, playerData.id, { year });

    return {
      ...playerData,
      goalsThisYear: stats.goals,
    };
  }, [slug, year]);

  const { data: player, loading, error } = useFetchData(fetcher, {
    initialData: null,
  });

  return { player, loading, error: Boolean(error), year };
};
