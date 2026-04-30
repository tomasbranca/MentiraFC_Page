import type { Game } from "../../../types/models";

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
