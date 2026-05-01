import { createContext } from "react";

import type { Game } from "../../types/models";

export type GameContextValue = {
  game: Game | null;
  loading: boolean;
  error: unknown;
  refetch: () => Promise<void>;
};

export const GameContext = createContext<GameContextValue | null>(null);
