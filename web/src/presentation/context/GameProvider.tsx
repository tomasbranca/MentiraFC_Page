// @ts-nocheck
import { type ReactNode } from "react";

import { GameContext } from "./GameContext";
import { useLatestGame } from "../hooks/queries/useLatestGame";

type GameProviderProps = {
  children: ReactNode;
};

export const GameProvider = ({ children }: GameProviderProps) => {
  const { data: game = null, isLoading, error, refetch } = useLatestGame();

  return (
    <GameContext.Provider
      value={{
        game,
        loading: isLoading,
        error,
        refetch: async () => {
          await refetch();
        },
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
