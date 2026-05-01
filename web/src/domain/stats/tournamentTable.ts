import type { Game, StandingsRow, TeamRef } from "../../types/models";

type GameInput = Partial<Omit<Game, "result">> & {
  result?: Partial<Record<keyof Game["result"], unknown>>;
};

type StandingsRowInput = Omit<
  Partial<StandingsRow>,
  "team" | "played" | "wins" | "draws" | "losses" | "goalsFor" | "goalsAgainst"
> & {
  team: TeamRef;
  played?: unknown;
  wins?: unknown;
  draws?: unknown;
  losses?: unknown;
  goalsFor?: unknown;
  goalsAgainst?: unknown;
};

const calculatePoints = (row: StandingsRow): number => row.wins * 3 + row.draws;
const calculateGoalDiff = (row: StandingsRow): number =>
  row.goalsFor - row.goalsAgainst;

const getRowType = (position: number): "champion" | "playoff" | "normal" => {
  if (position === 1) return "champion";
  if (position >= 2 && position <= 5) return "playoff";
  return "normal";
};

const normalizeNumber = (value: unknown): number =>
  Number.isFinite(value) ? Number(value) : 0;

const sortAndDecorateTable = (rows: StandingsRow[] = []): StandingsRow[] => {
  return rows
    .map((row) => ({
      ...row,
      points: calculatePoints(row),
      goalDiff: calculateGoalDiff(row),
    }))
    .sort((a, b) => {
      if (a.points !== b.points) return (b.points ?? 0) - (a.points ?? 0);
      if (a.goalDiff !== b.goalDiff)
        return (b.goalDiff ?? 0) - (a.goalDiff ?? 0);
      if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.name.localeCompare(b.team.name, "es");
    })
    .map((row, index) => ({
      ...row,
      position: index + 1,
      type: getRowType(index + 1),
    }));
};

const calculateMainTeamStats = (
  games: GameInput[] = []
): Omit<StandingsRow, "team"> => {
  return games.reduce<Omit<StandingsRow, "team">>(
    (acc, game) => {
      const goalsFor = normalizeNumber(game?.result?.goalsFor);
      const goalsAgainst = normalizeNumber(game?.result?.goalsAgainst);

      acc.played += 1;
      acc.goalsFor += goalsFor;
      acc.goalsAgainst += goalsAgainst;

      if (goalsFor > goalsAgainst) acc.wins += 1;
      else if (goalsFor < goalsAgainst) acc.losses += 1;
      else acc.draws += 1;

      return acc;
    },
    {
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    }
  );
};

const cloneManualRow = (row: StandingsRowInput): StandingsRow => ({
  ...row,
  team: {
    ...row.team,
  },
  played: normalizeNumber(row.played),
  wins: normalizeNumber(row.wins),
  draws: normalizeNumber(row.draws),
  losses: normalizeNumber(row.losses),
  goalsFor: normalizeNumber(row.goalsFor),
  goalsAgainst: normalizeNumber(row.goalsAgainst),
});

export const getHybridTournamentTable = ({
  manualStandings = [],
  games = [],
  mainTeam = null,
}: {
  manualStandings?: StandingsRowInput[];
  games?: GameInput[] | null;
  mainTeam?: TeamRef | null;
}): StandingsRow[] => {
  if (!mainTeam && !manualStandings.length) return [];

  const manualRows = (manualStandings || []).map(cloneManualRow);
  const rowsByTeamId = manualRows.reduce<Record<string, StandingsRow>>(
    (acc, row) => {
      acc[row.team.id] = row;
      return acc;
    },
    {}
  );

  const resolvedMainTeam =
    mainTeam || manualRows.find((row) => row.team.isMain)?.team || null;

  if (!resolvedMainTeam) {
    return sortAndDecorateTable(manualRows);
  }

  const mainStats = calculateMainTeamStats(
    (games || []).filter((game) => game?.state === "finalizado")
  );

  rowsByTeamId[resolvedMainTeam.id] = {
    team: resolvedMainTeam,
    ...mainStats,
  };

  return sortAndDecorateTable(Object.values(rowsByTeamId));
};

export const getTournamentTable = (
  games: GameInput[] = [],
  teams: TeamRef[] = []
): StandingsRow[] => {
  if (!Array.isArray(teams) || teams.length === 0) return [];

  const mainTeam = teams.find((team) => team.isMain);

  if (!mainTeam) return [];

  const mainStats = calculateMainTeamStats(
    (games || []).filter((game) => game?.state === "finalizado")
  );

  const rows: StandingsRow[] = teams.map((team) => ({
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  }));

  return sortAndDecorateTable(
    rows.map((row) =>
      row.team.id === mainTeam.id ? { ...row, ...mainStats } : row
    )
  );
};

export const getMainTeamIndex = (standings: StandingsRow[] = []): number => {
  return standings.findIndex((row) => row.team.isMain);
};

export const getSurroundingTeams = (
  standings: StandingsRow[] = [],
  idx: number,
  range = 2
): StandingsRow[] => {
  if (!standings.length) return [];
  if (idx === -1) return standings.slice(0, 5);

  const start = Math.max(0, idx - range);
  const end = Math.min(standings.length, idx + range + 1);

  if (start === 0) return standings.slice(0, 5);
  if (end === standings.length) return standings.slice(-5);

  return standings.slice(start, end);
};
