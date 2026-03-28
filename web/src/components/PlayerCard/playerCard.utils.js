export const getPlayerLink = (player) => {
  return `/plantel/${player.slug.current}`;
};

export const PLAYER_CARD_MODE = {
  DEFAULT: "default",
  GOALS: "goals",
};