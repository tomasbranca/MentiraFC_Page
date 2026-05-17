import { ROUTES } from "../../../shared/routing";
import type { Player } from "../../../types/models";

export const getPlayerLink = (player: Player): string => {
  return ROUTES.PLAYER_DETAIL(player.slug?.trim() || player.id);
};

export const PLAYER_CARD_MODE = {
  DEFAULT: "default",
  GOALS: "goals",
} as const;

export type PlayerCardMode =
  (typeof PLAYER_CARD_MODE)[keyof typeof PLAYER_CARD_MODE];
