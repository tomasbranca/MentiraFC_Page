import { useEffect, useState } from "react";
import { getAllGames } from "../../../data/games";

export const useRecordData = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllGames()
      .then((data) => setGames(data || []))
      .finally(() => setLoading(false));
  }, []);

  return { games, loading };
};