import { useEffect, useState } from "react";
import { getPlayerBySlug } from "../../../lib/sanity/services/players.service";
import { getFinishedGames } from "../../../lib/sanity/services/games.service";
import { getPlayerStats } from "../../../lib/domain/stats";

export const usePlayerDetail = (slug) => {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  const year = new Date().getFullYear();

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        const [playerData, gamesData] = await Promise.all([
          getPlayerBySlug(slug),
          getFinishedGames(),
        ]);

        if (!playerData) {
          setPlayer(null);
          return;
        }

        const stats = getPlayerStats(gamesData, playerData.id, { year });

        setPlayer({
          ...playerData,
          goalsThisYear: stats.goals,
        });
      } finally {
        setLoading(false);
      }
    };

    loadPlayer();
  }, [slug, year]);

  return { player, loading, year };
};
