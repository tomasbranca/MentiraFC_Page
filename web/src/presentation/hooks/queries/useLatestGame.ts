import { useQuery } from "@tanstack/react-query";

import { getLatestGame } from "../../../data/games";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";

export const useLatestGame = () => {
  return useQuery({
    queryKey: queryKeys.games.latest,
    queryFn: async () => {
      try {
        return await getLatestGame();
      } catch (error) {
        reportError(error, {
          source: "useLatestGame",
          action: "load_latest_game",
        });
        throw error;
      }
    },
  });
};
