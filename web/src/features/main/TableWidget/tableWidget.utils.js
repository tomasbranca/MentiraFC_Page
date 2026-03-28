export const sortStandings = (standings = []) => {
  return [...standings].sort((a, b) => a.position - b.position);
};

export const getMainTeamIndex = (standings) => {
  return standings.findIndex((row) => row.team.isMain);
};

export const getSurroundingTeams = (arr, idx, range = 2) => {
  if (idx === -1) return arr.slice(0, 5);

  const start = Math.max(0, idx - range);
  const end = Math.min(arr.length, idx + range + 1);

  if (start === 0) return arr.slice(0, 5);
  if (end === arr.length) return arr.slice(-5);

  return arr.slice(start, end);
};

export const calculatePoints = (row) => {
  return row.wins * 3 + row.draws;
};