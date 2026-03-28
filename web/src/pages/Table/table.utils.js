export const sortStandings = (standings = []) => {
  return [...standings].sort((a, b) => a.position - b.position);
};

export const calculatePoints = (row) => {
  return row.wins * 3 + row.draws;
};

export const calculateGoalDiff = (row) => {
  return row.goalsFor - row.goalsAgainst;
};

export const getRowType = (row) => {
  if (row.position === 1) return "champion";
  if (row.position >= 2 && row.position <= 5) return "playoff";
  return "normal";
};

export const formatStandings = (standings = []) => {
  return standings
    .map((row) => {
      const points = calculatePoints(row);
      const goalDiff = calculateGoalDiff(row);
      const type = getRowType(row);

      return {
        ...row,
        points,
        goalDiff,
        type,
      };
    })
    .sort((a, b) => a.position - b.position);
};