// @ts-nocheck
import { ROUTES } from "../../constants/routes.constants";

export const getPlayerLink = (player) => {
  return ROUTES.PLAYER_DETAIL(player.slug);
};

export const PLAYER_CARD_MODE = {
  DEFAULT: "default",
  GOALS: "goals",
};