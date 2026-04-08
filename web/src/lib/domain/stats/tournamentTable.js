const calculatePoints = (row) => row.wins * 3 + row.draws;
const calculateGoalDiff = (row) => row.goalsFor - row.goalsAgainst;

const getRowType = (position) => {
  if (position === 1) return "champion";
  if (position >= 2 && position <= 5) return "playoff";
  return "normal";
};

const createEmptyRow = (team) => ({
  team,
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
});

const toRowsMap = (teams = []) => {
  return teams.reduce((acc, team) => {
    acc[team.id] = createEmptyRow(team);
    return acc;
  }, {});
};

export const getTournamentTable = (games = [], teams = []) => {
  if (!Array.isArray(teams) || teams.length === 0) return [];

  const rowsByTeamId = toRowsMap(teams);
  const mainTeam = teams.find((team) => team.isMain);

  if (!mainTeam) return [];

  games
    .filter((game) => game?.state === "finalizado")
    .forEach((game) => {
      const rivalId = game?.rival?.id;
      if (!rivalId || !rowsByTeamId[rivalId]) return;

      const goalsFor = game?.result?.goalsFor ?? 0;
      const goalsAgainst = game?.result?.goalsAgainst ?? 0;

      const mainRow = rowsByTeamId[mainTeam.id];
      const rivalRow = rowsByTeamId[rivalId];

      mainRow.played += 1;
      mainRow.goalsFor += goalsFor;
      mainRow.goalsAgainst += goalsAgainst;

      rivalRow.played += 1;
      rivalRow.goalsFor += goalsAgainst;
      rivalRow.goalsAgainst += goalsFor;

      if (goalsFor > goalsAgainst) {
        mainRow.wins += 1;
        rivalRow.losses += 1;
      } else if (goalsFor < goalsAgainst) {
        mainRow.losses += 1;
        rivalRow.wins += 1;
      } else {
        mainRow.draws += 1;
        rivalRow.draws += 1;
      }
    });

  return Object.values(rowsByTeamId)
    .map((row) => ({
      ...row,
      points: calculatePoints(row),
      goalDiff: calculateGoalDiff(row),
    }))
    .sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
      if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.name.localeCompare(b.team.name, "es");
    })
    .map((row, index) => ({
      ...row,
      position: index + 1,
      type: getRowType(index + 1),
    }));
};

export const getMainTeamIndex = (standings = []) => {
  return standings.findIndex((row) => row.team.isMain);
};

export const getSurroundingTeams = (standings = [], idx, range = 2) => {
  if (!standings.length) return [];
  if (idx === -1) return standings.slice(0, 5);

  const start = Math.max(0, idx - range);
  const end = Math.min(standings.length, idx + range + 1);

  if (start === 0) return standings.slice(0, 5);
  if (end === standings.length) return standings.slice(-5);

  return standings.slice(start, end);
};
