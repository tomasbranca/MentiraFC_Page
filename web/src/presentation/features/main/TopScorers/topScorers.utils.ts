import type { PlayerWithGoals } from "../../../../types/models";

export const filterPlayersWithGoals = (
  players: PlayerWithGoals[] = []
): PlayerWithGoals[] => {
  return players.filter((p) => p.goals > 0);
};

export const paginate = <T>(items: T[] = [], page = 0, perPage = 4) => {
  const start = page * perPage;
  const end = start + perPage;

  return {
    slice: items.slice(start, end),
    hasNext: end < items.length,
    hasPrev: page > 0,
  };
};
