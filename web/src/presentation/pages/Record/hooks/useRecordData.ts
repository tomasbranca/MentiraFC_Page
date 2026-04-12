// @ts-nocheck
import { useCallback } from "react";
import { getAllGames } from "../../../../data/games";
import { useFetchData } from "../../../hooks/useFetchData";

export const useRecordData = () => {
  const fetcher = useCallback(async () => {
    const data = await getAllGames();
    return data || [];
  }, []);

  const { data: games, loading, error, refetch } = useFetchData(fetcher, {
    initialData: [],
    errorContext: {
      page: "Record",
      action: "load_record",
    },
  });

  return { games, loading, error: Boolean(error), refetch };
};
