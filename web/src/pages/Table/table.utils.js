export const sortStandings = (standings = []) => {
  return [...standings].sort((a, b) => {
    const pointsA = calculatePoints(a);
    const pointsB = calculatePoints(b);

    if (pointsA !== pointsB) return pointsB - pointsA;

    const diffA = calculateGoalDiff(a);
    const diffB = calculateGoalDiff(b);

    if (diffA !== diffB) return diffB - diffA;

    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;

    if (a.played !== b.played) return a.played - b.played;

    return 0;
  });
};

const addPositions = (standings) => {
  return standings.map((row, index) => ({
    ...row,
    position: index + 1,
  }));
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
  const enriched = standings.map((row) => {
    const points = calculatePoints(row);
    const goalDiff = calculateGoalDiff(row);

    return {
      ...row,
      points,
      goalDiff,
    };
  });

  const sorted = sortStandings(enriched);
  const withPositions = addPositions(sorted);

  return withPositions.map((row) => ({
    ...row,
    type: getRowType(row),
  }));
};