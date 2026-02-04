import { useEffect, useState } from "react";
import { GameContext } from "./GameContext";
import { getGame } from "../lib/sanity";

export const GameProvider = ({ children }) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGame().then((data) => {
      setGame(data);
      setLoading(false);
    });
  }, []);

  return (
    <GameContext.Provider value={{ game, loading }}>
      {children}
    </GameContext.Provider>
  );
};
