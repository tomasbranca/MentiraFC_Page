import { useEffect, useState } from "react";
import { getPlayerWithGoalsByYear } from "../../../lib/sanity/services/players.service";

export const usePlayerDetail = (slug) => {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  const year = new Date().getFullYear();

  useEffect(() => {
    getPlayerWithGoalsByYear(slug, year)
      .then(setPlayer)
      .finally(() => setLoading(false));
  }, [slug, year]);

  return { player, loading, year };
};