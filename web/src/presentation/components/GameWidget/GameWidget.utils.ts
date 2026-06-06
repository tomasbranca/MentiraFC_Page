import type { Game } from "../../../types/models";
import { isFinishedGameState } from "../../../domain/games";

type GameWidgetVisualStateParams = {
  game: Game | null;
  loading: boolean;
};

export const getGameWidgetVisualState = ({
  game,
  loading,
}: GameWidgetVisualStateParams) => {
  if (loading) {
    return "skeleton" as const;
  }

  if (!game) {
    return "empty" as const;
  }

  return "ready" as const;
};

export const getGameWidgetResultLabel = (game: Game): string => {
  if (!isFinishedGameState(game.state)) {
    return "VS";
  }

  if (!game.result) {
    return "Sin resultado";
  }

  return `${game.result.goalsFor} - ${game.result.goalsAgainst}`;
};
