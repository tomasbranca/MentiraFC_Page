// @ts-nocheck
import { type ReactNode, useCallback, useEffect, useState } from "react";

import { getLatestGame } from "../../data/games";
import { reportError } from "../../lib/errors/errorLogger";
import type { Game } from "../../types/models";
import { GameContext } from "./GameContext";
import { useInitialData } from "./InitialDataContext";
import { getGameProviderSnapshot } from "./gameProvider.utils";

type GameProviderProps = {
  children: ReactNode;
};

export const GameProvider = ({ children }: GameProviderProps) => {
  const { initialData } = useInitialData();
  const initialSnapshot = getGameProviderSnapshot(initialData);
  const [game, setGame] = useState<Game | null>(initialSnapshot.game);
  const [loading, setLoading] = useState(initialSnapshot.loading);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const nextSnapshot = getGameProviderSnapshot(initialData);

    setGame(nextSnapshot.game);
    setLoading(nextSnapshot.loading);
    setError(null);
  }, [initialData.bootstrapScope, initialData.latestGame]);

  const refetch = useCallback(async () => {
    setLoading(true);

    try {
      const latestGame = await getLatestGame();
      setGame(latestGame);
      setError(null);
    } catch (nextError) {
      setError(nextError);
      reportError(nextError, {
        source: "GameProvider",
        action: "refresh_latest_game",
      });
    } finally {
      setLoading(false);
    }
  }, []);

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
