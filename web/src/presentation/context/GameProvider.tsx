import { type ReactNode, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { getLatestGame } from "../../data/games";
import { queryKeys } from "../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../data/sanity/freshness";
import { reportError } from "../../lib/errors/errorLogger";
import { GameContext } from "./GameContext";
import { useInitialData } from "./useInitialData";
import { getGameProviderSnapshot } from "./gameProvider.utils";

type GameProviderProps = {
  children: ReactNode;
};

export const GameProvider = ({ children }: GameProviderProps) => {
  const { initialData } = useInitialData();
  const initialSnapshot = getGameProviderSnapshot(initialData);
  const canFetchLatestGame =
    initialData.bootstrapScope !== "empty" &&
    initialData.bootstrapScope !== "bootstrap-error";
  const latestGameQuery = useQuery({
    queryKey: queryKeys.games.latest,
    queryFn: async () => {
      try {
        return await getLatestGame();
      } catch (nextError) {
        reportError(nextError, {
          source: "GameProvider",
          action: "refresh_latest_game",
        });
        throw nextError;
      }
    },
    enabled: canFetchLatestGame,
    initialData: canFetchLatestGame ? initialSnapshot.game : undefined,
    refetchInterval: SANITY_FRESHNESS.latestGame.refetchInterval,
    refetchOnMount: "always",
    staleTime: SANITY_FRESHNESS.latestGame.staleTime,
  });
  const game = latestGameQuery.data ?? initialSnapshot.game;
  const loading =
    initialSnapshot.loading ||
    (latestGameQuery.isLoading && typeof latestGameQuery.data === "undefined");
  const error = game ? null : latestGameQuery.error;

  const refetch = useCallback(async () => {
    await latestGameQuery.refetch();
  }, [latestGameQuery]);

  return (
    <GameContext.Provider
      value={{
        game,
        loading,
        error,
        refetch,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
