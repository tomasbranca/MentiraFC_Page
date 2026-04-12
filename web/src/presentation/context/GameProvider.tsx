import { useCallback, useEffect, useState, type ReactNode } from "react";

import { getLatestGame } from "../../data/games";
import type { Game } from "../../types/models";
import { GameContext } from "./GameContext";

type GameProviderProps = {
  children: ReactNode;
};

export const GameProvider = ({ children }: GameProviderProps) => {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const loadGame = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getLatestGame();
      setGame(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGame();
  }, [loadGame]);

  return (
    <GameContext.Provider
      value={{
        game,
        loading,
        error,
        refetch: loadGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
