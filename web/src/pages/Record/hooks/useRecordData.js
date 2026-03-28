import { useEffect, useState } from "react";
import { getFinishedGames } from "../../../lib/sanity";

export const useRecordData = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFinishedGames()
      .then((data) => setGames(data || []))
      .finally(() => setLoading(false));
  }, []);

  return { games, loading };
};