import type { Player } from "../../../types/models";
import type { PositionId, TeamFilter } from "./team.constants";

export type GroupedPlayers = Record<PositionId, Player[]>;

const isPositionId = (position: Player["position"]): position is PositionId =>
  position === "arq" || position === "def" || position === "med" || position === "del";

export const groupPlayersByPosition = (players: Player[] = []): GroupedPlayers => {
  const positions: GroupedPlayers = {
    arq: [],
    def: [],
    med: [],
    del: [],
  };

  players.forEach((player) => {
    if (isPositionId(player.position)) {
      positions[player.position].push(player);
    }
  });

  Object.keys(positions).forEach((pos) => {
    positions[pos as PositionId].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  });

  return positions;
};

export const getFilteredSections = (
  grouped: GroupedPlayers,
  filter: TeamFilter
): Partial<GroupedPlayers> => {
  if (filter === "all") return grouped;

  return {
    [filter]: grouped[filter],
  };
};
