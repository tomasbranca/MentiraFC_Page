import { useQuery } from "@tanstack/react-query";

import { getPlayers } from "../../../data/players";
import { queryKeys } from "../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../data/sanity/freshness";
import { reportError } from "../../../lib/errors/errorLogger";

export const usePlayers = () => {
  return useQuery({
    queryKey: queryKeys.players.all,
    queryFn: async () => {
      try {
        return await getPlayers();
      } catch (error) {
        reportError(error, {
          source: "usePlayers",
          action: "load_players",
        });
        throw error;
      }
    },
    refetchInterval: SANITY_FRESHNESS.semiDynamic.refetchInterval,
    refetchOnMount: true,
    staleTime: SANITY_FRESHNESS.semiDynamic.staleTime,
  });
};
