import type { InitialDataPayload } from "../../data/getInitialData";
import type { Game } from "../../types/models";

type GameProviderSnapshot = {
  game: Game | null;
  loading: boolean;
};

export const getGameProviderSnapshot = (
  initialData: InitialDataPayload
): GameProviderSnapshot => ({
  game: initialData.latestGame,
  loading: initialData.bootstrapScope === "empty",
});
