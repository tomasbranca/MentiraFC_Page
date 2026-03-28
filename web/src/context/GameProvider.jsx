import { useEffect, useState, useCallback } from "react";
import { GameContext } from "./GameContext";
import { fetchGame } from "../services/gameService";

export const GameProvider = ({ children }) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadGame = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchGame();
      setGame(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  return (
    <GameContext.Provider
      value={{
        game,
        loading,
        error,
        refetch: loadGame, // 🔥 clave
      }}
    >
      {children}
    </GameContext.Provider>
  );
};