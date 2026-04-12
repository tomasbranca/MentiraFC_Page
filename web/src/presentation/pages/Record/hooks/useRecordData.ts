// @ts-nocheck
import { useQuery } from "@tanstack/react-query";

import { getAllGames } from "../../../../data/games";
import { queryKeys } from "../../../../data/queryKeys";
import { reportError } from "../../../../lib/errors/errorLogger";

export const useRecordData = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.games.finished,
    queryFn: async () => {
      try {
        const games = await getAllGames();
        return games || [];
      } catch (error) {
        reportError(error, {
          page: "Record",
          action: "load_record",
        });
        throw error;
      }
    },
  });

  return { games: data ?? [], loading: isLoading, error: isError, refetch };
};
