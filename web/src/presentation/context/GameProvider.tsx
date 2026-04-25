// @ts-nocheck
import { type ReactNode, useCallback, useState } from "react";

import { getLatestGame } from "../../data/games";
import { reportError } from "../../lib/errors/errorLogger";
import type { Game } from "../../types/models";
import { GameContext } from "./GameContext";

type GameProviderProps = {
  children: ReactNode;
  initialGame: Game | null;
};

export const GameProvider = ({ children, initialGame }: GameProviderProps) => {
  const [game, setGame] = useState<Game | null>(initialGame);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

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
