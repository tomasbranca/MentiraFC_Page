// @ts-nocheck
export const groupPlayersByPosition = (players = []) => {
  const positions = {
    arq: [],
    def: [],
    med: [],
    del: [],
  };

  players.forEach((player) => {
    if (positions[player.position]) {
      positions[player.position].push(player);
    }
  });

  Object.keys(positions).forEach((pos) => {
    positions[pos].sort((a, b) => a.number - b.number);
  });

  return positions;
};

export const getFilteredSections = (grouped, filter) => {
  if (filter === "all") return grouped;

  return {
    [filter]: grouped[filter],
  };
};