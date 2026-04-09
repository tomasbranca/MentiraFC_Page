import { useCallback } from "react";
import { getAllGames } from "../../../data/games";
import { useFetchData } from "../../../hooks/useFetchData";

export const useRecordData = () => {
  const fetcher = useCallback(async () => {
    const data = await getAllGames();
    return data || [];
  }, []);

  const { data: games, loading, error } = useFetchData(fetcher, {
    initialData: [],
  });

  return { games, loading, error: Boolean(error) };
};
